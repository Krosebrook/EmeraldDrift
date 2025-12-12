import type { BaseEntity } from "@/features/shared/types";

export type DesignPlatform = 
  | "amazon_kdp"
  | "etsy"
  | "tiktok_shop"
  | "instagram"
  | "pinterest"
  | "gumroad"
  | "printify"
  | "shopify";

export type ProductCategory =
  | "book_cover"
  | "interior"
  | "t_shirt"
  | "mug"
  | "poster"
  | "sticker"
  | "digital_download"
  | "phone_case"
  | "tote_bag"
  | "hoodie"
  | "canvas"
  | "notebook"
  | "custom";

export type DesignStatus = "draft" | "generating" | "ready" | "published" | "failed";

export type GenerationSource = "ai" | "upload" | "template" | "external";

export interface DesignDimensions {
  width: number;
  height: number;
  unit: "px" | "in" | "cm";
  dpi: number;
}

export interface DesignTemplate extends BaseEntity {
  name: string;
  platform: DesignPlatform;
  category: ProductCategory;
  dimensions: DesignDimensions;
  previewUri?: string;
  description: string;
  popular: boolean;
}

export interface ProductDesign extends BaseEntity {
  title: string;
  description: string;
  source: GenerationSource;
  status: DesignStatus;
  templateId?: string;
  platform: DesignPlatform;
  category: ProductCategory;
  dimensions: DesignDimensions;
  imageUri?: string;
  thumbnailUri?: string;
  aiPrompt?: string;
  tags: string[];
  publishedTo: DesignPlatform[];
  publishResults?: PublishResult[];
  metadata?: Record<string, unknown>;
}

export interface PublishResult {
  platform: DesignPlatform;
  success: boolean;
  publishedAt?: string;
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface AIGenerationRequest {
  prompt: string;
  platform: DesignPlatform;
  category: ProductCategory;
  style?: string;
  colorScheme?: string;
  additionalInstructions?: string;
}

export interface AIGenerationResult {
  imageUri: string;
  revisedPrompt?: string;
  generatedAt: string;
}

export interface PlatformConfig extends BaseEntity {
  platform: DesignPlatform;
  apiKey?: string;
  shopId?: string;
  storeUrl?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
  isConfigured: boolean;
  lastSyncAt?: string;
}

export interface UploadTarget {
  platform: DesignPlatform;
  productTitle: string;
  productDescription: string;
  price?: number;
  currency?: string;
  tags?: string[];
  category?: string;
  variants?: ProductVariant[];
}

export interface ProductVariant {
  name: string;
  sku?: string;
  price?: number;
  options?: Record<string, string>;
}

export const PLATFORM_TEMPLATES: Record<DesignPlatform, DesignTemplate[]> = {
  amazon_kdp: [
    {
      id: "kdp_cover_6x9",
      name: "KDP Book Cover 6x9",
      platform: "amazon_kdp",
      category: "book_cover",
      dimensions: { width: 1800, height: 2700, unit: "px", dpi: 300 },
      description: "Standard paperback book cover",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "kdp_cover_8x10",
      name: "KDP Book Cover 8x10",
      platform: "amazon_kdp",
      category: "book_cover",
      dimensions: { width: 2400, height: 3000, unit: "px", dpi: 300 },
      description: "Large format book cover",
      popular: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "kdp_interior_6x9",
      name: "KDP Interior 6x9",
      platform: "amazon_kdp",
      category: "interior",
      dimensions: { width: 1800, height: 2700, unit: "px", dpi: 300 },
      description: "Interior page template",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  etsy: [
    {
      id: "etsy_digital_8x10",
      name: "Digital Print 8x10",
      platform: "etsy",
      category: "digital_download",
      dimensions: { width: 2400, height: 3000, unit: "px", dpi: 300 },
      description: "Popular digital download size",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "etsy_sticker_2x2",
      name: "Sticker 2x2 inch",
      platform: "etsy",
      category: "sticker",
      dimensions: { width: 600, height: 600, unit: "px", dpi: 300 },
      description: "Square sticker design",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  tiktok_shop: [
    {
      id: "tiktok_product_1000",
      name: "Product Image 1000x1000",
      platform: "tiktok_shop",
      category: "custom",
      dimensions: { width: 1000, height: 1000, unit: "px", dpi: 72 },
      description: "TikTok Shop product listing",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  instagram: [
    {
      id: "ig_post_1080",
      name: "Instagram Post",
      platform: "instagram",
      category: "custom",
      dimensions: { width: 1080, height: 1080, unit: "px", dpi: 72 },
      description: "Square Instagram post",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ig_story_1080x1920",
      name: "Instagram Story",
      platform: "instagram",
      category: "custom",
      dimensions: { width: 1080, height: 1920, unit: "px", dpi: 72 },
      description: "Vertical story format",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  pinterest: [
    {
      id: "pin_1000x1500",
      name: "Pinterest Pin",
      platform: "pinterest",
      category: "custom",
      dimensions: { width: 1000, height: 1500, unit: "px", dpi: 72 },
      description: "Optimal Pinterest pin size",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  gumroad: [
    {
      id: "gumroad_cover_1280x720",
      name: "Product Cover",
      platform: "gumroad",
      category: "digital_download",
      dimensions: { width: 1280, height: 720, unit: "px", dpi: 72 },
      description: "Gumroad product thumbnail",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  printify: [
    {
      id: "printify_tshirt_4500",
      name: "T-Shirt Design",
      platform: "printify",
      category: "t_shirt",
      dimensions: { width: 4500, height: 5400, unit: "px", dpi: 300 },
      description: "High-res t-shirt print",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "printify_mug_2700",
      name: "Mug Design",
      platform: "printify",
      category: "mug",
      dimensions: { width: 2700, height: 1100, unit: "px", dpi: 300 },
      description: "11oz mug wrap design",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "printify_poster_18x24",
      name: "Poster 18x24",
      platform: "printify",
      category: "poster",
      dimensions: { width: 5400, height: 7200, unit: "px", dpi: 300 },
      description: "Large format poster",
      popular: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "printify_phonecase",
      name: "Phone Case",
      platform: "printify",
      category: "phone_case",
      dimensions: { width: 1242, height: 2688, unit: "px", dpi: 300 },
      description: "iPhone case design",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  shopify: [
    {
      id: "shopify_product_2048",
      name: "Product Image",
      platform: "shopify",
      category: "custom",
      dimensions: { width: 2048, height: 2048, unit: "px", dpi: 72 },
      description: "Shopify product listing",
      popular: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

export const PLATFORM_INFO: Record<DesignPlatform, { name: string; icon: string; color: string; description: string }> = {
  amazon_kdp: { name: "Amazon KDP", icon: "book", color: "#FF9900", description: "Books & publishing" },
  etsy: { name: "Etsy", icon: "shopping-bag", color: "#F56400", description: "Handmade & digital" },
  tiktok_shop: { name: "TikTok Shop", icon: "video", color: "#000000", description: "Social commerce" },
  instagram: { name: "Instagram", icon: "instagram", color: "#E4405F", description: "Visual marketing" },
  pinterest: { name: "Pinterest", icon: "target", color: "#E60023", description: "Idea pins" },
  gumroad: { name: "Gumroad", icon: "download", color: "#36A9AE", description: "Digital products" },
  printify: { name: "Printify", icon: "printer", color: "#29ABE2", description: "Print-on-demand" },
  shopify: { name: "Shopify", icon: "shopping-cart", color: "#96BF48", description: "E-commerce" },
};

export const CATEGORY_INFO: Record<ProductCategory, { name: string; icon: string }> = {
  book_cover: { name: "Book Cover", icon: "book" },
  interior: { name: "Book Interior", icon: "file-text" },
  t_shirt: { name: "T-Shirt", icon: "user" },
  mug: { name: "Mug", icon: "coffee" },
  poster: { name: "Poster", icon: "image" },
  sticker: { name: "Sticker", icon: "star" },
  digital_download: { name: "Digital Download", icon: "download" },
  phone_case: { name: "Phone Case", icon: "smartphone" },
  tote_bag: { name: "Tote Bag", icon: "shopping-bag" },
  hoodie: { name: "Hoodie", icon: "user" },
  canvas: { name: "Canvas", icon: "square" },
  notebook: { name: "Notebook", icon: "edit-3" },
  custom: { name: "Custom", icon: "grid" },
};
