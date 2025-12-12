import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: keyof typeof BorderRadius;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = "100%",
  height = 20,
  radius = "md",
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, [animation]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(animation.value, [0, 1], [0.3, 0.7]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as ViewStyle["width"],
          height,
          borderRadius: BorderRadius[radius],
          backgroundColor: theme.backgroundSecondary,
        },
        style,
        animatedStyle,
      ]}
    />
  );
}

export interface SkeletonCardProps {
  lines?: number;
  showAvatar?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function SkeletonCard({
  lines = 3,
  showAvatar = false,
  style,
}: SkeletonCardProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground },
        style,
      ]}
    >
      {showAvatar ? (
        <View style={styles.cardHeader}>
          <Skeleton width={40} height={40} radius="full" />
          <View style={styles.cardHeaderText}>
            <Skeleton width="60%" height={16} />
            <View style={{ height: Spacing.xs }} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ) : null}

      <View style={styles.cardContent}>
        {Array.from({ length: lines }).map((_, i) => (
          <View key={i} style={{ marginBottom: i < lines - 1 ? Spacing.sm : 0 }}>
            <Skeleton
              width={i === lines - 1 ? "60%" : "100%"}
              height={14}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  card: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardContent: {},
});
