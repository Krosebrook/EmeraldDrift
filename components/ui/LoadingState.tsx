import React from "react";
import { View, ActivityIndicator, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface LoadingStateProps {
  message?: string;
  size?: "small" | "large";
  fullScreen?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function LoadingState({
  message,
  size = "large",
  fullScreen = false,
  style,
}: LoadingStateProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullScreen && styles.fullScreen,
        fullScreen && { backgroundColor: theme.backgroundRoot },
        style,
      ]}
    >
      <ActivityIndicator size={size} color={theme.primary} />
      {message ? (
        <ThemedText type="body" secondary style={styles.message}>
          {message}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    marginTop: Spacing.md,
    textAlign: "center",
  },
});
