import React from "react";
import { StyleSheet, View, Pressable, Image, Dimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type LandingScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Landing">;
};

const { width } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "edit-3" as const,
    title: "Create Content",
    description: "AI-powered content creation for all your social platforms",
  },
  {
    icon: "bar-chart-2" as const,
    title: "Track Analytics",
    description: "Real-time insights on engagement, growth, and performance",
  },
  {
    icon: "users" as const,
    title: "Team Collaboration",
    description: "Work together with role-based permissions and workflows",
  },
  {
    icon: "calendar" as const,
    title: "Smart Scheduling",
    description: "Schedule posts at optimal times across all platforms",
  },
];

const PLATFORMS = [
  { name: "Instagram", color: "#E4405F" },
  { name: "TikTok", color: "#000000" },
  { name: "YouTube", color: "#FF0000" },
  { name: "LinkedIn", color: "#0A66C2" },
  { name: "Pinterest", color: "#E60023" },
];

export default function LandingScreen({ navigation }: LandingScreenProps) {
  const { theme, isDark } = useTheme();
  const { isMobile, isTablet, contentWidth } = useResponsive();

  return (
    <ScreenScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroSection}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="display" style={styles.heroTitle}>
          Creator Studio
        </ThemedText>
        <ThemedText type="title3" secondary style={styles.heroSubtitle}>
          Your all-in-one platform for content creation and social media management
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.platformsRow}>
        {PLATFORMS.map((platform, index) => (
          <View
            key={platform.name}
            style={[
              styles.platformBadge,
              { backgroundColor: isDark ? theme.backgroundSecondary : theme.backgroundDefault },
            ]}
          >
            <View style={[styles.platformDot, { backgroundColor: platform.color }]} />
            <ThemedText type="caption" style={styles.platformName}>
              {platform.name}
            </ThemedText>
          </View>
        ))}
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.featuresSection}>
        <ThemedText type="title2" style={styles.sectionTitle}>
          Everything you need
        </ThemedText>
        <Spacer height={Spacing.lg} />
        
        <View style={[styles.featuresGrid, { maxWidth: contentWidth, alignSelf: "center", width: "100%" }]}>
          {FEATURES.map((feature, index) => (
            <View
              key={feature.title}
              style={[
                styles.featureCard,
                { 
                  backgroundColor: theme.cardBackground,
                  width: isMobile ? "48%" : isTablet ? "31%" : "23%",
                },
              ]}
            >
              <View style={[styles.featureIconContainer, { backgroundColor: theme.primaryLight }]}>
                <Feather name={feature.icon} size={24} color={theme.primary} />
              </View>
              <Spacer height={Spacing.md} />
              <ThemedText type="subhead" style={styles.featureTitle}>
                {feature.title}
              </ThemedText>
              <Spacer height={Spacing.xs} />
              <ThemedText type="caption" secondary style={styles.featureDescription}>
                {feature.description}
              </ThemedText>
            </View>
          ))}
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.statsSection}>
        <View style={[styles.statsCard, { backgroundColor: theme.primaryLight }]}>
          <ThemedText type="display" style={[styles.statNumber, { color: theme.primary }]}>
            10K+
          </ThemedText>
          <ThemedText type="caption" secondary>
            Active Creators
          </ThemedText>
        </View>
        <View style={[styles.statsCard, { backgroundColor: theme.primaryLight }]}>
          <ThemedText type="display" style={[styles.statNumber, { color: theme.primary }]}>
            5M+
          </ThemedText>
          <ThemedText type="caption" secondary>
            Posts Created
          </ThemedText>
        </View>
        <View style={[styles.statsCard, { backgroundColor: theme.primaryLight }]}>
          <ThemedText type="display" style={[styles.statNumber, { color: theme.primary }]}>
            50M+
          </ThemedText>
          <ThemedText type="caption" secondary>
            Total Reach
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing["2xl"]} />

      <View style={styles.ctaSection}>
        <Button onPress={() => navigation.navigate("SignUp")}>
          Get Started Free
        </Button>
        <Spacer height={Spacing.base} />
        <Pressable
          onPress={() => navigation.navigate("Login")}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="body" style={styles.signInText}>
            Already have an account?{" "}
            <ThemedText type="link" style={{ fontWeight: "600" }}>Sign In</ThemedText>
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.footer}>
        <ThemedText type="caption" secondary style={styles.footerText}>
          Join thousands of creators building their brand
        </ThemedText>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingTop: Spacing.xl,
  },
  heroSection: {
    alignItems: "center",
    paddingHorizontal: Spacing.base,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    textAlign: "center",
  },
  heroSubtitle: {
    textAlign: "center",
    marginTop: Spacing.md,
    maxWidth: 300,
    lineHeight: 24,
  },
  platformsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },
  platformBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformName: {
    fontWeight: "500",
  },
  featuresSection: {
    paddingHorizontal: Spacing.base,
  },
  sectionTitle: {
    textAlign: "center",
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: Spacing.md,
  },
  featureCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  featureTitle: {
    fontWeight: "600",
  },
  featureDescription: {
    lineHeight: 18,
  },
  statsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
    justifyContent: "center",
  },
  statsCard: {
    flex: 1,
    minWidth: 100,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
  },
  ctaSection: {
    paddingHorizontal: Spacing.base,
    alignItems: "center",
  },
  signInText: {
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingBottom: Spacing.lg,
  },
  footerText: {
    textAlign: "center",
  },
});
