import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Pressable, ActivityIndicator } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useOfflineContext } from "@/context/OfflineContext";
import { Spacing, BorderRadius } from "@/constants/theme";

interface OfflineIndicatorProps {
  showPendingCount?: boolean;
  showSyncButton?: boolean;
  position?: "top" | "bottom";
}

export function OfflineIndicator({
  showPendingCount = true,
  showSyncButton = true,
  position = "top",
}: OfflineIndicatorProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { isOffline, isSyncing, pendingCount, triggerSync, isOnline } =
    useOfflineContext();
  const translateY = useSharedValue(position === "top" ? -100 : 100);
  const pulseOpacity = useSharedValue(1);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (isOffline || pendingCount > 0) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      translateY.value = withTiming(position === "top" ? -100 : 100, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      });
    }
  }, [isOffline, pendingCount, translateY, position]);

  useEffect(() => {
    if (isOffline) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 }),
        ),
        -1,
      );
      wasOfflineRef.current = true;
    } else {
      pulseOpacity.value = withTiming(1, { duration: 300 });
    }
  }, [isOffline, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  if (!isOffline && pendingCount === 0) {
    return null;
  }

  const handleSync = () => {
    if (isOnline && !isSyncing) {
      triggerSync();
    }
  };

  const getStatusText = (): string => {
    if (isSyncing) {
      return "Syncing...";
    }
    if (isOffline) {
      return pendingCount > 0
        ? `Offline - ${pendingCount} pending`
        : "You're offline";
    }
    if (pendingCount > 0) {
      return `${pendingCount} changes to sync`;
    }
    return "";
  };

  const getStatusIcon = (): keyof typeof Feather.glyphMap => {
    if (isSyncing) return "refresh-cw";
    if (isOffline) return "wifi-off";
    return "cloud";
  };

  const getBackgroundColor = (): string => {
    if (isOffline) return theme.warning;
    if (pendingCount > 0) return theme.primary;
    return theme.backgroundSecondary;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        position === "top"
          ? { top: insets.top + Spacing.sm }
          : { bottom: insets.bottom + Spacing.sm },
        animatedStyle,
      ]}
    >
      <Animated.View
        style={[
          styles.banner,
          { backgroundColor: getBackgroundColor() },
          pulseStyle,
        ]}
      >
        <View style={styles.content}>
          <Feather
            name={getStatusIcon()}
            size={16}
            color="#FFFFFF"
            style={isSyncing ? styles.spinningIcon : undefined}
          />
          <ThemedText style={styles.text}>{getStatusText()}</ThemedText>
        </View>

        {showSyncButton && isOnline && pendingCount > 0 && !isSyncing && (
          <Pressable
            onPress={handleSync}
            style={({ pressed }) => [
              styles.syncButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText style={styles.syncButtonText}>Sync Now</ThemedText>
          </Pressable>
        )}

        {isSyncing && (
          <ActivityIndicator
            size="small"
            color="#FFFFFF"
            style={styles.spinner}
          />
        )}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 1000,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  syncButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  spinner: {
    marginLeft: Spacing.sm,
  },
  spinningIcon: {
    transform: [{ rotate: "45deg" }],
  },
});
