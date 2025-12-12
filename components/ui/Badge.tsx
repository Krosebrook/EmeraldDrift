import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface BadgeProps {
  label: string;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

export function Badge({
  label,
  variant = "default",
  size = "md",
  style,
}: BadgeProps) {
  const { theme } = useTheme();

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: theme.primaryLight, text: theme.primary };
      case "success":
        return { bg: `${theme.success}20`, text: theme.success };
      case "warning":
        return { bg: `${theme.warning}20`, text: theme.warning };
      case "error":
        return { bg: `${theme.error}20`, text: theme.error };
      default:
        return { bg: theme.backgroundSecondary, text: theme.textSecondary };
    }
  };

  const colors = getColors();
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 2 : 4,
        },
        style,
      ]}
    >
      <ThemedText
        type={isSmall ? "caption" : "subhead"}
        style={{ color: colors.text, fontWeight: "500" }}
      >
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
});
