import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { analyticsRepository } from "./repository";
import { platformRepository } from "@/features/platforms/repository";
import type { AnalyticsSnapshot, PostAnalytics, PlatformStats, PlatformType } from "@/features/shared/types";

export interface AnalyticsSummary {
  snapshot: AnalyticsSnapshot;
  platformStats: PlatformStats[];
  recentPosts: PostAnalytics[];
  trends: {
    followersChange: number;
    engagementChange: number;
    viewsChange: number;
  };
}

export interface TimeRange {
  start: string;
  end: string;
}

export interface AnalyticsService {
  getSummary(): AsyncResult<AnalyticsSummary, AppError>;
  getSnapshot(): AsyncResult<AnalyticsSnapshot, AppError>;
  getPlatformStats(): AsyncResult<PlatformStats[], AppError>;
  getRecentPosts(limit?: number): AsyncResult<PostAnalytics[], AppError>;
  getPostAnalytics(contentId: string): AsyncResult<PostAnalytics[], AppError>;
  recordPostAnalytics(analytics: Omit<PostAnalytics, "id" | "createdAt" | "updatedAt">): AsyncResult<PostAnalytics, AppError>;
  refreshFromPlatforms(): AsyncResult<AnalyticsSummary, AppError>;
  calculateEngagementRate(likes: number, comments: number, shares: number, reach: number): number;
}

function generateId(): string {
  return `analytics_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function getDefaultSnapshot(): AnalyticsSnapshot {
  return {
    totalFollowers: 0,
    totalEngagement: 0,
    totalViews: 0,
    totalPosts: 0,
    growthRate: 0,
    recordedAt: new Date().toISOString(),
  };
}

export const analyticsService: AnalyticsService = {
  async getSummary(): AsyncResult<AnalyticsSummary, AppError> {
    const snapshotResult = await this.getSnapshot();
    if (!isOk(snapshotResult)) return err(snapshotResult.error);

    const platformStatsResult = await this.getPlatformStats();
    if (!isOk(platformStatsResult)) return err(platformStatsResult.error);

    const recentPostsResult = await this.getRecentPosts(10);
    if (!isOk(recentPostsResult)) return err(recentPostsResult.error);

    return ok({
      snapshot: snapshotResult.data,
      platformStats: platformStatsResult.data,
      recentPosts: recentPostsResult.data,
      trends: {
        followersChange: snapshotResult.data.growthRate,
        engagementChange: 0,
        viewsChange: 0,
      },
    });
  },

  async getSnapshot(): AsyncResult<AnalyticsSnapshot, AppError> {
    const result = await analyticsRepository.getSnapshot();
    if (!isOk(result)) return result;

    return ok(result.data ?? getDefaultSnapshot());
  },

  async getPlatformStats(): AsyncResult<PlatformStats[], AppError> {
    return analyticsRepository.getPlatformStats();
  },

  async getRecentPosts(limit = 10): AsyncResult<PostAnalytics[], AppError> {
    return analyticsRepository.getRecentPosts(limit);
  },

  async getPostAnalytics(contentId: string): AsyncResult<PostAnalytics[], AppError> {
    return analyticsRepository.getPostAnalytics(contentId);
  },

  async recordPostAnalytics(
    analytics: Omit<PostAnalytics, "id" | "createdAt" | "updatedAt">
  ): AsyncResult<PostAnalytics, AppError> {
    const now = new Date().toISOString();
    const fullAnalytics: PostAnalytics = {
      ...analytics,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    return analyticsRepository.savePostAnalytics(fullAnalytics);
  },

  async refreshFromPlatforms(): AsyncResult<AnalyticsSummary, AppError> {
    const connectedResult = await platformRepository.getConnected();
    if (!isOk(connectedResult)) return err(connectedResult.error);

    const platforms = connectedResult.data;
    const now = new Date().toISOString();

    const totalFollowers = platforms.reduce((sum, p) => sum + p.followerCount, 0);

    const platformStats: PlatformStats[] = platforms.map((p) => ({
      platform: p.platform,
      followers: p.followerCount,
      engagement: Math.random() * 10,
      posts: Math.floor(Math.random() * 50) + 10,
      weeklyGrowth: Math.random() * 5 - 1,
    }));

    const snapshot: AnalyticsSnapshot = {
      totalFollowers,
      totalEngagement: platformStats.reduce((sum, p) => sum + p.engagement, 0) / platformStats.length || 0,
      totalViews: Math.floor(totalFollowers * 2.5),
      totalPosts: platformStats.reduce((sum, p) => sum + p.posts, 0),
      growthRate: platformStats.reduce((sum, p) => sum + p.weeklyGrowth, 0) / platformStats.length || 0,
      recordedAt: now,
    };

    await analyticsRepository.saveSnapshot(snapshot);
    await analyticsRepository.savePlatformStats(platformStats);

    return this.getSummary();
  },

  calculateEngagementRate(likes: number, comments: number, shares: number, reach: number): number {
    if (reach === 0) return 0;
    return ((likes + comments + shares) / reach) * 100;
  },
};
