import type { BaseEntity } from "../shared/types";

export type ContentType = 
  | "marketing"
  | "technical"
  | "social"
  | "blog"
  | "email"
  | "press"
  | "script"
  | "ad";

export type ContentTone = 
  | "professional"
  | "friendly"
  | "authoritative"
  | "casual"
  | "enthusiastic"
  | "empathetic";

export type TargetAudience = 
  | "general"
  | "developers"
  | "executives"
  | "marketers"
  | "students"
  | "enterprise";

export interface ContentTypeConfig {
  value: ContentType;
  label: string;
  prompt: string;
  icon: string;
}

export interface GenerationRequest {
  contentType: ContentType;
  topic: string;
  tone: ContentTone;
  audience: TargetAudience;
  keywords?: string;
  wordCount: number;
  platform?: string;
  additionalInstructions?: string;
}

export interface GeneratedContent extends BaseEntity {
  request: GenerationRequest;
  content: string;
  wordCount: number;
  generatedAt: string;
  model: string;
  tokensUsed?: number;
  isFavorite: boolean;
}

export interface GenerationHistory {
  items: GeneratedContent[];
  totalCount: number;
}

export interface AIGeneratorState {
  isGenerating: boolean;
  currentContent: GeneratedContent | null;
  history: GeneratedContent[];
  error: string | null;
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
  { 
    value: "marketing", 
    label: "Marketing Copy", 
    prompt: "compelling marketing copy that drives conversions",
    icon: "trending-up"
  },
  { 
    value: "technical", 
    label: "Technical Documentation", 
    prompt: "clear, comprehensive technical documentation",
    icon: "code"
  },
  { 
    value: "social", 
    label: "Social Media Posts", 
    prompt: "engaging social media content optimized for platform algorithms",
    icon: "share-2"
  },
  { 
    value: "blog", 
    label: "Blog Article", 
    prompt: "well-researched, SEO-optimized blog article",
    icon: "file-text"
  },
  { 
    value: "email", 
    label: "Email Campaign", 
    prompt: "persuasive email marketing content",
    icon: "mail"
  },
  { 
    value: "press", 
    label: "Press Release", 
    prompt: "professional press release following AP style",
    icon: "newspaper"
  },
  { 
    value: "script", 
    label: "Video Script", 
    prompt: "engaging video script with hooks and call-to-actions",
    icon: "video"
  },
  { 
    value: "ad", 
    label: "Ad Copy", 
    prompt: "high-converting advertisement copy",
    icon: "zap"
  },
];

export const TONES: { value: ContentTone; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "authoritative", label: "Authoritative" },
  { value: "casual", label: "Casual" },
  { value: "enthusiastic", label: "Enthusiastic" },
  { value: "empathetic", label: "Empathetic" },
];

export const AUDIENCES: { value: TargetAudience; label: string }[] = [
  { value: "general", label: "General Public" },
  { value: "developers", label: "Developers" },
  { value: "executives", label: "Business Executives" },
  { value: "marketers", label: "Marketing Professionals" },
  { value: "students", label: "Students" },
  { value: "enterprise", label: "Enterprise Clients" },
];

export const WORD_COUNTS = [250, 500, 750, 1000, 1500, 2000];
