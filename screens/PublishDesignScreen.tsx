import React, { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { Image } from "expo-image";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { 
  designService, 
  PLATFORM_INFO,
} from "@/features";
import type { 
  DesignPlatform, 
  ProductDesign,
  UploadTarget,
} from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

type PublishDesignScreenProps = {
  navigation: NativeStackNavigationProp<any, "PublishDesign">;
  route: RouteProp<{ PublishDesign: { designId: string } }, "PublishDesign">;
};

const PUBLISHABLE_PLATFORMS: DesignPlatform[] = [
  "printify",
  "shopify",
  "amazon_kdp",
  "etsy",
  "tiktok_shop",
  "gumroad",
];

export default function PublishDesignScreen({ navigation, route }: PublishDesignScreenProps) {
  const { theme, isDark } = useTheme();
  const { designId } = route.params;

  const [design, setDesign] = useState<ProductDesign | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  
  const [selectedPlatforms, setSelectedPlatforms] = useState<DesignPlatform[]>([]);
  const [productTitle, setProductTitle] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  
  const [configuredPlatforms, setConfiguredPlatforms] = useState<DesignPlatform[]>([]);

  useEffect(() => {
    loadDesign();
    loadConfiguredPlatforms();
  }, [designId]);

  const loadDesign = async () => {
    setLoading(true);
    const result = await designService.getById(designId);
    setLoading(false);
    
    if (isOk(result) && result.data) {
      setDesign(result.data);
      setProductTitle(result.data.title);
      setProductDescription(result.data.description);
    } else {
      Alert.alert("Error", "Could not load design.");
      navigation.goBack();
    }
  };

  const loadConfiguredPlatforms = async () => {
    const result = await designService.getConfiguredPlatforms();
    if (isOk(result)) {
      setConfiguredPlatforms(result.data);
    }
  };

  const togglePlatform = (platform: DesignPlatform) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform)
        ? prev.filter((p) => p !== platform)
        : [...prev, platform]
    );
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleConfigurePlatform = (platform: DesignPlatform) => {
    navigation.navigate("PlatformSettings", { platform });
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert("Select Platforms", "Please select at least one platform to publish to.");
      return;
    }

    if (!productTitle.trim()) {
      Alert.alert("Title Required", "Please enter a product title.");
      return;
    }

    setPublishing(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const results: { platform: DesignPlatform; success: boolean; error?: string }[] = [];

    for (const platform of selectedPlatforms) {
      const target: UploadTarget = {
        platform,
        productTitle: productTitle.trim(),
        productDescription: productDescription.trim(),
        price: price ? parseFloat(price) : undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      const result = await designService.publishToplatform(designId, target);
      
      if (isOk(result)) {
        results.push({ platform, success: true });
      } else {
        results.push({ platform, success: false, error: result.error.message });
      }
    }

    setPublishing(false);

    const successCount = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success);

    if (Platform.OS !== "web") {
      if (successCount > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }

    if (successCount === selectedPlatforms.length) {
      Alert.alert(
        "Published!",
        `Your design has been published to ${successCount} platform${successCount > 1 ? "s" : ""}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } else if (successCount > 0) {
      const failedNames = failedResults.map((r) => PLATFORM_INFO[r.platform].name).join(", ");
      Alert.alert(
        "Partial Success",
        `Published to ${successCount} platforms. Failed: ${failedNames}`
      );
    } else {
      const errorMessage = failedResults[0]?.error || "Unknown error";
      Alert.alert("Publishing Failed", errorMessage);
    }

    loadDesign();
  };

  if (loading) {
    return (
      <ScreenKeyboardAwareScrollView>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </ScreenKeyboardAwareScrollView>
    );
  }

  return (
    <ScreenKeyboardAwareScrollView>
      {design?.imageUri ? (
        <Card style={styles.previewCard}>
          <Image
            source={{ uri: design.imageUri }}
            style={styles.previewImage}
            contentFit="contain"
          />
        </Card>
      ) : null}

      <Spacer height={Spacing.lg} />

      <ThemedText type="title2">Publish Details</ThemedText>

      <Spacer height={Spacing.lg} />

      <ThemedText style={styles.label}>Product Title *</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
        value={productTitle}
        onChangeText={setProductTitle}
        placeholder="Enter product title"
        placeholderTextColor={theme.textSecondary}
      />

      <Spacer height={Spacing.base} />

      <ThemedText style={styles.label}>Description</ThemedText>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border }]}
        value={productDescription}
        onChangeText={setProductDescription}
        placeholder="Enter product description"
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={3}
      />

      <Spacer height={Spacing.base} />

      <ThemedText style={styles.label}>Price (optional)</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
        value={price}
        onChangeText={setPrice}
        placeholder="e.g., 19.99"
        placeholderTextColor={theme.textSecondary}
        keyboardType="decimal-pad"
      />

      <Spacer height={Spacing.base} />

      <ThemedText style={styles.label}>Tags (comma-separated)</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
        value={tags}
        onChangeText={setTags}
        placeholder="e.g., art, design, minimal"
        placeholderTextColor={theme.textSecondary}
      />

      <Spacer height={Spacing.xl} />

      <ThemedText type="title3">Select Platforms</ThemedText>
      <ThemedText secondary type="caption" style={styles.subtitle}>
        Choose where to publish your design
      </ThemedText>

      <Spacer height={Spacing.base} />

      {PUBLISHABLE_PLATFORMS.map((platform) => {
        const info = PLATFORM_INFO[platform];
        const isSelected = selectedPlatforms.includes(platform);
        const isConfigured = configuredPlatforms.includes(platform);
        const alreadyPublished = design?.publishedTo?.includes(platform);

        return (
          <Pressable
            key={platform}
            style={[
              styles.platformRow,
              { 
                backgroundColor: isSelected ? info.color + "20" : theme.cardBackground,
                borderColor: isSelected ? info.color : theme.border,
              },
            ]}
            onPress={() => isConfigured ? togglePlatform(platform) : handleConfigurePlatform(platform)}
          >
            <Feather name={info.icon as any} size={24} color={info.color} />
            <View style={styles.platformInfo}>
              <ThemedText style={styles.platformName}>{info.name}</ThemedText>
              <ThemedText type="caption" secondary>
                {alreadyPublished 
                  ? "Already published" 
                  : isConfigured 
                    ? info.description 
                    : "Tap to configure"}
              </ThemedText>
            </View>
            {isConfigured ? (
              <View style={[styles.checkbox, isSelected && { backgroundColor: info.color }]}>
                {isSelected ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
              </View>
            ) : (
              <Feather name="settings" size={20} color={theme.textSecondary} />
            )}
          </Pressable>
        );
      })}

      <Spacer height={Spacing.xl} />

      <Button 
        onPress={handlePublish}
        disabled={publishing || selectedPlatforms.length === 0}
      >
        {publishing ? (
          <View style={styles.loadingButton}>
            <ActivityIndicator color="#FFFFFF" size="small" />
            <ThemedText style={styles.loadingText}>Publishing...</ThemedText>
          </View>
        ) : (
          `Publish to ${selectedPlatforms.length} Platform${selectedPlatforms.length !== 1 ? "s" : ""}`
        )}
      </Button>

      <Spacer height={Spacing.xl} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl * 2,
  },
  previewCard: {
    padding: Spacing.base,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: BorderRadius.md,
  },
  label: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  platformRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    marginBottom: Spacing.sm,
    gap: Spacing.base,
  },
  platformInfo: {
    flex: 1,
  },
  platformName: {
    ...Typography.body,
    fontWeight: "600" as const,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#CCC",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    color: "#FFFFFF",
  },
});
