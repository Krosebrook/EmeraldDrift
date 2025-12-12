import AsyncStorage from "@react-native-async-storage/async-storage";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import type { ProductDesign, PlatformConfig, DesignPlatform } from "./types";

const DESIGNS_KEY = "@designs";
const PLATFORM_CONFIGS_KEY = "@platform_configs";

export interface DesignRepository {
  getAll(): AsyncResult<ProductDesign[], AppError>;
  getById(id: string): AsyncResult<ProductDesign | null, AppError>;
  getByPlatform(platform: DesignPlatform): AsyncResult<ProductDesign[], AppError>;
  getByStatus(status: ProductDesign["status"]): AsyncResult<ProductDesign[], AppError>;
  save(design: ProductDesign): AsyncResult<ProductDesign, AppError>;
  update(id: string, updates: Partial<ProductDesign>): AsyncResult<ProductDesign, AppError>;
  delete(id: string): AsyncResult<void, AppError>;
  getPlatformConfigs(): AsyncResult<PlatformConfig[], AppError>;
  savePlatformConfig(config: PlatformConfig): AsyncResult<PlatformConfig, AppError>;
  getPlatformConfig(platform: DesignPlatform): AsyncResult<PlatformConfig | null, AppError>;
}

export const designRepository: DesignRepository = {
  async getAll(): AsyncResult<ProductDesign[], AppError> {
    try {
      const data = await AsyncStorage.getItem(DESIGNS_KEY);
      const designs: ProductDesign[] = data ? JSON.parse(data) : [];
      return ok(designs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch (error) {
      return err(AppError.persistence("load", DESIGNS_KEY, error instanceof Error ? error : undefined));
    }
  },

  async getById(id: string): AsyncResult<ProductDesign | null, AppError> {
    const result = await this.getAll();
    if (!isOk(result)) return result;
    return ok(result.data.find((d) => d.id === id) || null);
  },

  async getByPlatform(platform: DesignPlatform): AsyncResult<ProductDesign[], AppError> {
    const result = await this.getAll();
    if (!isOk(result)) return result;
    return ok(result.data.filter((d) => d.platform === platform));
  },

  async getByStatus(status: ProductDesign["status"]): AsyncResult<ProductDesign[], AppError> {
    const result = await this.getAll();
    if (!isOk(result)) return result;
    return ok(result.data.filter((d) => d.status === status));
  },

  async save(design: ProductDesign): AsyncResult<ProductDesign, AppError> {
    try {
      const result = await this.getAll();
      if (!isOk(result)) return err(result.error);

      const designs = result.data;
      const existingIndex = designs.findIndex((d) => d.id === design.id);

      if (existingIndex >= 0) {
        designs[existingIndex] = { ...design, updatedAt: new Date().toISOString() };
      } else {
        designs.push(design);
      }

      await AsyncStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
      return ok(existingIndex >= 0 ? designs[existingIndex] : design);
    } catch (error) {
      return err(AppError.persistence("save", DESIGNS_KEY, error instanceof Error ? error : undefined));
    }
  },

  async update(id: string, updates: Partial<ProductDesign>): AsyncResult<ProductDesign, AppError> {
    const existing = await this.getById(id);
    if (!isOk(existing)) return existing;
    if (!existing.data) return err(AppError.notFound("Design"));

    const updated: ProductDesign = {
      ...existing.data,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    return this.save(updated);
  },

  async delete(id: string): AsyncResult<void, AppError> {
    try {
      const result = await this.getAll();
      if (!isOk(result)) return err(result.error);

      const designs = result.data.filter((d) => d.id !== id);
      await AsyncStorage.setItem(DESIGNS_KEY, JSON.stringify(designs));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("delete", DESIGNS_KEY, error instanceof Error ? error : undefined));
    }
  },

  async getPlatformConfigs(): AsyncResult<PlatformConfig[], AppError> {
    try {
      const data = await AsyncStorage.getItem(PLATFORM_CONFIGS_KEY);
      return ok(data ? JSON.parse(data) : []);
    } catch (error) {
      return err(AppError.persistence("load", PLATFORM_CONFIGS_KEY, error instanceof Error ? error : undefined));
    }
  },

  async savePlatformConfig(config: PlatformConfig): AsyncResult<PlatformConfig, AppError> {
    try {
      const result = await this.getPlatformConfigs();
      if (!isOk(result)) return err(result.error);

      const configs = result.data;
      const existingIndex = configs.findIndex((c) => c.platform === config.platform);

      const now = new Date().toISOString();
      const updatedConfig = { ...config, updatedAt: now };

      if (existingIndex >= 0) {
        configs[existingIndex] = updatedConfig;
      } else {
        configs.push({ ...updatedConfig, createdAt: now });
      }

      await AsyncStorage.setItem(PLATFORM_CONFIGS_KEY, JSON.stringify(configs));
      return ok(updatedConfig);
    } catch (error) {
      return err(AppError.persistence("save", PLATFORM_CONFIGS_KEY, error instanceof Error ? error : undefined));
    }
  },

  async getPlatformConfig(platform: DesignPlatform): AsyncResult<PlatformConfig | null, AppError> {
    const result = await this.getPlatformConfigs();
    if (!isOk(result)) return result;
    return ok(result.data.find((c) => c.platform === platform) || null);
  },
};
