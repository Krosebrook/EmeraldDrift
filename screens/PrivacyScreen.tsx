import React, { useState } from "react";
import { StyleSheet, View, Switch, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function PrivacyScreen() {
  const { theme } = useTheme();
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [crashReporting, setCrashReporting] = useState(true);
  const [personalizedAds, setPersonalizedAds] = useState(false);

  const handleToggle = (setter: (value: boolean) => void, currentValue: boolean) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setter(!currentValue);
  };

  const handleClearData = () => {
    Alert.alert(
      "Clear Local Data",
      "This will clear all cached data and preferences. Your account and content will not be affected.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            Alert.alert("Done", "Local data has been cleared.");
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Privacy & Security</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Control your data and privacy settings
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Data Collection</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.settingContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="activity" size={18} color={theme.primary} />
          </View>
          <View style={styles.textContent}>
            <ThemedText style={{ fontWeight: "500" }}>Usage Analytics</ThemedText>
            <ThemedText type="caption" secondary>
              Help us improve by sharing anonymous usage data
            </ThemedText>
          </View>
        </View>
        <Switch
          value={analyticsEnabled}
          onValueChange={() => handleToggle(setAnalyticsEnabled, analyticsEnabled)}
          trackColor={{ false: theme.border, true: theme.primary + "60" }}
          thumbColor={analyticsEnabled ? theme.primary : theme.textSecondary}
        />
      </View>

      <Spacer height={Spacing.sm} />

      <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.settingContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.warning + "20" }]}>
            <Feather name="alert-triangle" size={18} color={theme.warning} />
          </View>
          <View style={styles.textContent}>
            <ThemedText style={{ fontWeight: "500" }}>Crash Reporting</ThemedText>
            <ThemedText type="caption" secondary>
              Automatically send crash reports to help fix bugs
            </ThemedText>
          </View>
        </View>
        <Switch
          value={crashReporting}
          onValueChange={() => handleToggle(setCrashReporting, crashReporting)}
          trackColor={{ false: theme.border, true: theme.primary + "60" }}
          thumbColor={crashReporting ? theme.primary : theme.textSecondary}
        />
      </View>

      <Spacer height={Spacing.sm} />

      <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.settingContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.textSecondary + "20" }]}>
            <Feather name="target" size={18} color={theme.textSecondary} />
          </View>
          <View style={styles.textContent}>
            <ThemedText style={{ fontWeight: "500" }}>Personalized Content</ThemedText>
            <ThemedText type="caption" secondary>
              Allow personalized recommendations
            </ThemedText>
          </View>
        </View>
        <Switch
          value={personalizedAds}
          onValueChange={() => handleToggle(setPersonalizedAds, personalizedAds)}
          trackColor={{ false: theme.border, true: theme.primary + "60" }}
          thumbColor={personalizedAds ? theme.primary : theme.textSecondary}
        />
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Security</ThemedText>
      <Spacer height={Spacing.md} />

      <Pressable
        style={({ pressed }) => [
          styles.actionRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="lock" size={18} color={theme.primary} />
        </View>
        <View style={styles.actionContent}>
          <ThemedText style={{ fontWeight: "500" }}>Change Password</ThemedText>
          <ThemedText type="caption" secondary>Update your account password</ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.sm} />

      <Pressable
        style={({ pressed }) => [
          styles.actionRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.success + "20" }]}>
          <Feather name="smartphone" size={18} color={theme.success} />
        </View>
        <View style={styles.actionContent}>
          <ThemedText style={{ fontWeight: "500" }}>Two-Factor Authentication</ThemedText>
          <ThemedText type="caption" secondary>Add an extra layer of security</ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Data Management</ThemedText>
      <Spacer height={Spacing.md} />

      <Pressable
        style={({ pressed }) => [
          styles.actionRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
          <Feather name="download" size={18} color={theme.primary} />
        </View>
        <View style={styles.actionContent}>
          <ThemedText style={{ fontWeight: "500" }}>Download My Data</ThemedText>
          <ThemedText type="caption" secondary>Get a copy of your data</ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.sm} />

      <Pressable
        onPress={handleClearData}
        style={({ pressed }) => [
          styles.actionRow,
          { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.error + "20" }]}>
          <Feather name="trash-2" size={18} color={theme.error} />
        </View>
        <View style={styles.actionContent}>
          <ThemedText style={{ fontWeight: "500", color: theme.error }}>Clear Local Data</ThemedText>
          <ThemedText type="caption" secondary>Remove cached data from device</ThemedText>
        </View>
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      </Pressable>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  actionContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  textContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
