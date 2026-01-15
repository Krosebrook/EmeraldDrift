import type { BaseEntity } from "@/features/shared/types";

export type MerchProductType =
  | "tshirt-white"
  | "tshirt-black"
  | "tshirt-graphic"
  | "hoodie-black"
  | "hoodie-gray"
  | "mug-ceramic"
  | "mug-travel"
  | "tote-bag"
  | "cap-baseball"
  | "cap-trucker"
  | "phone-case"
  | "phone-case-tough"
  | "poster-matte"
  | "poster-glossy"
  | "canvas-print"
  | "notebook"
  | "pillow"
  | "blanket";

export type StylePreference =
  | "studio"
  | "lifestyle"
  | "editorial"
  | "minimal"
  | "dramatic"
  | "vibrant"
  | "vintage"
  | "professional";

export type AIProvider = "gemini" | "openai";

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export type ImageSize = "1K" | "2K" | "4K";

export type GeminiModel =
  | "gemini-2.5-flash-image"
  | "gemini-3-flash-preview"
  | "gemini-3-pro-preview"
  | "gemini-3-pro-image-preview";

export interface MerchProduct {
  id: MerchProductType;
  name: string;
  description: string;
  category: "apparel" | "drinkware" | "accessories" | "home" | "art";
  placeholderImage: string;
  defaultPrompt: string;
  printArea: {
    width: number;
    height: number;
    unit: "px" | "in";
    dpi: number;
  };
  variants?: ProductVariant[];
  popular: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  additionalPrice?: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: "normal" | "bold";
  color: string;
  position: { x: number; y: number };
  rotation: number;
  alignment: "left" | "center" | "right";
}

export interface MerchDesignState {
  selectedProduct: MerchProductType | null;
  logoImage: string | null;
  backgroundImage: string | null;
  stylePreference: StylePreference;
  textOverlays: TextOverlay[];
  generatedMockup: string | null;
  variations: string[];
  isGenerating: boolean;
  error: string | null;
}

export interface MerchGenerationRequest {
  product: MerchProductType;
  logoImage: string;
  backgroundImage?: string;
  stylePreference: StylePreference;
  textOverlays?: TextOverlay[];
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  additionalPrompt?: string;
}

export interface MerchGenerationResult {
  mockupImage: string;
  variations?: string[];
  generatedAt: string;
  model: GeminiModel | "dall-e-3";
  cached: boolean;
}

export interface AIRequestConfig {
  model: GeminiModel;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
  thinkingBudget?: number;
  maxOutputTokens?: number;
  temperature?: number;
  maxRetries?: number;
  systemInstruction?: string;
}

export interface AIResponse {
  text?: string;
  image?: string;
  finishReason?: string;
}

export interface AICacheEntry {
  promptHash: string;
  response: AIResponse;
  timestamp: number;
  model: GeminiModel;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

export interface UsageMetrics {
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  cacheHits: number;
  cacheMisses: number;
  failedRequests: number;
}

export interface MerchSession extends BaseEntity {
  products: MerchProductType[];
  mockups: Record<MerchProductType, string>;
  logoImage: string;
  stylePreference: StylePreference;
  status: "draft" | "generating" | "ready" | "published";
}

export const STYLE_INFO: Record<StylePreference, { name: string; description: string; icon: string }> = {
  studio: { name: "Studio", description: "Clean professional product photography", icon: "camera" },
  lifestyle: { name: "Lifestyle", description: "In-context lifestyle shots", icon: "sun" },
  editorial: { name: "Editorial", description: "Magazine-style creative shots", icon: "book-open" },
  minimal: { name: "Minimal", description: "Clean and simple backgrounds", icon: "square" },
  dramatic: { name: "Dramatic", description: "Bold lighting and shadows", icon: "zap" },
  vibrant: { name: "Vibrant", description: "Colorful and energetic", icon: "droplet" },
  vintage: { name: "Vintage", description: "Retro aesthetic feel", icon: "clock" },
  professional: { name: "Professional", description: "Corporate and polished", icon: "briefcase" },
};

export const CATEGORY_INFO: Record<MerchProduct["category"], { name: string; icon: string }> = {
  apparel: { name: "Apparel", icon: "user" },
  drinkware: { name: "Drinkware", icon: "coffee" },
  accessories: { name: "Accessories", icon: "shopping-bag" },
  home: { name: "Home", icon: "home" },
  art: { name: "Art & Prints", icon: "image" },
};
