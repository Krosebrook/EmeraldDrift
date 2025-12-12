import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Card } from "@/components/Card";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: FeatherIconName;
  trend?: { value: number; isPositive: boolean };
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

function formatNumber(value: string | number): string {
  if (typeof value === "string") return value;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  onPress,
  style,
}: MetricCardProps) {
  const { theme } = useTheme();

  return (
    <Card onPress={onPress} style={[styles.card, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={[styles.iconContainer, { backgroundColor: theme.primaryLight }]}>
            <Feather name={icon} size={18} color={theme.primary} />
          </View>
        ) : null}
        <ThemedText type="caption" secondary numberOfLines={1} style={styles.title}>
          {title}
        </ThemedText>
      </View>

      <ThemedText type="title1" style={styles.value}>
        {formatNumber(value)}
      </ThemedText>

      <View style={styles.footer}>
        {subtitle ? (
          <ThemedText type="caption" secondary numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
        {trend ? (
          <View style={styles.trend}>
            <Feather
              name={trend.isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={trend.isPositive ? theme.success : theme.error}
            />
            <ThemedText
              type="caption"
              style={{ color: trend.isPositive ? theme.success : theme.error, marginLeft: 2 }}
            >
              {trend.value}%
            </ThemedText>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  title: {
    flex: 1,
  },
  value: {
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  trend: {
    flexDirection: "row",
    alignItems: "center",
  },
});
