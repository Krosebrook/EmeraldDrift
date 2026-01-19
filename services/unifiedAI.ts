import * as SecureStore from "expo-secure-store";
import { ok, err, AsyncResult, Result } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import { featureFlags, type AIProvider } from "@/core/featureFlags";

const OPENAI_API_KEY_STORAGE = "openai_api_key";
const GEMINI_API_KEY_STORAGE = "gemini_api_key";

export interface AIGenerationConfig {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  responseFormat?: "text" | "json";
}

export interface AIGenerationResult {
  content: string;
  model: string;
  provider: AIProvider;
  tokensUsed?: number;
  cached: boolean;
}

interface CacheEntry {
  result: AIGenerationResult;
  timestamp: number;
}

class UnifiedAIService {
  private static instance: UnifiedAIService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheTtlMs = 15 * 60 * 1000;
  private readonly maxCacheSize = 100;

  private usageMetrics = {
    requestCount: 0,
    totalTokens: 0,
    cacheHits: 0,
    cacheMisses: 0,
    failedRequests: 0,
  };

  private constructor() {}

  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  async getOpenAIKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(OPENAI_API_KEY_STORAGE);
    } catch {
      return null;
    }
  }

  async setOpenAIKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(OPENAI_API_KEY_STORAGE, key);
  }

  async removeOpenAIKey(): Promise<void> {
    await SecureStore.deleteItemAsync(OPENAI_API_KEY_STORAGE);
  }

  async hasOpenAIKey(): Promise<boolean> {
    const key = await this.getOpenAIKey();
    return !!key && key.length > 0;
  }

  async getGeminiKey(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(GEMINI_API_KEY_STORAGE);
    } catch {
      return null;
    }
  }

  async setGeminiKey(key: string): Promise<void> {
    await SecureStore.setItemAsync(GEMINI_API_KEY_STORAGE, key);
  }

  async removeGeminiKey(): Promise<void> {
    await SecureStore.deleteItemAsync(GEMINI_API_KEY_STORAGE);
  }

  async hasGeminiKey(): Promise<boolean> {
    const key = await this.getGeminiKey();
    return !!key && key.length > 0;
  }

  async hasAnyApiKey(): Promise<boolean> {
    const [hasOpenAI, hasGemini] = await Promise.all([
      this.hasOpenAIKey(),
      this.hasGeminiKey(),
    ]);
    return hasOpenAI || hasGemini;
  }

  async getActiveProvider(): Promise<AIProvider> {
    const flags = await featureFlags.get();
    
    if (flags.aiProvider !== "simulated") {
      if (flags.aiProvider === "openai" && await this.hasOpenAIKey()) {
        return "openai";
      }
      if (flags.aiProvider === "gemini" && await this.hasGeminiKey()) {
        return "gemini";
      }
    }

    if (await this.hasOpenAIKey()) return "openai";
    if (await this.hasGeminiKey()) return "gemini";
    
    return "simulated";
  }

  private hashPrompt(prompt: string, config: AIGenerationConfig): string {
    const content = `${prompt}:${config.model || ""}:${config.temperature || 0.7}`;
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  private getCached(promptHash: string): AIGenerationResult | null {
    const entry = this.cache.get(promptHash);
    if (!entry) {
      this.usageMetrics.cacheMisses++;
      return null;
    }

    if (Date.now() - entry.timestamp > this.cacheTtlMs) {
      this.cache.delete(promptHash);
      this.usageMetrics.cacheMisses++;
      return null;
    }

    this.usageMetrics.cacheHits++;
    return { ...entry.result, cached: true };
  }

  private setCache(promptHash: string, result: AIGenerationResult): void {
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
      result,
      timestamp: Date.now(),
    });
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public getCacheStats() {
    const total = this.usageMetrics.cacheHits + this.usageMetrics.cacheMisses;
    return {
      hits: this.usageMetrics.cacheHits,
      misses: this.usageMetrics.cacheMisses,
      size: this.cache.size,
      hitRate: total > 0 ? this.usageMetrics.cacheHits / total : 0,
    };
  }

  public getUsageMetrics() {
    return { ...this.usageMetrics };
  }

  private async generateWithOpenAI(
    prompt: string,
    config: AIGenerationConfig
  ): AsyncResult<AIGenerationResult, AppError> {
    const apiKey = await this.getOpenAIKey();
    if (!apiKey) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "OpenAI API key not configured. Please add your API key in Settings.",
      }));
    }

    try {
      const model = config.model || "gpt-4o-mini";
      const requestBody: Record<string, unknown> = {
        model,
        messages: [
          ...(config.systemPrompt ? [{ role: "system", content: config.systemPrompt }] : []),
          { role: "user", content: prompt },
        ],
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens ?? 2000,
      };

      if (config.responseFormat === "json") {
        requestBody.response_format = { type: "json_object" };
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content returned from OpenAI");
      }

      const tokensUsed = data.usage?.total_tokens || 0;
      this.usageMetrics.totalTokens += tokensUsed;

      return ok({
        content,
        model,
        provider: "openai",
        tokensUsed,
        cached: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OpenAI request failed";
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message,
      }));
    }
  }

  private async generateWithGemini(
    prompt: string,
    config: AIGenerationConfig
  ): AsyncResult<AIGenerationResult, AppError> {
    const apiKey = await this.getGeminiKey();
    if (!apiKey) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Gemini API key not configured. Please add your API key in Settings.",
      }));
    }

    try {
      const model = config.model || "gemini-1.5-flash";
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

      const requestBody: Record<string, unknown> = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          maxOutputTokens: config.maxTokens ?? 2000,
        },
      };

      if (config.systemPrompt) {
        requestBody.systemInstruction = { parts: [{ text: config.systemPrompt }] };
      }

      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!content) {
        throw new Error("No content returned from Gemini");
      }

      const tokensUsed = data.usageMetadata?.totalTokenCount || 0;
      this.usageMetrics.totalTokens += tokensUsed;

      return ok({
        content,
        model,
        provider: "gemini",
        tokensUsed,
        cached: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gemini request failed";
      return err(new AppError({
        code: ErrorCode.SERVER_ERROR,
        message,
      }));
    }
  }

  public async generate(
    prompt: string,
    config: AIGenerationConfig = {}
  ): AsyncResult<AIGenerationResult, AppError> {
    const promptHash = this.hashPrompt(prompt, config);
    const cached = this.getCached(promptHash);
    if (cached) {
      return ok(cached);
    }

    this.usageMetrics.requestCount++;

    const provider = await this.getActiveProvider();

    let result: Result<AIGenerationResult, AppError>;

    switch (provider) {
      case "openai":
        result = await this.generateWithOpenAI(prompt, config);
        break;
      case "gemini":
        result = await this.generateWithGemini(prompt, config);
        break;
      case "simulated":
      default:
        return err(new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: "No AI provider configured. Please add an OpenAI or Gemini API key in Settings.",
        }));
    }

    if (result.success) {
      this.setCache(promptHash, result.data);
    } else {
      this.usageMetrics.failedRequests++;
    }

    return result;
  }

  public async generateWithFallback(
    prompt: string,
    config: AIGenerationConfig = {},
    fallbackContent: string
  ): AsyncResult<AIGenerationResult, AppError> {
    const hasKey = await this.hasAnyApiKey();
    
    if (!hasKey) {
      return Promise.resolve(ok({
        content: fallbackContent,
        model: "fallback",
        provider: "simulated",
        cached: false,
      }));
    }

    const result = await this.generate(prompt, config);
    
    if (!result.success) {
      return Promise.resolve(ok({
        content: fallbackContent,
        model: "fallback",
        provider: "simulated",
        cached: false,
      }));
    }

    return Promise.resolve(result);
  }
}

export const unifiedAI = UnifiedAIService.getInstance();
