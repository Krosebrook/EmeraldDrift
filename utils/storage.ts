import AsyncStorage from "@react-native-async-storage/async-storage";

const CONTENT_STORAGE_KEY = "@creator_studio_content";
const PLATFORMS_STORAGE_KEY = "@creator_studio_platforms";
const ANALYTICS_STORAGE_KEY = "@creator_studio_analytics";
const SCHEDULED_POSTS_KEY = "@creator_studio_scheduled";

export interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConnection {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";
  username: string;
  displayName: string;
  avatar?: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
}

export interface AnalyticsData {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  growthRate: number;
  recentPosts: {
    id: string;
    platform: string;
    likes: number;
    comments: number;
    shares: number;
    views: number;
    date: string;
  }[];
  platformStats: {
    platform: string;
    followers: number;
    engagement: number;
    posts: number;
  }[];
}

export const storage = {
  async getContent(): Promise<ContentItem[]> {
    try {
      const json = await AsyncStorage.getItem(CONTENT_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error("Failed to get content:", error);
      return [];
    }
  },

  async saveContent(content: ContentItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(content));
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  },

  async addContent(item: ContentItem): Promise<void> {
    const content = await this.getContent();
    content.unshift(item);
    await this.saveContent(content);
  },

  async updateContent(id: string, updates: Partial<ContentItem>): Promise<void> {
    const content = await this.getContent();
    const index = content.findIndex((item) => item.id === id);
    if (index !== -1) {
      content[index] = { ...content[index], ...updates, updatedAt: new Date().toISOString() };
      await this.saveContent(content);
    }
  },

  async deleteContent(id: string): Promise<void> {
    const content = await this.getContent();
    const filtered = content.filter((item) => item.id !== id);
    await this.saveContent(filtered);
  },

  async getPlatforms(): Promise<PlatformConnection[]> {
    try {
      const json = await AsyncStorage.getItem(PLATFORMS_STORAGE_KEY);
      return json ? JSON.parse(json) : [];
    } catch (error) {
      console.error("Failed to get platforms:", error);
      return [];
    }
  },

  async savePlatforms(platforms: PlatformConnection[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PLATFORMS_STORAGE_KEY, JSON.stringify(platforms));
    } catch (error) {
      console.error("Failed to save platforms:", error);
    }
  },

  async connectPlatform(platform: PlatformConnection): Promise<void> {
    const platforms = await this.getPlatforms();
    const existingIndex = platforms.findIndex((p) => p.platform === platform.platform);
    if (existingIndex !== -1) {
      platforms[existingIndex] = platform;
    } else {
      platforms.push(platform);
    }
    await this.savePlatforms(platforms);
  },

  async disconnectPlatform(platformId: string): Promise<void> {
    const platforms = await this.getPlatforms();
    const filtered = platforms.filter((p) => p.id !== platformId);
    await this.savePlatforms(filtered);
  },

  async getAnalytics(): Promise<AnalyticsData> {
    try {
      const json = await AsyncStorage.getItem(ANALYTICS_STORAGE_KEY);
      if (json) {
        return JSON.parse(json);
      }
      return this.getDefaultAnalytics();
    } catch (error) {
      console.error("Failed to get analytics:", error);
      return this.getDefaultAnalytics();
    }
  },

  getDefaultAnalytics(): AnalyticsData {
    return {
      totalFollowers: 0,
      totalEngagement: 0,
      totalViews: 0,
      totalPosts: 0,
      growthRate: 0,
      recentPosts: [],
      platformStats: [],
    };
  },

  async saveAnalytics(analytics: AnalyticsData): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(analytics));
    } catch (error) {
      console.error("Failed to save analytics:", error);
    }
  },

  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CONTENT_STORAGE_KEY,
        PLATFORMS_STORAGE_KEY,
        ANALYTICS_STORAGE_KEY,
        SCHEDULED_POSTS_KEY,
      ]);
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};
