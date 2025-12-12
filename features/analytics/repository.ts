import AsyncStorage from "@react-native-async-storage/async-storage";
import { createFeatureRepository, Repository } from "@/features/shared/repository";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import type { AnalyticsSnapshot, PostAnalytics, PlatformStats, PlatformType } from "@/features/shared/types";

const STORAGE_KEYS = {
  SNAPSHOT: "@creator_studio_analytics_snapshot",
  POST_ANALYTICS: "@creator_studio_post_analytics",
  PLATFORM_STATS: "@creator_studio_platform_stats",
} as const;

const postAnalyticsRepository = createFeatureRepository<PostAnalytics>({
  storageKey: STORAGE_KEYS.POST_ANALYTICS,
});

export interface AnalyticsRepository {
  getSnapshot(): AsyncResult<AnalyticsSnapshot | null, AppError>;
  saveSnapshot(snapshot: AnalyticsSnapshot): AsyncResult<void, AppError>;
  getPostAnalytics(contentId: string): AsyncResult<PostAnalytics[], AppError>;
  savePostAnalytics(analytics: PostAnalytics): AsyncResult<PostAnalytics, AppError>;
  getPlatformStats(): AsyncResult<PlatformStats[], AppError>;
  savePlatformStats(stats: PlatformStats[]): AsyncResult<void, AppError>;
  getRecentPosts(limit?: number): AsyncResult<PostAnalytics[], AppError>;
  getByPlatform(platform: PlatformType): AsyncResult<PostAnalytics[], AppError>;
  clearAll(): AsyncResult<void, AppError>;
}

export const analyticsRepository: AnalyticsRepository = {
  async getSnapshot(): AsyncResult<AnalyticsSnapshot | null, AppError> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SNAPSHOT);
      return ok(data ? JSON.parse(data) : null);
    } catch (error) {
      return err(AppError.persistence("get", "analytics_snapshot", error instanceof Error ? error : undefined));
    }
  },

  async saveSnapshot(snapshot: AnalyticsSnapshot): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SNAPSHOT, JSON.stringify(snapshot));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "analytics_snapshot", error instanceof Error ? error : undefined));
    }
  },

  async getPostAnalytics(contentId: string): AsyncResult<PostAnalytics[], AppError> {
    return postAnalyticsRepository.getFiltered((item) => item.contentId === contentId);
  },

  async savePostAnalytics(analytics: PostAnalytics): AsyncResult<PostAnalytics, AppError> {
    return postAnalyticsRepository.save(analytics);
  },

  async getPlatformStats(): AsyncResult<PlatformStats[], AppError> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PLATFORM_STATS);
      return ok(data ? JSON.parse(data) : []);
    } catch (error) {
      return err(AppError.persistence("get", "platform_stats", error instanceof Error ? error : undefined));
    }
  },

  async savePlatformStats(stats: PlatformStats[]): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLATFORM_STATS, JSON.stringify(stats));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "platform_stats", error instanceof Error ? error : undefined));
    }
  },

  async getRecentPosts(limit = 10): AsyncResult<PostAnalytics[], AppError> {
    const result = await postAnalyticsRepository.getAll();
    if (!isOk(result)) return result;

    const sorted = result.data
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
      .slice(0, limit);

    return ok(sorted);
  },

  async getByPlatform(platform: PlatformType): AsyncResult<PostAnalytics[], AppError> {
    return postAnalyticsRepository.getFiltered((item) => item.platform === platform);
  },

  async clearAll(): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.SNAPSHOT,
        STORAGE_KEYS.POST_ANALYTICS,
        STORAGE_KEYS.PLATFORM_STATS,
      ]);
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("clear", "analytics", error instanceof Error ? error : undefined));
    }
  },
};
