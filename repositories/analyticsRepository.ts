import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { AnalyticsData, PlatformType, PostStats, PlatformAnalytics } from "../types";

function getDefaultAnalytics(): AnalyticsData {
  return {
    totalFollowers: 0,
    totalEngagement: 0,
    totalViews: 0,
    totalPosts: 0,
    growthRate: 0,
    recentPosts: [],
    platformStats: [],
  };
}

export const analyticsRepository = {
  async get(): Promise<AnalyticsData> {
    const data = await persistence.get<AnalyticsData>(STORAGE_KEYS.ANALYTICS);
    return data ?? getDefaultAnalytics();
  },

  async save(analytics: AnalyticsData): Promise<void> {
    await persistence.set(STORAGE_KEYS.ANALYTICS, analytics);
  },

  async update(updates: Partial<AnalyticsData>): Promise<AnalyticsData> {
    const current = await this.get();
    const updated = { ...current, ...updates };
    await this.save(updated);
    return updated;
  },

  async updateTotals(updates: {
    totalFollowers?: number;
    totalEngagement?: number;
    totalViews?: number;
    totalPosts?: number;
    growthRate?: number;
  }): Promise<AnalyticsData> {
    return this.update(updates);
  },

  async addRecentPost(post: PostStats): Promise<AnalyticsData> {
    const current = await this.get();
    const recentPosts = [post, ...current.recentPosts].slice(0, 20);
    return this.update({ recentPosts });
  },

  async updatePlatformStats(platform: PlatformType, stats: Omit<PlatformAnalytics, "platform">): Promise<AnalyticsData> {
    const current = await this.get();
    const existingIndex = current.platformStats.findIndex((p) => p.platform === platform);
    
    const platformStat: PlatformAnalytics = { platform, ...stats };
    
    if (existingIndex >= 0) {
      current.platformStats[existingIndex] = platformStat;
    } else {
      current.platformStats.push(platformStat);
    }
    
    return this.save(current).then(() => current);
  },

  async getPlatformStats(platform: PlatformType): Promise<PlatformAnalytics | null> {
    const analytics = await this.get();
    return analytics.platformStats.find((p) => p.platform === platform) ?? null;
  },

  async getRecentPosts(limit: number = 10): Promise<PostStats[]> {
    const analytics = await this.get();
    return analytics.recentPosts.slice(0, limit);
  },

  async calculateGrowthRate(previousFollowers: number): Promise<number> {
    const analytics = await this.get();
    if (previousFollowers === 0) return 0;
    return ((analytics.totalFollowers - previousFollowers) / previousFollowers) * 100;
  },

  async recalculateTotals(platformStats: PlatformAnalytics[]): Promise<AnalyticsData> {
    const totalFollowers = platformStats.reduce((sum, p) => sum + p.followers, 0);
    const totalPosts = platformStats.reduce((sum, p) => sum + p.posts, 0);
    const totalEngagement = platformStats.length > 0
      ? platformStats.reduce((sum, p) => sum + p.engagement, 0) / platformStats.length
      : 0;

    return this.update({
      totalFollowers,
      totalPosts,
      totalEngagement,
      platformStats,
    });
  },

  async clear(): Promise<void> {
    await persistence.remove(STORAGE_KEYS.ANALYTICS);
  },

  async reset(): Promise<AnalyticsData> {
    const defaultAnalytics = getDefaultAnalytics();
    await this.save(defaultAnalytics);
    return defaultAnalytics;
  },
};

export default analyticsRepository;
