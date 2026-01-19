import React, { Component, type ReactNode } from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/theme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { logError } from "@/core/errors";

type FeatureName = "content" | "analytics" | "platforms" | "offline" | "merch" | "team" | "general" | "ai-generator" | "prompts" | "agents";

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  feature: FeatureName;
  fallbackMessage?: string;
  onRetry?: () => void;
  showDetails?: boolean;
}

interface FeatureErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

const featureConfig: Record<FeatureName, { icon: keyof typeof Feather.glyphMap; title: string; defaultMessage: string }> = {
  content: {
    icon: "file-text",
    title: "Content Error",
    defaultMessage: "Unable to load your content. Please try again.",
  },
  analytics: {
    icon: "bar-chart-2",
    title: "Analytics Error",
    defaultMessage: "Unable to load analytics data. Please try again.",
  },
  platforms: {
    icon: "share-2",
    title: "Platform Error",
    defaultMessage: "Unable to connect to platforms. Please try again.",
  },
  offline: {
    icon: "wifi-off",
    title: "Sync Error",
    defaultMessage: "Unable to sync your changes. They're saved locally.",
  },
  merch: {
    icon: "shopping-bag",
    title: "Merch Studio Error",
    defaultMessage: "Unable to load Merch Studio. Please try again.",
  },
  team: {
    icon: "users",
    title: "Team Error",
    defaultMessage: "Unable to load team data. Please try again.",
  },
  general: {
    icon: "alert-circle",
    title: "Something went wrong",
    defaultMessage: "An unexpected error occurred. Please try again.",
  },
  "ai-generator": {
    icon: "cpu",
    title: "AI Generator Error",
    defaultMessage: "Unable to generate content. Please try again.",
  },
  prompts: {
    icon: "terminal",
    title: "Prompt Studio Error",
    defaultMessage: "Unable to load prompts. Please try again.",
  },
  agents: {
    icon: "activity",
    title: "Agent Orchestrator Error",
    defaultMessage: "Unable to load agents. Please try again.",
  },
};

export class FeatureErrorBoundary extends Component<FeatureErrorBoundaryProps, FeatureErrorBoundaryState> {
  state: FeatureErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): FeatureErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    logError(error, {
      feature: this.props.feature,
      componentStack: info.componentStack,
    });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const config = featureConfig[this.props.feature];
    const message = this.props.fallbackMessage || config.defaultMessage;

    return (
      <ThemedView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Feather name={config.icon} size={32} color={Colors.light.error} />
          </View>
          
          <ThemedText type="title3" style={styles.title}>
            {config.title}
          </ThemedText>
          
          <ThemedText type="body" secondary style={styles.message}>
            {message}
          </ThemedText>

          {this.props.showDetails && this.state.error && (
            <View style={styles.detailsContainer}>
              <ThemedText type="caption" secondary style={styles.errorDetails}>
                {this.state.error.message}
              </ThemedText>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.retryButton,
              { opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={this.handleRetry}
          >
            <Feather name="refresh-cw" size={16} color="#FFFFFF" />
            <ThemedText style={styles.retryText}>Try Again</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  content: {
    alignItems: "center",
    maxWidth: 300,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  message: {
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  detailsContainer: {
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.lg,
    width: "100%",
  },
  errorDetails: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
