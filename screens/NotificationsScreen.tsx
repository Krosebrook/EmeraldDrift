import React, { useState } from "react";
import { StyleSheet, View, Switch, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "publish_success",
    title: "Publishing Success",
    description: "Get notified when content is published",
    icon: "check-circle",
  },
  {
    id: "publish_failed",
    title: "Publishing Errors",
    description: "Get notified when publishing fails",
    icon: "alert-circle",
  },
  {
    id: "scheduled_reminder",
    title: "Scheduled Reminders",
    description: "Reminder before scheduled posts",
    icon: "clock",
  },
  {
    id: "analytics_weekly",
    title: "Weekly Analytics",
    description: "Weekly performance summary",
    icon: "bar-chart-2",
  },
  {
    id: "engagement_milestone",
    title: "Engagement Milestones",
    description: "When you hit follower milestones",
    icon: "award",
  },
  {
    id: "tips_tricks",
    title: "Tips & Best Practices",
    description: "Content creation tips",
    icon: "lightbulb",
  },
];

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<Record<string, boolean>>({
    publish_success: true,
    publish_failed: true,
    scheduled_reminder: true,
    analytics_weekly: false,
    engagement_milestone: true,
    tips_tricks: false,
  });

  const toggleSetting = (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSettings((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Notifications</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Manage what notifications you receive
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={[styles.masterToggle, { backgroundColor: theme.cardBackground }]}>
        <View style={styles.masterToggleContent}>
          <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="bell" size={20} color={theme.primary} />
          </View>
          <View style={styles.textContent}>
            <ThemedText style={{ fontWeight: "600" }}>Push Notifications</ThemedText>
            <ThemedText type="caption" secondary>
              Allow notifications on this device
            </ThemedText>
          </View>
        </View>
        <Switch
          value={true}
          onValueChange={() => {}}
          trackColor={{ false: theme.border, true: theme.primary + "60" }}
          thumbColor={theme.primary}
        />
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Notification Types</ThemedText>
      <Spacer height={Spacing.md} />

      {NOTIFICATION_SETTINGS.map((setting) => (
        <React.Fragment key={setting.id}>
          <View style={[styles.settingRow, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.settingContent}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
                <Feather name={setting.icon} size={18} color={theme.primary} />
              </View>
              <View style={styles.textContent}>
                <ThemedText style={{ fontWeight: "500" }}>{setting.title}</ThemedText>
                <ThemedText type="caption" secondary>{setting.description}</ThemedText>
              </View>
            </View>
            <Switch
              value={settings[setting.id]}
              onValueChange={() => toggleSetting(setting.id)}
              trackColor={{ false: theme.border, true: theme.primary + "60" }}
              thumbColor={settings[setting.id] ? theme.primary : theme.textSecondary}
            />
          </View>
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing.lg} />

      <View style={[styles.infoCard, { backgroundColor: theme.primaryLight }]}>
        <Feather name="info" size={20} color={theme.primary} />
        <ThemedText style={styles.infoText}>
          You can change notification permissions in your device settings at any time.
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  masterToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  masterToggleContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
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
  infoCard: {
    flexDirection: "row",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  infoText: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
