import { useState, useEffect, useCallback } from "react";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import type { NetworkStatus } from "@/features/offline/types";

interface UseNetworkStatusResult {
  status: NetworkStatus;
  isOnline: boolean;
  isOffline: boolean;
  checkConnection: () => Promise<boolean>;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [status, setStatus] = useState<NetworkStatus>("unknown");

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected === null) {
        setStatus("unknown");
      } else {
        setStatus(state.isConnected ? "online" : "offline");
      }
    });

    NetInfo.fetch().then((state: NetInfoState) => {
      if (state.isConnected === null) {
        setStatus("unknown");
      } else {
        setStatus(state.isConnected ? "online" : "offline");
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    const state = await NetInfo.fetch();
    const isConnected = state.isConnected ?? false;
    setStatus(isConnected ? "online" : "offline");
    return isConnected;
  }, []);

  return {
    status,
    isOnline: status === "online",
    isOffline: status === "offline",
    checkConnection,
  };
}
