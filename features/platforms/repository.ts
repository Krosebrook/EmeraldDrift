import { createFeatureRepository, Repository } from "@/features/shared/repository";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import type { PlatformConnection, PlatformType } from "@/features/shared/types";

const STORAGE_KEY = "@creator_studio_platforms";

const baseRepository = createFeatureRepository<PlatformConnection>({
  storageKey: STORAGE_KEY,
});

export interface PlatformRepository extends Repository<PlatformConnection> {
  getByPlatform(platform: PlatformType): AsyncResult<PlatformConnection | null, AppError>;
  getConnected(): AsyncResult<PlatformConnection[], AppError>;
  getDisconnected(): AsyncResult<PlatformConnection[], AppError>;
  connect(connection: Omit<PlatformConnection, "id" | "createdAt" | "updatedAt">): AsyncResult<PlatformConnection, AppError>;
  disconnect(platform: PlatformType): AsyncResult<void, AppError>;
  updateTokens(platform: PlatformType, accessToken: string, refreshToken?: string, expiresAt?: string): AsyncResult<PlatformConnection, AppError>;
  getTotalFollowers(): AsyncResult<number, AppError>;
}

function generateId(): string {
  return `platform_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const platformRepository: PlatformRepository = {
  ...baseRepository,

  async getByPlatform(platform: PlatformType): AsyncResult<PlatformConnection | null, AppError> {
    const result = await baseRepository.getFiltered((item) => item.platform === platform);
    if (!isOk(result)) return result as any;
    return ok(result.data[0] ?? null);
  },

  async getConnected(): AsyncResult<PlatformConnection[], AppError> {
    return baseRepository.getFiltered((item) => item.connected);
  },

  async getDisconnected(): AsyncResult<PlatformConnection[], AppError> {
    return baseRepository.getFiltered((item) => !item.connected);
  },

  async connect(connection: Omit<PlatformConnection, "id" | "createdAt" | "updatedAt">): AsyncResult<PlatformConnection, AppError> {
    const existingResult = await this.getByPlatform(connection.platform);
    if (!isOk(existingResult)) return existingResult as any;

    const now = new Date().toISOString();

    if (existingResult.data) {
      return baseRepository.update(existingResult.data.id, {
        ...connection,
        connected: true,
        connectedAt: now,
      });
    }

    const newConnection: PlatformConnection = {
      ...connection,
      id: generateId(),
      connected: true,
      connectedAt: now,
      createdAt: now,
      updatedAt: now,
    };

    return baseRepository.save(newConnection);
  },

  async disconnect(platform: PlatformType): AsyncResult<void, AppError> {
    const existingResult = await this.getByPlatform(platform);
    if (!isOk(existingResult)) return existingResult as any;

    if (!existingResult.data) {
      return ok(undefined);
    }

    await baseRepository.update(existingResult.data.id, {
      connected: false,
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiresAt: undefined,
    });

    return ok(undefined);
  },

  async updateTokens(
    platform: PlatformType,
    accessToken: string,
    refreshToken?: string,
    expiresAt?: string
  ): AsyncResult<PlatformConnection, AppError> {
    const existingResult = await this.getByPlatform(platform);
    if (!isOk(existingResult)) return existingResult as any;

    if (!existingResult.data) {
      return err(AppError.notFound(`Platform: ${platform}`));
    }

    return baseRepository.update(existingResult.data.id, {
      accessToken,
      refreshToken,
      tokenExpiresAt: expiresAt,
    });
  },

  async getTotalFollowers(): AsyncResult<number, AppError> {
    const connectedResult = await this.getConnected();
    if (!isOk(connectedResult)) return connectedResult as any;

    const total = connectedResult.data.reduce((sum, p) => sum + p.followerCount, 0);
    return ok(total);
  },
};
