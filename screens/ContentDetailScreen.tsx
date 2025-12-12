import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Alert, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { contentService } from "@/features";
import { isOk } from "@/core/result";
import type { ContentItem } from "@/features/shared/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { DashboardStackParamList } from "@/navigation/DashboardStackNavigator";

type ContentDetailScreenProps = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, "ContentDetail">;
  route: RouteProp<DashboardStackParamList, "ContentDetail">;
};

export default function ContentDetailScreen({ navigation, route }: ContentDetailScreenProps) {
  const { theme } = useTheme();
  const { id } = route.params;
  const [content, setContent] = useState<ContentItem | null>(null);

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    const result = await contentService.getById(id);
    if (isOk(result)) {
      setContent(result.data);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Content",
      "Are you sure you want to delete this content? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (content) {
              await contentService.delete(content.id);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  const handlePublish = async () => {
    if (!content) return;

    Alert.alert(
      "Publish Now",
      "Are you sure you want to publish this content immediately?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: async () => {
            await contentService.publish(content.id);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            await loadContent();
            Alert.alert("Published!", "Your content has been published successfully.");
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ContentItem["status"]): string => {
    switch (status) {
      case "published": return theme.success;
      case "scheduled": return theme.warning;
      case "failed": return theme.error;
      default: return theme.textSecondary;
    }
  };

  const getPlatformIcon = (platform: string): keyof typeof Feather.glyphMap => {
    const icons: Record<string, keyof typeof Feather.glyphMap> = {
      instagram: "instagram",
      tiktok: "video",
      youtube: "youtube",
      linkedin: "linkedin",
      pinterest: "target",
    };
    return icons[platform] || "globe";
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!content) {
    return (
      <ScreenScrollView>
        <View style={styles.loadingContainer}>
          <ThemedText secondary>Loading...</ThemedText>
        </View>
      </ScreenScrollView>
    );
  }

  return (
    <ScreenScrollView>
      <View style={[styles.mediaPreview, { backgroundColor: theme.backgroundSecondary }]}>
        {content.mediaUri ? (
          <Feather name="image" size={48} color={theme.success} />
        ) : (
          <Feather name="file-text" size={48} color={theme.textSecondary} />
        )}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.statusRow}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(content.status) + "20" }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(content.status) }]} />
          <ThemedText style={{ color: getStatusColor(content.status), fontWeight: "600", textTransform: "capitalize" }}>
            {content.status}
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.md} />

      <ThemedText type="title1">{content.title || "Untitled"}</ThemedText>

      <Spacer height={Spacing.base} />

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <ThemedText type="subhead" style={styles.sectionLabel}>Caption</ThemedText>
        <ThemedText style={{ marginTop: Spacing.sm }}>
          {content.caption || "No caption added"}
        </ThemedText>
      </View>

      <Spacer height={Spacing.md} />

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <ThemedText type="subhead" style={styles.sectionLabel}>Platforms</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: Spacing.sm }}>
          {content.platforms.length > 0 ? (
            content.platforms.map((platform) => (
              <View
                key={platform}
                style={[styles.platformChip, { backgroundColor: theme.primary + "20" }]}
              >
                <Feather name={getPlatformIcon(platform)} size={16} color={theme.primary} />
                <ThemedText style={{ marginLeft: 6, textTransform: "capitalize", color: theme.primary }}>
                  {platform}
                </ThemedText>
              </View>
            ))
          ) : (
            <ThemedText secondary>No platforms selected</ThemedText>
          )}
        </ScrollView>
      </View>

      <Spacer height={Spacing.md} />

      <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
        <ThemedText type="subhead" style={styles.sectionLabel}>Details</ThemedText>
        <View style={styles.detailRow}>
          <ThemedText secondary>Created</ThemedText>
          <ThemedText>{formatDate(content.createdAt)}</ThemedText>
        </View>
        {content.scheduledAt ? (
          <View style={styles.detailRow}>
            <ThemedText secondary>Scheduled for</ThemedText>
            <ThemedText>{formatDate(content.scheduledAt)}</ThemedText>
          </View>
        ) : null}
        {content.publishedAt ? (
          <View style={styles.detailRow}>
            <ThemedText secondary>Published</ThemedText>
            <ThemedText>{formatDate(content.publishedAt)}</ThemedText>
          </View>
        ) : null}
      </View>

      <Spacer height={Spacing.lg} />

      {content.status === "draft" || content.status === "scheduled" ? (
        <>
          <Button onPress={handlePublish}>
            Publish Now
          </Button>
          <Spacer height={Spacing.md} />
        </>
      ) : null}

      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          { borderColor: theme.error, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="trash-2" size={18} color={theme.error} />
        <ThemedText style={{ color: theme.error, marginLeft: 8, fontWeight: "600" }}>
          Delete Content
        </ThemedText>
      </Pressable>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Spacing["2xl"],
  },
  mediaPreview: {
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  section: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  sectionLabel: {
    fontWeight: "600",
    opacity: 0.7,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
});
