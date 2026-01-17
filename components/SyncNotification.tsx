import React, { useEffect, useState, useCallback } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { syncService } from "@/features/offline";
import type { SyncResult } from "@/features/offline";

interface NotificationState {
  visible: boolean;
  type: "success" | "error" | "info";
  message: string;
  details?: string;
}

export function SyncNotification() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: "info",
    message: "",
  });

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-20);

  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, visible: false }));
  }, []);

  const showNotification = useCallback((type: NotificationState["type"], message: string, details?: string) => {
    setNotification({ visible: true, type, message, details });
    opacity.value = withTiming(1, { duration: 200 });
    translateY.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });

    opacity.value = withDelay(
      4000,
      withTiming(0, { duration: 200 }, (finished) => {
        if (finished) {
          runOnJS(hideNotification)();
        }
      })
    );
    translateY.value = withDelay(4000, withTiming(-20, { duration: 200 }));
  }, [opacity, translateY, hideNotification]);

  useEffect(() => {
    const unsubscribe = syncService.subscribe((event, data) => {
      if (event === "syncComplete") {
        const result = data as SyncResult;
        if (result.successful > 0 || result.conflicts.length > 0) {
          const conflictNote = result.conflicts.length > 0
            ? ` (${result.conflicts.length} conflict${result.conflicts.length > 1 ? "s" : ""} resolved)`
            : "";
          showNotification(
            "success",
            `Synced ${result.successful} change${result.successful !== 1 ? "s" : ""}${conflictNote}`,
            result.failed > 0 ? `${result.failed} failed` : undefined
          );
        }
      } else if (event === "syncError") {
        const error = data as Error;
        showNotification("error", "Sync failed", error.message);
      }
    });

    return unsubscribe;
  }, [showNotification]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!notification.visible) {
    return null;
  }

  const getIcon = (): keyof typeof Feather.glyphMap => {
    switch (notification.type) {
      case "success":
        return "check-circle";
      case "error":
        return "alert-circle";
      default:
        return "info";
    }
  };

  const getBackgroundColor = (): string => {
    switch (notification.type) {
      case "success":
        return theme.success;
      case "error":
        return theme.error;
      default:
        return theme.primary;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + Spacing.xl + 60 },
        animatedStyle,
      ]}
    >
      <Pressable
        style={[styles.notification, { backgroundColor: getBackgroundColor() }]}
        onPress={hideNotification}
      >
        <Feather name={getIcon()} size={20} color="#FFFFFF" />
        <View style={styles.textContainer}>
          <ThemedText style={styles.message}>{notification.message}</ThemedText>
          {notification.details ? (
            <ThemedText style={styles.details}>{notification.details}</ThemedText>
          ) : null}
        </View>
        <Feather name="x" size={16} color="rgba(255,255,255,0.7)" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: Spacing.base,
    right: Spacing.base,
    zIndex: 1001,
  },
  notification: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  details: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 2,
  },
});
