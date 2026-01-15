import * as SecureStore from "expo-secure-store";
import { AppError, ErrorCode } from "@/core/errors";
import { ok, err, AsyncResult } from "@/core/result";
import type { GeminiModel, AIRequestConfig, AIResponse, AspectRatio, ImageSize } from "../types";

const GEMINI_API_KEY_STORAGE = "gemini_api_key";

const MODEL_ENDPOINTS: Record<GeminiModel, string> = {
  "gemini-2.5-flash-image": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent",
  "gemini-3-flash-preview": "https://generativelanguage.googleapis.com/v1beta/models/gemini-exp-1206:generateContent",
  "gemini-3-pro-preview": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro-exp:generateContent",
  "gemini-3-pro-image-preview": "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent",
};

const MODEL_COSTS: Record<GeminiModel, { input: number; output: number }> = {
  "gemini-2.5-flash-image": { input: 0.075, output: 0.30 },
  "gemini-3-flash-preview": { input: 0.075, output: 0.30 },
  "gemini-3-pro-preview": { input: 1.25, output: 5.00 },
  "gemini-3-pro-image-preview": { input: 1.25, output: 5.00 },
};

interface CacheEntry {
  response: AIResponse;
  timestamp: number;
  promptHash: string;
}

class GeminiService {
  private static instance: GeminiService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTtlMs = 30 * 60 * 1000;
  private readonly maxCacheSize = 50;
  private readonly defaultRetries = 2;

  private cacheStats = { hits: 0, misses: 0 };
  private usageMetrics = {
    requestCount: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    estimatedCost: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failedRequests: 0,
  };

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  async getApiKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE);
    } catch {
      return null;
    }
  }

  async setApiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE, key);
  }

  async removeApiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY_STORAGE);
  }

  async hasApiKey(): Promise<boolean> {
    const key = await this.getApiKey();
    return !!key && key.length > 0;
  }

  private hashPrompt(prompt: string, images: string[], model: GeminiModel): string {
    const content = `${model}:${prompt}:${images.length}:${images.map(i => i.slice(-20)).join(",")}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getCached(promptHash: string): AIResponse | null {
    const entry = this.cache.get(promptHash);
    if (!entry) {
      this.cacheStats.misses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(promptHash);
      this.cacheStats.misses++;
      return null;
    }

    this.cacheStats.hits++;
    this.usageMetrics.cacheHits++;
    return entry.response;
  }

  private setCache(promptHash: string, response: AIResponse): void {
    if (this.cache.size >= this.maxCacheSize) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(promptHash, {
      response,
      timestamp: Date.now(),
      promptHash,
    });
  }

  public clearCache(): void {
    this.cache.clear();
    this.cacheStats = { hits: 0, misses: 0 };
  }

  public getCacheStats() {
    const total = this.cacheStats.hits + this.cacheStats.misses;
    return {
      ...this.cacheStats,
      size: this.cache.size,
      hitRate: total > 0 ? this.cacheStats.hits / total : 0,
    };
  }

  public getUsageMetrics() {
    return { ...this.usageMetrics };
  }

  public resetUsageMetrics(): void {
    this.usageMetrics = {
      requestCount: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      estimatedCost: 0,
      cacheHits: 0,
      cacheMisses: 0,
      failedRequests: 0,
    };
  }

  private mapError(error: unknown): AppError {
    if (error instanceof AppError) return error;

    const message = error instanceof Error ? error.message : String(error);
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("rate limit") || lowerMsg.includes("429")) {
      return new AppError({
        code: ErrorCode.RATE_LIMITED,
        message: "API rate limit reached. Please wait a moment and try again.",
      });
    }

    if (lowerMsg.includes("401") || lowerMsg.includes("403") || lowerMsg.includes("authentication")) {
      return new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: "Authentication failed. Please verify your Gemini API key.",
      });
    }

    if (lowerMsg.includes("safety") || lowerMsg.includes("blocked")) {
      return new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Content was blocked by safety filters. Please modify your prompt.",
      });
    }

    if (lowerMsg.includes("overloaded") || lowerMsg.includes("503") || lowerMsg.includes("capacity")) {
      return new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: "AI service is currently at capacity. Please try again shortly.",
      });
    }

    return new AppError({
      code: ErrorCode.SERVER_ERROR,
      message: message || "An unexpected error occurred",
    });
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private calculateCost(model: GeminiModel, inputTokens: number, outputTokens: number): number {
    const costs = MODEL_COSTS[model];
    const inputCost = (inputTokens / 1000000) * costs.input;
    const outputCost = (outputTokens / 1000000) * costs.output;
    return inputCost + outputCost;
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  public async request(
    prompt: string,
    images: string[] = [],
    config: AIRequestConfig
  ): AsyncResult<AIResponse, AppError> {
    const apiKey = await this.getApiKey();
    if (!apiKey) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Gemini API key not configured. Please add your API key in Settings.",
      }));
    }

    const model = config.model;
    const maxRetries = config.maxRetries ?? this.defaultRetries;
    const promptHash = this.hashPrompt(prompt, images, model);

    const cached = this.getCached(promptHash);
    if (cached) {
      return ok(cached);
    }

    this.usageMetrics.cacheMisses++;

    let lastError: AppError | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        this.usageMetrics.requestCount++;

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: prompt },
        ];

        for (const imageBase64 of images) {
          const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
          const mimeType = this.detectMimeType(imageBase64);
          parts.push({
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          });
        }

        const requestBody: Record<string, unknown> = {
          contents: [{ parts }],
          generationConfig: {
            temperature: config.temperature ?? 0.9,
            maxOutputTokens: config.maxOutputTokens ?? 8192,
            responseModalities: ["TEXT", "IMAGE"],
          },
        };

        if (config.systemInstruction) {
          requestBody.systemInstruction = { parts: [{ text: config.systemInstruction }] };
        }

        const endpoint = MODEL_ENDPOINTS[model];
        const response = await fetch(`${endpoint}?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

          if (response.status === 429 || response.status === 503) {
            const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
            await this.sleep(delay);
            continue;
          }

          throw new Error(errorMessage);
        }

        const data = await response.json();
        const candidate = data.candidates?.[0];

        if (!candidate || !candidate.content?.parts) {
          throw new Error("No content returned from AI model");
        }

        const result: AIResponse = {
          finishReason: candidate.finishReason,
        };

        for (const part of candidate.content.parts) {
          if (part.text) {
            result.text = (result.text || "") + part.text;
          }
          if (part.inlineData?.data) {
            result.image = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }

        const inputTokens = this.estimateTokens(prompt) + images.length * 500;
        const outputTokens = result.text ? this.estimateTokens(result.text) : 0;
        this.usageMetrics.totalInputTokens += inputTokens;
        this.usageMetrics.totalOutputTokens += outputTokens;
        this.usageMetrics.estimatedCost += this.calculateCost(model, inputTokens, outputTokens);

        this.setCache(promptHash, result);

        return ok(result);
      } catch (error) {
        lastError = this.mapError(error);

        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
          await this.sleep(delay);
        }
      }
    }

    this.usageMetrics.failedRequests++;
    return err(lastError || new AppError({
      code: ErrorCode.SERVER_ERROR,
      message: "Failed to generate content after multiple attempts",
    }));
  }

  private detectMimeType(base64: string): string {
    if (base64.startsWith("data:image/png")) return "image/png";
    if (base64.startsWith("data:image/jpeg") || base64.startsWith("data:image/jpg")) return "image/jpeg";
    if (base64.startsWith("data:image/webp")) return "image/webp";
    if (base64.startsWith("data:image/gif")) return "image/gif";
    return "image/png";
  }

  public async generateMockup(
    logoBase64: string,
    productPrompt: string,
    stylePreference: string,
    options?: {
      backgroundImage?: string;
      aspectRatio?: AspectRatio;
      imageSize?: ImageSize;
    }
  ): AsyncResult<AIResponse, AppError> {
    const styleMap: Record<string, string> = {
      studio: "professional studio photography with clean lighting",
      lifestyle: "authentic lifestyle photography in natural setting",
      editorial: "high-fashion editorial magazine style",
      minimal: "minimalist clean background composition",
      dramatic: "dramatic lighting with bold shadows",
      vibrant: "colorful energetic composition with vibrant hues",
      vintage: "retro vintage aesthetic with film grain",
      professional: "corporate professional photography style",
    };

    const styleDesc = styleMap[stylePreference] || styleMap.studio;
    const finalPrompt = productPrompt.replace("{style}", styleDesc);

    const images = [logoBase64];
    if (options?.backgroundImage) {
      images.push(options.backgroundImage);
    }

    const systemInstruction = `You are a professional product mockup generator. Your task is to create photorealistic product mockups featuring the provided logo/design. 
    
Rules:
1. The logo/design MUST be clearly visible on the product
2. Maintain the logo's original colors and proportions
3. Apply realistic lighting and shadows to the logo
4. The product should look like a real photograph
5. Do not add any text, watermarks, or branding not in the original logo
6. Output only the final product mockup image`;

    return this.request(finalPrompt, images, {
      model: "gemini-2.5-flash-image",
      systemInstruction,
      temperature: 0.8,
      maxOutputTokens: 8192,
    });
  }

  public async generateVariations(
    originalPrompt: string,
    logoBase64: string,
    count: number = 3
  ): AsyncResult<AIResponse[], AppError> {
    const variations = [
      "VARIATION_A: Cinematic product shot from a dramatic high-angle bird's eye perspective. Use sharp high-contrast golden hour side-lighting.",
      "VARIATION_B: Professional close-up from a sharp 45-degree profile view. Emphasize material detail with soft diffused rim lighting.",
      "VARIATION_C: Minimalist composition with a low-angle perspective. Use cool-toned studio lighting with deep shadows.",
    ];

    const results: AIResponse[] = [];

    for (let i = 0; i < Math.min(count, variations.length); i++) {
      const variantPrompt = `${originalPrompt} ${variations[i]}`;
      const result = await this.request(variantPrompt, [logoBase64], {
        model: "gemini-2.5-flash-image",
        temperature: 0.9,
      });

      if (result.success) {
        results.push(result.data);
      }
    }

    if (results.length === 0) {
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message: "Failed to generate any variations",
      }));
    }

    return ok(results);
  }
}

export const geminiService = GeminiService.getInstance();
