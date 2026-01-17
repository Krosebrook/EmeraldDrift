import AsyncStorage from "@react-native-async-storage/async-storage";
import { ok, err, isOk, type Result } from "@/core/result";
import { AppError, ErrorCode, logError } from "@/core/errors";
import type { SyncOperation } from "./types";

const STORAGE_KEYS = {
  SYNC_QUEUE: "@offline:sync_queue",
  OFFLINE_CONTENT: "@offline:content",
  OFFLINE_PLATFORMS: "@offline:platforms",
  LAST_SYNC: "@offline:last_sync",
  OFFLINE_MEDIA: "@offline:media_uris",
} as const;

class OfflineStorageService {
  async getSyncQueue(): Promise<Result<SyncOperation[], AppError>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      if (!data) {
        return ok([]);
      }
      const operations = JSON.parse(data) as SyncOperation[];
      return ok(operations);
    } catch (error) {
      logError(error, { context: "OfflineStorage.getSyncQueue" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to get sync queue",
      }));
    }
  }

  async addToSyncQueue(operation: SyncOperation): Promise<Result<void, AppError>> {
    try {
      const queueResult = await this.getSyncQueue();
      const queue = isOk(queueResult) ? queueResult.data : [];
      
      const existingIndex = queue.findIndex(
        (op: SyncOperation) => op.entityId === operation.entityId && op.operationType === operation.operationType
      );
      
      if (existingIndex >= 0) {
        queue[existingIndex] = operation;
      } else {
        queue.push(operation);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.addToSyncQueue" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to add operation to sync queue",
      }));
    }
  }

  async removeFromSyncQueue(operationId: string): Promise<Result<void, AppError>> {
    try {
      const queueResult = await this.getSyncQueue();
      if (!isOk(queueResult)) {
        return err(queueResult.error);
      }
      
      const updatedQueue = queueResult.data.filter((op: SyncOperation) => op.id !== operationId);
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(updatedQueue));
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.removeFromSyncQueue" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to remove operation from sync queue",
      }));
    }
  }

  async updateSyncOperation(
    operationId: string,
    updates: Partial<SyncOperation>
  ): Promise<Result<void, AppError>> {
    try {
      const queueResult = await this.getSyncQueue();
      if (!isOk(queueResult)) {
        return err(queueResult.error);
      }
      
      const queue = queueResult.data.map((op: SyncOperation) =>
        op.id === operationId ? { ...op, ...updates } : op
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.updateSyncOperation" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to update sync operation",
      }));
    }
  }

  async clearSyncQueue(): Promise<Result<void, AppError>> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.clearSyncQueue" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to clear sync queue",
      }));
    }
  }

  async getOfflineContent<T>(): Promise<Result<T[], AppError>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CONTENT);
      if (!data) {
        return ok([]);
      }
      return ok(JSON.parse(data) as T[]);
    } catch (error) {
      logError(error, { context: "OfflineStorage.getOfflineContent" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to get offline content",
      }));
    }
  }

  async saveOfflineContent<T>(content: T[]): Promise<Result<void, AppError>> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_CONTENT, JSON.stringify(content));
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.saveOfflineContent" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to save offline content",
      }));
    }
  }

  async getLastSyncTime(): Promise<Result<string | null, AppError>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      return ok(data);
    } catch (error) {
      logError(error, { context: "OfflineStorage.getLastSyncTime" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to get last sync time",
      }));
    }
  }

  async setLastSyncTime(timestamp: string): Promise<Result<void, AppError>> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, timestamp);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.setLastSyncTime" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to set last sync time",
      }));
    }
  }

  async saveOfflineMediaUri(contentId: string, uri: string): Promise<Result<void, AppError>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MEDIA);
      const mediaMap: Record<string, string> = data ? JSON.parse(data) : {};
      mediaMap[contentId] = uri;
      await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_MEDIA, JSON.stringify(mediaMap));
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "OfflineStorage.saveOfflineMediaUri" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to save offline media URI",
      }));
    }
  }

  async getOfflineMediaUri(contentId: string): Promise<Result<string | null, AppError>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MEDIA);
      if (!data) {
        return ok(null);
      }
      const mediaMap: Record<string, string> = JSON.parse(data);
      return ok(mediaMap[contentId] || null);
    } catch (error) {
      logError(error, { context: "OfflineStorage.getOfflineMediaUri" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to get offline media URI",
      }));
    }
  }
}

export const offlineStorage = new OfflineStorageService();
