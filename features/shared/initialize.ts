import AsyncStorage from "@react-native-async-storage/async-storage";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { contentRepository } from "@/features/content";
import { platformRepository } from "@/features/platforms";
import { analyticsRepository } from "@/features/analytics";
import type { ContentItem, PlatformConnection, AnalyticsSnapshot, PlatformStats, PlatformType } from "./types";

const DEMO_INITIALIZED_KEY = "@creator_studio_demo_init";

function generateDemoPlatforms(): Omit<PlatformConnection, "createdAt" | "updatedAt">[] {
  const now = new Date();
  return [
    {
      id: "demo_instagram",
      platform: "instagram" as PlatformType,
      username: "creativestudio",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 15420,
    },
    {
      id: "demo_tiktok",
      platform: "tiktok" as PlatformType,
      username: "creativestudio",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 28750,
    },
    {
      id: "demo_youtube",
      platform: "youtube" as PlatformType,
      username: "CreativeStudioOfficial",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 8340,
    },
  ];
}

function generateDemoContent(): Omit<ContentItem, "createdAt" | "updatedAt">[] {
  const now = new Date();
  return [
    {
      id: "demo_content_1",
      title: "Morning Productivity Tips",
      caption: "Start your day with these 5 simple habits that will transform your morning routine. Your future self will thank you! What's your go-to morning habit?",
      platforms: ["instagram", "tiktok"] as PlatformType[],
      status: "published",
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_2",
      title: "Behind the Scenes",
      caption: "A sneak peek into our creative process. From ideation to execution - every masterpiece starts with a single idea.",
      platforms: ["youtube", "instagram"] as PlatformType[],
      status: "published",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_3",
      title: "Weekend Inspiration",
      caption: "Taking time to recharge is not a luxury, it's a necessity. How are you spending your weekend?",
      platforms: ["instagram"] as PlatformType[],
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_4",
      title: "New Product Launch",
      caption: "Exciting news! We've been working on something special and can't wait to share it with you. Stay tuned for the big reveal!",
      platforms: ["tiktok", "youtube", "instagram"] as PlatformType[],
      status: "draft",
    },
  ];
}

function generateDemoAnalyticsSnapshot(): AnalyticsSnapshot {
  return {
    totalFollowers: 52510,
    totalEngagement: 4.8,
    totalViews: 1250000,
    totalPosts: 156,
    growthRate: 12.5,
    recordedAt: new Date().toISOString(),
  };
}

function generateDemoPlatformStats(): PlatformStats[] {
  return [
    {
      platform: "instagram",
      followers: 15420,
      engagement: 5.2,
      posts: 68,
      weeklyGrowth: 2.3,
    },
    {
      platform: "tiktok",
      followers: 28750,
      engagement: 8.4,
      posts: 52,
      weeklyGrowth: 4.1,
    },
    {
      platform: "youtube",
      followers: 8340,
      engagement: 3.1,
      posts: 36,
      weeklyGrowth: 1.8,
    },
  ];
}

export async function initializeDemoData(): AsyncResult<void, AppError> {
  try {
    const initialized = await AsyncStorage.getItem(DEMO_INITIALIZED_KEY);
    if (initialized === "true") {
      return ok(undefined);
    }

    const existingContentResult = await contentRepository.getAll();
    const existingPlatformsResult = await platformRepository.getAll();

    if (
      isOk(existingContentResult) &&
      isOk(existingPlatformsResult) &&
      existingContentResult.data.length === 0 &&
      existingPlatformsResult.data.length === 0
    ) {
      const now = new Date().toISOString();

      const demoPlatforms = generateDemoPlatforms();
      for (const platform of demoPlatforms) {
        await platformRepository.save({
          ...platform,
          createdAt: now,
          updatedAt: now,
        } as PlatformConnection);
      }

      const demoContent = generateDemoContent();
      for (const content of demoContent) {
        await contentRepository.save({
          ...content,
          createdAt: now,
          updatedAt: now,
        } as ContentItem);
      }

      await analyticsRepository.saveSnapshot(generateDemoAnalyticsSnapshot());
      await analyticsRepository.savePlatformStats(generateDemoPlatformStats());

      await AsyncStorage.setItem(DEMO_INITIALIZED_KEY, "true");
    }

    return ok(undefined);
  } catch (error) {
    return err(AppError.persistence("init", "demo_data", error instanceof Error ? error : undefined));
  }
}

export async function clearAllData(): AsyncResult<void, AppError> {
  try {
    await contentRepository.clear();
    await platformRepository.clear();
    await analyticsRepository.clearAll();
    await AsyncStorage.removeItem(DEMO_INITIALIZED_KEY);
    return ok(undefined);
  } catch (error) {
    return err(AppError.persistence("clear", "all_data", error instanceof Error ? error : undefined));
  }
}
