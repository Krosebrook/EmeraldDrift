import React, { useState, useCallback, useMemo, memo } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  RefreshControl,
  Alert,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenFlatList } from "@/components/ScreenFlatList";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { contentService } from "@/features";
import { isOk } from "@/core/result";
import type { ContentItem } from "@/features/shared/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { DashboardStackParamList } from "@/navigation/DashboardStackNavigator";
import { AppTheme } from "@/types";

type ContentListScreenProps = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, "ContentList">;
};

type FilterType = "all" | "draft" | "scheduled" | "published";

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const getStatusColor = (
  status: ContentItem["status"],
  theme: AppTheme,
): string => {
  switch (status) {
    case "published":
      return theme.success;
    case "scheduled":
      return theme.warning;
    case "failed":
      return theme.error;
    default:
      return theme.textSecondary;
  }
};

const ContentItemRow = memo(function ContentItemRow({
  item,
  theme,
  onPress,
  onLongPress,
}: {
  item: ContentItem;
  theme: AppTheme;
  onPress: () => void;
  onLongPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.contentCard,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      <View
        style={[
          styles.thumbnail,
          { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        {item.mediaUri ? (
          <Feather name="image" size={24} color={theme.textSecondary} />
        ) : (
          <Feather name="file-text" size={24} color={theme.textSecondary} />
        )}
      </View>
      <View style={styles.contentInfo}>
        <ThemedText numberOfLines={1} style={styles.contentTitle}>
          {item.title || "Untitled"}
        </ThemedText>
        <ThemedText type="caption" secondary numberOfLines={1}>
          {item.caption || "No caption"}
        </ThemedText>
        <View style={styles.contentMeta}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status, theme) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status, theme) },
              ]}
            />
            <ThemedText
              type="caption"
              style={{
                color: getStatusColor(item.status, theme),
                textTransform: "capitalize",
              }}
            >
              {item.status}
            </ThemedText>
          </View>
          <ThemedText type="caption" secondary>
            {formatDate(item.createdAt)}
          </ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
});

const ContentListHeader = memo(function ContentListHeader({
  filter,
  onFilterChange,
  theme,
}: {
  filter: FilterType;
  onFilterChange: (type: FilterType) => void;
  theme: AppTheme;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.filterContainer}>
        {(["all", "draft", "scheduled", "published"] as FilterType[]).map(
          (type) => (
            <Pressable
              key={type}
              onPress={() => onFilterChange(type)}
              style={({ pressed }) => [
                styles.filterButton,
                {
                  backgroundColor:
                    filter === type ? theme.primary : theme.cardBackground,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText
                type="caption"
                style={{
                  color: filter === type ? "#FFFFFF" : theme.text,
                  fontWeight: "600",
                  textTransform: "capitalize",
                }}
              >
                {type}
              </ThemedText>
            </Pressable>
          ),
        )}
      </View>
    </View>
  );
});

const ContentListEmpty = memo(function ContentListEmpty({
  filter,
  theme,
}: {
  filter: FilterType;
  theme: AppTheme;
}) {
  return (
    <View
      style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}
    >
      <Feather name="inbox" size={48} color={theme.textSecondary} />
      <ThemedText style={{ marginTop: Spacing.md, textAlign: "center" }}>
        {filter === "all" ? "No content yet" : `No ${filter} content`}
      </ThemedText>
      <ThemedText
        type="caption"
        secondary
        style={{ textAlign: "center", marginTop: Spacing.xs }}
      >
        {filter === "all"
          ? "Create your first post in the Studio"
          : `You don't have any ${filter} content`}
      </ThemedText>
    </View>
  );
});

const ItemSeparator = () => <View style={{ height: Spacing.sm }} />;

export default function ContentListScreen({
  navigation,
}: ContentListScreenProps) {
  const { theme } = useTheme();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");

  const loadContent = useCallback(async () => {
    const result = await contentService.getAll();
    if (isOk(result)) {
      setContent(result.data);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContent();
    }, [loadContent]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContent();
    setRefreshing(false);
  }, [loadContent]);

  const handleDelete = useCallback(
    (item: ContentItem) => {
      Alert.alert(
        "Delete Content",
        "Are you sure you want to delete this content?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              await contentService.delete(item.id);
              await loadContent();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
              }
            },
          },
        ],
      );
    },
    [loadContent],
  );

  const filteredContent = useMemo(() => {
    return content.filter((item) => {
      if (filter === "all") return true;
      return item.status === filter;
    });
  }, [content, filter]);

  const handleFilterChange = useCallback((type: FilterType) => {
    setFilter(type);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ContentItem }) => (
      <ContentItemRow
        item={item}
        theme={theme}
        onPress={() => navigation.navigate("ContentDetail", { id: item.id })}
        onLongPress={() => handleDelete(item)}
      />
    ),
    [navigation, handleDelete, theme],
  );

  return (
    <ScreenFlatList
      data={filteredContent}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <ContentListHeader
          filter={filter}
          onFilterChange={handleFilterChange}
          theme={theme}
        />
      }
      ListEmptyComponent={<ContentListEmpty filter={filter} theme={theme} />}
      ItemSeparatorComponent={ItemSeparator}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  filterButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  contentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  contentInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  contentTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 2,
  },
  contentMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
    gap: Spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
});
