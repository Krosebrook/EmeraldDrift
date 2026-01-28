import { persistence } from "../core/persistence";
import { USER_STORAGE_KEYS } from "../core/constants";
import type { 
  UserStats, 
  UserActivity, 
  PlatformStats, 
  OnboardingState, 
  TutorialState 
} from "../types";

function getDefaultStats(): UserStats {
  return {
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
  };
}

function getDefaultOnboarding(): OnboardingState {
  return {
    completed: false,
    steps: {
      welcome: false,
      profile: false,
      platforms: false,
    },
  };
}

function getDefaultTutorial(): TutorialState {
  return {
    completed: false,
    screensViewed: [],
    skipped: false,
  };
}

function createUserStorage(userId: string) {
  return persistence.createUserScopedStorage(userId);
}

export const userRepository = {
  async initialize(userId: string): Promise<void> {
    const storage = createUserStorage(userId);
    const existingStats = await storage.get<UserStats>(USER_STORAGE_KEYS.STATS);
    
    if (!existingStats) {
      // ⚡ Performance: Batch initialization writes to reduce bridge crossings
      await storage.multiSet([
        [USER_STORAGE_KEYS.STATS, getDefaultStats()],
        [USER_STORAGE_KEYS.ACTIVITIES, []],
        [USER_STORAGE_KEYS.PLATFORM_STATS, []],
        [USER_STORAGE_KEYS.ONBOARDING, getDefaultOnboarding()],
        [USER_STORAGE_KEYS.TUTORIAL, getDefaultTutorial()],
      ]);
    }
  },

  async getStats(userId: string): Promise<UserStats> {
    const storage = createUserStorage(userId);
    const stats = await storage.get<UserStats>(USER_STORAGE_KEYS.STATS);
    return stats ?? getDefaultStats();
  },

  async updateStats(userId: string, updates: Partial<UserStats>): Promise<UserStats> {
    const storage = createUserStorage(userId);
    const current = await this.getStats(userId);
    const updated: UserStats = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };
    await storage.set(USER_STORAGE_KEYS.STATS, updated);
    return updated;
  },

  async incrementStat(
    userId: string, 
    key: keyof UserStats, 
    amount: number = 1
  ): Promise<UserStats> {
    const current = await this.getStats(userId);
    const currentValue = current[key];
    
    if (typeof currentValue === "number") {
      const updates: Partial<UserStats> = { [key]: currentValue + amount };
      return this.updateStats(userId, updates);
    }
    
    return current;
  },

  async getActivities(userId: string, limit: number = 20): Promise<UserActivity[]> {
    const storage = createUserStorage(userId);
    const activities = await storage.get<UserActivity[]>(USER_STORAGE_KEYS.ACTIVITIES);
    return (activities ?? []).slice(0, limit);
  },

  async addActivity(
    userId: string, 
    activity: Omit<UserActivity, "id" | "timestamp">
  ): Promise<UserActivity> {
    const storage = createUserStorage(userId);
    const activities = await this.getActivities(userId, 100);
    
    const newActivity: UserActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    
    const updated = [newActivity, ...activities].slice(0, 100);
    await storage.set(USER_STORAGE_KEYS.ACTIVITIES, updated);
    return newActivity;
  },

  async getPlatformStats(userId: string): Promise<PlatformStats[]> {
    const storage = createUserStorage(userId);
    return (await storage.get<PlatformStats[]>(USER_STORAGE_KEYS.PLATFORM_STATS)) ?? [];
  },

  async updatePlatformStats(userId: string, stats: PlatformStats): Promise<PlatformStats[]> {
    const storage = createUserStorage(userId);
    const current = await this.getPlatformStats(userId);
    const index = current.findIndex((p) => p.platform === stats.platform);
    
    if (index >= 0) {
      current[index] = stats;
    } else {
      current.push(stats);
    }
    
    await storage.set(USER_STORAGE_KEYS.PLATFORM_STATS, current);
    return current;
  },

  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const storage = createUserStorage(userId);
    const state = await storage.get<OnboardingState>(USER_STORAGE_KEYS.ONBOARDING);
    
    if (state) {
      return {
        completed: state.completed ?? false,
        completedAt: state.completedAt,
        steps: {
          welcome: state.steps?.welcome ?? false,
          profile: state.steps?.profile ?? false,
          platforms: state.steps?.platforms ?? false,
        },
      };
    }
    
    return getDefaultOnboarding();
  },

  async completeOnboardingStep(
    userId: string, 
    step: keyof OnboardingState["steps"]
  ): Promise<OnboardingState> {
    const storage = createUserStorage(userId);
    const state = await this.getOnboardingState(userId);
    state.steps[step] = true;
    
    const allComplete = state.steps.welcome && state.steps.profile && state.steps.platforms;
    if (allComplete) {
      state.completed = true;
      state.completedAt = new Date().toISOString();
    }
    
    await storage.set(USER_STORAGE_KEYS.ONBOARDING, state);
    return state;
  },

  async getTutorialState(userId: string): Promise<TutorialState> {
    const storage = createUserStorage(userId);
    const state = await storage.get<TutorialState>(USER_STORAGE_KEYS.TUTORIAL);
    return state ?? getDefaultTutorial();
  },

  async markScreenViewed(userId: string, screenName: string): Promise<TutorialState> {
    const storage = createUserStorage(userId);
    const state = await this.getTutorialState(userId);
    
    if (!state.screensViewed.includes(screenName)) {
      state.screensViewed.push(screenName);
    }
    
    await storage.set(USER_STORAGE_KEYS.TUTORIAL, state);
    return state;
  },

  async completeTutorial(userId: string, skipped: boolean = false): Promise<TutorialState> {
    const storage = createUserStorage(userId);
    const state = await this.getTutorialState(userId);
    state.completed = true;
    state.completedAt = new Date().toISOString();
    state.skipped = skipped;
    
    await storage.set(USER_STORAGE_KEYS.TUTORIAL, state);
    return state;
  },

  async resetUserData(userId: string): Promise<void> {
    const storage = createUserStorage(userId);
    await storage.clearAll([
      USER_STORAGE_KEYS.STATS,
      USER_STORAGE_KEYS.ACTIVITIES,
      USER_STORAGE_KEYS.PLATFORM_STATS,
      USER_STORAGE_KEYS.ONBOARDING,
      USER_STORAGE_KEYS.TUTORIAL,
    ]);
  },

  async deleteAllUserData(userId: string): Promise<void> {
    const storage = createUserStorage(userId);
    await storage.clearAll([
      USER_STORAGE_KEYS.STATS,
      USER_STORAGE_KEYS.ACTIVITIES,
      USER_STORAGE_KEYS.PLATFORM_STATS,
      USER_STORAGE_KEYS.ONBOARDING,
      USER_STORAGE_KEYS.TUTORIAL,
      USER_STORAGE_KEYS.PREFERENCES,
      USER_STORAGE_KEYS.NOTIFICATIONS,
    ]);
  },
};

export default userRepository;
