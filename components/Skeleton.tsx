import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = BorderRadius.sm,
  style,
}: SkeletonProps) {
  const { theme } = useTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + shimmerValue.value * 0.4,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.backgroundTertiary,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonText({
  lines = 1,
  lastLineWidth = "60%",
  lineHeight = 14,
  gap = Spacing.xs,
}: {
  lines?: number;
  lastLineWidth?: number | string;
  lineHeight?: number;
  gap?: number;
}) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : "100%"}
          height={lineHeight}
        />
      ))}
    </View>
  );
}

export function SkeletonCard({
  aspectRatio = 1,
  showTitle = true,
  showDescription = true,
}: {
  aspectRatio?: number;
  showTitle?: boolean;
  showDescription?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
      ]}
    >
      <Skeleton
        width="100%"
        height={0}
        style={{ aspectRatio, width: "100%" } as ViewStyle}
        borderRadius={BorderRadius.md}
      />
      {showTitle && (
        <View style={styles.cardContent}>
          <Skeleton width="70%" height={18} />
          {showDescription && (
            <Skeleton width="90%" height={12} style={{ marginTop: Spacing.xs }} />
          )}
        </View>
      )}
    </View>
  );
}

export function ProductGridSkeleton({ columns = 2 }: { columns?: number }) {
  return (
    <View style={styles.gridContainer}>
      <View style={styles.gridHeader}>
        <Skeleton width={140} height={24} />
        <Skeleton width={80} height={16} />
      </View>
      <View style={styles.chipContainer}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            width={80}
            height={32}
            borderRadius={BorderRadius.full}
          />
        ))}
      </View>
      <View style={[styles.grid, { gap: Spacing.sm }]}>
        {Array.from({ length: 4 }).map((_, i) => (
          <View key={i} style={{ width: `${100 / columns - 2}%` }}>
            <SkeletonCard aspectRatio={1} />
          </View>
        ))}
      </View>
    </View>
  );
}

export function StyleSelectorSkeleton() {
  return (
    <View style={styles.styleSelectorContainer}>
      <Skeleton width={120} height={24} style={{ marginBottom: Spacing.md }} />
      <View style={styles.styleGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={styles.styleItem}>
            <Skeleton width={80} height={80} borderRadius={BorderRadius.md} />
            <Skeleton
              width={60}
              height={12}
              style={{ marginTop: Spacing.xs }}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export function MerchPreviewSkeleton() {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.previewContainer,
        { backgroundColor: theme.backgroundSecondary },
      ]}
    >
      <Skeleton
        width="100%"
        height={0}
        style={{ aspectRatio: 1 } as ViewStyle}
        borderRadius={0}
      />
      <View style={styles.previewContent}>
        <Skeleton width="60%" height={22} />
        <Skeleton width="80%" height={16} style={{ marginTop: Spacing.xs }} />
      </View>
      <View style={styles.previewActions}>
        <Skeleton width="100%" height={44} borderRadius={BorderRadius.md} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.md,
  },
  gridContainer: {
    flex: 1,
  },
  gridHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  chipContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  styleSelectorContainer: {
    marginBottom: Spacing.lg,
  },
  styleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  styleItem: {
    alignItems: "center",
  },
  previewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  previewContent: {
    padding: Spacing.base,
  },
  previewActions: {
    padding: Spacing.base,
    paddingTop: 0,
  },
});
