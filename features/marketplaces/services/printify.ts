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
  ProductVariant,
} from "../types";

interface PrintifyShop {
  id: number;
  title: string;
  sales_channel: string;
}

interface PrintifyProduct {
  id: string;
  title: string;
  description: string;
  tags: string[];
  options: Array<{ name: string; type: string; values: Array<{ id: number; title: string }> }>;
  variants: Array<{
    id: number;
    sku: string;
    cost: number;
    price: number;
    title: string;
    is_enabled: boolean;
    is_default: boolean;
    options: number[];
  }>;
  images: Array<{ src: string; variant_ids: number[]; position: string; is_default: boolean }>;
  created_at: string;
  updated_at: string;
  visible: boolean;
  is_locked: boolean;
  blueprint_id: number;
  print_provider_id: number;
  sales_channel_properties: unknown[];
}

interface PrintifyOrder {
  id: string;
  address_to: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    country: string;
    region: string;
    address1: string;
    address2: string;
    city: string;
    zip: string;
  };
  line_items: Array<{
    product_id: string;
    quantity: number;
    variant_id: number;
    print_provider_id: number;
    blueprint_id: number;
    sku: string;
    cost: number;
    retail_cost: number;
    shipping_cost: number;
    status: string;
    metadata: {
      title: string;
      variant_label: string;
    };
  }>;
  total_price: number;
  total_shipping: number;
  total_tax: number;
  status: string;
  shipping_method: number;
  created_at: string;
  sent_to_production_at: string | null;
  fulfilled_at: string | null;
}

class PrintifyService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "printify";
  readonly displayName = "Printify";
  readonly baseUrl = "https://api.printify.com/v1";

  private shopId: string | null = null;

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    return {
      "Authorization": `Bearer ${credentials.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async ensureShopId(): AsyncResult<string, AppError> {
    if (this.shopId) return ok(this.shopId);

    const creds = await this.getCredentials();
    if (creds?.shopId) {
      this.shopId = creds.shopId;
      return ok(this.shopId);
    }

    const shopsResult = await this.getShops();
    if (!shopsResult.success) return err(shopsResult.error);

    if (shopsResult.data.length === 0) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "No Printify shops found. Please create a shop first.",
      }));
    }

    this.shopId = shopsResult.data[0].id.toString();

    const currentCreds = await this.getCredentials();
    if (currentCreds) {
      await this.setCredentials({ ...currentCreds, shopId: this.shopId });
    }

    return ok(this.shopId);
  }

  async getShops(): AsyncResult<PrintifyShop[], AppError> {
    return this.makeRequest<PrintifyShop[]>("/shops.json");
  }

  async testConnection(): AsyncResult<boolean, AppError> {
    const result = await this.getShops();
    if (!result.success) return err(result.error);
    return ok(true);
  }

  async getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const limit = params?.limit || 100;
    const page = Math.floor((params?.offset || 0) / limit) + 1;

    const result = await this.makeRequest<{ data: PrintifyProduct[] }>(
      `/shops/${shopIdResult.data}/products.json?limit=${limit}&page=${page}`
    );

    if (!result.success) return err(result.error);

    const products: MarketplaceProduct[] = result.data.data.map((p) => this.mapProduct(p));
    return ok(products);
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<PrintifyProduct>(
      `/shops/${shopIdResult.data}/products/${productId}.json`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const printifyProduct = {
      title: product.title,
      description: product.description || "",
      tags: product.tags || [],
    };

    const result = await this.makeRequest<PrintifyProduct>(
      `/shops/${shopIdResult.data}/products.json`,
      {
        method: "POST",
        body: JSON.stringify(printifyProduct),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const printifyUpdates: Record<string, unknown> = {};
    if (updates.title) printifyUpdates.title = updates.title;
    if (updates.description) printifyUpdates.description = updates.description;
    if (updates.tags) printifyUpdates.tags = updates.tags;

    const result = await this.makeRequest<PrintifyProduct>(
      `/shops/${shopIdResult.data}/products/${productId}.json`,
      {
        method: "PUT",
        body: JSON.stringify(printifyUpdates),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapProduct(result.data));
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<void>(
      `/shops/${shopIdResult.data}/products/${productId}.json`,
      { method: "DELETE" }
    );

    if (!result.success) return err(result.error);
    return ok(undefined);
  }

  async publishProduct(productId: string, publishToShop = true): AsyncResult<void, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<void>(
      `/shops/${shopIdResult.data}/products/${productId}/publish.json`,
      {
        method: "POST",
        body: JSON.stringify({
          title: true,
          description: true,
          images: true,
          variants: true,
          tags: true,
        }),
      }
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
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const limit = params?.limit || 100;
    const page = Math.floor((params?.offset || 0) / limit) + 1;

    let endpoint = `/shops/${shopIdResult.data}/orders.json?limit=${limit}&page=${page}`;
    if (params?.status) endpoint += `&status=${params.status}`;

    const result = await this.makeRequest<{ data: PrintifyOrder[] }>(endpoint);

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.data.map((o) => this.mapOrder(o));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<PrintifyOrder>(
      `/shops/${shopIdResult.data}/orders/${orderId}.json`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapOrder(result.data));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    return err(new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Printify order status is managed automatically by the fulfillment process.",
    }));
  }

  async sendToProduction(orderId: string): AsyncResult<void, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<void>(
      `/shops/${shopIdResult.data}/orders/${orderId}/send_to_production.json`,
      { method: "POST" }
    );

    if (!result.success) return err(result.error);
    return ok(undefined);
  }

  async getAnalytics(params: {
    startDate: string;
    endDate: string;
  }): AsyncResult<MarketplaceAnalytics, AppError> {
    const ordersResult = await this.getOrders({ limit: 500 });
    if (!ordersResult.success) return err(ordersResult.error);

    const start = new Date(params.startDate);
    const end = new Date(params.endDate);

    const filteredOrders = ordersResult.data.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= start && orderDate <= end;
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

  async getBlueprints(): AsyncResult<Array<{ id: number; title: string; description: string }>, AppError> {
    return this.makeRequest("/catalog/blueprints.json");
  }

  async getPrintProviders(blueprintId: number): AsyncResult<Array<{ id: number; title: string }>, AppError> {
    return this.makeRequest(`/catalog/blueprints/${blueprintId}/print_providers.json`);
  }

  private mapProduct(p: PrintifyProduct): MarketplaceProduct {
    const defaultVariant = p.variants.find((v) => v.is_default) || p.variants[0];
    
    return {
      id: p.id,
      externalId: p.id,
      marketplace: this.marketplace,
      title: p.title,
      description: p.description,
      status: p.visible ? "active" : "draft",
      price: defaultVariant?.price || 0,
      currency: "USD",
      sku: defaultVariant?.sku,
      images: p.images.map((img) => img.src),
      variants: p.variants.map((v) => ({
        id: v.id.toString(),
        externalId: v.id.toString(),
        title: v.title,
        sku: v.sku,
        price: v.price,
        options: {},
      })),
      tags: p.tags,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }

  private mapOrder(o: PrintifyOrder): MarketplaceOrder {
    return {
      id: o.id,
      externalId: o.id,
      marketplace: this.marketplace,
      orderNumber: o.id,
      status: this.mapOrderStatus(o.status),
      fulfillmentStatus: o.fulfilled_at ? "fulfilled" : "unfulfilled",
      paymentStatus: "paid",
      customer: {
        email: o.address_to.email,
        firstName: o.address_to.first_name,
        lastName: o.address_to.last_name,
        phone: o.address_to.phone,
      },
      items: o.line_items.map((item) => ({
        id: `${item.product_id}-${item.variant_id}`,
        productId: item.product_id,
        variantId: item.variant_id.toString(),
        title: item.metadata.title,
        sku: item.sku,
        quantity: item.quantity,
        price: item.retail_cost,
        total: item.retail_cost * item.quantity,
        fulfillmentStatus: item.status === "fulfilled" ? "fulfilled" : "unfulfilled",
      })),
      shippingAddress: {
        firstName: o.address_to.first_name,
        lastName: o.address_to.last_name,
        address1: o.address_to.address1,
        address2: o.address_to.address2,
        city: o.address_to.city,
        province: o.address_to.region,
        country: o.address_to.country,
        countryCode: o.address_to.country,
        zip: o.address_to.zip,
        phone: o.address_to.phone,
      },
      subtotal: o.total_price - o.total_shipping - o.total_tax,
      shippingCost: o.total_shipping,
      tax: o.total_tax,
      discount: 0,
      total: o.total_price,
      currency: "USD",
      createdAt: o.created_at,
      updatedAt: o.created_at,
      fulfilledAt: o.fulfilled_at || undefined,
    };
  }

  private mapOrderStatus(status: string): MarketplaceOrder["status"] {
    const statusMap: Record<string, MarketplaceOrder["status"]> = {
      pending: "pending",
      "awaiting-fulfillment": "processing",
      "in-production": "processing",
      shipped: "shipped",
      delivered: "delivered",
      cancelled: "cancelled",
      "on-hold": "on_hold",
    };
    return statusMap[status] || "pending";
  }
}

export const printifyService = new PrintifyService();
