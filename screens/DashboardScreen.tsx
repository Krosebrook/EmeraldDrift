import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Pressable, RefreshControl } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { storage, PlatformConnection, ContentItem, AnalyticsData } from "@/utils/storage";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { DashboardStackParamList } from "@/navigation/DashboardStackNavigator";

type DashboardScreenProps = {
  navigation: NativeStackNavigationProp<DashboardStackParamList, "Dashboard">;
};

interface KPICardProps {
  icon: keyof typeof Feather.glyphMap;
  value: string;
  label: string;
  trend?: number;
  color: string;
  onPress?: () => void;
}

function KPICard({ icon, value, label, trend, color, onPress }: KPICardProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.kpiCard,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.kpiIconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={24} color={color} />
      </View>
      <ThemedText style={styles.kpiValue}>{value}</ThemedText>
      <ThemedText type="caption" secondary>{label}</ThemedText>
      {trend !== undefined ? (
        <View style={styles.trendContainer}>
          <Feather
            name={trend >= 0 ? "trending-up" : "trending-down"}
            size={12}
            color={trend >= 0 ? theme.success : theme.error}
          />
          <ThemedText
            type="caption"
            style={{ color: trend >= 0 ? theme.success : theme.error, marginLeft: 2 }}
          >
            {Math.abs(trend)}%
          </ThemedText>
        </View>
      ) : null}
    </Pressable>
  );
}

interface PlatformCardProps {
  platform: PlatformConnection;
  onPress?: () => void;
}

function PlatformCard({ platform, onPress }: PlatformCardProps) {
  const { theme } = useTheme();

  const getPlatformColor = (platformName: string): string => {
    const colors: Record<string, string> = {
      instagram: theme.instagram,
      tiktok: theme.tiktok,
      youtube: theme.youtube,
      linkedin: theme.linkedin,
      pinterest: theme.pinterest,
    };
    return colors[platformName] || theme.primary;
  };

  const getPlatformIcon = (platformName: string): keyof typeof Feather.glyphMap => {
    const icons: Record<string, keyof typeof Feather.glyphMap> = {
      instagram: "instagram",
      tiktok: "video",
      youtube: "youtube",
      linkedin: "linkedin",
      pinterest: "target",
    };
    return icons[platformName] || "globe";
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.platformCard,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.platformIconContainer, { backgroundColor: getPlatformColor(platform.platform) + "20" }]}>
        <Feather name={getPlatformIcon(platform.platform)} size={20} color={getPlatformColor(platform.platform)} />
      </View>
      <View style={styles.platformInfo}>
        <ThemedText style={styles.platformName}>{platform.displayName}</ThemedText>
        <ThemedText type="caption" secondary>@{platform.username}</ThemedText>
      </View>
      <View style={styles.platformStats}>
        <ThemedText style={styles.followerCount}>{formatNumber(platform.followerCount)}</ThemedText>
        <ThemedText type="caption" secondary>followers</ThemedText>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

interface RecentPostCardProps {
  post: ContentItem;
  onPress?: () => void;
}

function RecentPostCard({ post, onPress }: RecentPostCardProps) {
  const { theme } = useTheme();

  const getStatusColor = () => {
    switch (post.status) {
      case "published": return theme.success;
      case "scheduled": return theme.warning;
      case "failed": return theme.error;
      default: return theme.textSecondary;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.recentPostCard,
        { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <View style={[styles.postThumbnail, { backgroundColor: theme.backgroundSecondary }]}>
        <Feather name="image" size={24} color={theme.textSecondary} />
      </View>
      <View style={styles.postInfo}>
        <ThemedText numberOfLines={1} style={styles.postTitle}>{post.title || "Untitled"}</ThemedText>
        <View style={styles.postMeta}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <ThemedText type="caption" secondary style={{ textTransform: "capitalize" }}>{post.status}</ThemedText>
          <ThemedText type="caption" secondary> - </ThemedText>
          <ThemedText type="caption" secondary>{formatDate(post.createdAt)}</ThemedText>
        </View>
      </View>
      <Feather name="chevron-right" size={20} color={theme.textSecondary} />
    </Pressable>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { theme } = useTheme();
  const { user } = useAuthContext();
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [platformsData, contentData, analyticsData] = await Promise.all([
      storage.getPlatforms(),
      storage.getContent(),
      storage.getAnalytics(),
    ]);
    setPlatforms(platformsData);
    setContent(contentData);
    setAnalytics(analyticsData);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const totalFollowers = platforms.reduce((sum, p) => sum + p.followerCount, 0);
  const recentPosts = content.slice(0, 5);

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <ThemedText type="title2" style={styles.greeting}>
        Hello, {user?.name || "Creator"}
      </ThemedText>
      <ThemedText secondary style={styles.subGreeting}>
        Here's your content overview
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={styles.kpiGrid}>
        <KPICard
          icon="users"
          value={formatNumber(totalFollowers)}
          label="Followers"
          trend={analytics?.growthRate || 0}
          color={theme.primary}
        />
        <KPICard
          icon="heart"
          value={formatNumber(analytics?.totalEngagement || 0)}
          label="Engagement"
          trend={12}
          color={theme.error}
        />
        <KPICard
          icon="eye"
          value={formatNumber(analytics?.totalViews || 0)}
          label="Views"
          trend={8}
          color={theme.success}
        />
        <KPICard
          icon="file-text"
          value={content.length.toString()}
          label="Posts"
          color={theme.warning}
        />
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.sectionHeader}>
        <ThemedText type="title3">Connected Platforms</ThemedText>
        <Pressable
          onPress={() => navigation.navigate("Platforms")}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="link">Manage</ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.md} />

      {platforms.length > 0 ? (
        platforms.map((platform) => (
          <React.Fragment key={platform.id}>
            <PlatformCard
              platform={platform}
              onPress={() => navigation.navigate("Platforms")}
            />
            <Spacer height={Spacing.sm} />
          </React.Fragment>
        ))
      ) : (
        <Pressable
          onPress={() => navigation.navigate("Platforms")}
          style={({ pressed }) => [
            styles.emptyCard,
            { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="plus-circle" size={32} color={theme.primary} />
          <Spacer height={Spacing.sm} />
          <ThemedText style={{ textAlign: "center" }}>Connect your first platform</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Link your social accounts to start publishing
          </ThemedText>
        </Pressable>
      )}

      <Spacer height={Spacing.lg} />

      <View style={styles.sectionHeader}>
        <ThemedText type="title3">Recent Content</ThemedText>
        <Pressable
          onPress={() => navigation.navigate("ContentList")}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
        >
          <ThemedText type="link">See All</ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.md} />

      {recentPosts.length > 0 ? (
        recentPosts.map((post) => (
          <React.Fragment key={post.id}>
            <RecentPostCard
              post={post}
              onPress={() => navigation.navigate("ContentDetail", { id: post.id })}
            />
            <Spacer height={Spacing.sm} />
          </React.Fragment>
        ))
      ) : (
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [
            styles.emptyCard,
            { backgroundColor: theme.cardBackground, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="edit-3" size={32} color={theme.primary} />
          <Spacer height={Spacing.sm} />
          <ThemedText style={{ textAlign: "center" }}>No content yet</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Tap the Studio tab to create your first post
          </ThemedText>
        </Pressable>
      )}

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  greeting: {
    marginTop: Spacing.sm,
  },
  subGreeting: {
    marginTop: Spacing.xs,
  },
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: "45%",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  kpiIconContainer: {
    width: Spacing.iconContainer,
    height: Spacing.iconContainer,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  platformIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  platformInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  platformName: {
    fontWeight: "600",
    fontSize: 15,
  },
  platformStats: {
    alignItems: "flex-end",
    marginRight: Spacing.sm,
  },
  followerCount: {
    fontWeight: "600",
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
  recentPostCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  postThumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  postInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  postTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginBottom: 2,
  },
  postMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
});
