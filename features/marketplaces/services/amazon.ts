import { ok, err, AsyncResult } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import { BaseMarketplaceService } from "./baseMarketplace";
import type {
  MarketplaceType,
  MarketplaceCredentials,
  MarketplaceProduct,
  MarketplaceOrder,
  MarketplaceAnalytics,
  SyncResult,
} from "../types";

class AmazonService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "amazon";
  readonly displayName = "Amazon";
  readonly baseUrl = "https://sellingpartnerapi-na.amazon.com";

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    return {
      "x-amz-access-token": credentials.accessToken || "",
      "Content-Type": "application/json",
    };
  }

  async testConnection(): AsyncResult<boolean, AppError> {
    const result = await this.makeRequest<{ payload: { marketplaceParticipations: unknown[] } }>(
      "/sellers/v1/marketplaceParticipations"
    );
    if (!result.success) return err(result.error);
    return ok(true);
  }

  async getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    return err(new AppError({
      code: ErrorCode.NOT_IMPLEMENTED,
      message: "Amazon product catalog access requires Catalog Items API integration. Please configure your SP-API credentials.",
    }));
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    return err(new AppError({
      code: ErrorCode.NOT_IMPLEMENTED,
      message: "Amazon product lookup requires Catalog Items API integration.",
    }));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    return err(new AppError({
      code: ErrorCode.NOT_IMPLEMENTED,
      message: "Amazon product creation requires Listings API integration with proper category and attribute mapping.",
    }));
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    return err(new AppError({
      code: ErrorCode.NOT_IMPLEMENTED,
      message: "Amazon product updates require Listings API integration.",
    }));
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    return err(new AppError({
      code: ErrorCode.NOT_IMPLEMENTED,
      message: "Amazon does not support product deletion. Products can only be marked as inactive.",
    }));
  }

  async getOrders(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    since?: string;
  }): AsyncResult<MarketplaceOrder[], AppError> {
    const createdAfter = params?.since || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const result = await this.makeRequest<{ payload: { Orders: AmazonOrder[] } }>(
      `/orders/v0/orders?CreatedAfter=${encodeURIComponent(createdAfter)}&MaxResultsPerPage=${params?.limit || 100}`
    );

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.payload.Orders.map((o) => this.mapOrder(o));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const result = await this.makeRequest<{ payload: AmazonOrder }>(
      `/orders/v0/orders/${orderId}`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapOrder(result.data.payload));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    return err(new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Amazon order status updates require using the Shipping API for fulfillment.",
    }));
  }

  async getAnalytics(params: {
    startDate: string;
    endDate: string;
  }): AsyncResult<MarketplaceAnalytics, AppError> {
    const ordersResult = await this.getOrders({ limit: 500, since: params.startDate });
    if (!ordersResult.success) return err(ordersResult.error);

    const end = new Date(params.endDate);
    const filteredOrders = ordersResult.data.filter((o) => new Date(o.createdAt) <= end);

    const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalUnits = filteredOrders.reduce(
      (sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0),
      0
    );

    return ok({
      marketplace: this.marketplace,
      period: "month",
      startDate: params.startDate,
      endDate: params.endDate,
      totalOrders: filteredOrders.length,
      totalRevenue,
      averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
      totalUnits,
      topProducts: [],
    });
  }

  async syncProducts(): AsyncResult<SyncResult, AppError> {
    return ok({
      success: false,
      marketplace: this.marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced: 0,
      errors: ["Amazon product sync requires full SP-API integration"],
    });
  }

  async syncOrders(): AsyncResult<SyncResult, AppError> {
    const result = await this.getOrders({ limit: 500 });
    
    return ok({
      success: result.success,
      marketplace: this.marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced: result.success ? result.data.length : 0,
      errors: result.success ? [] : [result.error.message],
    });
  }

  private mapOrder(o: AmazonOrder): MarketplaceOrder {
    return {
      id: o.AmazonOrderId,
      externalId: o.AmazonOrderId,
      marketplace: this.marketplace,
      orderNumber: o.AmazonOrderId,
      status: this.mapOrderStatus(o.OrderStatus),
      fulfillmentStatus: o.FulfillmentChannel === "AFN" ? "fulfilled" : "unfulfilled",
      paymentStatus: o.PaymentMethod ? "paid" : "pending",
      customer: {
        email: o.BuyerInfo?.BuyerEmail || "",
        firstName: o.BuyerInfo?.BuyerName?.split(" ")[0],
        lastName: o.BuyerInfo?.BuyerName?.split(" ").slice(1).join(" "),
      },
      items: [],
      shippingAddress: o.ShippingAddress ? {
        firstName: o.ShippingAddress.Name?.split(" ")[0] || "",
        lastName: o.ShippingAddress.Name?.split(" ").slice(1).join(" ") || "",
        address1: o.ShippingAddress.AddressLine1 || "",
        address2: o.ShippingAddress.AddressLine2 || undefined,
        city: o.ShippingAddress.City || "",
        province: o.ShippingAddress.StateOrRegion || undefined,
        country: o.ShippingAddress.CountryCode || "",
        countryCode: o.ShippingAddress.CountryCode || "",
        zip: o.ShippingAddress.PostalCode || "",
        phone: o.ShippingAddress.Phone || undefined,
      } : undefined,
      subtotal: parseFloat(o.OrderTotal?.Amount || "0"),
      shippingCost: 0,
      tax: 0,
      discount: 0,
      total: parseFloat(o.OrderTotal?.Amount || "0"),
      currency: o.OrderTotal?.CurrencyCode || "USD",
      createdAt: o.PurchaseDate,
      updatedAt: o.LastUpdateDate,
    };
  }

  private mapOrderStatus(status: string): MarketplaceOrder["status"] {
    const statusMap: Record<string, MarketplaceOrder["status"]> = {
      Pending: "pending",
      Unshipped: "confirmed",
      PartiallyShipped: "processing",
      Shipped: "shipped",
      InvoiceUnconfirmed: "pending",
      Canceled: "cancelled",
      Unfulfillable: "cancelled",
    };
    return statusMap[status] || "pending";
  }
}

interface AmazonOrder {
  AmazonOrderId: string;
  PurchaseDate: string;
  LastUpdateDate: string;
  OrderStatus: string;
  FulfillmentChannel: string;
  PaymentMethod: string;
  OrderTotal?: {
    Amount: string;
    CurrencyCode: string;
  };
  BuyerInfo?: {
    BuyerEmail: string;
    BuyerName: string;
  };
  ShippingAddress?: {
    Name: string;
    AddressLine1: string;
    AddressLine2?: string;
    City: string;
    StateOrRegion?: string;
    PostalCode: string;
    CountryCode: string;
    Phone?: string;
  };
}

export const amazonService = new AmazonService();
