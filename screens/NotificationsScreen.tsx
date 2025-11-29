import React, { useState, useEffect } from "react";
import { StyleSheet, View, Switch, Platform, Pressable, Linking, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import { notificationService, NotificationSettings } from "@/services/notifications";

interface NotificationSetting {
  id: keyof NotificationSettings;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    id: "publishSuccess",
    title: "Publishing Success",
    description: "Get notified when content is published",
    icon: "check-circle",
  },
  {
    id: "publishFailure",
    title: "Publishing Errors",
    description: "Get notified when publishing fails",
    icon: "alert-circle",
  },
  {
    id: "scheduledReminders",
    title: "Scheduled Reminders",
    description: "Reminder before scheduled posts",
    icon: "clock",
  },
  {
    id: "analyticsUpdates",
    title: "Analytics Updates",
    description: "Insights about your content performance",
    icon: "bar-chart-2",
  },
  {
    id: "teamActivity",
    title: "Team Activity",
    description: "Updates from your team members",
    icon: "users",
  },
];

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "undetermined">("undetermined");
  const [settings, setSettings] = useState<NotificationSettings>({
    publishSuccess: true,
    publishFailure: true,
    scheduledReminders: true,
    analyticsUpdates: false,
    teamActivity: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [status, savedSettings] = await Promise.all([
      notificationService.getPermissionStatus(),
      notificationService.getSettings(),
    ]);
    setPermissionStatus(status);
    setSettings(savedSettings);
    setIsLoading(false);
  };

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const granted = await notificationService.requestPermissions();
    setPermissionStatus(granted ? "granted" : "denied");
  };

  const openSettings = async () => {
    if (Platform.OS !== "web") {
      try {
        await Linking.openSettings();
      } catch {
        console.log("Could not open settings");
      }
    }
  };

  const toggleSetting = async (id: keyof NotificationSettings) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const newValue = !settings[id];
    setSettings((prev) => ({
      ...prev,
      [id]: newValue,
    }));
    await notificationService.updateSettings({ [id]: newValue });
  };

  if (isLoading) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ScreenScrollView>
    );
  }

  const isWeb = Platform.OS === "web";
  const permissionsGranted = permissionStatus === "granted";

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Notifications</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Manage what notifications you receive
      </ThemedText>

      <Spacer height={Spacing.lg} />

      {isWeb ? (
        <View style={[styles.webNotice, { backgroundColor: theme.warning + "15" }]}>
          <Feather name="info" size={18} color={theme.warning} />
          <ThemedText style={{ marginLeft: Spacing.sm, flex: 1, color: theme.warning }}>
            Push notifications are not available on web. Use the Expo Go app on your phone for full notification support.
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.masterToggle, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.masterToggleContent}>
            <View style={[styles.iconContainer, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="bell" size={20} color={theme.primary} />
            </View>
            <View style={styles.textContent}>
              <ThemedText style={{ fontWeight: "600" }}>Push Notifications</ThemedText>
              <ThemedText type="caption" secondary>
                {permissionsGranted ? "Notifications are enabled" : "Allow notifications on this device"}
              </ThemedText>
            </View>
          </View>
          {permissionsGranted ? (
            <View style={[styles.statusBadge, { backgroundColor: theme.success + "20" }]}>
              <Feather name="check" size={14} color={theme.success} />
              <ThemedText type="caption" style={{ marginLeft: 4, color: theme.success }}>
                Enabled
              </ThemedText>
            </View>
          ) : permissionStatus === "denied" ? (
            <Pressable
              onPress={openSettings}
              style={[styles.enableButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Open Settings
              </ThemedText>
            </Pressable>
          ) : (
            <Pressable
              onPress={requestPermissions}
              style={[styles.enableButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                Enable
              </ThemedText>
            </Pressable>
          )}
        </View>
      )}

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
              disabled={!permissionsGranted && !isWeb}
            />
          </View>
          <Spacer height={Spacing.sm} />
        </React.Fragment>
      ))}

      <Spacer height={Spacing.lg} />

      <View style={[styles.infoCard, { backgroundColor: theme.primaryLight }]}>
        <Feather name="info" size={20} color={theme.primary} />
        <ThemedText style={styles.infoText}>
          {isWeb 
            ? "Download Creator Studio from the App Store for the full mobile experience with push notifications."
            : "You can change notification permissions in your device settings at any time."}
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  webNotice: {
    flexDirection: "row",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
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
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  enableButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
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
