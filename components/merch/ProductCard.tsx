import React, { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Skeleton } from "@/components/Skeleton";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { MerchProduct } from "@/features/merch/types";

interface ProductCardProps {
  product: MerchProduct;
  selected?: boolean;
  onSelect: (product: MerchProduct) => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ProductCard({ product, selected = false, onSelect }: ProductCardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const [isLoading, setIsLoading] = useState(true);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={() => onSelect(product)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.container,
        {
          backgroundColor: theme.cardBackground,
          borderColor: selected ? theme.primary : theme.border,
          borderWidth: selected ? 2 : 1,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.imageWrapper}>
        {isLoading && (
          <View style={styles.imagePlaceholder}>
            <Skeleton width="100%" height={120} borderRadius={0} />
          </View>
        )}
        <Image
          source={{ uri: product.placeholderImage }}
          style={[styles.image, isLoading && styles.imageHidden]}
          contentFit="cover"
          transition={200}
          onLoadEnd={() => setIsLoading(false)}
          cachePolicy="memory-disk"
        />
      </View>

      {selected && (
        <View style={[styles.checkBadge, { backgroundColor: theme.primary }]}>
          <Feather name="check" size={12} color="#FFFFFF" />
        </View>
      )}

      {product.popular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.success }]}>
          <ThemedText style={styles.popularText}>Popular</ThemedText>
        </View>
      )}

      <View style={styles.content}>
        <ThemedText type="subhead" numberOfLines={1}>
          {product.name}
        </ThemedText>
        <ThemedText type="caption" secondary numberOfLines={1}>
          {product.description}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 120,
  },
  imagePlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  image: {
    width: "100%",
    height: 120,
    backgroundColor: "#f0f0f0",
  },
  imageHidden: {
    opacity: 0,
  },
  checkBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  popularBadge: {
    position: "absolute",
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  popularText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  content: {
    padding: Spacing.sm,
    gap: 2,
  },
});
