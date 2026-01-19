export type MarketplaceType = 
  | "printify"
  | "shopify"
  | "amazon"
  | "amazon_kdp"
  | "etsy"
  | "tiktok_shop"
  | "woocommerce";

export interface MarketplaceCredentials {
  marketplace: MarketplaceType;
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  shopId?: string;
  storeUrl?: string;
  expiresAt?: string;
}

export interface MarketplaceConnection {
  marketplace: MarketplaceType;
  displayName: string;
  connected: boolean;
  connectedAt?: string;
  lastSyncAt?: string;
  shopName?: string;
  shopUrl?: string;
  status: "active" | "error" | "expired" | "disconnected";
  errorMessage?: string;
}

export interface MarketplaceProduct {
  id: string;
  externalId: string;
  marketplace: MarketplaceType;
  title: string;
  description?: string;
  status: "draft" | "active" | "inactive" | "deleted";
  price: number;
  compareAtPrice?: number;
  currency: string;
  sku?: string;
  quantity?: number;
  images: string[];
  variants?: ProductVariant[];
  tags?: string[];
  categories?: string[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface ProductVariant {
  id: string;
  externalId?: string;
  title: string;
  sku?: string;
  price: number;
  compareAtPrice?: number;
  quantity?: number;
  options: Record<string, string>;
}

export interface MarketplaceOrder {
  id: string;
  externalId: string;
  marketplace: MarketplaceType;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  shippingAddress?: Address;
  billingAddress?: Address;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  fulfilledAt?: string;
  cancelledAt?: string;
}

export type OrderStatus = 
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"
  | "on_hold";

export type FulfillmentStatus =
  | "unfulfilled"
  | "partial"
  | "fulfilled"
  | "cancelled";

export type PaymentStatus =
  | "pending"
  | "authorized"
  | "paid"
  | "partially_refunded"
  | "refunded"
  | "voided";

export interface OrderCustomer {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId?: string;
  title: string;
  sku?: string;
  quantity: number;
  price: number;
  total: number;
  fulfillmentStatus: FulfillmentStatus;
  properties?: Record<string, string>;
}

export interface Address {
  firstName?: string;
  lastName?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  province?: string;
  provinceCode?: string;
  country: string;
  countryCode: string;
  zip: string;
  phone?: string;
}

export interface MarketplaceAnalytics {
  marketplace: MarketplaceType;
  period: "day" | "week" | "month" | "year";
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  totalUnits: number;
  conversionRate?: number;
  topProducts: {
    productId: string;
    title: string;
    units: number;
    revenue: number;
  }[];
}

export interface WebhookEvent {
  id: string;
  marketplace: MarketplaceType;
  eventType: string;
  payload: unknown;
  receivedAt: string;
  processedAt?: string;
  status: "pending" | "processed" | "failed";
  error?: string;
}

export interface SyncResult {
  success: boolean;
  marketplace: MarketplaceType;
  syncedAt: string;
  itemsSynced: number;
  errors: string[];
}

export const MARKETPLACE_CONFIG: Record<MarketplaceType, {
  name: string;
  icon: string;
  color: string;
  supportsWebhooks: boolean;
  supportsInventorySync: boolean;
  supportsPOD: boolean;
  authType: "apiKey" | "oauth" | "both";
  docsUrl: string;
}> = {
  printify: {
    name: "Printify",
    icon: "printer",
    color: "#29ABE2",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: true,
    authType: "apiKey",
    docsUrl: "https://developers.printify.com/",
  },
  shopify: {
    name: "Shopify",
    icon: "shopping-bag",
    color: "#96BF48",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: false,
    authType: "oauth",
    docsUrl: "https://shopify.dev/docs/api",
  },
  amazon: {
    name: "Amazon",
    icon: "box",
    color: "#FF9900",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: false,
    authType: "oauth",
    docsUrl: "https://developer-docs.amazon.com/sp-api/",
  },
  amazon_kdp: {
    name: "Amazon KDP",
    icon: "book",
    color: "#FF9900",
    supportsWebhooks: false,
    supportsInventorySync: false,
    supportsPOD: true,
    authType: "apiKey",
    docsUrl: "https://kdp.amazon.com/",
  },
  etsy: {
    name: "Etsy",
    icon: "heart",
    color: "#F56400",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: false,
    authType: "oauth",
    docsUrl: "https://developers.etsy.com/documentation/",
  },
  tiktok_shop: {
    name: "TikTok Shop",
    icon: "music",
    color: "#000000",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: false,
    authType: "oauth",
    docsUrl: "https://partner.tiktokshop.com/",
  },
  woocommerce: {
    name: "WooCommerce",
    icon: "shopping-cart",
    color: "#96588A",
    supportsWebhooks: true,
    supportsInventorySync: true,
    supportsPOD: false,
    authType: "both",
    docsUrl: "https://woocommerce.github.io/woocommerce-rest-api-docs/",
  },
};
