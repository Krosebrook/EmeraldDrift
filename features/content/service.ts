import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { contentRepository, ContentFilters } from "./repository";
import type { ContentItem, ContentStatus, PlatformType } from "@/features/shared/types";

function generateId(): string {
  return `content_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export interface CreateContentInput {
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: PlatformType[];
}

export interface UpdateContentInput {
  title?: string;
  caption?: string;
  mediaUri?: string;
  platforms?: PlatformType[];
}

export interface ContentStats {
  total: number;
  drafts: number;
  scheduled: number;
  published: number;
  failed: number;
}

export interface ContentService {
  create(input: CreateContentInput): AsyncResult<ContentItem, AppError>;
  update(id: string, input: UpdateContentInput): AsyncResult<ContentItem, AppError>;
  delete(id: string): AsyncResult<void, AppError>;
  getById(id: string): AsyncResult<ContentItem | null, AppError>;
  getAll(): AsyncResult<ContentItem[], AppError>;
  getFiltered(filters: ContentFilters): AsyncResult<ContentItem[], AppError>;
  search(query: string): AsyncResult<ContentItem[], AppError>;
  publish(id: string): AsyncResult<ContentItem, AppError>;
  schedule(id: string, scheduledAt: string): AsyncResult<ContentItem, AppError>;
  saveDraft(id: string, updates: UpdateContentInput): AsyncResult<ContentItem, AppError>;
  duplicate(id: string): AsyncResult<ContentItem, AppError>;
  getStats(): AsyncResult<ContentStats, AppError>;
}

export const contentService: ContentService = {
  async create(input: CreateContentInput): AsyncResult<ContentItem, AppError> {
    if (!input.title.trim()) {
      return err(AppError.validation("Title is required"));
    }
    if (input.platforms.length === 0) {
      return err(AppError.validation("At least one platform is required"));
    }

    const now = new Date().toISOString();
    const content: ContentItem = {
      id: generateId(),
      title: input.title.trim(),
      caption: input.caption.trim(),
      mediaUri: input.mediaUri,
      platforms: input.platforms,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    return contentRepository.save(content);
  },

  async update(id: string, input: UpdateContentInput): AsyncResult<ContentItem, AppError> {
    const updates: Partial<ContentItem> = {};

    if (input.title !== undefined) {
      if (!input.title.trim()) {
        return err(AppError.validation("Title cannot be empty"));
      }
      updates.title = input.title.trim();
    }
    if (input.caption !== undefined) {
      updates.caption = input.caption.trim();
    }
    if (input.mediaUri !== undefined) {
      updates.mediaUri = input.mediaUri;
    }
    if (input.platforms !== undefined) {
      if (input.platforms.length === 0) {
        return err(AppError.validation("At least one platform is required"));
      }
      updates.platforms = input.platforms;
    }

    return contentRepository.update(id, updates);
  },

  async delete(id: string): AsyncResult<void, AppError> {
    return contentRepository.delete(id);
  },

  async getById(id: string): AsyncResult<ContentItem | null, AppError> {
    return contentRepository.getById(id);
  },

  async getAll(): AsyncResult<ContentItem[], AppError> {
    return contentRepository.getAll();
  },

  async getFiltered(filters: ContentFilters): AsyncResult<ContentItem[], AppError> {
    return contentRepository.getWithFilters(filters);
  },

  async search(query: string): AsyncResult<ContentItem[], AppError> {
    return contentRepository.search(query);
  },

  async publish(id: string): AsyncResult<ContentItem, AppError> {
    return contentRepository.publish(id);
  },

  async schedule(id: string, scheduledAt: string): AsyncResult<ContentItem, AppError> {
    const scheduleDate = new Date(scheduledAt);
    if (scheduleDate <= new Date()) {
      return err(AppError.validation("Schedule time must be in the future"));
    }
    return contentRepository.schedule(id, scheduledAt);
  },

  async saveDraft(id: string, updates: UpdateContentInput): AsyncResult<ContentItem, AppError> {
    const existingResult = await contentRepository.getById(id);
    if (!isOk(existingResult)) return existingResult as any;

    if (existingResult.data) {
      return this.update(id, updates);
    }

    return this.create({
      title: updates.title ?? "",
      caption: updates.caption ?? "",
      mediaUri: updates.mediaUri,
      platforms: updates.platforms ?? [],
    });
  },

  async duplicate(id: string): AsyncResult<ContentItem, AppError> {
    const existingResult = await contentRepository.getById(id);
    if (!isOk(existingResult)) return existingResult as any;

    if (!existingResult.data) {
      return err(AppError.notFound(`Content: ${id}`));
    }

    const original = existingResult.data;
    return this.create({
      title: `${original.title} (Copy)`,
      caption: original.caption,
      mediaUri: original.mediaUri,
      platforms: original.platforms,
    });
  },

  async getStats(): AsyncResult<ContentStats, AppError> {
    const allResult = await contentRepository.getAll();
    if (!isOk(allResult)) return allResult as any;

    const items = allResult.data;
    return ok({
      total: items.length,
      drafts: items.filter((i) => i.status === "draft").length,
      scheduled: items.filter((i) => i.status === "scheduled").length,
      published: items.filter((i) => i.status === "published").length,
      failed: items.filter((i) => i.status === "failed").length,
    });
  },
};
