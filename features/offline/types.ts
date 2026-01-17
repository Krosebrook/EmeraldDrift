export type NetworkStatus = "online" | "offline" | "unknown";

export type SyncOperationType = "create" | "update" | "delete" | "publish" | "schedule";

export type SyncStatus = "pending" | "syncing" | "completed" | "failed";

export interface SyncOperation {
  id: string;
  entityType: "content" | "platform" | "settings";
  entityId: string;
  operationType: SyncOperationType;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  status: SyncStatus;
  errorMessage?: string;
}

export interface OfflineState {
  networkStatus: NetworkStatus;
  pendingOperations: SyncOperation[];
  isSyncing: boolean;
  lastSyncAt?: string;
  syncError?: string;
}

export interface ConflictResolution {
  strategy: "local" | "remote" | "merge";
  entityId: string;
  localVersion: unknown;
  remoteVersion: unknown;
  resolvedVersion?: unknown;
}

export interface SyncResult {
  successful: number;
  failed: number;
  conflicts: ConflictResolution[];
}
