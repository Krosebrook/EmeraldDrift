import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, FlatList, Platform, Alert } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { designService, PLATFORM_INFO, CATEGORY_INFO } from "@/features";
import type { ProductDesign, DesignPlatform, DesignStatus } from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { StudioStackParamList } from "@/navigation/StudioStackNavigator";

type DesignListScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, "DesignList">;
};

const STATUS_FILTERS: { value: DesignStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ready", label: "Ready" },
  { value: "published", label: "Published" },
  { value: "draft", label: "Draft" },
  { value: "generating", label: "Generating" },
  { value: "failed", label: "Failed" },
];

export default function DesignListScreen({ navigation }: DesignListScreenProps) {
  const { theme, isDark } = useTheme();
  const { isMobile, cardWidth } = useResponsive();
  const [designs, setDesigns] = useState<ProductDesign[]>([]);
  const [filteredDesigns, setFilteredDesigns] = useState<ProductDesign[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<DesignStatus | "all">("all");

  useFocusEffect(
    useCallback(() => {
      loadDesigns();
    }, [])
  );

  const loadDesigns = async () => {
    setLoading(true);
    const result = await designService.getAll();
    if (isOk(result)) {
      setDesigns(result.data);
      filterDesigns(result.data, selectedFilter);
    }
    setLoading(false);
  };

  const filterDesigns = (allDesigns: ProductDesign[], filter: DesignStatus | "all") => {
    if (filter === "all") {
      setFilteredDesigns(allDesigns);
    } else {
      setFilteredDesigns(allDesigns.filter((d) => d.status === filter));
    }
  };

  const handleFilterChange = (filter: DesignStatus | "all") => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedFilter(filter);
    filterDesigns(designs, filter);
  };

  const handleDesignPress = (design: ProductDesign) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("DesignDetail", { designId: design.id });
  };

  const handleCreateNew = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("DesignStudio");
  };

  const getStatusColor = (status: DesignStatus) => {
    switch (status) {
      case "ready":
        return theme.success;
      case "published":
        return theme.primary;
      case "generating":
        return theme.warning;
      case "failed":
        return theme.error;
      default:
        return theme.textSecondary;
    }
  };

  const getStatusIcon = (status: DesignStatus) => {
    switch (status) {
      case "ready":
        return "check-circle";
      case "published":
        return "send";
      case "generating":
        return "loader";
      case "failed":
        return "alert-circle";
      default:
        return "file";
    }
  };

  const renderDesignCard = ({ item }: { item: ProductDesign }) => {
    const platformInfo = PLATFORM_INFO[item.platform];
    const categoryInfo = CATEGORY_INFO[item.category];
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);

    return (
      <Pressable
        onPress={() => handleDesignPress(item)}
        style={({ pressed }) => [
          styles.designCard,
          { width: cardWidth, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Card style={styles.cardContent}>
          {item.thumbnailUri ? (
            <Image
              source={{ uri: item.thumbnailUri }}
              style={styles.thumbnail}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.thumbnailPlaceholder, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="image" size={32} color={theme.textSecondary} />
            </View>
          )}
          
          <View style={styles.cardDetails}>
            <ThemedText type="title3" numberOfLines={1}>
              {item.title}
            </ThemedText>
            
            <Spacer height={Spacing.xs} />
            
            <View style={styles.metaRow}>
              <View style={styles.badge}>
                <Feather name={categoryInfo.icon as keyof typeof Feather.glyphMap} size={12} color={theme.textSecondary} />
                <ThemedText type="caption" secondary style={styles.badgeText}>
                  {categoryInfo.name}
                </ThemedText>
              </View>
              
              <View style={[styles.badge, { backgroundColor: `${platformInfo.color}20` }]}>
                <ThemedText type="caption" style={{ color: platformInfo.color, fontWeight: "600" }}>
                  {platformInfo.name}
                </ThemedText>
              </View>
            </View>
            
            <Spacer height={Spacing.xs} />
            
            <View style={styles.statusRow}>
              <Feather name={statusIcon as keyof typeof Feather.glyphMap} size={14} color={statusColor} />
              <ThemedText type="caption" style={{ color: statusColor, marginLeft: 4 }}>
                {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
              </ThemedText>
              
              {item.publishedTo.length > 0 && (
                <View style={styles.publishBadge}>
                  <Feather name="check" size={12} color={theme.success} />
                  <ThemedText type="caption" style={{ color: theme.success, marginLeft: 2 }}>
                    {item.publishedTo.length} published
                  </ThemedText>
                </View>
              )}
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="grid" size={64} color={theme.textSecondary} />
      <Spacer height={Spacing.base} />
      <ThemedText type="title2">No Designs Yet</ThemedText>
      <Spacer height={Spacing.sm} />
      <ThemedText type="body" secondary style={styles.emptyText}>
        Create your first product design for print-on-demand platforms
      </ThemedText>
      <Spacer height={Spacing.lg} />
      <Pressable
        onPress={handleCreateNew}
        style={({ pressed }) => [
          styles.createButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="plus" size={20} color="#FFFFFF" />
        <ThemedText style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}>
          Create Design
        </ThemedText>
      </Pressable>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <ThemedText type="title2">{designs.length}</ThemedText>
            <ThemedText type="caption" secondary>Total</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="title2" style={{ color: theme.success }}>
              {designs.filter((d) => d.status === "ready").length}
            </ThemedText>
            <ThemedText type="caption" secondary>Ready</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText type="title2" style={{ color: theme.primary }}>
              {designs.filter((d) => d.publishedTo.length > 0).length}
            </ThemedText>
            <ThemedText type="caption" secondary>Published</ThemedText>
          </View>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          horizontal
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => {
            const isSelected = selectedFilter === item.value;
            return (
              <Pressable
                onPress={() => handleFilterChange(item.value)}
                style={({ pressed }) => [
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                    borderColor: isSelected ? theme.primary : theme.border,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <ThemedText
                  type="callout"
                  style={{
                    color: isSelected ? "#FFFFFF" : theme.text,
                    fontWeight: isSelected ? "600" : "400",
                  }}
                >
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={filteredDesigns}
        keyExtractor={(item) => item.id}
        renderItem={renderDesignCard}
        numColumns={numColumns}
        key={numColumns}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={loading ? null : renderEmpty}
        onRefresh={loadDesigns}
        refreshing={loading}
      />

      <Pressable
        onPress={handleCreateNew}
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="plus" size={24} color="#FFFFFF" />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  filterContainer: {
    paddingVertical: Spacing.md,
  },
  filterList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  listContent: {
    padding: Spacing.base,
    gap: Spacing.base,
  },
  designCard: {
    marginBottom: Spacing.base,
  },
  cardContent: {
    overflow: "hidden",
  },
  thumbnail: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  thumbnailPlaceholder: {
    width: "100%",
    aspectRatio: 4 / 3,
    alignItems: "center",
    justifyContent: "center",
  },
  cardDetails: {
    padding: Spacing.md,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  badgeText: {
    marginLeft: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  publishBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyText: {
    textAlign: "center",
    maxWidth: 300,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
});
