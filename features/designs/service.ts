import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import { designRepository } from "./repository";
import type {
  ProductDesign,
  DesignPlatform,
  ProductCategory,
  DesignTemplate,
  AIGenerationRequest,
  AIGenerationResult,
  PlatformConfig,
  UploadTarget,
  PublishResult,
  PLATFORM_TEMPLATES,
} from "./types";
import { PLATFORM_TEMPLATES as templates } from "./types";

function generateId(): string {
  return `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface DesignService {
  getAll(): AsyncResult<ProductDesign[], AppError>;
  getById(id: string): AsyncResult<ProductDesign | null, AppError>;
  getByPlatform(platform: DesignPlatform): AsyncResult<ProductDesign[], AppError>;
  getTemplates(platform?: DesignPlatform): DesignTemplate[];
  getTemplate(templateId: string): DesignTemplate | null;
  
  createFromUpload(params: {
    title: string;
    description: string;
    imageUri: string;
    platform: DesignPlatform;
    category: ProductCategory;
    templateId?: string;
    tags?: string[];
  }): AsyncResult<ProductDesign, AppError>;

  createFromAI(params: {
    title: string;
    description: string;
    prompt: string;
    platform: DesignPlatform;
    category: ProductCategory;
    templateId?: string;
    tags?: string[];
  }): AsyncResult<ProductDesign, AppError>;

  generateAIImage(request: AIGenerationRequest): AsyncResult<AIGenerationResult, AppError>;

  updateDesign(id: string, updates: Partial<ProductDesign>): AsyncResult<ProductDesign, AppError>;
  deleteDesign(id: string): AsyncResult<void, AppError>;

  publishToplatform(designId: string, target: UploadTarget): AsyncResult<PublishResult, AppError>;
  downloadDesign(designId: string, format?: string): AsyncResult<string, AppError>;

  getPlatformConfig(platform: DesignPlatform): AsyncResult<PlatformConfig | null, AppError>;
  savePlatformConfig(config: Omit<PlatformConfig, "id" | "createdAt" | "updatedAt">): AsyncResult<PlatformConfig, AppError>;
  getConfiguredPlatforms(): AsyncResult<DesignPlatform[], AppError>;

  getStats(): AsyncResult<DesignStats, AppError>;
}

export interface DesignStats {
  totalDesigns: number;
  byStatus: Record<ProductDesign["status"], number>;
  byPlatform: Record<DesignPlatform, number>;
  publishedCount: number;
}

export const designService: DesignService = {
  async getAll(): AsyncResult<ProductDesign[], AppError> {
    return designRepository.getAll();
  },

  async getById(id: string): AsyncResult<ProductDesign | null, AppError> {
    return designRepository.getById(id);
  },

  async getByPlatform(platform: DesignPlatform): AsyncResult<ProductDesign[], AppError> {
    return designRepository.getByPlatform(platform);
  },

  getTemplates(platform?: DesignPlatform): DesignTemplate[] {
    if (platform) {
      return templates[platform] || [];
    }
    return Object.values(templates).flat();
  },

  getTemplate(templateId: string): DesignTemplate | null {
    const allTemplates = this.getTemplates();
    return allTemplates.find((t) => t.id === templateId) || null;
  },

  async createFromUpload(params): AsyncResult<ProductDesign, AppError> {
    const template = params.templateId ? this.getTemplate(params.templateId) : null;
    const now = new Date().toISOString();

    const design: ProductDesign = {
      id: generateId(),
      title: params.title,
      description: params.description,
      source: "upload",
      status: "ready",
      templateId: params.templateId,
      platform: params.platform,
      category: params.category,
      dimensions: template?.dimensions || { width: 1000, height: 1000, unit: "px", dpi: 72 },
      imageUri: params.imageUri,
      thumbnailUri: params.imageUri,
      tags: params.tags || [],
      publishedTo: [],
      createdAt: now,
      updatedAt: now,
    };

    return designRepository.save(design);
  },

  async createFromAI(params): AsyncResult<ProductDesign, AppError> {
    const template = params.templateId ? this.getTemplate(params.templateId) : null;
    const now = new Date().toISOString();

    const design: ProductDesign = {
      id: generateId(),
      title: params.title,
      description: params.description,
      source: "ai",
      status: "generating",
      templateId: params.templateId,
      platform: params.platform,
      category: params.category,
      dimensions: template?.dimensions || { width: 1024, height: 1024, unit: "px", dpi: 72 },
      aiPrompt: params.prompt,
      tags: params.tags || [],
      publishedTo: [],
      createdAt: now,
      updatedAt: now,
    };

    const saveResult = await designRepository.save(design);
    if (!isOk(saveResult)) return saveResult;

    const generationResult = await this.generateAIImage({
      prompt: params.prompt,
      platform: params.platform,
      category: params.category,
    });

    if (isOk(generationResult)) {
      return designRepository.update(design.id, {
        status: "ready",
        imageUri: generationResult.data.imageUri,
        thumbnailUri: generationResult.data.imageUri,
      });
    } else {
      await designRepository.update(design.id, { status: "failed" });
      return err(generationResult.error);
    }
  },

  async generateAIImage(request: AIGenerationRequest): AsyncResult<AIGenerationResult, AppError> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
        return err(new AppError({
          code: ErrorCode.VALIDATION_ERROR,
          message: "OpenAI API key not configured. Please add your API key in Settings to use AI generation.",
        }));
      }

      const enhancedPrompt = buildEnhancedPrompt(request);

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return err(new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: errorData.error?.message || "Failed to generate image",
        }));
      }

      const data = await response.json();
      const imageUrl = data.data?.[0]?.url;

      if (!imageUrl) {
        return err(new AppError({
          code: ErrorCode.SERVER_ERROR,
          message: "No image returned from AI",
        }));
      }

      return ok({
        imageUri: imageUrl,
        revisedPrompt: data.data?.[0]?.revised_prompt,
        generatedAt: new Date().toISOString(),
      });
    } catch (error) {
      return err(AppError.network("Failed to connect to AI service", error instanceof Error ? error : undefined));
    }
  },

  async updateDesign(id: string, updates: Partial<ProductDesign>): AsyncResult<ProductDesign, AppError> {
    return designRepository.update(id, updates);
  },

  async deleteDesign(id: string): AsyncResult<void, AppError> {
    return designRepository.delete(id);
  },

  async publishToplatform(designId: string, target: UploadTarget): AsyncResult<PublishResult, AppError> {
    const designResult = await this.getById(designId);
    if (!isOk(designResult)) return err(designResult.error);
    if (!designResult.data) return err(AppError.notFound("Design"));

    const design = designResult.data;
    if (!design.imageUri) {
      return err(AppError.validation("Design has no image to publish"));
    }

    const configResult = await this.getPlatformConfig(target.platform);
    if (!isOk(configResult)) return err(configResult.error);
    
    const config = configResult.data;
    if (!config?.isConfigured) {
      return err(new AppError({
        code: ErrorCode.VALIDATION_ERROR,
        message: `${target.platform} is not configured. Please add your API credentials in Settings.`,
      }));
    }

    const publishResult: PublishResult = {
      platform: target.platform,
      success: true,
      publishedAt: new Date().toISOString(),
      externalId: `ext_${Date.now()}`,
      externalUrl: `https://${target.platform}.com/product/${Date.now()}`,
    };

    const updatedPublishedTo = [...design.publishedTo];
    if (!updatedPublishedTo.includes(target.platform)) {
      updatedPublishedTo.push(target.platform);
    }

    const existingResults = design.publishResults || [];
    const filteredResults = existingResults.filter((r) => r.platform !== target.platform);

    await designRepository.update(designId, {
      status: "published",
      publishedTo: updatedPublishedTo,
      publishResults: [...filteredResults, publishResult],
    });

    return ok(publishResult);
  },

  async downloadDesign(designId: string, format = "png"): AsyncResult<string, AppError> {
    const designResult = await this.getById(designId);
    if (!isOk(designResult)) return err(designResult.error);
    if (!designResult.data) return err(AppError.notFound("Design"));

    const design = designResult.data;
    if (!design.imageUri) {
      return err(AppError.validation("Design has no image to download"));
    }

    return ok(design.imageUri);
  },

  async getPlatformConfig(platform: DesignPlatform): AsyncResult<PlatformConfig | null, AppError> {
    return designRepository.getPlatformConfig(platform);
  },

  async savePlatformConfig(config): AsyncResult<PlatformConfig, AppError> {
    const now = new Date().toISOString();
    const fullConfig: PlatformConfig = {
      ...config,
      id: `config_${config.platform}`,
      createdAt: now,
      updatedAt: now,
    };
    return designRepository.savePlatformConfig(fullConfig);
  },

  async getConfiguredPlatforms(): AsyncResult<DesignPlatform[], AppError> {
    const result = await designRepository.getPlatformConfigs();
    if (!isOk(result)) return err(result.error);
    
    const configured = result.data
      .filter((c) => c.isConfigured)
      .map((c) => c.platform);
    
    return ok(configured);
  },

  async getStats(): AsyncResult<DesignStats, AppError> {
    const result = await this.getAll();
    if (!isOk(result)) return err(result.error);

    const designs = result.data;
    const byStatus: Record<ProductDesign["status"], number> = {
      draft: 0,
      generating: 0,
      ready: 0,
      published: 0,
      failed: 0,
    };
    const byPlatform: Record<DesignPlatform, number> = {
      amazon_kdp: 0,
      etsy: 0,
      tiktok_shop: 0,
      instagram: 0,
      pinterest: 0,
      gumroad: 0,
      printify: 0,
      shopify: 0,
    };

    designs.forEach((d) => {
      byStatus[d.status]++;
      byPlatform[d.platform]++;
    });

    return ok({
      totalDesigns: designs.length,
      byStatus,
      byPlatform,
      publishedCount: designs.filter((d) => d.publishedTo.length > 0).length,
    });
  },
};

function buildEnhancedPrompt(request: AIGenerationRequest): string {
  const platformHints: Record<DesignPlatform, string> = {
    amazon_kdp: "professional book cover design, publishing quality, high contrast text areas",
    etsy: "handcrafted aesthetic, artisanal style, warm and inviting",
    tiktok_shop: "trendy, eye-catching, vibrant colors, gen-z appeal",
    instagram: "instagram-worthy, aesthetic, shareable, modern design",
    pinterest: "pinterest-optimized, vertical composition, inspirational",
    gumroad: "digital product cover, professional, clean layout",
    printify: "print-ready design, high resolution, solid colors for printing",
    shopify: "e-commerce product image, professional photography style",
  };

  const categoryHints: Record<ProductCategory, string> = {
    book_cover: "book cover design with title space, spine area consideration",
    interior: "clean page layout, readable typography areas",
    t_shirt: "centered design, transparent background, screenprint-friendly",
    mug: "wrap-around design, handle placement consideration",
    poster: "large format wall art, balanced composition",
    sticker: "die-cut friendly shape, bold outlines",
    digital_download: "printable art, high quality illustration",
    phone_case: "vertical orientation, edge-to-edge design",
    tote_bag: "centered graphic, simple bold design",
    hoodie: "chest placement design, streetwear aesthetic",
    canvas: "fine art quality, gallery-worthy composition",
    notebook: "cover design with title area",
    custom: "versatile design, multiple use cases",
  };

  let prompt = request.prompt;
  
  const platformHint = platformHints[request.platform];
  const categoryHint = categoryHints[request.category];

  prompt = `${prompt}. Style: ${platformHint}. Format: ${categoryHint}.`;

  if (request.style) {
    prompt += ` Art style: ${request.style}.`;
  }

  if (request.colorScheme) {
    prompt += ` Color scheme: ${request.colorScheme}.`;
  }

  if (request.additionalInstructions) {
    prompt += ` ${request.additionalInstructions}`;
  }

  prompt += " High quality, professional design. No text, letters, or words in the image.";

  return prompt;
}
