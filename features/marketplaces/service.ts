import { ok, err, AsyncResult, isOk } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import type {
  MarketplaceType,
  MarketplaceConnection,
  MarketplaceProduct,
  MarketplaceOrder,
  MarketplaceAnalytics,
  SyncResult,
  MARKETPLACE_CONFIG,
} from "./types";
import { BaseMarketplaceService } from "./services/baseMarketplace";
import { printifyService } from "./services/printify";
import { shopifyService } from "./services/shopify";
import { etsyService } from "./services/etsy";
import { wooCommerceService } from "./services/woocommerce";
import { amazonService } from "./services/amazon";
import { tiktokShopService } from "./services/tiktokShop";

type MarketplaceServices = Record<MarketplaceType, BaseMarketplaceService>;

const marketplaceServices: Partial<MarketplaceServices> = {
  printify: printifyService,
  shopify: shopifyService,
  etsy: etsyService,
  woocommerce: wooCommerceService,
  amazon: amazonService,
  tiktok_shop: tiktokShopService,
};

export interface UnifiedMarketplaceService {
  getService(marketplace: MarketplaceType): BaseMarketplaceService | null;
  getAllConnections(): AsyncResult<MarketplaceConnection[], AppError>;
  getConnection(marketplace: MarketplaceType): AsyncResult<MarketplaceConnection, AppError>;
  connect(marketplace: MarketplaceType, credentials: Record<string, string>): AsyncResult<MarketplaceConnection, AppError>;
  disconnect(marketplace: MarketplaceType): AsyncResult<void, AppError>;
  
  getAllProducts(options?: { marketplaces?: MarketplaceType[]; limit?: number }): AsyncResult<MarketplaceProduct[], AppError>;
  getAllOrders(options?: { marketplaces?: MarketplaceType[]; limit?: number; since?: string }): AsyncResult<MarketplaceOrder[], AppError>;
  
  getAggregatedAnalytics(params: { startDate: string; endDate: string; marketplaces?: MarketplaceType[] }): AsyncResult<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalUnits: number;
    byMarketplace: MarketplaceAnalytics[];
  }, AppError>;
  
  syncAll(): AsyncResult<SyncResult[], AppError>;
  syncMarketplace(marketplace: MarketplaceType): AsyncResult<SyncResult, AppError>;
}

class UnifiedMarketplaceServiceImpl implements UnifiedMarketplaceService {
  getService(marketplace: MarketplaceType): BaseMarketplaceService | null {
    return marketplaceServices[marketplace] || null;
  }

  async getAllConnections(): AsyncResult<MarketplaceConnection[], AppError> {
    const connections: MarketplaceConnection[] = [];
    
    const marketplaces = Object.keys(marketplaceServices) as MarketplaceType[];
    
    await Promise.all(
      marketplaces.map(async (marketplace) => {
        const service = this.getService(marketplace);
        if (service) {
          const result = await service.getConnection();
          if (isOk(result)) {
            connections.push(result.data);
          }
        }
      })
    );

    return ok(connections);
  }

  async getConnection(marketplace: MarketplaceType): AsyncResult<MarketplaceConnection, AppError> {
    const service = this.getService(marketplace);
    if (!service) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Marketplace ${marketplace} is not supported`,
      }));
    }
    return service.getConnection();
  }

  async connect(
    marketplace: MarketplaceType,
    credentials: Record<string, string>
  ): AsyncResult<MarketplaceConnection, AppError> {
    const service = this.getService(marketplace);
    if (!service) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Marketplace ${marketplace} is not supported`,
      }));
    }
    return service.connect(credentials);
  }

  async disconnect(marketplace: MarketplaceType): AsyncResult<void, AppError> {
    const service = this.getService(marketplace);
    if (!service) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Marketplace ${marketplace} is not supported`,
      }));
    }
    return service.disconnect();
  }

  async getAllProducts(options?: {
    marketplaces?: MarketplaceType[];
    limit?: number;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    const allProducts: MarketplaceProduct[] = [];
    const errors: string[] = [];

    const connectionsResult = await this.getAllConnections();
    if (!isOk(connectionsResult)) return err(connectionsResult.error);

    const connectedMarketplaces = connectionsResult.data
      .filter((c) => c.connected && c.status === "active")
      .map((c) => c.marketplace)
      .filter((m) => !options?.marketplaces || options.marketplaces.includes(m));

    await Promise.all(
      connectedMarketplaces.map(async (marketplace) => {
        const service = this.getService(marketplace);
        if (service) {
          const result = await service.getProducts({ limit: options?.limit || 100 });
          if (isOk(result)) {
            allProducts.push(...result.data);
          } else {
            errors.push(`${marketplace}: ${result.error.message}`);
          }
        }
      })
    );

    if (errors.length > 0 && allProducts.length === 0) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: `Failed to fetch products: ${errors.join("; ")}`,
      }));
    }

    return ok(allProducts);
  }

  async getAllOrders(options?: {
    marketplaces?: MarketplaceType[];
    limit?: number;
    since?: string;
  }): AsyncResult<MarketplaceOrder[], AppError> {
    const allOrders: MarketplaceOrder[] = [];
    const errors: string[] = [];

    const connectionsResult = await this.getAllConnections();
    if (!isOk(connectionsResult)) return err(connectionsResult.error);

    const connectedMarketplaces = connectionsResult.data
      .filter((c) => c.connected && c.status === "active")
      .map((c) => c.marketplace)
      .filter((m) => !options?.marketplaces || options.marketplaces.includes(m));

    await Promise.all(
      connectedMarketplaces.map(async (marketplace) => {
        const service = this.getService(marketplace);
        if (service) {
          const result = await service.getOrders({
            limit: options?.limit || 100,
            since: options?.since,
          });
          if (isOk(result)) {
            allOrders.push(...result.data);
          } else {
            errors.push(`${marketplace}: ${result.error.message}`);
          }
        }
      })
    );

    if (errors.length > 0 && allOrders.length === 0) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: `Failed to fetch orders: ${errors.join("; ")}`,
      }));
    }

    allOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return ok(allOrders);
  }

  async getAggregatedAnalytics(params: {
    startDate: string;
    endDate: string;
    marketplaces?: MarketplaceType[];
  }): AsyncResult<{
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    totalUnits: number;
    byMarketplace: MarketplaceAnalytics[];
  }, AppError> {
    const byMarketplace: MarketplaceAnalytics[] = [];
    const errors: string[] = [];

    const connectionsResult = await this.getAllConnections();
    if (!isOk(connectionsResult)) return err(connectionsResult.error);

    const connectedMarketplaces = connectionsResult.data
      .filter((c) => c.connected && c.status === "active")
      .map((c) => c.marketplace)
      .filter((m) => !params.marketplaces || params.marketplaces.includes(m));

    await Promise.all(
      connectedMarketplaces.map(async (marketplace) => {
        const service = this.getService(marketplace);
        if (service) {
          const result = await service.getAnalytics({
            startDate: params.startDate,
            endDate: params.endDate,
          });
          if (isOk(result)) {
            byMarketplace.push(result.data);
          } else {
            errors.push(`${marketplace}: ${result.error.message}`);
          }
        }
      })
    );

    const totalRevenue = byMarketplace.reduce((sum, a) => sum + a.totalRevenue, 0);
    const totalOrders = byMarketplace.reduce((sum, a) => sum + a.totalOrders, 0);
    const totalUnits = byMarketplace.reduce((sum, a) => sum + a.totalUnits, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return ok({
      totalRevenue,
      totalOrders,
      averageOrderValue,
      totalUnits,
      byMarketplace,
    });
  }

  async syncAll(): AsyncResult<SyncResult[], AppError> {
    const results: SyncResult[] = [];

    const connectionsResult = await this.getAllConnections();
    if (!isOk(connectionsResult)) return err(connectionsResult.error);

    const connectedMarketplaces = connectionsResult.data
      .filter((c) => c.connected && c.status === "active")
      .map((c) => c.marketplace);

    await Promise.all(
      connectedMarketplaces.map(async (marketplace) => {
        const result = await this.syncMarketplace(marketplace);
        if (isOk(result)) {
          results.push(result.data);
        }
      })
    );

    return ok(results);
  }

  async syncMarketplace(marketplace: MarketplaceType): AsyncResult<SyncResult, AppError> {
    const service = this.getService(marketplace);
    if (!service) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Marketplace ${marketplace} is not supported`,
      }));
    }

    const [productsResult, ordersResult] = await Promise.all([
      service.syncProducts(),
      service.syncOrders(),
    ]);

    const errors: string[] = [];
    let itemsSynced = 0;

    if (isOk(productsResult)) {
      itemsSynced += productsResult.data.itemsSynced;
      errors.push(...productsResult.data.errors);
    } else {
      errors.push(productsResult.error.message);
    }

    if (isOk(ordersResult)) {
      itemsSynced += ordersResult.data.itemsSynced;
      errors.push(...ordersResult.data.errors);
    } else {
      errors.push(ordersResult.error.message);
    }

    return ok({
      success: errors.length === 0,
      marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced,
      errors,
    });
  }
}

export const unifiedMarketplaceService = new UnifiedMarketplaceServiceImpl();

export { printifyService } from "./services/printify";
export { shopifyService } from "./services/shopify";
export { etsyService } from "./services/etsy";
export { wooCommerceService } from "./services/woocommerce";
export { amazonService } from "./services/amazon";
export { tiktokShopService } from "./services/tiktokShop";
