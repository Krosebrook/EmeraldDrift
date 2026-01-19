import { ok, err, AsyncResult, isOk } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unifiedMarketplaceService } from "@/features/marketplaces/service";
import type {
  MarketplaceType,
  MarketplaceOrder,
  WebhookEvent,
} from "@/features/marketplaces/types";

const ORDERS_STORAGE_KEY = "@pod_orders";
const WEBHOOKS_STORAGE_KEY = "@pod_webhooks";
const LAST_SYNC_KEY = "@pod_orders_last_sync";

export type OrderEventType =
  | "order.created"
  | "order.updated"
  | "order.fulfilled"
  | "order.shipped"
  | "order.delivered"
  | "order.cancelled"
  | "order.refunded";

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  order: MarketplaceOrder;
  previousOrder?: MarketplaceOrder;
  timestamp: string;
}

export type OrderEventHandler = (event: OrderEvent) => Promise<void>;

export interface OrderListenerService {
  startListening(): Promise<void>;
  stopListening(): void;
  
  onOrderEvent(handler: OrderEventHandler): () => void;
  
  pollOrders(): AsyncResult<OrderEvent[], AppError>;
  
  processWebhook(event: WebhookEvent): AsyncResult<OrderEvent | null, AppError>;
  
  getRecentOrders(options?: {
    limit?: number;
    since?: string;
    marketplaces?: MarketplaceType[];
    status?: string;
  }): AsyncResult<MarketplaceOrder[], AppError>;
  
  getOrderStats(): AsyncResult<{
    totalToday: number;
    totalThisWeek: number;
    totalThisMonth: number;
    pendingFulfillment: number;
    recentRevenue: number;
  }, AppError>;
}

class OrderListenerServiceImpl implements OrderListenerService {
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Set<OrderEventHandler> = new Set();
  private ordersCache: Map<string, MarketplaceOrder> = new Map();
  private isListening = false;

  async startListening(): Promise<void> {
    if (this.isListening) return;
    
    this.isListening = true;
    
    await this.loadCachedOrders();
    
    this.pollingInterval = setInterval(async () => {
      await this.pollOrders();
    }, 60000);
    
    await this.pollOrders();
  }

  stopListening(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isListening = false;
  }

  onOrderEvent(handler: OrderEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  async pollOrders(): AsyncResult<OrderEvent[], AppError> {
    const lastSync = await this.getLastSyncTime();
    const since = lastSync || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const ordersResult = await unifiedMarketplaceService.getAllOrders({ since });
    if (!isOk(ordersResult)) return err(ordersResult.error);

    const events: OrderEvent[] = [];

    for (const order of ordersResult.data) {
      const orderKey = `${order.marketplace}:${order.externalId}`;
      const existingOrder = this.ordersCache.get(orderKey);

      if (!existingOrder) {
        const event: OrderEvent = {
          id: `${orderKey}:${Date.now()}`,
          type: "order.created",
          order,
          timestamp: new Date().toISOString(),
        };
        events.push(event);
        this.ordersCache.set(orderKey, order);
      } else if (this.hasOrderChanged(existingOrder, order)) {
        const eventType = this.determineEventType(existingOrder, order);
        const event: OrderEvent = {
          id: `${orderKey}:${Date.now()}`,
          type: eventType,
          order,
          previousOrder: existingOrder,
          timestamp: new Date().toISOString(),
        };
        events.push(event);
        this.ordersCache.set(orderKey, order);
      }
    }

    await this.persistOrdersCache();
    await this.setLastSyncTime(new Date().toISOString());

    for (const event of events) {
      await this.notifyHandlers(event);
    }

    return ok(events);
  }

  async processWebhook(webhookEvent: WebhookEvent): AsyncResult<OrderEvent | null, AppError> {
    await this.storeWebhookEvent(webhookEvent);

    const orderEvent = this.parseWebhookToOrderEvent(webhookEvent);
    if (!orderEvent) return ok(null);

    const orderKey = `${orderEvent.order.marketplace}:${orderEvent.order.externalId}`;
    const existingOrder = this.ordersCache.get(orderKey);
    
    if (existingOrder) {
      orderEvent.previousOrder = existingOrder;
    }
    
    this.ordersCache.set(orderKey, orderEvent.order);
    await this.persistOrdersCache();

    await this.notifyHandlers(orderEvent);

    return ok(orderEvent);
  }

  async getRecentOrders(options?: {
    limit?: number;
    since?: string;
    marketplaces?: MarketplaceType[];
    status?: string;
  }): AsyncResult<MarketplaceOrder[], AppError> {
    return unifiedMarketplaceService.getAllOrders({
      limit: options?.limit || 50,
      since: options?.since,
      marketplaces: options?.marketplaces,
    });
  }

  async getOrderStats(): AsyncResult<{
    totalToday: number;
    totalThisWeek: number;
    totalThisMonth: number;
    pendingFulfillment: number;
    recentRevenue: number;
  }, AppError> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const ordersResult = await unifiedMarketplaceService.getAllOrders({ since: startOfMonth });
    if (!isOk(ordersResult)) return err(ordersResult.error);

    const orders = ordersResult.data;

    const totalToday = orders.filter((o) => new Date(o.createdAt) >= new Date(startOfDay)).length;
    const totalThisWeek = orders.filter((o) => new Date(o.createdAt) >= new Date(startOfWeek)).length;
    const totalThisMonth = orders.length;
    const pendingFulfillment = orders.filter((o) => o.fulfillmentStatus === "unfulfilled").length;
    const recentRevenue = orders.reduce((sum, o) => sum + o.total, 0);

    return ok({
      totalToday,
      totalThisWeek,
      totalThisMonth,
      pendingFulfillment,
      recentRevenue,
    });
  }

  private hasOrderChanged(oldOrder: MarketplaceOrder, newOrder: MarketplaceOrder): boolean {
    return (
      oldOrder.status !== newOrder.status ||
      oldOrder.fulfillmentStatus !== newOrder.fulfillmentStatus ||
      oldOrder.paymentStatus !== newOrder.paymentStatus ||
      oldOrder.updatedAt !== newOrder.updatedAt
    );
  }

  private determineEventType(oldOrder: MarketplaceOrder, newOrder: MarketplaceOrder): OrderEventType {
    if (newOrder.status === "cancelled") return "order.cancelled";
    if (newOrder.status === "refunded") return "order.refunded";
    if (newOrder.status === "delivered") return "order.delivered";
    if (newOrder.status === "shipped") return "order.shipped";
    if (newOrder.fulfillmentStatus === "fulfilled" && oldOrder.fulfillmentStatus !== "fulfilled") {
      return "order.fulfilled";
    }
    return "order.updated";
  }

  private parseWebhookToOrderEvent(webhook: WebhookEvent): OrderEvent | null {
    const payload = webhook.payload as Record<string, unknown>;
    
    if (!payload || typeof payload !== "object") return null;

    const eventTypeMap: Record<string, OrderEventType> = {
      "orders/create": "order.created",
      "orders/updated": "order.updated",
      "orders/fulfilled": "order.fulfilled",
      "orders/cancelled": "order.cancelled",
      "order.created": "order.created",
      "order.shipped": "order.shipped",
    };

    const eventType = eventTypeMap[webhook.eventType];
    if (!eventType) return null;

    return null;
  }

  private async notifyHandlers(event: OrderEvent): Promise<void> {
    const promises = Array.from(this.eventHandlers).map((handler) =>
      handler(event).catch((error) => {
        console.error("Order event handler error:", error);
      })
    );
    await Promise.all(promises);
  }

  private async loadCachedOrders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored) {
        const orders: MarketplaceOrder[] = JSON.parse(stored);
        orders.forEach((order) => {
          const key = `${order.marketplace}:${order.externalId}`;
          this.ordersCache.set(key, order);
        });
      }
    } catch (error) {
      console.error("Failed to load cached orders:", error);
    }
  }

  private async persistOrdersCache(): Promise<void> {
    try {
      const orders = Array.from(this.ordersCache.values());
      await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error("Failed to persist orders cache:", error);
    }
  }

  private async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  private async setLastSyncTime(time: string): Promise<void> {
    try {
      await AsyncStorage.setItem(LAST_SYNC_KEY, time);
    } catch (error) {
      console.error("Failed to set last sync time:", error);
    }
  }

  private async storeWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(WEBHOOKS_STORAGE_KEY);
      const events: WebhookEvent[] = stored ? JSON.parse(stored) : [];
      events.unshift(event);
      const trimmed = events.slice(0, 1000);
      await AsyncStorage.setItem(WEBHOOKS_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to store webhook event:", error);
    }
  }
}

export const orderListenerService = new OrderListenerServiceImpl();
