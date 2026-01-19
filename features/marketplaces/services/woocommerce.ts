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

interface WooProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  status: "draft" | "pending" | "private" | "publish";
  description: string;
  short_description: string;
  sku: string;
  price: string;
  regular_price: string;
  sale_price: string;
  stock_quantity: number | null;
  stock_status: string;
  manage_stock: boolean;
  tags: Array<{ id: number; name: string; slug: string }>;
  categories: Array<{ id: number; name: string; slug: string }>;
  images: Array<{ id: number; src: string; name: string; alt: string }>;
  variations: number[];
  date_created: string;
  date_modified: string;
}

interface WooOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  date_created: string;
  date_modified: string;
  discount_total: string;
  shipping_total: string;
  total: string;
  total_tax: string;
  customer_id: number;
  billing: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    email: string;
    phone: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    company: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  payment_method: string;
  payment_method_title: string;
  line_items: Array<{
    id: number;
    name: string;
    product_id: number;
    variation_id: number;
    quantity: number;
    tax_class: string;
    subtotal: string;
    subtotal_tax: string;
    total: string;
    total_tax: string;
    sku: string;
  }>;
  date_paid: string | null;
  date_completed: string | null;
}

class WooCommerceService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "woocommerce";
  readonly displayName = "WooCommerce";
  
  get baseUrl(): string {
    return "";
  }

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    const auth = Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString("base64");
    return {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
    };
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): AsyncResult<T, AppError> {
    const creds = await this.getCredentials();
    if (!creds || !creds.storeUrl) {
      return err(new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: "WooCommerce store not configured. Please connect your store first.",
      }));
    }

    if (!creds.apiKey || !creds.apiSecret) {
      return err(new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: "WooCommerce API keys missing. Please reconnect your store.",
      }));
    }

    try {
      const headers = await this.buildHeaders(creds);
      const storeUrl = creds.storeUrl.replace(/\/$/, "");
      const url = `${storeUrl}/wp-json/wc/v3${endpoint}`;
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
      }

      const data = await response.json();
      return ok(data as T);
    } catch (error) {
      return err(this.mapApiError(error, "request"));
    }
  }

  async testConnection(): AsyncResult<boolean, AppError> {
    const result = await this.makeRequest<{ store_id: number }>("/system_status");
    if (!result.success) return err(result.error);
    return ok(true);
  }

  async getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    const perPage = params?.limit || 100;
    const page = Math.floor((params?.offset || 0) / perPage) + 1;

    let endpoint = `/products?per_page=${perPage}&page=${page}`;
    if (params?.status) endpoint += `&status=${params.status}`;

    const result = await this.makeRequest<WooProduct[]>(endpoint);

    if (!result.success) return err(result.error);

    const products: MarketplaceProduct[] = result.data.map((p) => this.mapProduct(p));
    return ok(products);
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    const result = await this.makeRequest<WooProduct>(`/products/${productId}`);

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    const wooProduct = {
      name: product.title,
      description: product.description || "",
      status: product.status === "active" ? "publish" : "draft",
      regular_price: product.price?.toString() || "0",
      sku: product.sku,
      stock_quantity: product.quantity,
      manage_stock: product.quantity !== undefined,
      tags: product.tags?.map((t) => ({ name: t })),
      categories: product.categories?.map((c) => ({ name: c })),
    };

    const result = await this.makeRequest<WooProduct>(
      "/products",
      {
        method: "POST",
        body: JSON.stringify(wooProduct),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    const wooUpdates: Record<string, unknown> = {};
    if (updates.title) wooUpdates.name = updates.title;
    if (updates.description) wooUpdates.description = updates.description;
    if (updates.price !== undefined) wooUpdates.regular_price = updates.price.toString();
    if (updates.compareAtPrice !== undefined) wooUpdates.sale_price = updates.compareAtPrice.toString();
    if (updates.sku) wooUpdates.sku = updates.sku;
    if (updates.quantity !== undefined) {
      wooUpdates.stock_quantity = updates.quantity;
      wooUpdates.manage_stock = true;
    }
    if (updates.status) wooUpdates.status = updates.status === "active" ? "publish" : "draft";
    if (updates.tags) wooUpdates.tags = updates.tags.map((t) => ({ name: t }));

    const result = await this.makeRequest<WooProduct>(
      `/products/${productId}`,
      {
        method: "PUT",
        body: JSON.stringify(wooUpdates),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    const result = await this.makeRequest<void>(
      `/products/${productId}?force=true`,
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
    const perPage = params?.limit || 100;
    const page = Math.floor((params?.offset || 0) / perPage) + 1;

    let endpoint = `/orders?per_page=${perPage}&page=${page}`;
    if (params?.status) endpoint += `&status=${params.status}`;
    if (params?.since) endpoint += `&after=${params.since}`;

    const result = await this.makeRequest<WooOrder[]>(endpoint);

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.map((o) => this.mapOrder(o));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const result = await this.makeRequest<WooOrder>(`/orders/${orderId}`);

    if (!result.success) return err(result.error);
    return ok(this.mapOrder(result.data));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    const result = await this.makeRequest<WooOrder>(
      `/orders/${orderId}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapOrder(result.data));
  }

  async getAnalytics(params: {
    startDate: string;
    endDate: string;
  }): AsyncResult<MarketplaceAnalytics, AppError> {
    const ordersResult = await this.getOrders({ 
      limit: 500, 
      since: params.startDate 
    });
    
    if (!ordersResult.success) return err(ordersResult.error);

    const end = new Date(params.endDate);
    const filteredOrders = ordersResult.data.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate <= end;
    });

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

  private mapProduct(p: WooProduct): MarketplaceProduct {
    return {
      id: p.id.toString(),
      externalId: p.id.toString(),
      marketplace: this.marketplace,
      title: p.name,
      description: p.description,
      status: p.status === "publish" ? "active" : p.status === "draft" ? "draft" : "inactive",
      price: parseFloat(p.regular_price) || parseFloat(p.price) || 0,
      compareAtPrice: p.sale_price ? parseFloat(p.sale_price) : undefined,
      currency: "USD",
      sku: p.sku,
      quantity: p.stock_quantity || undefined,
      images: p.images.map((img) => img.src),
      tags: p.tags.map((t) => t.name),
      categories: p.categories.map((c) => c.name),
      createdAt: p.date_created,
      updatedAt: p.date_modified,
    };
  }

  private mapOrder(o: WooOrder): MarketplaceOrder {
    return {
      id: o.id.toString(),
      externalId: o.id.toString(),
      marketplace: this.marketplace,
      orderNumber: o.number,
      status: this.mapOrderStatus(o.status),
      fulfillmentStatus: o.status === "completed" ? "fulfilled" : "unfulfilled",
      paymentStatus: o.date_paid ? "paid" : "pending",
      customer: {
        id: o.customer_id.toString(),
        email: o.billing.email,
        firstName: o.billing.first_name,
        lastName: o.billing.last_name,
        phone: o.billing.phone || undefined,
      },
      items: o.line_items.map((item) => ({
        id: item.id.toString(),
        productId: item.product_id.toString(),
        variantId: item.variation_id ? item.variation_id.toString() : undefined,
        title: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: parseFloat(item.subtotal) / item.quantity,
        total: parseFloat(item.total),
        fulfillmentStatus: o.status === "completed" ? "fulfilled" : "unfulfilled",
      })),
      shippingAddress: {
        firstName: o.shipping.first_name,
        lastName: o.shipping.last_name,
        company: o.shipping.company || undefined,
        address1: o.shipping.address_1,
        address2: o.shipping.address_2 || undefined,
        city: o.shipping.city,
        province: o.shipping.state,
        country: o.shipping.country,
        countryCode: o.shipping.country,
        zip: o.shipping.postcode,
      },
      billingAddress: {
        firstName: o.billing.first_name,
        lastName: o.billing.last_name,
        company: o.billing.company || undefined,
        address1: o.billing.address_1,
        address2: o.billing.address_2 || undefined,
        city: o.billing.city,
        province: o.billing.state,
        country: o.billing.country,
        countryCode: o.billing.country,
        zip: o.billing.postcode,
        phone: o.billing.phone || undefined,
      },
      subtotal: parseFloat(o.total) - parseFloat(o.shipping_total) - parseFloat(o.total_tax) + parseFloat(o.discount_total),
      shippingCost: parseFloat(o.shipping_total),
      tax: parseFloat(o.total_tax),
      discount: parseFloat(o.discount_total),
      total: parseFloat(o.total),
      currency: o.currency,
      createdAt: o.date_created,
      updatedAt: o.date_modified,
    };
  }

  private mapOrderStatus(status: string): MarketplaceOrder["status"] {
    const statusMap: Record<string, MarketplaceOrder["status"]> = {
      pending: "pending",
      processing: "processing",
      "on-hold": "on_hold",
      completed: "delivered",
      cancelled: "cancelled",
      refunded: "refunded",
      failed: "cancelled",
    };
    return statusMap[status] || "pending";
  }
}

export const wooCommerceService = new WooCommerceService();
