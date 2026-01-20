import React from "react";
import {
  View,
  StyleSheet,
  Image,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { MerchProduct } from "@/features/merch/types";

interface MerchPreviewProps {
  product: MerchProduct | null;
  mockupImage: string | null;
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onRetry?: () => void;
}

function LoadingOverlay() {
  const { theme } = useTheme();
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2000, easing: Easing.linear }),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
      <Animated.View style={animatedStyle}>
        <Feather name="loader" size={32} color={theme.primary} />
      </Animated.View>
      <ThemedText style={styles.loadingText}>Synthesizing Mockup...</ThemedText>
      <ThemedText type="caption" style={styles.loadingSubtext}>
        AI is creating your product visualization
      </ThemedText>
    </View>
  );
}

export function MerchPreview({
  product,
  mockupImage,
  isGenerating,
  error,
  onGenerate,
  onDownload,
  onShare,
  onRetry,
}: MerchPreviewProps) {
  const { theme } = useTheme();

  if (!product) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: theme.backgroundTertiary },
            ]}
          >
            <Feather name="package" size={40} color={theme.textSecondary} />
          </View>
          <ThemedText type="title3" style={styles.emptyTitle}>
            Select a Product
          </ThemedText>
          <ThemedText type="body" secondary style={styles.emptyDescription}>
            Choose a product from the catalog to preview your mockup
          </ThemedText>
        </View>
      </View>
    );
  }

  const displayImage = mockupImage || product.placeholderImage;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundSecondary }]}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: displayImage }}
          style={styles.image}
          resizeMode="contain"
        />

        {isGenerating && <LoadingOverlay />}

        {error && (
          <View
            style={[styles.overlay, { backgroundColor: "rgba(239,68,68,0.9)" }]}
          >
            <Feather name="alert-circle" size={32} color="#FFFFFF" />
            <ThemedText style={styles.errorText}>Generation Failed</ThemedText>
            <ThemedText type="caption" style={styles.errorDescription}>
              {error}
            </ThemedText>
            {onRetry && (
              <Pressable
                onPress={onRetry}
                style={[styles.retryButton, { backgroundColor: "#FFFFFF" }]}
              >
                <Feather name="refresh-cw" size={14} color="#EF4444" />
                <ThemedText style={{ color: "#EF4444", marginLeft: 6 }}>
                  Try Again
                </ThemedText>
              </Pressable>
            )}
          </View>
        )}

        {!mockupImage && !isGenerating && !error && (
          <View style={styles.placeholderOverlay}>
            <View
              style={[
                styles.placeholderBadge,
                { backgroundColor: theme.backgroundTertiary },
              ]}
            >
              <Feather name="image" size={16} color={theme.textSecondary} />
              <ThemedText type="caption" secondary style={{ marginLeft: 6 }}>
                Preview
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <ThemedText type="title3">{product.name}</ThemedText>
        <ThemedText type="body" secondary>
          {product.description}
        </ThemedText>
      </View>

      <View style={styles.actions}>
        {!mockupImage && !isGenerating && (
          <Button onPress={onGenerate} leftIcon="zap" fullWidth>
            Generate Mockup
          </Button>
        )}

        {mockupImage && !isGenerating && (
          <View style={styles.actionRow}>
            <Button
              onPress={onGenerate}
              variant="outline"
              leftIcon="refresh-cw"
              style={styles.actionButton}
            >
              Regenerate
            </Button>
            {onDownload && (
              <Button
                onPress={onDownload}
                variant="secondary"
                leftIcon="download"
                style={styles.actionButton}
              >
                Save
              </Button>
            )}
            {onShare && (
              <Button
                onPress={onShare}
                variant="primary"
                leftIcon="share"
                style={styles.actionButton}
              >
                Share
              </Button>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  loadingSubtext: {
    color: "rgba(255,255,255,0.7)",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  errorText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  errorDescription: {
    color: "rgba(255,255,255,0.9)",
    marginTop: Spacing.xs,
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.md,
  },
  placeholderOverlay: {
    position: "absolute",
    bottom: Spacing.md,
    left: Spacing.md,
  },
  placeholderBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    minHeight: 300,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyDescription: {
    textAlign: "center",
  },
  productInfo: {
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  actions: {
    padding: Spacing.base,
    paddingTop: 0,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
