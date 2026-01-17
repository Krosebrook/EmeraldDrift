import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { isOk } from "@/core/result";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { syncService } from "@/features/offline/syncService";
import { syncQueue } from "@/features/offline/syncQueue";
import { offlineStorage } from "@/features/offline/storage";
import type { NetworkStatus, SyncResult } from "@/features/offline/types";

interface OfflineContextValue {
  networkStatus: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncAt: string | null;
  syncError: string | null;
  triggerSync: () => Promise<SyncResult | null>;
  retryFailed: () => Promise<number>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const { status, isOnline, isOffline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const wasOfflineRef = useRef(false);

  const refreshPendingCount = useCallback(async () => {
    const statsResult = await syncQueue.getQueueStats();
    if (isOk(statsResult)) {
      setPendingCount(statsResult.data.pending + statsResult.data.failed);
    }
  }, []);

  const refreshLastSync = useCallback(async () => {
    const result = await offlineStorage.getLastSyncTime();
    if (isOk(result)) {
      setLastSyncAt(result.data);
    }
  }, []);

  const triggerSync = useCallback(async (): Promise<SyncResult | null> => {
    if (!isOnline || isSyncing) {
      return null;
    }

    setIsSyncing(true);
    setSyncError(null);

    const result = await syncService.sync();

    setIsSyncing(false);

    if (isOk(result)) {
      await refreshPendingCount();
      await refreshLastSync();
      return result.data;
    } else {
      setSyncError(result.error.message);
      return null;
    }
  }, [isOnline, isSyncing, refreshPendingCount, refreshLastSync]);

  const retryFailed = useCallback(async (): Promise<number> => {
    const result = await syncQueue.retryFailed();
    if (isOk(result)) {
      await refreshPendingCount();
      if (isOnline) {
        triggerSync();
      }
      return result.data;
    }
    return 0;
  }, [isOnline, triggerSync, refreshPendingCount]);

  useEffect(() => {
    if (isOffline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current && isOnline) {
      wasOfflineRef.current = false;
      triggerSync();
    }
  }, [isOnline, isOffline, triggerSync]);

  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === "active" && isOnline) {
        refreshPendingCount();
        if (pendingCount > 0) {
          triggerSync();
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isOnline, pendingCount, triggerSync, refreshPendingCount]);

  useEffect(() => {
    refreshPendingCount();
    refreshLastSync();
  }, [refreshPendingCount, refreshLastSync]);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((event, data) => {
      if (event === "syncStart") {
        setIsSyncing(true);
      } else if (event === "syncComplete") {
        setIsSyncing(false);
        refreshPendingCount();
        refreshLastSync();
      } else if (event === "syncError") {
        setIsSyncing(false);
        if (data instanceof Error) {
          setSyncError(data.message);
        }
      } else if (event === "operationComplete" || event === "operationFailed") {
        refreshPendingCount();
      }
    });

    return unsubscribe;
  }, [refreshPendingCount, refreshLastSync]);

  const value: OfflineContextValue = {
    networkStatus: status,
    isOnline,
    isOffline,
    isSyncing,
    pendingCount,
    lastSyncAt,
    syncError,
    triggerSync,
    retryFailed,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOfflineContext(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOfflineContext must be used within an OfflineProvider");
  }
  return context;
}
