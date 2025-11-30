import AsyncStorage from "@react-native-async-storage/async-storage";

export interface UserStats {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  postsDraft: number;
  mediaUploaded: number;
  platformsConnected: number;
  teamMembers: number;
  engagementRate: number;
  growthRate: number;
  lastUpdated: string;
}

export interface UserActivity {
  id: string;
  type: "post_created" | "post_published" | "post_scheduled" | "platform_connected" | "media_uploaded" | "team_invited";
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformStats {
  platform: "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";
  followers: number;
  engagement: number;
  views: number;
  posts: number;
  growthRate: number;
}

export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  steps: {
    welcome: boolean;
    profile: boolean;
    platforms: boolean;
  };
}

export interface TutorialState {
  completed: boolean;
  completedAt?: string;
  screensViewed: string[];
  skipped: boolean;
}

const KEYS = {
  stats: (userId: string) => `@user_stats_${userId}`,
  activities: (userId: string) => `@user_activities_${userId}`,
  platformStats: (userId: string) => `@platform_stats_${userId}`,
  onboarding: (userId: string) => `@onboarding_${userId}`,
  tutorial: (userId: string) => `@tutorial_${userId}`,
};

const getDefaultStats = (): UserStats => ({
  totalFollowers: 0,
  totalEngagement: 0,
  totalViews: 0,
  totalPosts: 0,
  postsCreated: 0,
  postsScheduled: 0,
  postsPublished: 0,
  postsDraft: 0,
  mediaUploaded: 0,
  platformsConnected: 0,
  teamMembers: 1,
  engagementRate: 0,
  growthRate: 0,
  lastUpdated: new Date().toISOString(),
});

const getDefaultOnboarding = (): OnboardingState => ({
  completed: false,
  steps: {
    welcome: false,
    profile: false,
    platforms: false,
  },
});

const getDefaultTutorial = (): TutorialState => ({
  completed: false,
  screensViewed: [],
  skipped: false,
});

export const userStatsService = {
  async initializeUser(userId: string): Promise<void> {
    const existingStats = await this.getStats(userId);
    if (!existingStats) {
      await this.saveStats(userId, getDefaultStats());
      await this.saveActivities(userId, []);
      await this.savePlatformStats(userId, []);
      await this.saveOnboardingState(userId, getDefaultOnboarding());
      await this.saveTutorialState(userId, getDefaultTutorial());
    }
  },

  async getStats(userId: string): Promise<UserStats | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.stats(userId));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting user stats:", error);
      return null;
    }
  },

  async saveStats(userId: string, stats: UserStats): Promise<void> {
    try {
      stats.lastUpdated = new Date().toISOString();
      await AsyncStorage.setItem(KEYS.stats(userId), JSON.stringify(stats));
    } catch (error) {
      console.error("Error saving user stats:", error);
    }
  },

  async updateStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    const currentStats = await this.getStats(userId) || getDefaultStats();
    const updatedStats = { ...currentStats, ...updates, lastUpdated: new Date().toISOString() };
    await this.saveStats(userId, updatedStats);
    return updatedStats;
  },

  async incrementStat(userId: string, key: keyof UserStats, amount: number = 1): Promise<UserStats> {
    const currentStats = await this.getStats(userId) || getDefaultStats();
    const currentValue = currentStats[key];
    if (typeof currentValue === "number") {
      const statsRecord = currentStats as unknown as Record<string, unknown>;
      statsRecord[key] = currentValue + amount;
    }
    currentStats.lastUpdated = new Date().toISOString();
    await this.saveStats(userId, currentStats);
    return currentStats;
  },

  async getActivities(userId: string, limit: number = 20): Promise<UserActivity[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.activities(userId));
      const activities: UserActivity[] = data ? JSON.parse(data) : [];
      return activities.slice(0, limit);
    } catch (error) {
      console.error("Error getting user activities:", error);
      return [];
    }
  },

  async saveActivities(userId: string, activities: UserActivity[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.activities(userId), JSON.stringify(activities));
    } catch (error) {
      console.error("Error saving user activities:", error);
    }
  },

  async addActivity(userId: string, activity: Omit<UserActivity, "id" | "timestamp">): Promise<UserActivity> {
    const activities = await this.getActivities(userId, 100);
    const newActivity: UserActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    const updatedActivities = [newActivity, ...activities].slice(0, 100);
    await this.saveActivities(userId, updatedActivities);
    return newActivity;
  },

  async getPlatformStats(userId: string): Promise<PlatformStats[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.platformStats(userId));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting platform stats:", error);
      return [];
    }
  },

  async savePlatformStats(userId: string, stats: PlatformStats[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.platformStats(userId), JSON.stringify(stats));
    } catch (error) {
      console.error("Error saving platform stats:", error);
    }
  },

  async addOrUpdatePlatformStats(userId: string, platformStats: PlatformStats): Promise<PlatformStats[]> {
    const current = await this.getPlatformStats(userId);
    const index = current.findIndex((p) => p.platform === platformStats.platform);
    if (index >= 0) {
      current[index] = platformStats;
    } else {
      current.push(platformStats);
    }
    await this.savePlatformStats(userId, current);
    return current;
  },

  async getOnboardingState(userId: string): Promise<OnboardingState> {
    try {
      const data = await AsyncStorage.getItem(KEYS.onboarding(userId));
      if (data) {
        const parsed = JSON.parse(data);
        return {
          completed: parsed.completed ?? false,
          completedAt: parsed.completedAt,
          steps: {
            welcome: parsed.steps?.welcome ?? false,
            profile: parsed.steps?.profile ?? false,
            platforms: parsed.steps?.platforms ?? false,
          },
        };
      }
      return getDefaultOnboarding();
    } catch (error) {
      console.error("Error getting onboarding state:", error);
      return getDefaultOnboarding();
    }
  },

  async saveOnboardingState(userId: string, state: OnboardingState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.onboarding(userId), JSON.stringify(state));
    } catch (error) {
      console.error("Error saving onboarding state:", error);
    }
  },

  async completeOnboardingStep(userId: string, step: keyof OnboardingState["steps"]): Promise<OnboardingState> {
    const state = await this.getOnboardingState(userId);
    state.steps[step] = true;
    
    const allComplete = state.steps.welcome && state.steps.profile && state.steps.platforms;
    if (allComplete) {
      state.completed = true;
      state.completedAt = new Date().toISOString();
    }
    
    await this.saveOnboardingState(userId, state);
    return state;
  },

  async getTutorialState(userId: string): Promise<TutorialState> {
    try {
      const data = await AsyncStorage.getItem(KEYS.tutorial(userId));
      return data ? JSON.parse(data) : getDefaultTutorial();
    } catch (error) {
      console.error("Error getting tutorial state:", error);
      return getDefaultTutorial();
    }
  },

  async saveTutorialState(userId: string, state: TutorialState): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.tutorial(userId), JSON.stringify(state));
    } catch (error) {
      console.error("Error saving tutorial state:", error);
    }
  },

  async markScreenViewed(userId: string, screenName: string): Promise<TutorialState> {
    const state = await this.getTutorialState(userId);
    if (!state.screensViewed.includes(screenName)) {
      state.screensViewed.push(screenName);
    }
    await this.saveTutorialState(userId, state);
    return state;
  },

  async completeTutorial(userId: string, skipped: boolean = false): Promise<TutorialState> {
    const state = await this.getTutorialState(userId);
    state.completed = true;
    state.completedAt = new Date().toISOString();
    state.skipped = skipped;
    await this.saveTutorialState(userId, state);
    return state;
  },

  async resetUserData(userId: string): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.stats(userId),
        KEYS.activities(userId),
        KEYS.platformStats(userId),
        KEYS.onboarding(userId),
        KEYS.tutorial(userId),
      ]);
    } catch (error) {
      console.error("Error resetting user data:", error);
    }
  },
};

export default userStatsService;
