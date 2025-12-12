import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius } from "@/constants/theme";

export interface ProgressBarProps {
  progress: number;
  height?: number;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  height = 4,
  color,
  backgroundColor,
  animated = true,
  style,
}: ProgressBarProps) {
  const { theme } = useTheme();

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const fillColor = color || theme.primary;
  const bgColor = backgroundColor || theme.backgroundSecondary;

  const animatedStyle = useAnimatedStyle(() => ({
    width: animated
      ? withSpring(`${clampedProgress}%`, { damping: 15, stiffness: 100 })
      : `${clampedProgress}%`,
  }));

  return (
    <View
      style={[
        styles.container,
        { height, backgroundColor: bgColor, borderRadius: height / 2 },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: fillColor, borderRadius: height / 2 },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
  },
});
