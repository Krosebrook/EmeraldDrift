import { createFeatureRepository, Repository } from "@/features/shared/repository";
import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import type { ContentItem, ContentStatus, PlatformType } from "@/features/shared/types";

const STORAGE_KEY = "@creator_studio_content";

const baseRepository = createFeatureRepository<ContentItem>({
  storageKey: STORAGE_KEY,
});

export interface ContentFilters {
  status?: ContentStatus;
  platform?: PlatformType;
  search?: string;
  fromDate?: string;
  toDate?: string;
}

export interface ContentRepository extends Repository<ContentItem> {
  getByStatus(status: ContentStatus): AsyncResult<ContentItem[], AppError>;
  getByPlatform(platform: PlatformType): AsyncResult<ContentItem[], AppError>;
  getScheduled(): AsyncResult<ContentItem[], AppError>;
  getDrafts(): AsyncResult<ContentItem[], AppError>;
  getPublished(): AsyncResult<ContentItem[], AppError>;
  getFailed(): AsyncResult<ContentItem[], AppError>;
  search(query: string): AsyncResult<ContentItem[], AppError>;
  getWithFilters(filters: ContentFilters): AsyncResult<ContentItem[], AppError>;
  publish(id: string): AsyncResult<ContentItem, AppError>;
  schedule(id: string, scheduledAt: string): AsyncResult<ContentItem, AppError>;
  markFailed(id: string, reason: string): AsyncResult<ContentItem, AppError>;
}

export const contentRepository: ContentRepository = {
  ...baseRepository,

  async getByStatus(status: ContentStatus): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.status === status);
  },

  async getByPlatform(platform: PlatformType): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.platforms.includes(platform));
  },

  async getScheduled(): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.status === "scheduled");
  },

  async getDrafts(): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.status === "draft");
  },

  async getPublished(): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.status === "published");
  },

  async getFailed(): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => item.status === "failed");
  },

  async search(query: string): AsyncResult<ContentItem[], AppError> {
    const lowerQuery = query.toLowerCase();
    return baseRepository.getFiltered(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.caption.toLowerCase().includes(lowerQuery)
    );
  },

  async getWithFilters(filters: ContentFilters): AsyncResult<ContentItem[], AppError> {
    return baseRepository.getFiltered((item) => {
      if (filters.status && item.status !== filters.status) return false;
      if (filters.platform && !item.platforms.includes(filters.platform)) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        if (
          !item.title.toLowerCase().includes(query) &&
          !item.caption.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      if (filters.fromDate && item.createdAt < filters.fromDate) return false;
      if (filters.toDate && item.createdAt > filters.toDate) return false;
      return true;
    });
  },

  async publish(id: string): AsyncResult<ContentItem, AppError> {
    return baseRepository.update(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
  },

  async schedule(id: string, scheduledAt: string): AsyncResult<ContentItem, AppError> {
    return baseRepository.update(id, {
      status: "scheduled",
      scheduledAt,
    });
  },

  async markFailed(id: string, reason: string): AsyncResult<ContentItem, AppError> {
    return baseRepository.update(id, {
      status: "failed",
      failedReason: reason,
    });
  },
};
