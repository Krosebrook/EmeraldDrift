import React from "react";
import { StyleSheet, View, Pressable, Linking, Image } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function AboutScreen() {
  const { theme } = useTheme();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScreenScrollView>
      <View style={styles.header}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title1">Creator Studio</ThemedText>
        <ThemedText secondary>Version 1.0.0</ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.infoCard, { backgroundColor: theme.cardBackground }]}>
        <ThemedText style={styles.description}>
          Creator Studio is your all-in-one platform for managing social media content across 
          Instagram, TikTok, YouTube, LinkedIn, and Pinterest. Create, schedule, and analyze 
          your content performance in one beautiful app.
        </ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Features</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.featureGrid}>
        <View style={[styles.featureCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="edit-3" size={20} color={theme.primary} />
          </View>
          <ThemedText style={styles.featureTitle}>Create</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Craft beautiful content
          </ThemedText>
        </View>
        <View style={[styles.featureCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="clock" size={20} color={theme.warning} />
          </View>
          <ThemedText style={styles.featureTitle}>Schedule</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Post at the best time
          </ThemedText>
        </View>
        <View style={[styles.featureCard, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.featureIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="bar-chart-2" size={20} color={theme.success} />
          </View>
          <ThemedText style={styles.featureTitle}>Analyze</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Track performance
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Legal</ThemedText>
      <Spacer height={Spacing.md} />

      <Pressable
        onPress={() => openLink("https://example.com/terms")}
        style={({ pressed }) => [
          styles.linkRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="file-text" size={18} color={theme.primary} />
        <ThemedText style={styles.linkText}>Terms of Service</ThemedText>
        <Feather name="external-link" size={16} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.sm} />

      <Pressable
        onPress={() => openLink("https://example.com/privacy")}
        style={({ pressed }) => [
          styles.linkRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="shield" size={18} color={theme.primary} />
        <ThemedText style={styles.linkText}>Privacy Policy</ThemedText>
        <Feather name="external-link" size={16} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.sm} />

      <Pressable
        onPress={() => openLink("https://example.com/licenses")}
        style={({ pressed }) => [
          styles.linkRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="code" size={18} color={theme.primary} />
        <ThemedText style={styles.linkText}>Open Source Licenses</ThemedText>
        <Feather name="external-link" size={16} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.lg} />

      <View style={styles.footer}>
        <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
          Made with love for creators everywhere
        </ThemedText>
        <ThemedText type="caption" secondary style={{ textAlign: "center", marginTop: Spacing.xs }}>
          2025 Creator Studio. All rights reserved.
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.md,
  },
  infoCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  description: {
    textAlign: "center",
  },
  featureGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  featureCard: {
    flex: 1,
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    fontWeight: "600",
    marginBottom: 2,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  linkText: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  footer: {
    paddingTop: Spacing.md,
  },
});
