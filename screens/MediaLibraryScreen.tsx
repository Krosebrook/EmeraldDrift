import React, { useState, useCallback, useMemo } from "react";
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Platform,
  Alert,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import { mediaLibraryService, MediaAsset, MediaCategory } from "@/services/mediaLibrary";
import { AppTheme } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_SPACING = Spacing.xs;
const NUM_COLUMNS = 3;
const ITEM_WIDTH = (SCREEN_WIDTH - Spacing.base * 2 - GRID_SPACING * (NUM_COLUMNS - 1)) / NUM_COLUMNS;

type FilterTab = MediaCategory | string;

interface CategoryChip {
  id: FilterTab;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}

const BASE_CATEGORIES: CategoryChip[] = [
  { id: "all", label: "All", icon: "grid" },
  { id: "images", label: "Images", icon: "image" },
  { id: "videos", label: "Videos", icon: "video" },
  { id: "favorites", label: "Favorites", icon: "heart" },
];

const MediaItem = React.memo(({ item, onPress, theme }: { item: MediaAsset, onPress: (item: MediaAsset) => void, theme: AppTheme }) => (
  <Pressable
    onPress={() => onPress(item)}
    style={({ pressed }) => [
      styles.mediaItem,
      { opacity: pressed ? 0.8 : 1 },
    ]}
    accessibilityLabel={`${item.type === "video" ? "Video" : "Image"}, ${item.fileName || "Media asset"}${item.isFavorite ? ", favorited" : ""}`}
    accessibilityRole="button"
    accessibilityHint="Double tap to view details"
  >
    <Image
      source={{ uri: item.uri }}
      style={styles.mediaImage}
      contentFit="cover"
      transition={200}
    />
    {item.type === "video" ? (
      <View style={styles.videoIndicator}>
        <Feather name="play-circle" size={20} color="#FFFFFF" />
      </View>
    ) : null}
    {item.isFavorite ? (
      <View style={[styles.favoriteIndicator, { backgroundColor: theme.error }]}>
        <Feather name="heart" size={10} color="#FFFFFF" />
      </View>
    ) : null}
  </Pressable>
));

export default function MediaLibraryScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isAddingMedia, setIsAddingMedia] = useState(false);

  const loadLibrary = useCallback(async () => {
    setIsLoading(true);
    const library = await mediaLibraryService.getLibrary();
    setAssets(library.assets);
    setCategories(library.categories);
    setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLibrary();
    }, [loadLibrary])
  );

  const filteredAssets = useMemo(() => {
    return mediaLibraryService.filterAssets(assets, {
      category: activeFilter,
      search: searchQuery,
    });
  }, [assets, activeFilter, searchQuery]);

  const allCategoryChips = useMemo((): CategoryChip[] => {
    const customCategories: CategoryChip[] = categories.map((cat) => ({
      id: cat,
      label: cat,
      icon: "folder" as keyof typeof Feather.glyphMap,
    }));
    return [...BASE_CATEGORIES, ...customCategories];
  }, [categories]);

  const handleAddMedia = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow access to your photo library to add media.");
      return;
    }

    setIsAddingMedia(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const itemsToAdd = result.assets.map((pickedAsset) => ({
          uri: pickedAsset.uri,
          width: pickedAsset.width,
          height: pickedAsset.height,
          duration: pickedAsset.duration || undefined,
          fileSize: pickedAsset.fileSize || 0,
        }));
        
        await mediaLibraryService.addAssetsBatch(itemsToAdd);
        await loadLibrary();
        
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error adding media:", error);
      Alert.alert("Error", "Failed to add media. Please try again.");
    } finally {
      setIsAddingMedia(false);
    }
  };

  const handleToggleFavorite = async (asset: MediaAsset) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    const updatedAsset = await mediaLibraryService.toggleFavorite(asset.id);
    if (updatedAsset) {
      setAssets((prev) => prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a)));
      if (selectedAsset?.id === asset.id) {
        setSelectedAsset(updatedAsset);
      }
    }
  };

  const handleDeleteAsset = async (asset: MediaAsset) => {
    Alert.alert(
      "Delete Media",
      `Are you sure you want to delete "${asset.fileName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await mediaLibraryService.deleteAsset(asset.id);
            setShowAssetModal(false);
            setSelectedAsset(null);
            setAssets((prev) => prev.filter((a) => a.id !== asset.id));
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          },
        },
      ]
    );
  };

  const openAssetDetail = useCallback((asset: MediaAsset) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedAsset(asset);
    setShowAssetModal(true);
  }, []);

  const renderMediaItem = useCallback(({ item }: { item: MediaAsset }) => (
    <MediaItem item={item} onPress={openAssetDetail} theme={theme} />
  ), [openAssetDetail, theme]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Feather name="image" size={64} color={theme.textSecondary} />
      <ThemedText type="title3" style={{ marginTop: Spacing.md, textAlign: "center" }}>
        {searchQuery ? "No Results Found" : "No Media Yet"}
      </ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs, textAlign: "center" }}>
        {searchQuery
          ? "Try a different search term"
          : "Add photos and videos to your library"}
      </ThemedText>
      {!searchQuery ? (
        <Pressable
          onPress={handleAddMedia}
          style={[styles.emptyButton, { backgroundColor: theme.primary }]}
          accessibilityLabel="Add Media"
          accessibilityRole="button"
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <ThemedText style={{ color: "#FFFFFF", marginLeft: Spacing.xs, fontWeight: "600" }}>
            Add Media
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );

  const renderHeader = () => (
    <>
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundSecondary }]}>
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search media..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search media"
          />
          {searchQuery.length > 0 ? (
            <Pressable
              onPress={() => setSearchQuery("")}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Feather name="x" size={18} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
      >
        {allCategoryChips.map((chip) => {
          const isActive = activeFilter === chip.id;
          return (
            <Pressable
              key={chip.id}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setActiveFilter(chip.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? theme.primary : theme.backgroundSecondary,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${chip.label}`}
              accessibilityState={{ selected: isActive }}
            >
              <Feather
                name={chip.icon}
                size={14}
                color={isActive ? "#FFFFFF" : theme.textSecondary}
              />
              <ThemedText
                style={{
                  marginLeft: 6,
                  fontSize: 13,
                  color: isActive ? "#FFFFFF" : theme.text,
                }}
              >
                {chip.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.statsRow}>
        <ThemedText secondary type="caption">
          {filteredAssets.length} {filteredAssets.length === 1 ? "item" : "items"}
        </ThemedText>
      </View>
    </>
  );

  if (isLoading) {
    return (
      <ThemedView style={[styles.container, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={filteredAssets}
        renderItem={renderMediaItem}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={filteredAssets.length > 0 ? styles.gridRow : undefined}
        contentContainerStyle={[
          styles.gridContent,
          { paddingBottom: insets.bottom + 80 + Spacing.xl },
        ]}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        initialNumToRender={15}
        windowSize={5}
        removeClippedSubviews={true}
      />

      <Pressable
        onPress={handleAddMedia}
        disabled={isAddingMedia}
        style={({ pressed }) => [
          styles.fab,
          {
            backgroundColor: theme.primary,
            bottom: insets.bottom + Spacing.base,
            opacity: pressed ? 0.9 : 1,
          },
        ]}
        accessibilityLabel="Add Media"
        accessibilityRole="button"
        accessibilityState={{ disabled: isAddingMedia, busy: isAddingMedia }}
      >
        {isAddingMedia ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Feather name="plus" size={24} color="#FFFFFF" />
        )}
      </Pressable>

      <Modal
        visible={showAssetModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAssetModal(false)}
      >
        <ThemedView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable
              onPress={() => setShowAssetModal(false)}
              accessibilityLabel="Close details"
              accessibilityRole="button"
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
            <ThemedText type="title3">Media Details</ThemedText>
            <Pressable
              onPress={() => selectedAsset && handleToggleFavorite(selectedAsset)}
              accessibilityLabel={selectedAsset?.isFavorite ? "Remove from favorites" : "Add to favorites"}
              accessibilityRole="button"
              accessibilityState={{ selected: selectedAsset?.isFavorite }}
            >
              <Feather
                name="heart"
                size={24}
                color={selectedAsset?.isFavorite ? theme.error : theme.textSecondary}
              />
            </Pressable>
          </View>

          {selectedAsset ? (
            <ScrollView style={styles.modalContent}>
              <Image
                source={{ uri: selectedAsset.uri }}
                style={styles.previewImage}
                contentFit="contain"
              />

              <View style={styles.detailsSection}>
                <ThemedText type="title3" style={{ marginBottom: Spacing.sm }}>
                  {selectedAsset.fileName}
                </ThemedText>

                <View style={styles.detailRow}>
                  <Feather name="file" size={16} color={theme.textSecondary} />
                  <ThemedText secondary style={{ marginLeft: Spacing.sm }}>
                    {selectedAsset.type === "image" ? "Image" : "Video"}
                    {selectedAsset.fileSize > 0 ? ` - ${mediaLibraryService.formatFileSize(selectedAsset.fileSize)}` : ""}
                  </ThemedText>
                </View>

                {selectedAsset.width && selectedAsset.height ? (
                  <View style={styles.detailRow}>
                    <Feather name="maximize" size={16} color={theme.textSecondary} />
                    <ThemedText secondary style={{ marginLeft: Spacing.sm }}>
                      {selectedAsset.width} x {selectedAsset.height}
                    </ThemedText>
                  </View>
                ) : null}

                {selectedAsset.duration ? (
                  <View style={styles.detailRow}>
                    <Feather name="clock" size={16} color={theme.textSecondary} />
                    <ThemedText secondary style={{ marginLeft: Spacing.sm }}>
                      {Math.round(selectedAsset.duration / 1000)}s
                    </ThemedText>
                  </View>
                ) : null}

                <View style={styles.detailRow}>
                  <Feather name="calendar" size={16} color={theme.textSecondary} />
                  <ThemedText secondary style={{ marginLeft: Spacing.sm }}>
                    Added {new Date(selectedAsset.createdAt).toLocaleDateString()}
                  </ThemedText>
                </View>

                {selectedAsset.usedIn.length > 0 ? (
                  <View style={[styles.usedInBadge, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check-circle" size={14} color={theme.success} />
                    <ThemedText style={{ marginLeft: Spacing.xs, color: theme.success, fontSize: 13 }}>
                      Used in {selectedAsset.usedIn.length} {selectedAsset.usedIn.length === 1 ? "post" : "posts"}
                    </ThemedText>
                  </View>
                ) : null}

                {selectedAsset.category.length > 0 ? (
                  <View style={styles.tagsContainer}>
                    <ThemedText type="caption" secondary style={{ marginBottom: Spacing.xs }}>
                      Categories
                    </ThemedText>
                    <View style={styles.tagsRow}>
                      {selectedAsset.category.map((cat) => (
                        <View
                          key={cat}
                          style={[styles.tag, { backgroundColor: theme.primary + "20" }]}
                        >
                          <ThemedText style={{ color: theme.primary, fontSize: 12 }}>{cat}</ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </View>

              <View style={styles.actionsSection}>
                <Pressable
                  onPress={() => selectedAsset && handleDeleteAsset(selectedAsset)}
                  style={[styles.deleteButton, { backgroundColor: theme.error + "15" }]}
                >
                  <Feather name="trash-2" size={18} color={theme.error} />
                  <ThemedText style={{ marginLeft: Spacing.sm, color: theme.error }}>
                    Delete from Library
                  </ThemedText>
                </Pressable>
              </View>

              <Spacer height={Spacing["2xl"]} />
            </ScrollView>
          ) : null}
        </ThemedView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
  },
  statsRow: {
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
  },
  gridContent: {
    paddingHorizontal: Spacing.base,
    flexGrow: 1,
  },
  gridRow: {
    gap: GRID_SPACING,
    marginBottom: GRID_SPACING,
  },
  mediaItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
    position: "relative",
  },
  mediaImage: {
    width: "100%",
    height: "100%",
  },
  videoIndicator: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    padding: 2,
  },
  favoriteIndicator: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 10,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.lg,
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  fab: {
    position: "absolute",
    right: Spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  modalContent: {
    flex: 1,
  },
  previewImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#000",
  },
  detailsSection: {
    padding: Spacing.base,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  usedInBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    alignSelf: "flex-start",
  },
  tagsContainer: {
    marginTop: Spacing.md,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  actionsSection: {
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: "rgba(128,128,128,0.2)",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
