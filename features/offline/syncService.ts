import { ok, err, isOk, type Result } from "@/core/result";
import { AppError, ErrorCode, logError } from "@/core/errors";
import { contentService } from "@/features/content/service";
import { syncQueue } from "./syncQueue";
import { offlineStorage } from "./storage";
import type { SyncOperation, SyncResult, ConflictResolution } from "./types";
import type { ContentItem } from "@/features/shared/types";

type SyncEventType = "syncStart" | "syncComplete" | "syncError" | "operationComplete" | "operationFailed";

type SyncEventListener = (event: SyncEventType, data?: unknown) => void;

class SyncService {
  private isSyncing = false;
  private listeners: Set<SyncEventListener> = new Set();

  subscribe(listener: SyncEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: SyncEventType, data?: unknown): void {
    this.listeners.forEach((listener) => listener(event, data));
  }

  async sync(): Promise<Result<SyncResult, AppError>> {
    if (this.isSyncing) {
      return err(new AppError({
        code: ErrorCode.CONFLICT,
        message: "Sync already in progress",
      }));
    }

    this.isSyncing = true;
    this.emit("syncStart");

    const result: SyncResult = {
      successful: 0,
      failed: 0,
      conflicts: [],
    };

    try {
      const pendingResult = await syncQueue.getPendingOperations();
      if (!isOk(pendingResult)) {
        this.isSyncing = false;
        this.emit("syncError", pendingResult.error);
        return err(pendingResult.error);
      }

      const operations = pendingResult.data;

      for (const operation of operations) {
        await syncQueue.markAsSyncing(operation.id);

        const opResult = await this.executeOperation(operation);

        if (isOk(opResult)) {
          if (opResult.data.conflict) {
            result.conflicts.push(opResult.data.conflict);
          }
          await syncQueue.markAsCompleted(operation.id);
          result.successful++;
          this.emit("operationComplete", operation);
        } else {
          await syncQueue.markAsFailed(operation.id, opResult.error.message);
          result.failed++;
          this.emit("operationFailed", { operation, error: opResult.error });
        }
      }

      await offlineStorage.setLastSyncTime(new Date().toISOString());
      this.isSyncing = false;
      this.emit("syncComplete", result);
      return ok(result);
    } catch (error) {
      this.isSyncing = false;
      logError(error, { context: "SyncService.sync" });
      const appError = new AppError({
        code: ErrorCode.UNKNOWN_ERROR,
        message: "Sync failed unexpectedly",
      });
      this.emit("syncError", appError);
      return err(appError);
    }
  }

  private async executeOperation(
    operation: SyncOperation
  ): Promise<Result<{ conflict?: ConflictResolution }, AppError>> {
    switch (operation.entityType) {
      case "content":
        return this.syncContentOperation(operation);
      case "platform":
        return ok({});
      case "settings":
        return ok({});
      default:
        return err(new AppError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: `Unknown entity type: ${operation.entityType}`,
        }));
    }
  }

  private async syncContentOperation(
    operation: SyncOperation
  ): Promise<Result<{ conflict?: ConflictResolution }, AppError>> {
    const payload = operation.payload as Partial<ContentItem>;

    switch (operation.operationType) {
      case "create": {
        const result = await contentService.create(payload as Omit<ContentItem, "id" | "createdAt" | "updatedAt">);
        if (!isOk(result)) {
          return err(result.error);
        }
        return ok({});
      }

      case "update": {
        const existingResult = await contentService.getById(operation.entityId);
        if (!isOk(existingResult)) {
          return err(existingResult.error);
        }

        const existing = existingResult.data;
        if (!existing) {
          return err(AppError.notFound("Content"));
        }

        const localUpdatedAt = payload.updatedAt ? new Date(payload.updatedAt) : new Date(0);
        const remoteUpdatedAt = new Date(existing.updatedAt);

        if (remoteUpdatedAt > localUpdatedAt) {
          const conflict: ConflictResolution = {
            strategy: "remote",
            entityId: operation.entityId,
            localVersion: payload,
            remoteVersion: existing,
          };
          return ok({ conflict });
        }

        const updateResult = await contentService.update(operation.entityId, payload);
        if (!isOk(updateResult)) {
          return err(updateResult.error);
        }
        return ok({});
      }

      case "delete": {
        const deleteResult = await contentService.delete(operation.entityId);
        if (!isOk(deleteResult)) {
          return err(deleteResult.error);
        }
        return ok({});
      }

      case "publish": {
        const publishResult = await contentService.publish(operation.entityId);
        if (!isOk(publishResult)) {
          return err(publishResult.error);
        }
        return ok({});
      }

      case "schedule": {
        const schedulePayload = payload as { scheduledAt: string };
        const scheduleResult = await contentService.schedule(
          operation.entityId,
          schedulePayload.scheduledAt
        );
        if (!isOk(scheduleResult)) {
          return err(scheduleResult.error);
        }
        return ok({});
      }

      default:
        return err(new AppError({
          code: ErrorCode.UNKNOWN_ERROR,
          message: `Unknown operation type: ${operation.operationType}`,
        }));
    }
  }

  async getLastSyncTime(): Promise<Result<string | null, AppError>> {
    return offlineStorage.getLastSyncTime();
  }

  getSyncingStatus(): boolean {
    return this.isSyncing;
  }
}

export const syncService = new SyncService();
