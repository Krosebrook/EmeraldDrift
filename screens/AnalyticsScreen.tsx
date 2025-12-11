import React, { useState, useCallback, useMemo } from "react";
import { StyleSheet, View, Pressable, RefreshControl, Dimensions, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { useAuthContext } from "@/context/AuthContext";
import { userStatsService, UserStats } from "@/services/userStats";
import { storage, AnalyticsData, PlatformConnection } from "@/utils/storage";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { AnalyticsStackParamList } from "@/navigation/AnalyticsStackNavigator";

type AnalyticsScreenProps = {
  navigation: NativeStackNavigationProp<AnalyticsStackParamList, "Analytics">;
};

type TimeRange = "7d" | "30d" | "90d";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function SimpleBarChart({ data, color, label }: { data: number[]; color: string; label: string }) {
  const { theme } = useTheme();
  const { isMobile, contentWidth } = useResponsive();
  const maxValue = Math.max(...data, 1);
  const chartWidth = contentWidth - Spacing.lg;
  const barWidth = (chartWidth - Spacing.sm * (data.length - 1)) / data.length;
  const chartHeight = isMobile ? 120 : 160;

  return (
    <View>
      <ThemedText type="subhead" style={{ marginBottom: Spacing.md, fontWeight: "600" }}>
        {label}
      </ThemedText>
      <View style={[styles.chartContainer, { width: chartWidth }]}>
        <View style={[styles.barsContainer, { height: chartHeight }]}>
          {data.map((value, index) => {
            const height = (value / maxValue) * chartHeight;
            return (
              <View
                key={index}
                style={[
                  styles.bar,
                  {
                    width: Math.max(barWidth - Spacing.xs, 4),
                    height: Math.max(height, 2),
                    backgroundColor: color,
                    opacity: 0.3 + (value / maxValue) * 0.7,
                  },
                ]}
              />
            );
          })}
        </View>
        <View style={[styles.chartBaseline, { backgroundColor: theme.border }]} />
      </View>
    </View>
  );
}

interface MetricCardProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  change?: number;
  color: string;
}

function MetricCard({ icon, label, value, change, color }: MetricCardProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.metricCard, { backgroundColor: theme.cardBackground }]}>
      <View style={[styles.metricIconContainer, { backgroundColor: color + "20" }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <View style={styles.metricContent}>
        <ThemedText type="caption" secondary>{label}</ThemedText>
        <ThemedText style={styles.metricValue}>{value}</ThemedText>
      </View>
      {change !== undefined ? (
        <View style={styles.metricChange}>
          <Feather
            name={change >= 0 ? "arrow-up-right" : "arrow-down-right"}
            size={14}
            color={change >= 0 ? theme.success : theme.error}
          />
          <ThemedText
            type="caption"
            style={{ color: change >= 0 ? theme.success : theme.error }}
          >
            {Math.abs(change)}%
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

interface PlatformStatsProps {
  platform: PlatformConnection;
  stats: {
    followers: number;
    engagement: number;
    posts: number;
  };
}

function PlatformStats({ platform, stats }: PlatformStatsProps) {
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <View style={[styles.platformStatsCard, { backgroundColor: theme.cardBackground }]}>
      <View style={styles.platformHeader}>
        <View style={[styles.platformIcon, { backgroundColor: getPlatformColor(platform.platform) + "20" }]}>
          <Feather name={getPlatformIcon(platform.platform)} size={20} color={getPlatformColor(platform.platform)} />
        </View>
        <View style={styles.platformNameContainer}>
          <ThemedText style={styles.platformName}>{platform.displayName}</ThemedText>
          <ThemedText type="caption" secondary>@{platform.username}</ThemedText>
        </View>
      </View>
      <View style={styles.platformMetrics}>
        <View style={styles.platformMetricItem}>
          <ThemedText style={styles.platformMetricValue}>{formatNumber(stats.followers)}</ThemedText>
          <ThemedText type="caption" secondary>Followers</ThemedText>
        </View>
        <View style={styles.platformMetricItem}>
          <ThemedText style={styles.platformMetricValue}>{stats.engagement.toFixed(1)}%</ThemedText>
          <ThemedText type="caption" secondary>Engagement</ThemedText>
        </View>
        <View style={styles.platformMetricItem}>
          <ThemedText style={styles.platformMetricValue}>{stats.posts}</ThemedText>
          <ThemedText type="caption" secondary>Posts</ThemedText>
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen({ navigation }: AnalyticsScreenProps) {
  const { theme } = useTheme();
  const { isMobile, isTablet, contentWidth, numColumns } = useResponsive();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [analyticsData, platformsData] = await Promise.all([
      storage.getAnalytics(),
      storage.getPlatforms(),
    ]);
    setAnalytics(analyticsData);
    setPlatforms(platformsData);
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

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const mockChartData = [12, 19, 14, 25, 22, 30, 28];
  const mockEngagementData = [5.2, 4.8, 6.1, 5.5, 7.2, 6.8, 7.5];

  return (
    <ScreenScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
      }
    >
      <View style={styles.timeRangeContainer}>
        {(["7d", "30d", "90d"] as TimeRange[]).map((range) => (
          <Pressable
            key={range}
            onPress={() => setTimeRange(range)}
            style={({ pressed }) => [
              styles.timeRangeButton,
              {
                backgroundColor: timeRange === range ? theme.primary : theme.backgroundDefault,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <ThemedText
              style={[
                styles.timeRangeText,
                { color: timeRange === range ? "#FFFFFF" : theme.text },
              ]}
            >
              {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.metricsGrid, { maxWidth: contentWidth, alignSelf: "center", width: "100%" }]}>
        <View style={[styles.metricCardWrapper, { width: isMobile ? "48%" : isTablet ? "31%" : "23%" }]}>
          <MetricCard
            icon="users"
            label="Total Followers"
            value={formatNumber(analytics?.totalFollowers || 0)}
            change={analytics?.growthRate || 0}
            color={theme.primary}
          />
        </View>
        <View style={[styles.metricCardWrapper, { width: isMobile ? "48%" : isTablet ? "31%" : "23%" }]}>
          <MetricCard
            icon="heart"
            label="Engagement Rate"
            value={`${(analytics?.totalEngagement || 0).toFixed(1)}%`}
            change={12}
            color={theme.error}
          />
        </View>
        <View style={[styles.metricCardWrapper, { width: isMobile ? "48%" : isTablet ? "31%" : "23%" }]}>
          <MetricCard
            icon="eye"
            label="Total Views"
            value={formatNumber(analytics?.totalViews || 0)}
            change={8}
            color={theme.success}
          />
        </View>
        <View style={[styles.metricCardWrapper, { width: isMobile ? "48%" : isTablet ? "31%" : "23%" }]}>
          <MetricCard
            icon="send"
            label="Total Posts"
            value={analytics?.totalPosts.toString() || "0"}
            color={theme.warning}
          />
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
        <SimpleBarChart data={mockChartData} color={theme.primary} label="Follower Growth" />
        <Spacer height={Spacing.sm} />
        <View style={styles.chartLabels}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <ThemedText key={day} type="caption" secondary style={styles.chartLabel}>
              {day}
            </ThemedText>
          ))}
        </View>
      </View>

      <Spacer height={Spacing.base} />

      <View style={[styles.chartCard, { backgroundColor: theme.cardBackground }]}>
        <SimpleBarChart data={mockEngagementData} color={theme.success} label="Engagement Rate" />
        <Spacer height={Spacing.sm} />
        <View style={styles.chartLabels}>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <ThemedText key={day} type="caption" secondary style={styles.chartLabel}>
              {day}
            </ThemedText>
          ))}
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3">Platform Performance</ThemedText>
      <Spacer height={Spacing.md} />

      {platforms.length > 0 ? (
        platforms.map((platform) => (
          <React.Fragment key={platform.id}>
            <PlatformStats
              platform={platform}
              stats={{
                followers: platform.followerCount,
                engagement: 4.5 + Math.random() * 3,
                posts: Math.floor(Math.random() * 50) + 10,
              }}
            />
            <Spacer height={Spacing.sm} />
          </React.Fragment>
        ))
      ) : (
        <View style={[styles.emptyState, { backgroundColor: theme.cardBackground }]}>
          <Feather name="bar-chart-2" size={48} color={theme.textSecondary} />
          <Spacer height={Spacing.md} />
          <ThemedText style={{ textAlign: "center" }}>No platforms connected</ThemedText>
          <ThemedText type="caption" secondary style={{ textAlign: "center" }}>
            Connect your social accounts to see analytics
          </ThemedText>
        </View>
      )}

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  timeRangeContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: Spacing.sm,
  },
  metricCardWrapper: {
    marginBottom: Spacing.sm,
  },
  metricCard: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  metricIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  metricContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  metricChange: {
    flexDirection: "row",
    alignItems: "center",
  },
  chartCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.lg,
  },
  chartTitle: {
    fontWeight: "600",
  },
  chartContainer: {
    height: 180,
    justifyContent: "flex-end",
  },
  barsContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 160,
  },
  bar: {
    borderRadius: 4,
  },
  chartBaseline: {
    height: 1,
    marginTop: Spacing.xs,
  },
  chartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
  },
  platformStatsCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  platformHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  platformIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  platformNameContainer: {
    marginLeft: Spacing.md,
  },
  platformName: {
    fontWeight: "600",
    fontSize: 16,
  },
  platformMetrics: {
    flexDirection: "row",
  },
  platformMetricItem: {
    flex: 1,
    alignItems: "center",
  },
  platformMetricValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
  },
});
