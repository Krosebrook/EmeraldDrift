import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATION_SETTINGS_KEY = "@creator_studio_notification_settings";

export interface NotificationSettings {
  publishSuccess: boolean;
  publishFailure: boolean;
  scheduledReminders: boolean;
  analyticsUpdates: boolean;
  teamActivity: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  publishSuccess: true,
  publishFailure: true,
  scheduledReminders: true,
  analyticsUpdates: false,
  teamActivity: true,
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "web") {
      return false;
    }

    if (!Device.isDevice) {
      console.log("Push notifications require a physical device");
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    if (Platform.OS === "android") {
      await Promise.all([
        Notifications.setNotificationChannelAsync("default", {
          name: "Default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#8B5CF6",
        }),
        Notifications.setNotificationChannelAsync("publishing", {
          name: "Publishing Updates",
          description: "Notifications about your content publishing status",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#8B5CF6",
        }),
        Notifications.setNotificationChannelAsync("reminders", {
          name: "Scheduled Reminders",
          description: "Reminders for scheduled content",
          importance: Notifications.AndroidImportance.DEFAULT,
          lightColor: "#8B5CF6",
        }),
      ]);
    }

    return true;
  },

  async getPermissionStatus(): Promise<"granted" | "denied" | "undetermined"> {
    if (Platform.OS === "web") {
      return "denied";
    }
    const { status } = await Notifications.getPermissionsAsync();
    return status;
  },

  async getSettings(): Promise<NotificationSettings> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      console.log("Error loading notification settings");
    }
    return DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...settings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    } catch {
      console.log("Error saving notification settings");
    }
  },

  async notifyPublishSuccess(title: string, platform: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.publishSuccess) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Content Published",
        body: `"${title}" has been successfully published to ${platform}`,
        data: { type: "publish_success", platform },
        sound: true,
        ...(Platform.OS === "android" && { channelId: "publishing" }),
      },
      trigger: null,
    });
  },

  async notifyPublishFailure(title: string, platform: string, error?: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.publishFailure) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Publishing Failed",
        body: `"${title}" could not be published to ${platform}${error ? `: ${error}` : ""}`,
        data: { type: "publish_failure", platform, error },
        sound: true,
        ...(Platform.OS === "android" && { channelId: "publishing" }),
      },
      trigger: null,
    });
  },

  async scheduleReminder(contentId: string, title: string, scheduledTime: Date): Promise<string | null> {
    const settings = await this.getSettings();
    if (!settings.scheduledReminders) return null;

    const reminderTime = new Date(scheduledTime.getTime() - 30 * 60 * 1000);
    
    if (reminderTime <= new Date()) {
      return null;
    }

    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Upcoming Post",
        body: `"${title}" is scheduled to publish in 30 minutes`,
        data: { type: "scheduled_reminder", contentId },
        sound: true,
        ...(Platform.OS === "android" && { channelId: "reminders" }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderTime,
      },
    });

    return identifier;
  },

  async cancelReminder(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  async notifyAnalyticsUpdate(message: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.analyticsUpdates) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Analytics Update",
        body: message,
        data: { type: "analytics_update" },
        sound: false,
      },
      trigger: null,
    });
  },

  async notifyTeamActivity(memberName: string, action: string): Promise<void> {
    const settings = await this.getSettings();
    if (!settings.teamActivity) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Team Activity",
        body: `${memberName} ${action}`,
        data: { type: "team_activity", memberName },
        sound: false,
      },
      trigger: null,
    });
  },

  async getBadgeCount(): Promise<number> {
    if (Platform.OS === "web") return 0;
    return await Notifications.getBadgeCountAsync();
  },

  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === "web") return;
    await Notifications.setBadgeCountAsync(count);
  },

  async clearBadge(): Promise<void> {
    if (Platform.OS === "web") return;
    await Notifications.setBadgeCountAsync(0);
  },

  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  },

  addResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  },
};
