import AsyncStorage from "@react-native-async-storage/async-storage";
import type { StylePreference, MerchProductType } from "../types";

const KEYS = {
  LAST_PRODUCT: "merch_last_product",
  LAST_STYLE: "merch_last_style",
  RECENT_PRODUCTS: "merch_recent_products",
  MOCKUP_CACHE: "merch_mockup_cache",
};

const MAX_RECENT_PRODUCTS = 5;
const MAX_CACHED_MOCKUPS = 10;
const MOCKUP_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CachedMockup {
  productId: MerchProductType;
  stylePreference: StylePreference;
  mockupImage: string;
  timestamp: number;
}

class PreferencesService {
  private static instance: PreferencesService;

  private constructor() {}

  static getInstance(): PreferencesService {
    if (!PreferencesService.instance) {
      PreferencesService.instance = new PreferencesService();
    }
    return PreferencesService.instance;
  }

  async getLastProduct(): Promise<MerchProductType | null> {
    try {
      return (await AsyncStorage.getItem(KEYS.LAST_PRODUCT)) as MerchProductType | null;
    } catch {
      return null;
    }
  }

  async setLastProduct(productId: MerchProductType): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_PRODUCT, productId);
      await this.addToRecentProducts(productId);
    } catch {}
  }

  async getRecentProducts(): Promise<MerchProductType[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.RECENT_PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private async addToRecentProducts(productId: MerchProductType): Promise<void> {
    try {
      const recent = await this.getRecentProducts();
      const filtered = recent.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_RECENT_PRODUCTS);
      await AsyncStorage.setItem(KEYS.RECENT_PRODUCTS, JSON.stringify(updated));
    } catch {}
  }

  async getLastStyle(): Promise<StylePreference> {
    try {
      const style = await AsyncStorage.getItem(KEYS.LAST_STYLE);
      return (style as StylePreference) || "studio";
    } catch {
      return "studio";
    }
  }

  async setLastStyle(style: StylePreference): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.LAST_STYLE, style);
    } catch {}
  }

  async getCachedMockup(
    productId: MerchProductType,
    stylePreference: StylePreference
  ): Promise<string | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MOCKUP_CACHE);
      if (!data) return null;

      const cache: CachedMockup[] = JSON.parse(data);
      const now = Date.now();

      const entry = cache.find(
        (c) =>
          c.productId === productId &&
          c.stylePreference === stylePreference &&
          now - c.timestamp < MOCKUP_CACHE_TTL_MS
      );

      return entry?.mockupImage || null;
    } catch {
      return null;
    }
  }

  async cacheMockup(
    productId: MerchProductType,
    stylePreference: StylePreference,
    mockupImage: string
  ): Promise<void> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MOCKUP_CACHE);
      let cache: CachedMockup[] = data ? JSON.parse(data) : [];

      cache = cache.filter(
        (c) => !(c.productId === productId && c.stylePreference === stylePreference)
      );

      const now = Date.now();
      cache = cache.filter((c) => now - c.timestamp < MOCKUP_CACHE_TTL_MS);

      cache.unshift({
        productId,
        stylePreference,
        mockupImage,
        timestamp: now,
      });

      if (cache.length > MAX_CACHED_MOCKUPS) {
        cache = cache.slice(0, MAX_CACHED_MOCKUPS);
      }

      await AsyncStorage.setItem(KEYS.MOCKUP_CACHE, JSON.stringify(cache));
    } catch {}
  }

  async clearMockupCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(KEYS.MOCKUP_CACHE);
    } catch {}
  }

  async clearAllPreferences(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.LAST_PRODUCT,
        KEYS.LAST_STYLE,
        KEYS.RECENT_PRODUCTS,
        KEYS.MOCKUP_CACHE,
      ]);
    } catch {}
  }
}

export const preferencesService = PreferencesService.getInstance();
