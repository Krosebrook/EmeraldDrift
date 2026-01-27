import React, { useState, useRef } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  Image,
  TextInput,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { userStatsService, OnboardingState } from "@/services/userStats";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

interface OnboardingScreenProps {
  onComplete?: () => void;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "instagram" as const, color: "#E4405F" },
  { id: "youtube", name: "YouTube", icon: "youtube" as const, color: "#FF0000" },
  { id: "twitter", name: "TikTok", icon: "video" as const, color: "#000000" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" as const, color: "#0A66C2" },
  { id: "pinterest", name: "Pinterest", icon: "image" as const, color: "#E60023" },
];

const GOALS = [
  { id: "grow", label: "Grow my audience", icon: "trending-up" as const },
  { id: "schedule", label: "Schedule content", icon: "calendar" as const },
  { id: "analytics", label: "Track analytics", icon: "bar-chart-2" as const },
  { id: "collaborate", label: "Team collaboration", icon: "users" as const },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { theme, isDark } = useTheme();
  const { user, updateProfile } = useAuthContext();
  const [isCompleting, setIsCompleting] = useState(false);
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [bio, setBio] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  const steps = [
    { key: "welcome", title: "Welcome" },
    { key: "profile", title: "Profile" },
    { key: "platforms", title: "Platforms" },
  ];

  const handleNext = async () => {
    if (isCompleting) return;
    
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (user) {
      if (currentStep === 0) {
        await userStatsService.completeOnboardingStep(user.id, "welcome");
      } else if (currentStep === 1) {
        await updateProfile({ name: displayName });
        await userStatsService.completeOnboardingStep(user.id, "profile");
      } else if (currentStep === 2) {
        setIsCompleting(true);
        await userStatsService.completeOnboardingStep(user.id, "platforms");
        
        if (selectedPlatforms.length > 0) {
          await userStatsService.updateStats(user.id, {
            platformsConnected: selectedPlatforms.length,
          });
        }
        
        await userStatsService.addActivity(user.id, {
          type: "post_created",
          title: "Joined Creator Studio",
          description: "Welcome to the community!",
        });
        
        if (onComplete) {
          onComplete();
        }
        return;
      }
    }

    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      flatListRef.current?.scrollToIndex({ index: nextStep, animated: true });
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      flatListRef.current?.scrollToIndex({ index: prevStep, animated: true });
    }
  };

  const handleSkip = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    
    if (user) {
      const state = await userStatsService.getOnboardingState(user.id);
      state.completed = true;
      state.completedAt = new Date().toISOString();
      await userStatsService.saveOnboardingState(user.id, state);
    }
    if (onComplete) {
      onComplete();
    }
  };

  const toggleGoal = (goalId: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setSelectedGoals((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  };

  const togglePlatform = (platformId: string) => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setSelectedPlatforms((prev) =>
      prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId]
    );
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.welcomeLogo}
          resizeMode="contain"
        />
        <Spacer height={Spacing.xl} />
        <ThemedText type="display" style={styles.welcomeTitle}>
          Welcome to Creator Studio
        </ThemedText>
        <Spacer height={Spacing.md} />
        <ThemedText type="body" secondary style={styles.welcomeSubtitle}>
          Your all-in-one platform for content creation, scheduling, and analytics across all your social channels.
        </ThemedText>
        <Spacer height={Spacing["2xl"]} />
        <View style={styles.featuresList}>
          {[
            { icon: "edit-3", text: "AI-powered content creation" },
            { icon: "bar-chart-2", text: "Real-time analytics" },
            { icon: "calendar", text: "Smart scheduling" },
            { icon: "users", text: "Team collaboration" },
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={[styles.featureIcon, { backgroundColor: theme.primaryLight }]}>
                <Feather name={feature.icon as any} size={18} color={theme.primary} />
              </View>
              <ThemedText type="body">{feature.text}</ThemedText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <ThemedText type="display" style={styles.stepTitle}>
          Set up your profile
        </ThemedText>
        <Spacer height={Spacing.sm} />
        <ThemedText type="body" secondary style={styles.stepSubtitle}>
          Tell us a bit about yourself
        </ThemedText>
        <Spacer height={Spacing.xl} />

        <View style={styles.inputGroup}>
          <ThemedText type="subhead" style={styles.inputLabel}>Display Name</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.placeholder}
            accessibilityLabel="Display Name"
          />
        </View>

        <Spacer height={Spacing.lg} />

        <View style={styles.inputGroup}>
          <ThemedText type="subhead" style={styles.inputLabel}>Bio (optional)</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.bioInput,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself..."
            placeholderTextColor={theme.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            accessibilityLabel="Bio"
          />
        </View>

        <Spacer height={Spacing.xl} />

        <ThemedText type="subhead" style={styles.inputLabel}>What are your goals?</ThemedText>
        <Spacer height={Spacing.md} />
        <View style={styles.goalsGrid}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoals.includes(goal.id);
            return (
              <Pressable
                key={goal.id}
                onPress={() => toggleGoal(goal.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={goal.label}
                style={[
                  styles.goalChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name={goal.icon}
                  size={16}
                  color={isSelected ? "#FFFFFF" : theme.text}
                />
                <ThemedText
                  type="caption"
                  style={[
                    styles.goalLabel,
                    { color: isSelected ? "#FFFFFF" : theme.text },
                  ]}
                >
                  {goal.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderPlatformsStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <ThemedText type="display" style={styles.stepTitle}>
          Connect your platforms
        </ThemedText>
        <Spacer height={Spacing.sm} />
        <ThemedText type="body" secondary style={styles.stepSubtitle}>
          Select the platforms you want to manage
        </ThemedText>
        <Spacer height={Spacing.xl} />

        <View style={styles.platformsList}>
          {PLATFORMS.map((platform) => {
            const isSelected = selectedPlatforms.includes(platform.id);
            return (
              <Pressable
                key={platform.id}
                onPress={() => togglePlatform(platform.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${platform.name} platform`}
                style={[
                  styles.platformCard,
                  {
                    backgroundColor: theme.cardBackground,
                    borderColor: isSelected ? theme.primary : theme.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.platformIcon, { backgroundColor: platform.color }]}>
                  <Feather name={platform.icon as any} size={24} color="#FFFFFF" />
                </View>
                <ThemedText type="body" style={styles.platformName}>
                  {platform.name}
                </ThemedText>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: isSelected ? theme.primary : "transparent",
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  {isSelected ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Spacer height={Spacing.lg} />

        <ThemedText type="caption" secondary style={styles.platformNote}>
          You can connect more platforms later from Settings
        </ThemedText>
      </View>
    </View>
  );

  const renderStep = ({ item, index }: { item: { key: string }; index: number }) => {
    switch (item.key) {
      case "welcome":
        return renderWelcomeStep();
      case "profile":
        return renderProfileStep();
      case "platforms":
        return renderPlatformsStep();
      default:
        return null;
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        {currentStep > 0 ? (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Feather name="arrow-left" size={24} color={theme.text} />
          </Pressable>
        ) : (
          <View style={styles.backButton} />
        )}
        
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index <= currentStep ? theme.primary : theme.border,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleSkip}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding"
        >
          <ThemedText type="link">Skip</ThemedText>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        keyExtractor={(item) => item.key}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Button onPress={handleNext}>
          {currentStep === steps.length - 1 ? "Get Started" : "Continue"}
        </Button>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  progressContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    paddingHorizontal: Spacing.sm,
  },
  stepContainer: {
    width,
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  welcomeLogo: {
    width: 100,
    height: 100,
    alignSelf: "center",
  },
  welcomeTitle: {
    textAlign: "center",
  },
  welcomeSubtitle: {
    textAlign: "center",
    lineHeight: 24,
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTitle: {
    fontSize: 28,
  },
  stepSubtitle: {
    lineHeight: 24,
  },
  inputGroup: {
    width: "100%",
  },
  inputLabel: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.body.fontSize,
  },
  bioInput: {
    height: 100,
    paddingTop: Spacing.md,
  },
  goalsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  goalChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  goalLabel: {
    fontWeight: "500",
  },
  platformsList: {
    gap: Spacing.md,
  },
  platformCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  platformName: {
    flex: 1,
    marginLeft: Spacing.md,
    fontWeight: "500",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.xs,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  platformNote: {
    textAlign: "center",
  },
  footer: {
    paddingHorizontal: Spacing.lg,
  },
});
