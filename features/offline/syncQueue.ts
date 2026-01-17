import { ok, err, isOk, type Result } from "@/core/result";
import { AppError, ErrorCode, logError } from "@/core/errors";
import { offlineStorage } from "./storage";
import type { SyncOperation, SyncOperationType } from "./types";

function generateId(): string {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

class SyncQueueManager {
  async enqueue(
    entityType: SyncOperation["entityType"],
    entityId: string,
    operationType: SyncOperationType,
    payload: unknown
  ): Promise<Result<SyncOperation, AppError>> {
    try {
      const operation: SyncOperation = {
        id: generateId(),
        entityType,
        entityId,
        operationType,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
        status: "pending",
      };

      const result = await offlineStorage.addToSyncQueue(operation);
      if (!isOk(result)) {
        return err(result.error);
      }

      return ok(operation);
    } catch (error) {
      logError(error, { context: "SyncQueueManager.enqueue" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to enqueue operation",
      }));
    }
  }

  async dequeue(operationId: string): Promise<Result<void, AppError>> {
    return offlineStorage.removeFromSyncQueue(operationId);
  }

  async getPendingOperations(): Promise<Result<SyncOperation[], AppError>> {
    const result = await offlineStorage.getSyncQueue();
    if (!isOk(result)) {
      return err(result.error);
    }

    const pending = result.data.filter((op: SyncOperation) => op.status === "pending" || op.status === "failed");
    return ok(pending);
  }

  async getAllOperations(): Promise<Result<SyncOperation[], AppError>> {
    return offlineStorage.getSyncQueue();
  }

  async markAsSyncing(operationId: string): Promise<Result<void, AppError>> {
    return offlineStorage.updateSyncOperation(operationId, {
      status: "syncing",
      lastAttemptAt: new Date().toISOString(),
    });
  }

  async markAsCompleted(operationId: string): Promise<Result<void, AppError>> {
    return offlineStorage.removeFromSyncQueue(operationId);
  }

  async markAsFailed(operationId: string, errorMessage: string): Promise<Result<void, AppError>> {
    const queueResult = await offlineStorage.getSyncQueue();
    if (!isOk(queueResult)) {
      return err(queueResult.error);
    }

    const operation = queueResult.data.find((op: SyncOperation) => op.id === operationId);
    if (!operation) {
      return ok(undefined);
    }

    return offlineStorage.updateSyncOperation(operationId, {
      status: "failed",
      attempts: operation.attempts + 1,
      lastAttemptAt: new Date().toISOString(),
      errorMessage,
    });
  }

  async retryFailed(): Promise<Result<number, AppError>> {
    const queueResult = await offlineStorage.getSyncQueue();
    if (!isOk(queueResult)) {
      return err(queueResult.error);
    }

    const failedOps = queueResult.data.filter(
      (op: SyncOperation) => op.status === "failed" && op.attempts < 3
    );

    for (const op of failedOps) {
      await offlineStorage.updateSyncOperation(op.id, { status: "pending" });
    }

    return ok(failedOps.length);
  }

  async clearCompleted(): Promise<Result<void, AppError>> {
    const queueResult = await offlineStorage.getSyncQueue();
    if (!isOk(queueResult)) {
      return err(queueResult.error);
    }

    const activeOps = queueResult.data.filter((op: SyncOperation) => op.status !== "completed");
    
    try {
      await offlineStorage.clearSyncQueue();
      for (const op of activeOps) {
        await offlineStorage.addToSyncQueue(op);
      }
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "SyncQueueManager.clearCompleted" });
      return err(new AppError({
        code: ErrorCode.PERSISTENCE_ERROR,
        message: "Failed to clear completed operations",
      }));
    }
  }

  async getQueueStats(): Promise<Result<{
    pending: number;
    syncing: number;
    failed: number;
    total: number;
  }, AppError>> {
    const result = await offlineStorage.getSyncQueue();
    if (!isOk(result)) {
      return err(result.error);
    }

    const stats = result.data.reduce(
      (acc, op: SyncOperation) => {
        acc.total++;
        if (op.status === "pending") acc.pending++;
        else if (op.status === "syncing") acc.syncing++;
        else if (op.status === "failed") acc.failed++;
        return acc;
      },
      { pending: 0, syncing: 0, failed: 0, total: 0 }
    );

    return ok(stats);
  }
}

export const syncQueue = new SyncQueueManager();
