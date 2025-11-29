import AsyncStorage from "@react-native-async-storage/async-storage";

const CONTENT_STORAGE_KEY = "@creator_studio_content";
const PLATFORMS_STORAGE_KEY = "@creator_studio_platforms";
const ANALYTICS_STORAGE_KEY = "@creator_studio_analytics";
const SCHEDULED_POSTS_KEY = "@creator_studio_scheduled";
const DEMO_INITIALIZED_KEY = "@creator_studio_demo_init";

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

function generateDemoPlatforms(): PlatformConnection[] {
  const now = new Date();
  return [
    {
      id: "demo_instagram",
      platform: "instagram",
      username: "creativestudio",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 15420,
    },
    {
      id: "demo_tiktok",
      platform: "tiktok",
      username: "creativestudio",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 28750,
    },
    {
      id: "demo_youtube",
      platform: "youtube",
      username: "CreativeStudioOfficial",
      displayName: "Creative Studio",
      connected: true,
      connectedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      followerCount: 8340,
    },
  ];
}

function generateDemoContent(): ContentItem[] {
  const now = new Date();
  return [
    {
      id: "demo_content_1",
      title: "Morning Productivity Tips",
      caption: "Start your day with these 5 simple habits that will transform your morning routine. Your future self will thank you! What's your go-to morning habit?",
      platforms: ["instagram", "tiktok"],
      status: "published",
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_2",
      title: "Behind the Scenes",
      caption: "A sneak peek into our creative process. From ideation to execution - every masterpiece starts with a single idea.",
      platforms: ["youtube", "instagram"],
      status: "published",
      publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_3",
      title: "Weekend Inspiration",
      caption: "Taking time to recharge is not a luxury, it's a necessity. How are you spending your weekend?",
      platforms: ["instagram"],
      status: "scheduled",
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "demo_content_4",
      title: "New Product Launch",
      caption: "Exciting news! We've been working on something special and can't wait to share it with you. Stay tuned for the big reveal!",
      platforms: ["tiktok", "youtube", "instagram"],
      status: "draft",
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

function generateDemoAnalytics(): AnalyticsData {
  const now = new Date();
  return {
    totalFollowers: 52510,
    totalEngagement: 4.8,
    totalViews: 1250000,
    totalPosts: 156,
    growthRate: 12.5,
    recentPosts: [
      {
        id: "post_1",
        platform: "instagram",
        likes: 2450,
        comments: 187,
        shares: 45,
        views: 28500,
        date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "post_2",
        platform: "tiktok",
        likes: 8920,
        comments: 542,
        shares: 234,
        views: 125000,
        date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "post_3",
        platform: "youtube",
        likes: 1230,
        comments: 89,
        shares: 67,
        views: 45600,
        date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "post_4",
        platform: "instagram",
        likes: 1890,
        comments: 156,
        shares: 34,
        views: 22300,
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    platformStats: [
      {
        platform: "instagram",
        followers: 15420,
        engagement: 5.2,
        posts: 68,
      },
      {
        platform: "tiktok",
        followers: 28750,
        engagement: 8.4,
        posts: 52,
      },
      {
        platform: "youtube",
        followers: 8340,
        engagement: 3.1,
        posts: 36,
      },
    ],
  };
}

export const storage = {
  async initializeDemoData(): Promise<void> {
    try {
      const initialized = await AsyncStorage.getItem(DEMO_INITIALIZED_KEY);
      if (initialized) return;

      const existingPlatforms = await this.getPlatforms();
      const existingContent = await this.getContent();
      
      if (existingPlatforms.length === 0 && existingContent.length === 0) {
        await this.savePlatforms(generateDemoPlatforms());
        await this.saveContent(generateDemoContent());
        await this.saveAnalytics(generateDemoAnalytics());
        await AsyncStorage.setItem(DEMO_INITIALIZED_KEY, "true");
      }
    } catch (error) {
      console.error("Failed to initialize demo data:", error);
    }
  },

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
        DEMO_INITIALIZED_KEY,
      ]);
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  },
};
