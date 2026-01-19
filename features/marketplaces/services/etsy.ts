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

interface EtsyListing {
  listing_id: number;
  user_id: number;
  shop_id: number;
  title: string;
  description: string;
  state: "active" | "inactive" | "draft" | "expired" | "removed";
  creation_timestamp: number;
  last_modified_timestamp: number;
  quantity: number;
  tags: string[];
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  sku: string[];
  images: Array<{
    listing_image_id: number;
    url_fullxfull: string;
    rank: number;
  }>;
}

interface EtsyReceipt {
  receipt_id: number;
  receipt_type: number;
  seller_user_id: number;
  seller_email: string;
  buyer_user_id: number;
  buyer_email: string;
  name: string;
  first_line: string;
  second_line: string | null;
  city: string;
  state: string | null;
  zip: string;
  formatted_address: string;
  country_iso: string;
  payment_method: string;
  payment_email: string;
  grandtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  subtotal: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_shipping_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  total_tax_cost: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  discount_amt: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  status: string;
  is_shipped: boolean;
  is_paid: boolean;
  create_timestamp: number;
  update_timestamp: number;
  transactions: Array<{
    transaction_id: number;
    title: string;
    description: string;
    seller_user_id: number;
    buyer_user_id: number;
    create_timestamp: number;
    paid_timestamp: number | null;
    shipped_timestamp: number | null;
    quantity: number;
    listing_image_id: number;
    receipt_id: number;
    is_digital: boolean;
    file_data: string;
    listing_id: number;
    sku: string;
    product_id: number;
    transaction_type: string;
    price: {
      amount: number;
      divisor: number;
      currency_code: string;
    };
  }>;
}

class EtsyService extends BaseMarketplaceService {
  readonly marketplace: MarketplaceType = "etsy";
  readonly displayName = "Etsy";
  readonly baseUrl = "https://api.etsy.com/v3/application";

  private shopId: string | null = null;

  protected async buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>> {
    return {
      "Authorization": `Bearer ${credentials.accessToken}`,
      "x-api-key": credentials.apiKey || "",
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

    const meResult = await this.makeRequest<{ user_id: number; shop_id: number }>("/users/me");
    if (!meResult.success) return err(meResult.error);

    if (!meResult.data.shop_id) {
      return err(new AppError({
        code: ErrorCode.NOT_FOUND,
        message: "No Etsy shop found for this account.",
      }));
    }

    this.shopId = meResult.data.shop_id.toString();

    const currentCreds = await this.getCredentials();
    if (currentCreds) {
      await this.setCredentials({ ...currentCreds, shopId: this.shopId });
    }

    return ok(this.shopId);
  }

  async testConnection(): AsyncResult<boolean, AppError> {
    const result = await this.makeRequest<{ user_id: number }>("/users/me");
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
    const offset = params?.offset || 0;
    
    let endpoint = `/shops/${shopIdResult.data}/listings?limit=${limit}&offset=${offset}`;
    if (params?.status) endpoint += `&state=${params.status}`;

    const result = await this.makeRequest<{ results: EtsyListing[]; count: number }>(endpoint);

    if (!result.success) return err(result.error);

    const products: MarketplaceProduct[] = result.data.results.map((l) => this.mapListing(l));
    return ok(products);
  }

  async getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError> {
    const result = await this.makeRequest<EtsyListing>(`/listings/${productId}`);

    if (!result.success) return err(result.error);
    return ok(this.mapListing(result.data));
  }

  async createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const etsyListing = {
      title: product.title,
      description: product.description || "",
      price: product.price || 0,
      quantity: product.quantity || 1,
      tags: product.tags?.slice(0, 13) || [],
      who_made: "i_did",
      when_made: "made_to_order",
      taxonomy_id: 1,
      is_supply: false,
    };

    const result = await this.makeRequest<EtsyListing>(
      `/shops/${shopIdResult.data}/listings`,
      {
        method: "POST",
        body: JSON.stringify(etsyListing),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapListing(result.data));
  }

  async updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const etsyUpdates: Record<string, unknown> = {};
    if (updates.title) etsyUpdates.title = updates.title;
    if (updates.description) etsyUpdates.description = updates.description;
    if (updates.price !== undefined) etsyUpdates.price = updates.price;
    if (updates.quantity !== undefined) etsyUpdates.quantity = updates.quantity;
    if (updates.tags) etsyUpdates.tags = updates.tags.slice(0, 13);
    if (updates.status) etsyUpdates.state = updates.status === "active" ? "active" : "inactive";

    const result = await this.makeRequest<EtsyListing>(
      `/shops/${shopIdResult.data}/listings/${productId}`,
      {
        method: "PATCH",
        body: JSON.stringify(etsyUpdates),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapListing(result.data));
  }

  async deleteProduct(productId: string): AsyncResult<void, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<void>(
      `/shops/${shopIdResult.data}/listings/${productId}`,
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
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const limit = params?.limit || 100;
    const offset = params?.offset || 0;

    let endpoint = `/shops/${shopIdResult.data}/receipts?limit=${limit}&offset=${offset}`;
    if (params?.status === "paid") endpoint += "&was_paid=true";
    if (params?.status === "shipped") endpoint += "&was_shipped=true";

    const result = await this.makeRequest<{ results: EtsyReceipt[]; count: number }>(endpoint);

    if (!result.success) return err(result.error);

    const orders: MarketplaceOrder[] = result.data.results.map((r) => this.mapReceipt(r));
    return ok(orders);
  }

  async getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    const result = await this.makeRequest<EtsyReceipt>(
      `/shops/${shopIdResult.data}/receipts/${orderId}`
    );

    if (!result.success) return err(result.error);
    return ok(this.mapReceipt(result.data));
  }

  async updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError> {
    const shopIdResult = await this.ensureShopId();
    if (!shopIdResult.success) return err(shopIdResult.error);

    if (status !== "shipped") {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Etsy only supports marking orders as shipped.",
      }));
    }

    const result = await this.makeRequest<EtsyReceipt>(
      `/shops/${shopIdResult.data}/receipts/${orderId}`,
      {
        method: "PUT",
        body: JSON.stringify({ was_shipped: true }),
      }
    );

    if (!result.success) return err(result.error);
    return ok(this.mapReceipt(result.data));
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

  private mapListing(l: EtsyListing): MarketplaceProduct {
    const price = l.price.amount / l.price.divisor;
    
    return {
      id: l.listing_id.toString(),
      externalId: l.listing_id.toString(),
      marketplace: this.marketplace,
      title: l.title,
      description: l.description,
      status: l.state === "active" ? "active" : l.state === "draft" ? "draft" : "inactive",
      price,
      currency: l.price.currency_code,
      sku: l.sku[0],
      quantity: l.quantity,
      images: l.images.map((img) => img.url_fullxfull),
      tags: l.tags,
      createdAt: new Date(l.creation_timestamp * 1000).toISOString(),
      updatedAt: new Date(l.last_modified_timestamp * 1000).toISOString(),
    };
  }

  private mapReceipt(r: EtsyReceipt): MarketplaceOrder {
    const grandtotal = r.grandtotal.amount / r.grandtotal.divisor;
    const subtotal = r.subtotal.amount / r.subtotal.divisor;
    const shipping = r.total_shipping_cost.amount / r.total_shipping_cost.divisor;
    const tax = r.total_tax_cost.amount / r.total_tax_cost.divisor;
    const discount = r.discount_amt.amount / r.discount_amt.divisor;

    const nameParts = r.name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    return {
      id: r.receipt_id.toString(),
      externalId: r.receipt_id.toString(),
      marketplace: this.marketplace,
      orderNumber: r.receipt_id.toString(),
      status: r.is_shipped ? "shipped" : r.is_paid ? "confirmed" : "pending",
      fulfillmentStatus: r.is_shipped ? "fulfilled" : "unfulfilled",
      paymentStatus: r.is_paid ? "paid" : "pending",
      customer: {
        id: r.buyer_user_id.toString(),
        email: r.buyer_email,
        firstName,
        lastName,
      },
      items: r.transactions.map((t) => ({
        id: t.transaction_id.toString(),
        productId: t.listing_id.toString(),
        variantId: t.product_id.toString(),
        title: t.title,
        sku: t.sku,
        quantity: t.quantity,
        price: t.price.amount / t.price.divisor,
        total: (t.price.amount / t.price.divisor) * t.quantity,
        fulfillmentStatus: t.shipped_timestamp ? "fulfilled" : "unfulfilled",
      })),
      shippingAddress: {
        firstName,
        lastName,
        address1: r.first_line,
        address2: r.second_line || undefined,
        city: r.city,
        province: r.state || undefined,
        country: r.country_iso,
        countryCode: r.country_iso,
        zip: r.zip,
      },
      subtotal,
      shippingCost: shipping,
      tax,
      discount,
      total: grandtotal,
      currency: r.grandtotal.currency_code,
      createdAt: new Date(r.create_timestamp * 1000).toISOString(),
      updatedAt: new Date(r.update_timestamp * 1000).toISOString(),
    };
  }
}

export const etsyService = new EtsyService();
