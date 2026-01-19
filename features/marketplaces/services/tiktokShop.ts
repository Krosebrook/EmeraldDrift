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

class TikTokShopService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "tiktok_shop";
  readonly displayName = "TikTok Shop";
  readonly baseUrl = "https://open-api.tiktokglobalshop.com";

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    return {
      "x-tts-access-token": credentials.accessToken || "",
      "Content-Type": "application/json",
    };
  }

  private generateSign(path: string, timestamp: string, credentials: MarketplaceCredentials): string {
    return "";
  }

  async testConnection(): AsyncResult<boolean, AppError> {
    const result = await this.makeRequest<{ code: number; message: string; data: unknown }>(
      "/authorization/202309/shops"
    );
    if (!result.success) return err(result.error);
    if (result.data.code !== 0) {
      return err(new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: result.data.message || "TikTok Shop authentication failed",
      }));
    }
    return ok(true);
  }

  async getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    const pageSize = params?.limit || 100;
    const pageNumber = Math.floor((params?.offset || 0) / pageSize) + 1;

    const result = await this.makeRequest<{
      code: number;
      data: { products: TikTokProduct[]; total_count: number };
    }>(`/product/202309/products?page_size=${pageSize}&page_number=${pageNumber}`);

    if (!result.success) return err(result.error);
    if (result.data.code !== 0) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: "Failed to fetch TikTok Shop products",
      }));
    }

    const products: MarketplaceProduct[] = result.data.data.products.map((p) => this.mapProduct(p));
    return ok(products);
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    const result = await this.makeRequest<{
      code: number;
      data: TikTokProduct;
    }>(`/product/202309/products/${productId}`);

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data.data));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    const tiktokProduct = {
      title: product.title,
      description: product.description,
      category_id: "0",
      main_images: product.images?.map((url) => ({ url })) || [],
      skus: [{
        sales_attributes: [],
        original_price: {
          amount: ((product.price || 0) * 100).toString(),
          currency: product.currency || "USD",
        },
        seller_sku: product.sku || "",
        inventory: [{
          warehouse_id: "",
          quantity: product.quantity || 0,
        }],
      }],
    };

    const result = await this.makeRequest<{
      code: number;
      data: { product_id: string };
    }>("/product/202309/products", {
      method: "POST",
      body: JSON.stringify(tiktokProduct),
    });

    if (!result.success) return err(result.error);

    return this.getProduct(result.data.data.product_id);
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    const tiktokUpdates: Record<string, unknown> = {};
    if (updates.title) tiktokUpdates.title = updates.title;
    if (updates.description) tiktokUpdates.description = updates.description;

    const result = await this.makeRequest<{ code: number }>(
      `/product/202309/products/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(tiktokUpdates),
      }
    );

    if (!result.success) return err(result.error);
    return this.getProduct(productId);
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    const result = await this.makeRequest<{ code: number }>(
      `/product/202309/products/${productId}`,
      { method: "DELETE" }
    );

    if (!result.success) return err(result.error);
    return ok(undefined);
  }

  async getOrders(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    since?: string;
  }): AsyncResult<MarketplaceOrder[], AppError> {
    const pageSize = params?.limit || 100;
    const pageNumber = Math.floor((params?.offset || 0) / pageSize) + 1;

    let endpoint = `/order/202309/orders?page_size=${pageSize}&page_token=${pageNumber}`;
    if (params?.since) {
      const timestamp = Math.floor(new Date(params.since).getTime() / 1000);
      endpoint += `&create_time_ge=${timestamp}`;
    }

    const result = await this.makeRequest<{
      code: number;
      data: { orders: TikTokOrder[] };
    }>(endpoint);

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.data.orders.map((o) => this.mapOrder(o));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const result = await this.makeRequest<{
      code: number;
      data: { orders: TikTokOrder[] };
    }>(`/order/202309/orders?order_ids=${orderId}`);

    if (!result.success) return err(result.error);
    if (result.data.data.orders.length === 0) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "Order not found",
      }));
    }
    return ok(this.mapOrder(result.data.data.orders[0]));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    return err(new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "TikTok Shop order status updates require using the Fulfillment API.",
    }));
  }

  async shipOrder(orderId: string, trackingNumber: string, shippingProvider: string): AsyncResult<void, AppError> {
    const result = await this.makeRequest<{ code: number }>(
      `/fulfillment/202309/orders/${orderId}/packages`,
      {
        method: "POST",
        body: JSON.stringify({
          tracking_number: trackingNumber,
          shipping_provider_id: shippingProvider,
        }),
      }
    );

    if (!result.success) return err(result.error);
    return ok(undefined);
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

    const productSales = new Map<string, { title: string; units: number; revenue: number }>();
    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        const current = productSales.get(item.productId) || { title: item.title, units: 0, revenue: 0 };
        current.units += item.quantity;
        current.revenue += item.total;
        productSales.set(item.productId, current);
      });
    });

    const topProducts = Array.from(productSales.entries())
      .map(([productId, data]) => ({ productId, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return ok({
      marketplace: this.marketplace,
      period: "month",
      startDate: params.startDate,
      endDate: params.endDate,
      totalOrders: filteredOrders.length,
      totalRevenue,
      averageOrderValue: filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0,
      totalUnits,
      topProducts,
    });
  }

  async syncProducts(): AsyncResult<SyncResult, AppError> {
    const result = await this.getProducts({ limit: 500 });
    
    return ok({
      success: result.success,
      marketplace: this.marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced: result.success ? result.data.length : 0,
      errors: result.success ? [] : [result.error.message],
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

  private mapProduct(p: TikTokProduct): MarketplaceProduct {
    const defaultSku = p.skus[0];
    const price = defaultSku?.original_price?.amount 
      ? parseInt(defaultSku.original_price.amount) / 100 
      : 0;

    return {
      id: p.id,
      externalId: p.id,
      marketplace: this.marketplace,
      title: p.title,
      description: p.description,
      status: p.status === 1 ? "active" : "inactive",
      price,
      currency: defaultSku?.original_price?.currency || "USD",
      sku: defaultSku?.seller_sku,
      quantity: defaultSku?.inventory?.[0]?.quantity,
      images: p.main_images?.map((img) => img.url) || [],
      createdAt: new Date(p.create_time * 1000).toISOString(),
      updatedAt: new Date(p.update_time * 1000).toISOString(),
    };
  }

  private mapOrder(o: TikTokOrder): MarketplaceOrder {
    return {
      id: o.id,
      externalId: o.id,
      marketplace: this.marketplace,
      orderNumber: o.id,
      status: this.mapOrderStatus(o.status),
      fulfillmentStatus: o.fulfillment_status === "FULFILLED" ? "fulfilled" : "unfulfilled",
      paymentStatus: o.payment?.payment_status === "PAID" ? "paid" : "pending",
      customer: {
        email: o.buyer_email || "",
        firstName: o.recipient_address?.name?.split(" ")[0],
        lastName: o.recipient_address?.name?.split(" ").slice(1).join(" "),
        phone: o.recipient_address?.phone_number,
      },
      items: o.line_items?.map((item) => ({
        id: item.id,
        productId: item.product_id,
        variantId: item.sku_id,
        title: item.product_name,
        sku: item.seller_sku,
        quantity: item.quantity,
        price: parseInt(item.original_price?.amount || "0") / 100,
        total: (parseInt(item.original_price?.amount || "0") / 100) * item.quantity,
        fulfillmentStatus: "unfulfilled",
      })) || [],
      shippingAddress: o.recipient_address ? {
        firstName: o.recipient_address.name?.split(" ")[0] || "",
        lastName: o.recipient_address.name?.split(" ").slice(1).join(" ") || "",
        address1: o.recipient_address.address_line1 || "",
        address2: o.recipient_address.address_line2 || undefined,
        city: o.recipient_address.city || "",
        province: o.recipient_address.state || undefined,
        country: o.recipient_address.region || "",
        countryCode: o.recipient_address.region_code || "",
        zip: o.recipient_address.postal_code || "",
        phone: o.recipient_address.phone_number || undefined,
      } : undefined,
      subtotal: parseInt(o.payment?.product_original_price?.amount || "0") / 100,
      shippingCost: parseInt(o.payment?.shipping_fee?.amount || "0") / 100,
      tax: parseInt(o.payment?.tax?.amount || "0") / 100,
      discount: parseInt(o.payment?.platform_discount?.amount || "0") / 100,
      total: parseInt(o.payment?.total_amount?.amount || "0") / 100,
      currency: o.payment?.currency || "USD",
      createdAt: new Date(o.create_time * 1000).toISOString(),
      updatedAt: new Date(o.update_time * 1000).toISOString(),
    };
  }

  private mapOrderStatus(status: string): MarketplaceOrder["status"] {
    const statusMap: Record<string, MarketplaceOrder["status"]> = {
      UNPAID: "pending",
      AWAITING_SHIPMENT: "confirmed",
      AWAITING_COLLECTION: "processing",
      IN_TRANSIT: "shipped",
      DELIVERED: "delivered",
      COMPLETED: "delivered",
      CANCELLED: "cancelled",
    };
    return statusMap[status] || "pending";
  }
}

interface TikTokProduct {
  id: string;
  title: string;
  description: string;
  status: number;
  create_time: number;
  update_time: number;
  main_images: Array<{ url: string }>;
  skus: Array<{
    id: string;
    seller_sku: string;
    original_price: { amount: string; currency: string };
    inventory: Array<{ warehouse_id: string; quantity: number }>;
  }>;
}

interface TikTokOrder {
  id: string;
  status: string;
  fulfillment_status: string;
  create_time: number;
  update_time: number;
  buyer_email?: string;
  recipient_address?: {
    name: string;
    phone_number: string;
    address_line1: string;
    address_line2?: string;
    city: string;
    state?: string;
    postal_code: string;
    region: string;
    region_code: string;
  };
  line_items?: Array<{
    id: string;
    product_id: string;
    sku_id: string;
    product_name: string;
    seller_sku: string;
    quantity: number;
    original_price: { amount: string; currency: string };
  }>;
  payment?: {
    currency: string;
    payment_status: string;
    total_amount: { amount: string };
    product_original_price: { amount: string };
    shipping_fee: { amount: string };
    tax: { amount: string };
    platform_discount: { amount: string };
  };
}

export const tiktokShopService = new TikTokShopService();
