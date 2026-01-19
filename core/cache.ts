import AsyncStorage from "@react-native-async-storage/async-storage";
import { featureFlags } from "./featureFlags";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  version: number;
}

interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  version: number;
}

const CACHE_PREFIX = "@cache_";
const CACHE_INDEX_KEY = "@cache_index";
const CACHE_VERSION = 1;

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 300000,
  maxEntries: 100,
  version: CACHE_VERSION,
};

let cacheIndex: Set<string> = new Set();
let memoryCache: Map<string, CacheEntry<unknown>> = new Map();
let refreshCallbacks: Map<string, () => Promise<unknown>> = new Map();
let backgroundRefreshTimers: Map<string, NodeJS.Timeout> = new Map();

async function loadCacheIndex(): Promise<void> {
  try {
    const index = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (index) {
      cacheIndex = new Set(JSON.parse(index));
    }
  } catch {
    cacheIndex = new Set();
  }
}

async function saveCacheIndex(): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify([...cacheIndex]));
  } catch (error) {
    console.warn("Failed to save cache index:", error);
  }
}

export const cacheManager = {
  async init(): Promise<void> {
    await loadCacheIndex();
  },

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = CACHE_PREFIX + key;
    
    if (memoryCache.has(cacheKey)) {
      const entry = memoryCache.get(cacheKey) as CacheEntry<T>;
      if (this.isValid(entry)) {
        this.scheduleBackgroundRefresh(key);
        return entry.data;
      }
      memoryCache.delete(cacheKey);
    }

    try {
      const stored = await AsyncStorage.getItem(cacheKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (this.isValid(entry)) {
          memoryCache.set(cacheKey, entry);
          this.scheduleBackgroundRefresh(key);
          return entry.data;
        }
        await this.remove(key);
      }
    } catch (error) {
      console.warn(`Cache read error for ${key}:`, error);
    }

    return null;
  },

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const flags = await featureFlags.get();
    if (!flags.enableCaching) return;

    const cacheKey = CACHE_PREFIX + key;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? DEFAULT_CONFIG.defaultTTL,
      version: DEFAULT_CONFIG.version,
    };

    try {
      memoryCache.set(cacheKey, entry);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(entry));
      cacheIndex.add(key);
      await saveCacheIndex();
      await this.enforceMaxEntries();
    } catch (error) {
      console.warn(`Cache write error for ${key}:`, error);
    }
  },

  async remove(key: string): Promise<void> {
    const cacheKey = CACHE_PREFIX + key;
    memoryCache.delete(cacheKey);
    cacheIndex.delete(key);
    
    try {
      await AsyncStorage.removeItem(cacheKey);
      await saveCacheIndex();
    } catch (error) {
      console.warn(`Cache remove error for ${key}:`, error);
    }

    const timer = backgroundRefreshTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      backgroundRefreshTimers.delete(key);
    }
  },

  async clear(): Promise<void> {
    const keys = [...cacheIndex].map((k) => CACHE_PREFIX + k);
    memoryCache.clear();
    cacheIndex.clear();

    try {
      await AsyncStorage.multiRemove(keys);
      await saveCacheIndex();
    } catch (error) {
      console.warn("Cache clear error:", error);
    }

    backgroundRefreshTimers.forEach((timer) => clearTimeout(timer));
    backgroundRefreshTimers.clear();
  },

  isValid<T>(entry: CacheEntry<T>): boolean {
    if (entry.version !== DEFAULT_CONFIG.version) return false;
    return Date.now() - entry.timestamp < entry.ttl;
  },

  isStale<T>(entry: CacheEntry<T>): boolean {
    const staleThreshold = entry.ttl * 0.75;
    return Date.now() - entry.timestamp > staleThreshold;
  },

  registerRefreshCallback(key: string, callback: () => Promise<unknown>): void {
    refreshCallbacks.set(key, callback);
  },

  unregisterRefreshCallback(key: string): void {
    refreshCallbacks.delete(key);
    const timer = backgroundRefreshTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      backgroundRefreshTimers.delete(key);
    }
  },

  scheduleBackgroundRefresh(key: string): void {
    if (backgroundRefreshTimers.has(key)) return;
    
    const callback = refreshCallbacks.get(key);
    if (!callback) return;

    const cacheKey = CACHE_PREFIX + key;
    const entry = memoryCache.get(cacheKey);
    
    if (entry && this.isStale(entry)) {
      const timer = setTimeout(async () => {
        try {
          const freshData = await callback();
          await this.set(key, freshData);
        } catch (error) {
          console.warn(`Background refresh failed for ${key}:`, error);
        } finally {
          backgroundRefreshTimers.delete(key);
        }
      }, 100);
      
      backgroundRefreshTimers.set(key, timer);
    }
  },

  async enforceMaxEntries(): Promise<void> {
    if (cacheIndex.size <= DEFAULT_CONFIG.maxEntries) return;

    const entries: Array<{ key: string; timestamp: number }> = [];
    
    for (const key of cacheIndex) {
      const cacheKey = CACHE_PREFIX + key;
      const entry = memoryCache.get(cacheKey);
      if (entry) {
        entries.push({ key, timestamp: entry.timestamp });
      }
    }

    entries.sort((a, b) => a.timestamp - b.timestamp);
    const toRemove = entries.slice(0, entries.length - DEFAULT_CONFIG.maxEntries);
    
    for (const { key } of toRemove) {
      await this.remove(key);
    }
  },

  getCacheStats(): { entries: number; memoryEntries: number } {
    return {
      entries: cacheIndex.size,
      memoryEntries: memoryCache.size,
    };
  },
};

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options?: { ttl?: number; forceRefresh?: boolean }
): Promise<T> {
  if (!options?.forceRefresh) {
    const cached = await cacheManager.get<T>(key);
    if (cached !== null) return cached;
  }

  const data = await fetcher();
  await cacheManager.set(key, data, options?.ttl);
  cacheManager.registerRefreshCallback(key, fetcher);
  
  return data;
}
