import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert, Platform, ScrollView, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { useTheme } from "@/hooks/useTheme";
import { designService, PLATFORM_INFO, CATEGORY_INFO } from "@/features";
import type { ProductDesign, DesignPlatform } from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { StudioStackParamList } from "@/navigation/StudioStackNavigator";

type DesignDetailScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, "DesignDetail">;
  route: RouteProp<{ DesignDetail: { designId: string } }, "DesignDetail">;
};

export default function DesignDetailScreen({ navigation, route }: DesignDetailScreenProps) {
  const { theme, isDark } = useTheme();
  const { designId } = route.params;
  
  const [design, setDesign] = useState<ProductDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadDesign();
    }, [designId])
  );

  const loadDesign = async () => {
    setLoading(true);
    const result = await designService.getById(designId);
    if (isOk(result) && result.data) {
      setDesign(result.data);
      setEditTitle(result.data.title);
      setEditDescription(result.data.description);
    } else {
      Alert.alert("Error", "Design not found");
      navigation.goBack();
    }
    setLoading(false);
  };

  const handleEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setIsEditing(false);
    if (design) {
      setEditTitle(design.title);
      setEditDescription(design.description);
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      Alert.alert("Validation", "Title is required");
      return;
    }

    setSaving(true);
    const result = await designService.updateDesign(designId, {
      title: editTitle.trim(),
      description: editDescription.trim(),
    });

    if (isOk(result)) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setDesign(result.data);
      setIsEditing(false);
      Alert.alert("Success", "Design updated successfully");
    } else {
      Alert.alert("Error", "Failed to update design");
    }
    setSaving(false);
  };

  const handlePublish = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    navigation.navigate("PublishDesign", { designId });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Design",
      "Are you sure you want to delete this design? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await designService.deleteDesign(designId);
            if (isOk(result)) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
              navigation.goBack();
            } else {
              Alert.alert("Error", "Failed to delete design");
            }
          },
        },
      ]
    );
  };

  const handleDownload = async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const result = await designService.downloadDesign(designId);
    if (isOk(result)) {
      Alert.alert("Download", `Design URL: ${result.data}`);
    } else {
      Alert.alert("Error", "Failed to download design");
    }
  };

  if (loading || !design) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>Loading...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const platformInfo = PLATFORM_INFO[design.platform];
  const categoryInfo = CATEGORY_INFO[design.category];

  const getStatusColor = () => {
    switch (design.status) {
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

  return (
    <ThemedView style={styles.container}>
      <ScreenKeyboardAwareScrollView>
        {design.imageUri && (
          <Image
            source={{ uri: design.imageUri }}
            style={styles.mainImage}
            contentFit="contain"
          />
        )}

        <View style={styles.content}>
          {isEditing ? (
            <>
              <View style={styles.fieldContainer}>
                <ThemedText type="subhead" style={styles.label}>
                  Title
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundDefault,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Enter title..."
                  placeholderTextColor={theme.placeholder}
                />
              </View>

              <Spacer height={Spacing.base} />

              <View style={styles.fieldContainer}>
                <ThemedText type="subhead" style={styles.label}>
                  Description
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundDefault,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                  value={editDescription}
                  onChangeText={setEditDescription}
                  placeholder="Enter description..."
                  placeholderTextColor={theme.placeholder}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <Spacer height={Spacing.lg} />

              <View style={styles.editActions}>
                <Pressable
                  onPress={handleCancelEdit}
                  style={({ pressed }) => [
                    styles.editButton,
                    { borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <ThemedText secondary>Cancel</ThemedText>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  disabled={saving}
                  style={({ pressed }) => [
                    styles.editButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <ThemedText style={{ color: "#FFFFFF" }}>
                    {saving ? "Saving..." : "Save"}
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title1">{design.title}</ThemedText>
                  <Spacer height={Spacing.xs} />
                  <View style={styles.statusBadge}>
                    <Feather
                      name={design.status === "ready" ? "check-circle" : "clock"}
                      size={14}
                      color={getStatusColor()}
                    />
                    <ThemedText type="caption" style={{ color: getStatusColor(), marginLeft: 4 }}>
                      {design.status.charAt(0).toUpperCase() + design.status.slice(1)}
                    </ThemedText>
                  </View>
                </View>
                <Pressable
                  onPress={handleEdit}
                  style={({ pressed }) => [
                    styles.iconButton,
                    { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Feather name="edit-2" size={20} color={theme.primary} />
                </Pressable>
              </View>

              <Spacer height={Spacing.base} />

              {design.description && (
                <>
                  <ThemedText type="body" secondary>
                    {design.description}
                  </ThemedText>
                  <Spacer height={Spacing.lg} />
                </>
              )}

              <Card>
                <View style={styles.infoRow}>
                  <ThemedText type="subhead">Platform</ThemedText>
                  <View style={styles.platformBadge}>
                    <ThemedText
                      type="body"
                      style={{ color: platformInfo.color, fontWeight: "600" }}
                    >
                      {platformInfo.name}
                    </ThemedText>
                  </View>
                </View>

                <Spacer height={Spacing.md} />

                <View style={styles.infoRow}>
                  <ThemedText type="subhead">Category</ThemedText>
                  <ThemedText type="body">{categoryInfo.name}</ThemedText>
                </View>

                <Spacer height={Spacing.md} />

                <View style={styles.infoRow}>
                  <ThemedText type="subhead">Dimensions</ThemedText>
                  <ThemedText type="body">
                    {design.dimensions.width} × {design.dimensions.height} {design.dimensions.unit}
                  </ThemedText>
                </View>

                <Spacer height={Spacing.md} />

                <View style={styles.infoRow}>
                  <ThemedText type="subhead">Source</ThemedText>
                  <ThemedText type="body">
                    {design.source === "ai" ? "AI Generated" : "Uploaded"}
                  </ThemedText>
                </View>

                {design.publishedTo.length > 0 && (
                  <>
                    <Spacer height={Spacing.md} />
                    <View style={styles.infoRow}>
                      <ThemedText type="subhead">Published To</ThemedText>
                      <View style={styles.publishedList}>
                        {design.publishedTo.map((platform) => (
                          <View key={platform} style={styles.publishedBadge}>
                            <Feather name="check" size={12} color={theme.success} />
                            <ThemedText type="caption" style={{ color: theme.success, marginLeft: 4 }}>
                              {PLATFORM_INFO[platform].name}
                            </ThemedText>
                          </View>
                        ))}
                      </View>
                    </View>
                  </>
                )}
              </Card>

              <Spacer height={Spacing.lg} />

              {design.tags.length > 0 && (
                <>
                  <ThemedText type="subhead">Tags</ThemedText>
                  <Spacer height={Spacing.sm} />
                  <View style={styles.tagsContainer}>
                    {design.tags.map((tag, index) => (
                      <View key={index} style={[styles.tag, { backgroundColor: theme.backgroundDefault }]}>
                        <ThemedText type="caption">{tag}</ThemedText>
                      </View>
                    ))}
                  </View>
                  <Spacer height={Spacing.lg} />
                </>
              )}

              <Button onPress={handlePublish}>Publish to Platforms</Button>

              <Spacer height={Spacing.md} />

              <View style={styles.actionRow}>
                <Pressable
                  onPress={handleDownload}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Feather name="download" size={18} color={theme.primary} />
                  <ThemedText style={{ color: theme.primary, marginLeft: 6 }}>
                    Download
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleDelete}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: theme.error, opacity: pressed ? 0.9 : 1 },
                  ]}
                >
                  <Feather name="trash-2" size={18} color={theme.error} />
                  <ThemedText style={{ color: theme.error, marginLeft: 6 }}>
                    Delete
                  </ThemedText>
                </Pressable>
              </View>
            </>
          )}

          <Spacer height={Spacing.xl} />

          <Card>
            <ThemedText type="caption" secondary>
              Created: {new Date(design.createdAt).toLocaleDateString()}
            </ThemedText>
            <Spacer height={Spacing.xs} />
            <ThemedText type="caption" secondary>
              Updated: {new Date(design.updatedAt).toLocaleDateString()}
            </ThemedText>
          </Card>
        </View>
      </ScreenKeyboardAwareScrollView>
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
  mainImage: {
    width: "100%",
    height: 300,
    backgroundColor: "#f0f0f0",
  },
  content: {
    padding: Spacing.base,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  platformBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  publishedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  publishedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  fieldContainer: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.body.fontSize,
  },
  textArea: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  editActions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  editButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
});
