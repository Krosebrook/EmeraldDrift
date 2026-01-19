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

interface ShopifyProduct {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  created_at: string;
  handle: string;
  updated_at: string;
  published_at: string | null;
  status: "active" | "archived" | "draft";
  tags: string;
  variants: Array<{
    id: number;
    product_id: number;
    title: string;
    price: string;
    sku: string;
    position: number;
    inventory_policy: string;
    compare_at_price: string | null;
    option1: string | null;
    option2: string | null;
    option3: string | null;
    created_at: string;
    updated_at: string;
    inventory_quantity: number;
  }>;
  images: Array<{
    id: number;
    src: string;
    position: number;
  }>;
}

interface ShopifyOrder {
  id: number;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  cancelled_at: string | null;
  financial_status: string;
  fulfillment_status: string | null;
  currency: string;
  current_total_price: string;
  current_subtotal_price: string;
  total_tax: string;
  total_discounts: string;
  total_shipping_price_set: {
    shop_money: { amount: string; currency_code: string };
  };
  customer: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
  };
  line_items: Array<{
    id: number;
    product_id: number;
    variant_id: number;
    title: string;
    sku: string;
    quantity: number;
    price: string;
    fulfillment_status: string | null;
  }>;
  shipping_address: {
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    province_code: string;
    country: string;
    country_code: string;
    zip: string;
    phone: string | null;
  } | null;
  billing_address: {
    first_name: string;
    last_name: string;
    company: string | null;
    address1: string;
    address2: string | null;
    city: string;
    province: string;
    province_code: string;
    country: string;
    country_code: string;
    zip: string;
    phone: string | null;
  } | null;
}

class ShopifyService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "shopify";
  readonly displayName = "Shopify";
  
  get baseUrl(): string {
    return "";
  }

  private async getStoreUrl(): Promise<string | null> {
    const creds = await this.getCredentials();
    return creds?.storeUrl || null;
  }

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    return {
      "X-Shopify-Access-Token": credentials.accessToken || "",
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
        message: "Shopify store not configured. Please connect your store first.",
      }));
    }

    if (!creds.accessToken) {
      return err(new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: "Shopify access token missing. Please reconnect your store.",
      }));
    }

    try {
      const headers = await this.buildHeaders(creds);
      const url = `https://${creds.storeUrl}/admin/api/2024-01${endpoint}`;
      
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
    const result = await this.makeRequest<{ shop: { name: string } }>("/shop.json");
    if (!result.success) return err(result.error);
    return ok(true);
  }

  async getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    const limit = params?.limit || 50;
    let endpoint = `/products.json?limit=${limit}`;
    if (params?.status) endpoint += `&status=${params.status}`;

    const result = await this.makeRequest<{ products: ShopifyProduct[] }>(endpoint);

    if (!result.success) return err(result.error);

    const products: MarketplaceProduct[] = result.data.products.map((p) => this.mapProduct(p));
    return ok(products);
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    const result = await this.makeRequest<{ product: ShopifyProduct }>(
      `/products/${productId}.json`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data.product));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description || "",
        status: product.status === "active" ? "active" : "draft",
        tags: product.tags?.join(", ") || "",
        variants: product.variants?.map((v) => ({
          title: v.title,
          price: v.price.toString(),
          sku: v.sku,
          compare_at_price: v.compareAtPrice?.toString(),
          inventory_quantity: v.quantity || 0,
        })) || [{
          title: "Default",
          price: (product.price || 0).toString(),
          sku: product.sku,
        }],
      },
    };

    const result = await this.makeRequest<{ product: ShopifyProduct }>(
      "/products.json",
      {
        method: "POST",
        body: JSON.stringify(shopifyProduct),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data.product));
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    const shopifyUpdates: Record<string, unknown> = { product: { id: productId } };
    const productData = shopifyUpdates.product as Record<string, unknown>;
    
    if (updates.title) productData.title = updates.title;
    if (updates.description) productData.body_html = updates.description;
    if (updates.status) productData.status = updates.status === "active" ? "active" : "draft";
    if (updates.tags) productData.tags = updates.tags.join(", ");

    const result = await this.makeRequest<{ product: ShopifyProduct }>(
      `/products/${productId}.json`,
      {
        method: "PUT",
        body: JSON.stringify(shopifyUpdates),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data.product));
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    const result = await this.makeRequest<void>(
      `/products/${productId}.json`,
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
    const limit = params?.limit || 50;
    let endpoint = `/orders.json?limit=${limit}&status=any`;
    if (params?.status) endpoint += `&fulfillment_status=${params.status}`;
    if (params?.since) endpoint += `&created_at_min=${params.since}`;

    const result = await this.makeRequest<{ orders: ShopifyOrder[] }>(endpoint);

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.orders.map((o) => this.mapOrder(o));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const result = await this.makeRequest<{ order: ShopifyOrder }>(
      `/orders/${orderId}.json`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapOrder(result.data.order));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    return err(new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Use fulfillment endpoints to update Shopify order status.",
    }));
  }

  async fulfillOrder(orderId: string, trackingNumber?: string, trackingCompany?: string): AsyncResult<void, AppError> {
    const fulfillment = {
      fulfillment: {
        notify_customer: true,
        ...(trackingNumber && { tracking_number: trackingNumber }),
        ...(trackingCompany && { tracking_company: trackingCompany }),
      },
    };

    const result = await this.makeRequest<void>(
      `/orders/${orderId}/fulfillments.json`,
      {
        method: "POST",
        body: JSON.stringify(fulfillment),
      }
    );

    if (!result.success) return err(result.error);
    return ok(undefined);
  }

  async getAnalytics(params: {
    startDate: string;
    endDate: string;
  }): AsyncResult<MarketplaceAnalytics, AppError> {
    const ordersResult = await this.getOrders({ 
      limit: 250, 
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
    const result = await this.getProducts({ limit: 250 });
    
    return ok({
      success: result.success,
      marketplace: this.marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced: result.success ? result.data.length : 0,
      errors: result.success ? [] : [result.error.message],
    });
  }

  async syncOrders(): AsyncResult<SyncResult, AppError> {
    const result = await this.getOrders({ limit: 250 });
    
    return ok({
      success: result.success,
      marketplace: this.marketplace,
      syncedAt: new Date().toISOString(),
      itemsSynced: result.success ? result.data.length : 0,
      errors: result.success ? [] : [result.error.message],
    });
  }

  private mapProduct(p: ShopifyProduct): MarketplaceProduct {
    const defaultVariant = p.variants[0];
    
    return {
      id: p.id.toString(),
      externalId: p.id.toString(),
      marketplace: this.marketplace,
      title: p.title,
      description: p.body_html,
      status: p.status === "active" ? "active" : p.status === "archived" ? "inactive" : "draft",
      price: parseFloat(defaultVariant?.price || "0"),
      compareAtPrice: defaultVariant?.compare_at_price ? parseFloat(defaultVariant.compare_at_price) : undefined,
      currency: "USD",
      sku: defaultVariant?.sku,
      quantity: defaultVariant?.inventory_quantity,
      images: p.images.map((img) => img.src),
      variants: p.variants.map((v) => ({
        id: v.id.toString(),
        externalId: v.id.toString(),
        title: v.title,
        sku: v.sku,
        price: parseFloat(v.price),
        compareAtPrice: v.compare_at_price ? parseFloat(v.compare_at_price) : undefined,
        quantity: v.inventory_quantity,
        options: {
          ...(v.option1 && { option1: v.option1 }),
          ...(v.option2 && { option2: v.option2 }),
          ...(v.option3 && { option3: v.option3 }),
        },
      })),
      tags: p.tags.split(",").map((t) => t.trim()).filter(Boolean),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      publishedAt: p.published_at || undefined,
    };
  }

  private mapOrder(o: ShopifyOrder): MarketplaceOrder {
    return {
      id: o.id.toString(),
      externalId: o.id.toString(),
      marketplace: this.marketplace,
      orderNumber: o.name,
      status: this.mapOrderStatus(o.financial_status, o.fulfillment_status, o.cancelled_at),
      fulfillmentStatus: o.fulfillment_status === "fulfilled" ? "fulfilled" : 
                        o.fulfillment_status === "partial" ? "partial" : "unfulfilled",
      paymentStatus: this.mapPaymentStatus(o.financial_status),
      customer: {
        id: o.customer.id.toString(),
        email: o.customer.email,
        firstName: o.customer.first_name,
        lastName: o.customer.last_name,
        phone: o.customer.phone || undefined,
      },
      items: o.line_items.map((item) => ({
        id: item.id.toString(),
        productId: item.product_id.toString(),
        variantId: item.variant_id.toString(),
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        price: parseFloat(item.price),
        total: parseFloat(item.price) * item.quantity,
        fulfillmentStatus: item.fulfillment_status === "fulfilled" ? "fulfilled" : "unfulfilled",
      })),
      shippingAddress: o.shipping_address ? {
        firstName: o.shipping_address.first_name,
        lastName: o.shipping_address.last_name,
        company: o.shipping_address.company || undefined,
        address1: o.shipping_address.address1,
        address2: o.shipping_address.address2 || undefined,
        city: o.shipping_address.city,
        province: o.shipping_address.province,
        provinceCode: o.shipping_address.province_code,
        country: o.shipping_address.country,
        countryCode: o.shipping_address.country_code,
        zip: o.shipping_address.zip,
        phone: o.shipping_address.phone || undefined,
      } : undefined,
      billingAddress: o.billing_address ? {
        firstName: o.billing_address.first_name,
        lastName: o.billing_address.last_name,
        company: o.billing_address.company || undefined,
        address1: o.billing_address.address1,
        address2: o.billing_address.address2 || undefined,
        city: o.billing_address.city,
        province: o.billing_address.province,
        provinceCode: o.billing_address.province_code,
        country: o.billing_address.country,
        countryCode: o.billing_address.country_code,
        zip: o.billing_address.zip,
        phone: o.billing_address.phone || undefined,
      } : undefined,
      subtotal: parseFloat(o.current_subtotal_price),
      shippingCost: parseFloat(o.total_shipping_price_set.shop_money.amount),
      tax: parseFloat(o.total_tax),
      discount: parseFloat(o.total_discounts),
      total: parseFloat(o.current_total_price),
      currency: o.currency,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      cancelledAt: o.cancelled_at || undefined,
    };
  }

  private mapOrderStatus(
    financial: string,
    fulfillment: string | null,
    cancelled: string | null
  ): MarketplaceOrder["status"] {
    if (cancelled) return "cancelled";
    if (fulfillment === "fulfilled") return "delivered";
    if (fulfillment === "partial") return "processing";
    if (financial === "paid") return "confirmed";
    if (financial === "refunded") return "refunded";
    return "pending";
  }

  private mapPaymentStatus(status: string): MarketplaceOrder["paymentStatus"] {
    const statusMap: Record<string, MarketplaceOrder["paymentStatus"]> = {
      pending: "pending",
      authorized: "authorized",
      paid: "paid",
      partially_refunded: "partially_refunded",
      refunded: "refunded",
      voided: "voided",
    };
    return statusMap[status] || "pending";
  }
}

export const shopifyService = new ShopifyService();
