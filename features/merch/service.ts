import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import { geminiService } from "./services/geminiService";
import { MERCH_PRODUCTS, getProductById } from "./data/products";
import type {
  MerchProduct,
  MerchProductType,
  StylePreference,
  MerchGenerationRequest,
  MerchGenerationResult,
  AIResponse,
} from "./types";

export interface MerchService {
  getProducts(): MerchProduct[];
  getProductById(id: MerchProductType): MerchProduct | undefined;
  getPopularProducts(): MerchProduct[];
  getProductsByCategory(category: MerchProduct["category"]): MerchProduct[];

  generateMockup(request: MerchGenerationRequest): AsyncResult<MerchGenerationResult, AppError>;
  generateVariations(request: MerchGenerationRequest, count?: number): AsyncResult<MerchGenerationResult[], AppError>;

  hasGeminiApiKey(): Promise<boolean>;
  setGeminiApiKey(key: string): Promise<void>;
  removeGeminiApiKey(): Promise<void>;

  getCacheStats(): { hits: number; misses: number; size: number; hitRate: number };
  getUsageMetrics(): {
    requestCount: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    estimatedCost: number;
    cacheHits: number;
    cacheMisses: number;
    failedRequests: number;
  };
  clearCache(): void;
}

export const merchService: MerchService = {
  getProducts(): MerchProduct[] {
    return MERCH_PRODUCTS;
  },

  getProductById(id: MerchProductType): MerchProduct | undefined {
    return getProductById(id);
  },

  getPopularProducts(): MerchProduct[] {
    return MERCH_PRODUCTS.filter((p) => p.popular);
  },

  getProductsByCategory(category: MerchProduct["category"]): MerchProduct[] {
    return MERCH_PRODUCTS.filter((p) => p.category === category);
  },

  async generateMockup(request: MerchGenerationRequest): AsyncResult<MerchGenerationResult, AppError> {
    const product = getProductById(request.product);
    if (!product) {
      return err(AppError.notFound("Product"));
    }

    if (!request.logoImage) {
      return err(AppError.validation("Logo image is required"));
    }

    const hasKey = await geminiService.hasApiKey();
    if (!hasKey) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Gemini API key not configured. Please add your API key in Settings.",
      }));
    }

    const prompt = buildMockupPrompt(product, request);

    const result = await geminiService.generateMockup(
      request.logoImage,
      prompt,
      request.stylePreference,
      {
        backgroundImage: request.backgroundImage,
        aspectRatio: request.aspectRatio,
        imageSize: request.imageSize,
      }
    );

    if (!isOk(result)) {
      return err(result.error);
    }

    if (!result.data.image) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: "No mockup image was generated",
      }));
    }

    return ok({
      mockupImage: result.data.image,
      generatedAt: new Date().toISOString(),
      model: "gemini-2.5-flash-image",
      cached: false,
    });
  },

  async generateVariations(
    request: MerchGenerationRequest,
    count = 3
  ): AsyncResult<MerchGenerationResult[], AppError> {
    const product = getProductById(request.product);
    if (!product) {
      return err(AppError.notFound("Product"));
    }

    if (!request.logoImage) {
      return err(AppError.validation("Logo image is required"));
    }

    const hasKey = await geminiService.hasApiKey();
    if (!hasKey) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Gemini API key not configured. Please add your API key in Settings.",
      }));
    }

    const basePrompt = buildMockupPrompt(product, request);
    const result = await geminiService.generateVariations(basePrompt, request.logoImage, count);

    if (!isOk(result)) {
      return err(result.error);
    }

    const variations: MerchGenerationResult[] = result.data
      .filter((r: AIResponse) => r.image)
      .map((r: AIResponse) => ({
        mockupImage: r.image!,
        generatedAt: new Date().toISOString(),
        model: "gemini-2.5-flash-image" as const,
        cached: false,
      }));

    if (variations.length === 0) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: "No variation images were generated",
      }));
    }

    return ok(variations);
  },

  async hasGeminiApiKey(): Promise<boolean> {
    return geminiService.hasApiKey();
  },

  async setGeminiApiKey(key: string): Promise<void> {
    return geminiService.setApiKey(key);
  },

  async removeGeminiApiKey(): Promise<void> {
    return geminiService.removeApiKey();
  },

  getCacheStats() {
    return geminiService.getCacheStats();
  },

  getUsageMetrics() {
    return geminiService.getUsageMetrics();
  },

  clearCache(): void {
    geminiService.clearCache();
  },
};

function buildMockupPrompt(product: MerchProduct, request: MerchGenerationRequest): string {
  let prompt = product.defaultPrompt;

  if (request.textOverlays && request.textOverlays.length > 0) {
    const textDesc = request.textOverlays
      .map((t) => `"${t.text}" in ${t.fontFamily} font`)
      .join(", ");
    prompt += ` Include text overlay: ${textDesc}.`;
  }

  if (request.additionalPrompt) {
    prompt += ` ${request.additionalPrompt}`;
  }

  prompt += ` High quality, photorealistic product mockup. No additional text, watermarks, or branding.`;

  return prompt;
}

export const getErrorSuggestion = (errorMsg: string, hasBackground: boolean): string => {
  const msg = errorMsg.toLowerCase();

  if (msg.includes("safety") || msg.includes("blocked") || msg.includes("candidate")) {
    if (msg.includes("face") || msg.includes("person") || msg.includes("human")) {
      return "The AI model restricted generating human elements. Ensure your logo is a pure graphic and avoid mentioning models in your style prompt.";
    }
    return "Content safety filter triggered. Try simplifying your prompt and avoid extreme realism involving people.";
  }

  if (msg.includes("rate") || msg.includes("429")) {
    return "API rate limit reached. Please wait 10-15 seconds before trying again.";
  }

  if (msg.includes("overloaded") || msg.includes("503") || msg.includes("capacity")) {
    return "The AI service is experiencing high load. Please try again in 30 seconds.";
  }

  if (msg.includes("billing") || msg.includes("403") || msg.includes("not found")) {
    return "Check that your API key is linked to a paid Google Cloud project with Gemini API enabled.";
  }

  if (msg.includes("dimension") || msg.includes("resolution") || msg.includes("size")) {
    return "Image resolution issue. The logo should be between 256px and 3072px. Very large files (>5MB) may fail.";
  }

  if (msg.includes("format") || msg.includes("mime") || msg.includes("type")) {
    return "Unsupported file format. Convert your logo to PNG or JPG. Transparent PNGs work best.";
  }

  return "An unexpected error occurred. Check your network and try again with a different product.";
};
