import React, { useState } from "react";
import { StyleSheet, View, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { storage, ContentItem } from "@/utils/storage";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { StudioStackParamList } from "@/navigation/StudioStackNavigator";

type ScheduleScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, "Schedule">;
  route: RouteProp<StudioStackParamList, "Schedule">;
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TIME_SLOTS = [
  { label: "Morning", time: "09:00", icon: "sunrise" as const },
  { label: "Midday", time: "12:00", icon: "sun" as const },
  { label: "Afternoon", time: "15:00", icon: "cloud" as const },
  { label: "Evening", time: "18:00", icon: "sunset" as const },
  { label: "Night", time: "21:00", icon: "moon" as const },
];

export default function ScheduleScreen({ navigation, route }: ScheduleScreenProps) {
  const { theme } = useTheme();
  const { title, caption, mediaUri, platforms } = route.params;

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("12:00");
  const [isLoading, setIsLoading] = useState(false);

  const getNextWeekDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getNextWeekDates();

  const formatDate = (date: Date): string => {
    return date.getDate().toString();
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.toDateString() === date2.toDateString();
  };

  const handleSchedule = async () => {
    setIsLoading(true);

    const scheduledDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(":").map(Number);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    const newContent: ContentItem = {
      id: `content_${Date.now()}`,
      title,
      caption,
      mediaUri,
      platforms,
      status: "scheduled",
      scheduledAt: scheduledDateTime.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.addContent(newContent);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsLoading(false);

    Alert.alert(
      "Scheduled!",
      `Your content will be published on ${scheduledDateTime.toLocaleDateString()} at ${selectedTime}`,
      [{ text: "OK", onPress: () => navigation.popToTop() }]
    );
  };

  const getScheduleDateTime = (): string => {
    const [hours] = selectedTime.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${displayHours}:00 ${period}`;
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Schedule Post</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Choose when to publish your content
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={[styles.previewCard, { backgroundColor: theme.cardBackground }]}>
        <View style={[styles.previewThumbnail, { backgroundColor: theme.backgroundSecondary }]}>
          {mediaUri ? (
            <Feather name="image" size={24} color={theme.success} />
          ) : (
            <Feather name="file-text" size={24} color={theme.textSecondary} />
          )}
        </View>
        <View style={styles.previewContent}>
          <ThemedText numberOfLines={1} style={{ fontWeight: "600" }}>
            {title || "Untitled Post"}
          </ThemedText>
          <ThemedText type="caption" secondary numberOfLines={1}>
            {caption || "No caption"}
          </ThemedText>
          <View style={styles.platformBadges}>
            {platforms.map((platform) => (
              <View
                key={platform}
                style={[styles.platformBadge, { backgroundColor: theme.primary + "20" }]}
              >
                <ThemedText type="caption" style={{ color: theme.primary, textTransform: "capitalize" }}>
                  {platform}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Select Date</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.dateGrid}>
        {weekDates.map((date) => (
          <Pressable
            key={date.toISOString()}
            onPress={() => {
              setSelectedDate(date);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={({ pressed }) => [
              styles.dateCard,
              {
                backgroundColor: isSameDay(date, selectedDate) ? theme.primary : theme.cardBackground,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText
              type="caption"
              style={{
                color: isSameDay(date, selectedDate) ? "#FFFFFF" : theme.textSecondary,
              }}
            >
              {DAYS_OF_WEEK[date.getDay()]}
            </ThemedText>
            <ThemedText
              style={{
                fontSize: 20,
                fontWeight: "700",
                color: isSameDay(date, selectedDate) ? "#FFFFFF" : theme.text,
              }}
            >
              {formatDate(date)}
            </ThemedText>
            {isToday(date) ? (
              <View
                style={[
                  styles.todayDot,
                  { backgroundColor: isSameDay(date, selectedDate) ? "#FFFFFF" : theme.primary },
                ]}
              />
            ) : null}
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Select Time</ThemedText>
      <Spacer height={Spacing.md} />

      <View style={styles.timeGrid}>
        {TIME_SLOTS.map((slot) => (
          <Pressable
            key={slot.time}
            onPress={() => {
              setSelectedTime(slot.time);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={({ pressed }) => [
              styles.timeCard,
              {
                backgroundColor: selectedTime === slot.time ? theme.primary : theme.cardBackground,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather
              name={slot.icon}
              size={20}
              color={selectedTime === slot.time ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              style={{
                marginTop: Spacing.xs,
                fontWeight: "600",
                color: selectedTime === slot.time ? "#FFFFFF" : theme.text,
              }}
            >
              {slot.label}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{
                color: selectedTime === slot.time ? "rgba(255,255,255,0.8)" : theme.textSecondary,
              }}
            >
              {slot.time}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.summaryCard, { backgroundColor: theme.primaryLight }]}>
        <Feather name="calendar" size={20} color={theme.primary} />
        <View style={styles.summaryContent}>
          <ThemedText type="caption" secondary>Scheduled for</ThemedText>
          <ThemedText style={{ fontWeight: "600", marginTop: 2 }}>{getScheduleDateTime()}</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <Button onPress={handleSchedule} disabled={isLoading}>
        {isLoading ? "Scheduling..." : "Schedule Post"}
      </Button>

      <Spacer height={Spacing.md} />

      <Pressable
        onPress={() => navigation.goBack()}
        style={({ pressed }) => [styles.cancelButton, { opacity: pressed ? 0.7 : 1 }]}
      >
        <ThemedText secondary>Cancel</ThemedText>
      </Pressable>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    flexDirection: "row",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  previewThumbnail: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  previewContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center",
  },
  platformBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: Spacing.xs,
  },
  platformBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  dateGrid: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  dateCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  timeCard: {
    width: "31%",
    alignItems: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  summaryContent: {
    marginLeft: Spacing.md,
  },
  cancelButton: {
    alignItems: "center",
    padding: Spacing.md,
  },
});
