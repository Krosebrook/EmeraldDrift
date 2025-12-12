import { useState, useCallback } from "react";

export interface UseRefreshReturn {
  refreshing: boolean;
  onRefresh: (fn: () => Promise<void>) => Promise<void>;
}

export function useRefresh(): UseRefreshReturn {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async (fn: () => Promise<void>) => {
    setRefreshing(true);
    try {
      await fn();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, onRefresh };
}
