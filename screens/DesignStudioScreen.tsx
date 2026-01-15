import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ActivityIndicator, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Image } from "expo-image";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { 
  designService, 
  PLATFORM_INFO, 
  CATEGORY_INFO,
  PLATFORM_TEMPLATES,
} from "@/features";
import type { 
  DesignPlatform, 
  ProductCategory, 
  DesignTemplate,
  ProductDesign,
} from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

type DesignStudioScreenProps = {
  navigation: NativeStackNavigationProp<any, "DesignStudio">;
};

type CreationMode = "ai" | "upload" | null;

const PLATFORMS: DesignPlatform[] = [
  "printify",
  "shopify",
  "amazon_kdp",
  "etsy",
  "tiktok_shop",
  "instagram",
  "pinterest",
  "gumroad",
];

export default function DesignStudioScreen({ navigation }: DesignStudioScreenProps) {
  const { theme, isDark } = useTheme();
  const { isMobile, contentWidth } = useResponsive();

  const [mode, setMode] = useState<CreationMode>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<DesignPlatform | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate | null>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [uploadedImageUri, setUploadedImageUri] = useState<string | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDesign, setGeneratedDesign] = useState<ProductDesign | null>(null);
  const [recentDesigns, setRecentDesigns] = useState<ProductDesign[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadRecentDesigns();
    }, [])
  );

  const loadRecentDesigns = async () => {
    const result = await designService.getAll();
    if (isOk(result)) {
      setRecentDesigns(result.data.slice(0, 5));
    }
  };

  const handleSelectPlatform = (platform: DesignPlatform) => {
    setSelectedPlatform(platform);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSelectCategory = (category: ProductCategory) => {
    setSelectedCategory(category);
    if (selectedPlatform) {
      const templates = PLATFORM_TEMPLATES[selectedPlatform] || [];
      const matchingTemplate = templates.find((t) => t.category === category);
      setSelectedTemplate(matchingTemplate || templates[0] || null);
    }
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSelectTemplate = (template: DesignTemplate) => {
    setSelectedTemplate(template);
    setSelectedCategory(template.category);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSelectImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library to upload designs.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        setUploadedImageUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };

  const handleGenerateAI = async () => {
    if (!selectedPlatform || !selectedCategory || !aiPrompt.trim()) {
      Alert.alert("Missing Information", "Please select a platform, category, and enter a design description.");
      return;
    }

    setIsGenerating(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = await designService.createFromAI({
      title: title.trim() || `${CATEGORY_INFO[selectedCategory].name} Design`,
      description: description.trim(),
      prompt: aiPrompt.trim(),
      platform: selectedPlatform,
      category: selectedCategory,
      templateId: selectedTemplate?.id,
      tags: [],
    });

    setIsGenerating(false);

    if (isOk(result)) {
      setGeneratedDesign(result.data);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Design Created!", "Your AI-generated design is ready.");
      loadRecentDesigns();
    } else {
      Alert.alert("Generation Failed", result.error.message);
    }
  };

  const handleUploadCreate = async () => {
    if (!selectedPlatform || !selectedCategory || !uploadedImageUri) {
      Alert.alert("Missing Information", "Please select a platform, category, and upload an image.");
      return;
    }

    setIsGenerating(true);

    const result = await designService.createFromUpload({
      title: title.trim() || `${CATEGORY_INFO[selectedCategory].name} Design`,
      description: description.trim(),
      imageUri: uploadedImageUri,
      platform: selectedPlatform,
      category: selectedCategory,
      templateId: selectedTemplate?.id,
      tags: [],
    });

    setIsGenerating(false);

    if (isOk(result)) {
      setGeneratedDesign(result.data);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Design Created!", "Your design has been saved.");
      loadRecentDesigns();
    } else {
      Alert.alert("Error", result.error.message);
    }
  };

  const handleDownload = async (design: ProductDesign) => {
    if (!design.imageUri) {
      Alert.alert("No Image", "This design has no image to download.");
      return;
    }

    try {
      if (Platform.OS === "web") {
        await Linking.openURL(design.imageUri);
      } else {
        await Linking.openURL(design.imageUri);
      }
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      Alert.alert("Download Failed", "Could not download the design. Please try again.");
    }
  };

  const handlePublish = (design: ProductDesign) => {
    navigation.navigate("PublishDesign", { designId: design.id });
  };

  const resetForm = () => {
    setMode(null);
    setSelectedPlatform(null);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setTitle("");
    setDescription("");
    setAiPrompt("");
    setUploadedImageUri(null);
    setGeneratedDesign(null);
  };

  const availableTemplates = selectedPlatform ? PLATFORM_TEMPLATES[selectedPlatform] || [] : [];
  const availableCategories = [...new Set(availableTemplates.map((t) => t.category))];

  const renderModeSelection = () => (
    <View>
      <ThemedText type="title2" style={styles.sectionTitle}>Create New Design</ThemedText>
      <ThemedText secondary style={styles.subtitle}>
        Choose how you want to create your product design
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={styles.modeCards}>
        <Pressable
          style={[styles.modeCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => setMode("ai")}
        >
          <View style={[styles.modeIcon, { backgroundColor: theme.primary + "20" }]}>
            <Feather name="cpu" size={32} color={theme.primary} />
          </View>
          <ThemedText style={styles.modeTitle}>AI Generation</ThemedText>
          <ThemedText secondary type="caption" style={styles.modeDescription}>
            Describe your design and let AI create it for you
          </ThemedText>
        </Pressable>

        <Spacer height={Spacing.base} />

        <Pressable
          style={[styles.modeCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => setMode("upload")}
        >
          <View style={[styles.modeIcon, { backgroundColor: theme.success + "20" }]}>
            <Feather name="upload" size={32} color={theme.success} />
          </View>
          <ThemedText style={styles.modeTitle}>Upload Design</ThemedText>
          <ThemedText secondary type="caption" style={styles.modeDescription}>
            Upload your own design files from your device
          </ThemedText>
        </Pressable>

        <Spacer height={Spacing.base} />

        <Pressable
          style={[styles.modeCard, { backgroundColor: theme.cardBackground }]}
          onPress={() => navigation.navigate("MerchStudio")}
        >
          <View style={[styles.modeIcon, { backgroundColor: "#F97316" + "20" }]}>
            <Feather name="shopping-bag" size={32} color="#F97316" />
          </View>
          <ThemedText style={styles.modeTitle}>Merch Studio</ThemedText>
          <ThemedText secondary type="caption" style={styles.modeDescription}>
            Create product mockups with AI (T-shirts, mugs, posters & more)
          </ThemedText>
        </Pressable>
      </View>

      {recentDesigns.length > 0 ? (
        <>
          <Spacer height={Spacing.xl} />
          <ThemedText type="title3">Recent Designs</ThemedText>
          <Spacer height={Spacing.base} />
          {recentDesigns.map((design) => (
            <Card key={design.id} style={styles.recentCard}>
              <View style={styles.recentCardContent}>
                {design.imageUri ? (
                  <Image
                    source={{ uri: design.imageUri }}
                    style={styles.recentThumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.recentThumbnail, { backgroundColor: theme.border }]}>
                    <Feather name="image" size={24} color={theme.textSecondary} />
                  </View>
                )}
                <View style={styles.recentInfo}>
                  <ThemedText numberOfLines={1}>{design.title}</ThemedText>
                  <ThemedText secondary type="caption">
                    {PLATFORM_INFO[design.platform]?.name} - {design.status}
                  </ThemedText>
                </View>
                <View style={styles.recentActions}>
                  <Pressable onPress={() => handleDownload(design)} style={styles.actionButton}>
                    <Feather name="download" size={20} color={theme.primary} />
                  </Pressable>
                  <Pressable onPress={() => handlePublish(design)} style={styles.actionButton}>
                    <Feather name="send" size={20} color={theme.success} />
                  </Pressable>
                </View>
              </View>
            </Card>
          ))}
        </>
      ) : null}
    </View>
  );

  const renderPlatformSelection = () => (
    <View>
      <Pressable style={styles.backButton} onPress={resetForm}>
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText style={styles.backText}>Back</ThemedText>
      </Pressable>

      <Spacer height={Spacing.base} />

      <ThemedText type="title2">Select Platform</ThemedText>
      <ThemedText secondary style={styles.subtitle}>
        Choose where you want to publish your design
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <View style={styles.platformGrid}>
        {PLATFORMS.map((platform) => {
          const info = PLATFORM_INFO[platform];
          const isSelected = selectedPlatform === platform;
          return (
            <Pressable
              key={platform}
              style={[
                styles.platformCard,
                { 
                  backgroundColor: isSelected ? info.color + "20" : theme.cardBackground,
                  borderColor: isSelected ? info.color : theme.border,
                },
              ]}
              onPress={() => handleSelectPlatform(platform)}
            >
              <Feather 
                name={info.icon as any} 
                size={24} 
                color={isSelected ? info.color : theme.textSecondary} 
              />
              <ThemedText style={[styles.platformName, isSelected && { color: info.color }]}>
                {info.name}
              </ThemedText>
              <ThemedText type="caption" secondary numberOfLines={1}>
                {info.description}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {selectedPlatform ? (
        <>
          <Spacer height={Spacing.xl} />
          <ThemedText type="title3">Select Template</ThemedText>
          <Spacer height={Spacing.base} />

          <View style={styles.templateGrid}>
            {availableTemplates.map((template) => {
              const isSelected = selectedTemplate?.id === template.id;
              return (
                <Pressable
                  key={template.id}
                  style={[
                    styles.templateCard,
                    { 
                      backgroundColor: isSelected ? theme.primary + "20" : theme.cardBackground,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <ThemedText style={styles.templateName}>{template.name}</ThemedText>
                  <ThemedText type="caption" secondary>
                    {template.dimensions.width} x {template.dimensions.height} {template.dimensions.unit}
                  </ThemedText>
                  {template.popular ? (
                    <View style={[styles.popularBadge, { backgroundColor: theme.warning + "20" }]}>
                      <ThemedText type="caption" style={{ color: theme.warning }}>Popular</ThemedText>
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          {selectedTemplate ? (
            <>
              <Spacer height={Spacing.xl} />
              <Button onPress={() => setSelectedCategory(selectedTemplate.category)}>
                Continue with {selectedTemplate.name}
              </Button>
            </>
          ) : null}
        </>
      ) : null}
    </View>
  );

  const renderDesignForm = () => (
    <View>
      <Pressable style={styles.backButton} onPress={() => setSelectedCategory(null)}>
        <Feather name="arrow-left" size={20} color={theme.text} />
        <ThemedText style={styles.backText}>Back</ThemedText>
      </Pressable>

      <Spacer height={Spacing.base} />

      <ThemedText type="title2">
        {mode === "ai" ? "Describe Your Design" : "Upload Your Design"}
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <ThemedText style={styles.label}>Title (optional)</ThemedText>
      <TextInput
        style={[styles.input, { backgroundColor: theme.backgroundSecondary, color: theme.text, borderColor: theme.border }]}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter design title"
        placeholderTextColor={theme.textSecondary}
      />

      <Spacer height={Spacing.base} />

      <ThemedText style={styles.label}>Description (optional)</ThemedText>
      <TextInput
        style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Enter design description"
        placeholderTextColor={theme.textSecondary}
        multiline
        numberOfLines={3}
      />

      <Spacer height={Spacing.lg} />

      {mode === "ai" ? (
        <>
          <ThemedText style={styles.label}>Design Prompt *</ThemedText>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, color: theme.text, borderColor: theme.border }]}
            value={aiPrompt}
            onChangeText={setAiPrompt}
            placeholder="Describe your design in detail... e.g., 'A minimalist mountain landscape with sunset colors, perfect for a t-shirt print'"
            placeholderTextColor={theme.textSecondary}
            multiline
            numberOfLines={5}
          />

          <Spacer height={Spacing.xl} />

          <Button 
            onPress={handleGenerateAI} 
            disabled={isGenerating || !aiPrompt.trim()}
          >
            {isGenerating ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <ThemedText style={styles.loadingText}>Generating...</ThemedText>
              </View>
            ) : (
              "Generate with AI"
            )}
          </Button>
        </>
      ) : (
        <>
          <ThemedText style={styles.label}>Upload Image *</ThemedText>
          
          <Pressable
            style={[styles.uploadArea, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}
            onPress={handleSelectImage}
          >
            {uploadedImageUri ? (
              <Image
                source={{ uri: uploadedImageUri }}
                style={styles.uploadedImage}
                contentFit="contain"
              />
            ) : (
              <View style={styles.uploadPlaceholder}>
                <Feather name="upload-cloud" size={48} color={theme.textSecondary} />
                <ThemedText secondary style={styles.uploadText}>
                  Tap to select an image
                </ThemedText>
                <ThemedText type="caption" secondary>
                  PNG, JPG up to 10MB
                </ThemedText>
              </View>
            )}
          </Pressable>

          <Spacer height={Spacing.xl} />

          <Button 
            onPress={handleUploadCreate} 
            disabled={isGenerating || !uploadedImageUri}
          >
            {isGenerating ? "Creating..." : "Create Design"}
          </Button>
        </>
      )}

      {generatedDesign?.imageUri ? (
        <>
          <Spacer height={Spacing.xl} />
          <ThemedText type="title3">Generated Design</ThemedText>
          <Spacer height={Spacing.base} />
          
          <Card style={styles.resultCard}>
            <Image
              source={{ uri: generatedDesign.imageUri }}
              style={styles.resultImage}
              contentFit="contain"
            />
            <View style={styles.resultActions}>
              <Button 
                variant="secondary"
                onPress={() => handleDownload(generatedDesign)}
                style={styles.resultButton}
              >
                Download
              </Button>
              <Button 
                onPress={() => handlePublish(generatedDesign)}
                style={styles.resultButton}
              >
                Publish
              </Button>
            </View>
          </Card>
        </>
      ) : null}
    </View>
  );

  return (
    <ScreenKeyboardAwareScrollView>
      {mode === null ? renderModeSelection() : null}
      {mode !== null && !selectedCategory ? renderPlatformSelection() : null}
      {mode !== null && selectedCategory ? renderDesignForm() : null}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  modeCards: {
    gap: Spacing.base,
  },
  modeCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  modeIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.base,
  },
  modeTitle: {
    ...Typography.title3,
    marginBottom: Spacing.xs,
  },
  modeDescription: {
    textAlign: "center",
  },
  recentCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.base,
  },
  recentCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  recentThumbnail: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  recentInfo: {
    flex: 1,
    marginLeft: Spacing.base,
  },
  recentActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.sm,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  backText: {
    ...Typography.body,
  },
  platformGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  platformCard: {
    width: "48%",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    alignItems: "center",
  },
  platformName: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginTop: Spacing.xs,
  },
  templateGrid: {
    gap: Spacing.sm,
  },
  templateCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
  templateName: {
    ...Typography.body,
    fontWeight: "600" as const,
  },
  popularBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.xs,
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
  uploadArea: {
    height: 200,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  uploadText: {
    marginTop: Spacing.base,
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  loadingButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  loadingText: {
    color: "#FFFFFF",
  },
  resultCard: {
    padding: Spacing.base,
  },
  resultImage: {
    width: "100%",
    height: 300,
    borderRadius: BorderRadius.md,
  },
  resultActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.base,
  },
  resultButton: {
    flex: 1,
  },
});
