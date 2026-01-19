import { ok, err, AsyncResult, isOk } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unifiedMarketplaceService } from "@/features/marketplaces/service";
import type { MarketplaceType, MarketplaceProduct } from "@/features/marketplaces/types";

const INVENTORY_STORAGE_KEY = "@pod_inventory";
const INVENTORY_ALERTS_KEY = "@pod_inventory_alerts";

export interface InventoryItem {
  id: string;
  productId: string;
  marketplace: MarketplaceType;
  title: string;
  sku: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  supplier?: string;
  costPerUnit?: number;
  leadTimeDays?: number;
  lastRestockedAt?: string;
  lastSyncedAt: string;
}

export interface InventoryAlert {
  id: string;
  type: "low_stock" | "out_of_stock" | "overstock" | "reorder_needed";
  inventoryItemId: string;
  productTitle: string;
  marketplace: MarketplaceType;
  message: string;
  severity: "info" | "warning" | "critical";
  acknowledged: boolean;
  createdAt: string;
  acknowledgedAt?: string;
}

export interface InventoryAdjustment {
  id: string;
  inventoryItemId: string;
  type: "add" | "remove" | "set" | "reserve" | "unreserve";
  quantity: number;
  reason: string;
  previousStock: number;
  newStock: number;
  createdAt: string;
  createdBy?: string;
}

export interface InventorySummary {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  healthyStockCount: number;
  byMarketplace: Array<{
    marketplace: MarketplaceType;
    productCount: number;
    totalStock: number;
    value: number;
  }>;
}

export interface InventoryManagerService {
  syncInventory(marketplaces?: MarketplaceType[]): AsyncResult<InventoryItem[], AppError>;
  
  getInventory(options?: {
    marketplaces?: MarketplaceType[];
    status?: "low" | "out" | "healthy";
    search?: string;
  }): AsyncResult<InventoryItem[], AppError>;
  
  getInventoryItem(itemId: string): AsyncResult<InventoryItem | null, AppError>;
  
  updateInventory(itemId: string, updates: {
    reorderPoint?: number;
    reorderQuantity?: number;
    supplier?: string;
    costPerUnit?: number;
    leadTimeDays?: number;
  }): AsyncResult<InventoryItem, AppError>;
  
  adjustStock(itemId: string, adjustment: {
    type: "add" | "remove" | "set";
    quantity: number;
    reason: string;
  }): AsyncResult<InventoryItem, AppError>;
  
  reserveStock(itemId: string, quantity: number): AsyncResult<InventoryItem, AppError>;
  unreserveStock(itemId: string, quantity: number): AsyncResult<InventoryItem, AppError>;
  
  getAlerts(options?: {
    acknowledged?: boolean;
    severity?: "info" | "warning" | "critical";
    type?: InventoryAlert["type"];
  }): AsyncResult<InventoryAlert[], AppError>;
  
  acknowledgeAlert(alertId: string): AsyncResult<void, AppError>;
  acknowledgeAllAlerts(): AsyncResult<void, AppError>;
  
  getSummary(): AsyncResult<InventorySummary, AppError>;
  
  generateReorderReport(): AsyncResult<Array<{
    item: InventoryItem;
    suggestedQuantity: number;
    estimatedCost: number;
    urgency: "immediate" | "soon" | "planned";
  }>, AppError>;
}

class InventoryManagerServiceImpl implements InventoryManagerService {
  private inventoryCache: Map<string, InventoryItem> = new Map();
  private alerts: InventoryAlert[] = [];

  async syncInventory(marketplaces?: MarketplaceType[]): AsyncResult<InventoryItem[], AppError> {
    const productsResult = await unifiedMarketplaceService.getAllProducts({
      marketplaces,
    });

    if (!isOk(productsResult)) return err(productsResult.error);

    const items: InventoryItem[] = [];

    for (const product of productsResult.data) {
      const itemId = `${product.marketplace}:${product.id}`;
      const existingItem = this.inventoryCache.get(itemId);

      const item: InventoryItem = {
        id: itemId,
        productId: product.id,
        marketplace: product.marketplace,
        title: product.title,
        sku: product.sku || "",
        currentStock: product.quantity || 0,
        reservedStock: existingItem?.reservedStock || 0,
        availableStock: (product.quantity || 0) - (existingItem?.reservedStock || 0),
        reorderPoint: existingItem?.reorderPoint || 10,
        reorderQuantity: existingItem?.reorderQuantity || 50,
        supplier: existingItem?.supplier,
        costPerUnit: existingItem?.costPerUnit,
        leadTimeDays: existingItem?.leadTimeDays,
        lastRestockedAt: existingItem?.lastRestockedAt,
        lastSyncedAt: new Date().toISOString(),
      };

      this.inventoryCache.set(itemId, item);
      items.push(item);

      await this.checkAndGenerateAlerts(item);
    }

    await this.persistInventory();
    await this.persistAlerts();

    return ok(items);
  }

  async getInventory(options?: {
    marketplaces?: MarketplaceType[];
    status?: "low" | "out" | "healthy";
    search?: string;
  }): AsyncResult<InventoryItem[], AppError> {
    if (this.inventoryCache.size === 0) {
      await this.loadInventory();
    }

    let items = Array.from(this.inventoryCache.values());

    if (options?.marketplaces?.length) {
      items = items.filter((item) => options.marketplaces!.includes(item.marketplace));
    }

    if (options?.status) {
      items = items.filter((item) => {
        if (options.status === "out") return item.availableStock <= 0;
        if (options.status === "low") return item.availableStock > 0 && item.availableStock <= item.reorderPoint;
        return item.availableStock > item.reorderPoint;
      });
    }

    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower)
      );
    }

    return ok(items);
  }

  async getInventoryItem(itemId: string): AsyncResult<InventoryItem | null, AppError> {
    if (this.inventoryCache.size === 0) {
      await this.loadInventory();
    }
    return ok(this.inventoryCache.get(itemId) || null);
  }

  async updateInventory(itemId: string, updates: {
    reorderPoint?: number;
    reorderQuantity?: number;
    supplier?: string;
    costPerUnit?: number;
    leadTimeDays?: number;
  }): AsyncResult<InventoryItem, AppError> {
    const item = this.inventoryCache.get(itemId);
    if (!item) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Inventory item not found",
      }));
    }

    const updatedItem: InventoryItem = {
      ...item,
      ...updates,
    };

    this.inventoryCache.set(itemId, updatedItem);
    await this.persistInventory();

    return ok(updatedItem);
  }

  async adjustStock(itemId: string, adjustment: {
    type: "add" | "remove" | "set";
    quantity: number;
    reason: string;
  }): AsyncResult<InventoryItem, AppError> {
    const item = this.inventoryCache.get(itemId);
    if (!item) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Inventory item not found",
      }));
    }

    const previousStock = item.currentStock;
    let newStock: number;

    switch (adjustment.type) {
      case "add":
        newStock = previousStock + adjustment.quantity;
        break;
      case "remove":
        newStock = Math.max(0, previousStock - adjustment.quantity);
        break;
      case "set":
        newStock = adjustment.quantity;
        break;
    }

    const updatedItem: InventoryItem = {
      ...item,
      currentStock: newStock,
      availableStock: newStock - item.reservedStock,
      lastRestockedAt: adjustment.type === "add" ? new Date().toISOString() : item.lastRestockedAt,
    };

    this.inventoryCache.set(itemId, updatedItem);
    await this.persistInventory();
    await this.checkAndGenerateAlerts(updatedItem);

    return ok(updatedItem);
  }

  async reserveStock(itemId: string, quantity: number): AsyncResult<InventoryItem, AppError> {
    const item = this.inventoryCache.get(itemId);
    if (!item) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Inventory item not found",
      }));
    }

    if (item.availableStock < quantity) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `Insufficient stock. Available: ${item.availableStock}, Requested: ${quantity}`,
      }));
    }

    const updatedItem: InventoryItem = {
      ...item,
      reservedStock: item.reservedStock + quantity,
      availableStock: item.availableStock - quantity,
    };

    this.inventoryCache.set(itemId, updatedItem);
    await this.persistInventory();

    return ok(updatedItem);
  }

  async unreserveStock(itemId: string, quantity: number): AsyncResult<InventoryItem, AppError> {
    const item = this.inventoryCache.get(itemId);
    if (!item) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Inventory item not found",
      }));
    }

    const unreserveAmount = Math.min(quantity, item.reservedStock);

    const updatedItem: InventoryItem = {
      ...item,
      reservedStock: item.reservedStock - unreserveAmount,
      availableStock: item.availableStock + unreserveAmount,
    };

    this.inventoryCache.set(itemId, updatedItem);
    await this.persistInventory();

    return ok(updatedItem);
  }

  async getAlerts(options?: {
    acknowledged?: boolean;
    severity?: "info" | "warning" | "critical";
    type?: InventoryAlert["type"];
  }): AsyncResult<InventoryAlert[], AppError> {
    if (this.alerts.length === 0) {
      await this.loadAlerts();
    }

    let filteredAlerts = [...this.alerts];

    if (options?.acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter((a) => a.acknowledged === options.acknowledged);
    }

    if (options?.severity) {
      filteredAlerts = filteredAlerts.filter((a) => a.severity === options.severity);
    }

    if (options?.type) {
      filteredAlerts = filteredAlerts.filter((a) => a.type === options.type);
    }

    return ok(filteredAlerts);
  }

  async acknowledgeAlert(alertId: string): AsyncResult<void, AppError> {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedAt = new Date().toISOString();
      await this.persistAlerts();
    }
    return ok(undefined);
  }

  async acknowledgeAllAlerts(): AsyncResult<void, AppError> {
    const now = new Date().toISOString();
    this.alerts.forEach((alert) => {
      if (!alert.acknowledged) {
        alert.acknowledged = true;
        alert.acknowledgedAt = now;
      }
    });
    await this.persistAlerts();
    return ok(undefined);
  }

  async getSummary(): AsyncResult<InventorySummary, AppError> {
    if (this.inventoryCache.size === 0) {
      await this.loadInventory();
    }

    const items = Array.from(this.inventoryCache.values());
    
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let healthyStockCount = 0;

    const byMarketplace = new Map<MarketplaceType, {
      productCount: number;
      totalStock: number;
      value: number;
    }>();

    for (const item of items) {
      const itemValue = (item.costPerUnit || 0) * item.currentStock;
      totalValue += itemValue;

      if (item.availableStock <= 0) {
        outOfStockCount++;
      } else if (item.availableStock <= item.reorderPoint) {
        lowStockCount++;
      } else {
        healthyStockCount++;
      }

      const existing = byMarketplace.get(item.marketplace) || {
        productCount: 0,
        totalStock: 0,
        value: 0,
      };
      existing.productCount++;
      existing.totalStock += item.currentStock;
      existing.value += itemValue;
      byMarketplace.set(item.marketplace, existing);
    }

    return ok({
      totalProducts: items.length,
      totalValue,
      lowStockCount,
      outOfStockCount,
      healthyStockCount,
      byMarketplace: Array.from(byMarketplace.entries()).map(([marketplace, data]) => ({
        marketplace,
        ...data,
      })),
    });
  }

  async generateReorderReport(): AsyncResult<Array<{
    item: InventoryItem;
    suggestedQuantity: number;
    estimatedCost: number;
    urgency: "immediate" | "soon" | "planned";
  }>, AppError> {
    if (this.inventoryCache.size === 0) {
      await this.loadInventory();
    }

    const items = Array.from(this.inventoryCache.values())
      .filter((item) => item.availableStock <= item.reorderPoint);

    const report = items.map((item) => {
      let urgency: "immediate" | "soon" | "planned" = "planned";
      let suggestedQuantity = item.reorderQuantity;

      if (item.availableStock <= 0) {
        urgency = "immediate";
        suggestedQuantity = Math.max(item.reorderQuantity, item.reorderPoint * 2);
      } else if (item.availableStock <= item.reorderPoint * 0.5) {
        urgency = "soon";
        suggestedQuantity = Math.max(item.reorderQuantity, item.reorderPoint);
      }

      return {
        item,
        suggestedQuantity,
        estimatedCost: suggestedQuantity * (item.costPerUnit || 0),
        urgency,
      };
    });

    report.sort((a, b) => {
      const urgencyOrder = { immediate: 0, soon: 1, planned: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    });

    return ok(report);
  }

  private async checkAndGenerateAlerts(item: InventoryItem): Promise<void> {
    this.alerts = this.alerts.filter((a) => a.inventoryItemId !== item.id);

    if (item.availableStock <= 0) {
      this.alerts.push({
        id: `alert_${item.id}_${Date.now()}`,
        type: "out_of_stock",
        inventoryItemId: item.id,
        productTitle: item.title,
        marketplace: item.marketplace,
        message: `${item.title} is out of stock`,
        severity: "critical",
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    } else if (item.availableStock <= item.reorderPoint) {
      this.alerts.push({
        id: `alert_${item.id}_${Date.now()}`,
        type: "low_stock",
        inventoryItemId: item.id,
        productTitle: item.title,
        marketplace: item.marketplace,
        message: `${item.title} is running low (${item.availableStock} remaining)`,
        severity: "warning",
        acknowledged: false,
        createdAt: new Date().toISOString(),
      });
    }
  }

  private async loadInventory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(INVENTORY_STORAGE_KEY);
      if (stored) {
        const items: InventoryItem[] = JSON.parse(stored);
        items.forEach((item) => this.inventoryCache.set(item.id, item));
      }
    } catch (error) {
      console.error("Failed to load inventory:", error);
    }
  }

  private async persistInventory(): Promise<void> {
    try {
      const items = Array.from(this.inventoryCache.values());
      await AsyncStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to persist inventory:", error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(INVENTORY_ALERTS_KEY);
      if (stored) {
        this.alerts = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Failed to load alerts:", error);
    }
  }

  private async persistAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem(INVENTORY_ALERTS_KEY, JSON.stringify(this.alerts));
    } catch (error) {
      console.error("Failed to persist alerts:", error);
    }
  }
}

export const inventoryManagerService = new InventoryManagerServiceImpl();
