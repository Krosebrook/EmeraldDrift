import React, { ReactNode } from "react";
import { View, StyleSheet, ViewStyle, StyleProp, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface GlassSurfaceProps {
  children: ReactNode;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
  padding?: keyof typeof Spacing;
  radius?: keyof typeof BorderRadius;
  bordered?: boolean;
}

export function GlassSurface({
  children,
  intensity = 80,
  style,
  padding = "base",
  radius = "lg",
  bordered = true,
}: GlassSurfaceProps) {
  const { theme, isDark } = useTheme();

  const containerStyle: ViewStyle = {
    padding: Spacing[padding],
    borderRadius: BorderRadius[radius],
    overflow: "hidden",
    borderWidth: bordered ? 1 : 0,
    borderColor: bordered ? theme.border : undefined,
  };

  if (Platform.OS === "ios") {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <BlurView
          intensity={intensity}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        containerStyle,
        { backgroundColor: theme.cardBackground },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});
