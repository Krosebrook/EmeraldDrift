import AsyncStorage from "@react-native-async-storage/async-storage";

export type AIProvider = "simulated" | "openai" | "gemini";

export interface FeatureFlags {
  aiProvider: AIProvider;
  enableCaching: boolean;
  cacheRefreshInterval: number;
  enableOfflineMode: boolean;
  enableAnalytics: boolean;
  enableDebugMode: boolean;
  lazyLoadScreens: boolean;
  maxRetryAttempts: number;
  requestTimeout: number;
}

const FEATURE_FLAGS_KEY = "@feature_flags";

const DEFAULT_FLAGS: FeatureFlags = {
  aiProvider: "simulated",
  enableCaching: true,
  cacheRefreshInterval: 300000,
  enableOfflineMode: true,
  enableAnalytics: true,
  enableDebugMode: __DEV__,
  lazyLoadScreens: true,
  maxRetryAttempts: 3,
  requestTimeout: 30000,
};

let cachedFlags: FeatureFlags | null = null;

export const featureFlags = {
  async get(): Promise<FeatureFlags> {
    if (cachedFlags) return cachedFlags;
    
    try {
      const stored = await AsyncStorage.getItem(FEATURE_FLAGS_KEY);
      if (stored) {
        cachedFlags = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
        return cachedFlags as FeatureFlags;
      }
    } catch (error) {
      console.warn("Failed to load feature flags:", error);
    }
    
    cachedFlags = DEFAULT_FLAGS;
    return cachedFlags;
  },

  async set(flags: Partial<FeatureFlags>): Promise<void> {
    try {
      const current = await this.get();
      const updated = { ...current, ...flags };
      await AsyncStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(updated));
      cachedFlags = updated;
    } catch (error) {
      console.error("Failed to save feature flags:", error);
    }
  },

  async reset(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FEATURE_FLAGS_KEY);
      cachedFlags = DEFAULT_FLAGS;
    } catch (error) {
      console.error("Failed to reset feature flags:", error);
    }
  },

  getSync(): FeatureFlags {
    return cachedFlags || DEFAULT_FLAGS;
  },

  isSimulated(): boolean {
    return this.getSync().aiProvider === "simulated";
  },

  getAIProvider(): AIProvider {
    return this.getSync().aiProvider;
  },
};

export function useFeatureFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  return featureFlags.getSync()[key];
}
