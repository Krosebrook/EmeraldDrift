import { useCallback } from "react";
import { isOk, type Result } from "@/core/result";
import { AppError } from "@/core/errors";
import { contentService } from "@/features/content/service";
import { syncQueue } from "@/features/offline/syncQueue";
import { offlineStorage } from "@/features/offline/storage";
import { useOfflineContext } from "@/context/OfflineContext";
import type { ContentItem } from "@/features/shared/types";
import type { CreateContentInput, UpdateContentInput } from "@/features/content";

interface UseOfflineContentResult {
  getAll: () => Promise<Result<ContentItem[], AppError>>;
  getById: (id: string) => Promise<Result<ContentItem | null, AppError>>;
  create: (input: CreateContentInput) => Promise<Result<ContentItem, AppError>>;
  update: (id: string, updates: UpdateContentInput) => Promise<Result<ContentItem, AppError>>;
  delete: (id: string) => Promise<Result<void, AppError>>;
  publish: (id: string) => Promise<Result<ContentItem, AppError>>;
  schedule: (id: string, scheduledAt: string) => Promise<Result<ContentItem, AppError>>;
  isOffline: boolean;
  pendingCount: number;
}

export function useOfflineContent(): UseOfflineContentResult {
  const { isOffline, isOnline, pendingCount } = useOfflineContext();

  const getAll = useCallback(async (): Promise<Result<ContentItem[], AppError>> => {
    if (isOnline) {
      const result = await contentService.getAll();
      if (isOk(result)) {
        await offlineStorage.saveOfflineContent(result.data);
      }
      return result;
    }
    return offlineStorage.getOfflineContent<ContentItem>();
  }, [isOnline]);

  const getById = useCallback(async (id: string): Promise<Result<ContentItem | null, AppError>> => {
    if (isOnline) {
      return contentService.getById(id);
    }
    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (isOk(allResult)) {
      const item = allResult.data.find((c) => c.id === id) || null;
      return { success: true, data: item };
    }
    return allResult as Result<ContentItem | null, AppError>;
  }, [isOnline]);

  const create = useCallback(async (input: CreateContentInput): Promise<Result<ContentItem, AppError>> => {
    if (isOnline) {
      const result = await contentService.create(input);
      if (isOk(result)) {
        const allResult = await contentService.getAll();
        if (isOk(allResult)) {
          await offlineStorage.saveOfflineContent(allResult.data);
        }
      }
      return result;
    }

    const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const offlineItem: ContentItem = {
      id: tempId,
      title: input.title,
      caption: input.caption,
      mediaUri: input.mediaUri,
      platforms: input.platforms,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    await syncQueue.enqueue("content", tempId, "create", offlineItem);

    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (isOk(allResult)) {
      await offlineStorage.saveOfflineContent([...allResult.data, offlineItem]);
    }

    return { success: true, data: offlineItem };
  }, [isOnline]);

  const update = useCallback(async (id: string, updates: UpdateContentInput): Promise<Result<ContentItem, AppError>> => {
    if (isOnline) {
      const result = await contentService.update(id, updates);
      if (isOk(result)) {
        const allResult = await contentService.getAll();
        if (isOk(allResult)) {
          await offlineStorage.saveOfflineContent(allResult.data);
        }
      }
      return result;
    }

    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (!isOk(allResult)) {
      return allResult as Result<ContentItem, AppError>;
    }

    const index = allResult.data.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: AppError.notFound("Content") };
    }

    const now = new Date().toISOString();
    const updatedItem: ContentItem = {
      ...allResult.data[index],
      ...updates,
      updatedAt: now,
    };

    allResult.data[index] = updatedItem;
    await offlineStorage.saveOfflineContent(allResult.data);
    await syncQueue.enqueue("content", id, "update", updatedItem);

    return { success: true, data: updatedItem };
  }, [isOnline]);

  const deleteContent = useCallback(async (id: string): Promise<Result<void, AppError>> => {
    if (isOnline) {
      const result = await contentService.delete(id);
      if (isOk(result)) {
        const allResult = await contentService.getAll();
        if (isOk(allResult)) {
          await offlineStorage.saveOfflineContent(allResult.data);
        }
      }
      return result;
    }

    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (!isOk(allResult)) {
      return allResult as Result<void, AppError>;
    }

    const filtered = allResult.data.filter((c) => c.id !== id);
    await offlineStorage.saveOfflineContent(filtered);
    await syncQueue.enqueue("content", id, "delete", { id });

    return { success: true, data: undefined };
  }, [isOnline]);

  const publish = useCallback(async (id: string): Promise<Result<ContentItem, AppError>> => {
    if (isOnline) {
      const result = await contentService.publish(id);
      if (isOk(result)) {
        const allResult = await contentService.getAll();
        if (isOk(allResult)) {
          await offlineStorage.saveOfflineContent(allResult.data);
        }
      }
      return result;
    }

    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (!isOk(allResult)) {
      return allResult as Result<ContentItem, AppError>;
    }

    const index = allResult.data.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: AppError.notFound("Content") };
    }

    const now = new Date().toISOString();
    const updatedItem: ContentItem = {
      ...allResult.data[index],
      status: "published",
      publishedAt: now,
      updatedAt: now,
    };

    allResult.data[index] = updatedItem;
    await offlineStorage.saveOfflineContent(allResult.data);
    await syncQueue.enqueue("content", id, "publish", { id });

    return { success: true, data: updatedItem };
  }, [isOnline]);

  const schedule = useCallback(async (id: string, scheduledAt: string): Promise<Result<ContentItem, AppError>> => {
    if (isOnline) {
      const result = await contentService.schedule(id, scheduledAt);
      if (isOk(result)) {
        const allResult = await contentService.getAll();
        if (isOk(allResult)) {
          await offlineStorage.saveOfflineContent(allResult.data);
        }
      }
      return result;
    }

    const allResult = await offlineStorage.getOfflineContent<ContentItem>();
    if (!isOk(allResult)) {
      return allResult as Result<ContentItem, AppError>;
    }

    const index = allResult.data.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: AppError.notFound("Content") };
    }

    const now = new Date().toISOString();
    const updatedItem: ContentItem = {
      ...allResult.data[index],
      status: "scheduled",
      scheduledAt,
      updatedAt: now,
    };

    allResult.data[index] = updatedItem;
    await offlineStorage.saveOfflineContent(allResult.data);
    await syncQueue.enqueue("content", id, "schedule", { id, scheduledAt });

    return { success: true, data: updatedItem };
  }, [isOnline]);

  return {
    getAll,
    getById,
    create,
    update,
    delete: deleteContent,
    publish,
    schedule,
    isOffline,
    pendingCount,
  };
}
