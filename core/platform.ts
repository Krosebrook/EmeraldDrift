import type { PlatformType, AppTheme } from "../types";

export interface PlatformConfig {
  id: PlatformType;
  name: string;
  icon: string;
  maxCaptionLength: number;
  supportsVideo: boolean;
  supportsImage: boolean;
  supportsCarousel: boolean;
  supportsStories: boolean;
  supportsReels: boolean;
  hashtagLimit: number;
}

export const PLATFORM_CONFIGS: Record<PlatformType, PlatformConfig> = {
  instagram: {
    id: "instagram",
    name: "Instagram",
    icon: "instagram",
    maxCaptionLength: 2200,
    supportsVideo: true,
    supportsImage: true,
    supportsCarousel: true,
    supportsStories: true,
    supportsReels: true,
    hashtagLimit: 30,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok",
    icon: "video",
    maxCaptionLength: 2200,
    supportsVideo: true,
    supportsImage: false,
    supportsCarousel: false,
    supportsStories: false,
    supportsReels: false,
    hashtagLimit: 100,
  },
  youtube: {
    id: "youtube",
    name: "YouTube",
    icon: "youtube",
    maxCaptionLength: 5000,
    supportsVideo: true,
    supportsImage: false,
    supportsCarousel: false,
    supportsStories: false,
    supportsReels: true,
    hashtagLimit: 15,
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn",
    icon: "linkedin",
    maxCaptionLength: 3000,
    supportsVideo: true,
    supportsImage: true,
    supportsCarousel: true,
    supportsStories: false,
    supportsReels: false,
    hashtagLimit: 30,
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest",
    icon: "image",
    maxCaptionLength: 500,
    supportsVideo: true,
    supportsImage: true,
    supportsCarousel: false,
    supportsStories: false,
    supportsReels: false,
    hashtagLimit: 20,
  },
};

export const ALL_PLATFORMS: PlatformType[] = [
  "instagram",
  "tiktok",
  "youtube",
  "linkedin",
  "pinterest",
];

export function getPlatformConfig(platform: PlatformType): PlatformConfig {
  return PLATFORM_CONFIGS[platform];
}

export function getPlatformColor(platform: PlatformType, theme: AppTheme): string {
  const colorMap: Record<PlatformType, keyof AppTheme> = {
    instagram: "instagram",
    tiktok: "tiktok",
    youtube: "youtube",
    linkedin: "linkedin",
    pinterest: "pinterest",
  };
  return theme[colorMap[platform]];
}

export function getPlatformName(platform: PlatformType): string {
  return PLATFORM_CONFIGS[platform].name;
}

export function getPlatformIcon(platform: PlatformType): string {
  return PLATFORM_CONFIGS[platform].icon;
}

export function validateCaptionLength(platform: PlatformType, caption: string): boolean {
  const config = PLATFORM_CONFIGS[platform];
  return caption.length <= config.maxCaptionLength;
}

export function countHashtags(caption: string): number {
  const matches = caption.match(/#\w+/g);
  return matches ? matches.length : 0;
}

export function validateHashtagCount(platform: PlatformType, caption: string): boolean {
  const config = PLATFORM_CONFIGS[platform];
  return countHashtags(caption) <= config.hashtagLimit;
}

export function getContentTypeSupport(
  platform: PlatformType,
  contentType: "image" | "video"
): boolean {
  const config = PLATFORM_CONFIGS[platform];
  return contentType === "image" ? config.supportsImage : config.supportsVideo;
}
