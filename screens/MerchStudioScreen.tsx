import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, View, Alert, Platform, Linking } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as MediaLibrary from "expo-media-library";
import { File, Paths } from "expo-file-system";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import {
  ProductGrid,
  StyleSelector,
  MerchPreview,
  UploadArea,
  TextOverlayControls,
} from "@/components/merch";
import { useTheme } from "@/hooks/useTheme";
import { merchService, getErrorSuggestion, preferencesService } from "@/features";
import type {
  MerchProduct,
  MerchProductType,
  StylePreference,
  TextOverlay,
  MerchGenerationResult,
} from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius } from "@/constants/theme";

type MerchStudioScreenProps = {
  navigation: NativeStackNavigationProp<any, "MerchStudio">;
};

type Step = "product" | "assets" | "style" | "generate";

export default function MerchStudioScreen({ navigation }: MerchStudioScreenProps) {
  const { theme } = useTheme();

  const [step, setStep] = useState<Step>("product");
  const [selectedProduct, setSelectedProduct] = useState<MerchProduct | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundBase64, setBackgroundBase64] = useState<string | null>(null);
  const [stylePreference, setStylePreference] = useState<StylePreference>("studio");
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [mockupResult, setMockupResult] = useState<MerchGenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

  React.useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const hasKey = await merchService.hasGeminiApiKey();
    setHasApiKey(hasKey);
  };

  const handleSelectProduct = (product: MerchProduct) => {
    setSelectedProduct(product);
    setMockupResult(null);
    setError(null);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleLogoSelected = (uri: string, base64: string) => {
    setLogoImage(uri);
    setLogoBase64(base64);
    setMockupResult(null);
    setError(null);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleBackgroundSelected = (uri: string, base64: string) => {
    setBackgroundImage(uri);
    setBackgroundBase64(base64);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleRemoveLogo = () => {
    setLogoImage(null);
    setLogoBase64(null);
  };

  const handleRemoveBackground = () => {
    setBackgroundImage(null);
    setBackgroundBase64(null);
  };

  const handleSelectStyle = (style: StylePreference) => {
    setStylePreference(style);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddOverlay = (overlay: TextOverlay) => {
    setTextOverlays((prev) => [...prev, overlay]);
  };

  const handleUpdateOverlay = (id: string, updates: Partial<TextOverlay>) => {
    setTextOverlays((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  const handleRemoveOverlay = (id: string) => {
    setTextOverlays((prev) => prev.filter((o) => o.id !== id));
  };

  const handleGenerate = async () => {
    if (!selectedProduct || !logoBase64) {
      Alert.alert("Missing Information", "Please select a product and upload your logo.");
      return;
    }

    if (!hasApiKey) {
      Alert.alert(
        "API Key Required",
        "Please add your Gemini API key in Settings to use AI mockup generation.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Settings", onPress: () => navigation.navigate("Settings") },
        ]
      );
      return;
    }

    setIsGenerating(true);
    setError(null);

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const result = await merchService.generateMockup({
      product: selectedProduct.id,
      logoImage: logoBase64,
      backgroundImage: backgroundBase64 || undefined,
      stylePreference,
      textOverlays: textOverlays.length > 0 ? textOverlays : undefined,
    });

    setIsGenerating(false);

    if (isOk(result)) {
      setMockupResult(result.data);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      const suggestion = getErrorSuggestion(result.error.message, !!backgroundImage);
      setError(suggestion);
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    handleGenerate();
  };

  const saveImageToLibrary = async (base64Image: string, fileName: string): Promise<boolean> => {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== "granted") {
      if (!canAskAgain && Platform.OS !== "web") {
        Alert.alert(
          "Permission Required",
          "Photo library access is needed to save mockups. Please enable it in Settings.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: async () => {
                try {
                  await Linking.openSettings();
                } catch {}
              },
            },
          ]
        );
      } else {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to save mockups."
        );
      }
      return false;
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const file = new File(Paths.cache, fileName);
    await file.write(base64Data, { encoding: "base64" });

    await MediaLibrary.createAssetAsync(file.uri);
    return true;
  };

  const handleDownload = async () => {
    if (!mockupResult?.mockupImage) return;

    try {
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = mockupResult.mockupImage;
        link.download = `mockup-${selectedProduct?.id || "design"}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert("Success", "Download started!");
      } else {
        const fileName = `mockup-${selectedProduct?.id || "design"}-${Date.now()}.png`;
        const saved = await saveImageToLibrary(mockupResult.mockupImage, fileName);
        
        if (saved) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Saved!", "Mockup saved to your photo library.");
        }
      }
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Download Failed", "Could not save the mockup. Please try again.");
    }
  };

  const handleShare = async () => {
    if (!mockupResult?.mockupImage) return;

    try {
      if (Platform.OS === "web") {
        if (typeof navigator !== "undefined" && navigator.share) {
          await navigator.share({
            title: `${selectedProduct?.name} Mockup`,
            text: "Check out my product mockup!",
          });
        } else {
          Alert.alert("Share", "Right-click the image to copy or save it.");
        }
      } else {
        const fileName = `mockup-share-${Date.now()}.png`;
        const saved = await saveImageToLibrary(mockupResult.mockupImage, fileName);
        
        if (saved) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Saved!", "Mockup saved to your photo library. You can share it from there.");
        }
      }
    } catch (err) {
      console.error("Share error:", err);
      Alert.alert("Share Failed", "Could not share the mockup.");
    }
  };

  const canProceedToAssets = !!selectedProduct;
  const canProceedToStyle = !!logoImage;
  const canGenerate = !!selectedProduct && !!logoBase64;

  const renderStep = () => {
    switch (step) {
      case "product":
        return (
          <View>
            <ThemedText type="title2" style={styles.sectionTitle}>
              Choose Your Product
            </ThemedText>
            <ThemedText type="body" secondary style={styles.subtitle}>
              Select a product to create your mockup
            </ThemedText>

            <View style={styles.stepContent}>
              <ProductGrid
                selectedProductId={selectedProduct?.id || null}
                onSelectProduct={handleSelectProduct}
                columns={2}
              />
            </View>

            {canProceedToAssets && (
              <View style={styles.stepActions}>
                <Button onPress={() => setStep("assets")} rightIcon="arrow-right">
                  Continue with {selectedProduct?.name}
                </Button>
              </View>
            )}
          </View>
        );

      case "assets":
        return (
          <View>
            <View style={styles.stepHeader}>
              <Button
                variant="ghost"
                onPress={() => setStep("product")}
                leftIcon="arrow-left"
                size="sm"
              >
                Back
              </Button>
            </View>

            <ThemedText type="title2" style={styles.sectionTitle}>
              Upload Your Assets
            </ThemedText>
            <ThemedText type="body" secondary style={styles.subtitle}>
              Add your logo and optionally a background image
            </ThemedText>

            <View style={styles.stepContent}>
              <UploadArea
                label="Logo / Design"
                description="Your logo or design to place on the product. PNG with transparent background works best."
                image={logoImage}
                onImageSelected={handleLogoSelected}
                onRemove={handleRemoveLogo}
                aspectRatio={1}
              />

              <UploadArea
                label="Background"
                description="Optional: Add a custom background for your mockup scene."
                image={backgroundImage}
                onImageSelected={handleBackgroundSelected}
                onRemove={handleRemoveBackground}
                aspectRatio={16 / 9}
                optional
              />

              <TextOverlayControls
                overlays={textOverlays}
                onAddOverlay={handleAddOverlay}
                onUpdateOverlay={handleUpdateOverlay}
                onRemoveOverlay={handleRemoveOverlay}
              />
            </View>

            <View style={styles.stepActions}>
              <Button
                onPress={() => setStep("style")}
                disabled={!canProceedToStyle}
                rightIcon="arrow-right"
              >
                Continue to Style
              </Button>
            </View>
          </View>
        );

      case "style":
        return (
          <View>
            <View style={styles.stepHeader}>
              <Button
                variant="ghost"
                onPress={() => setStep("assets")}
                leftIcon="arrow-left"
                size="sm"
              >
                Back
              </Button>
            </View>

            <ThemedText type="title2" style={styles.sectionTitle}>
              Choose Visual Style
            </ThemedText>
            <ThemedText type="body" secondary style={styles.subtitle}>
              Select how your mockup will be photographed
            </ThemedText>

            <View style={styles.stepContent}>
              <StyleSelector
                selectedStyle={stylePreference}
                onSelectStyle={handleSelectStyle}
              />
            </View>

            <View style={styles.stepActions}>
              <Button onPress={() => setStep("generate")} rightIcon="zap">
                Generate Mockup
              </Button>
            </View>
          </View>
        );

      case "generate":
        return (
          <View>
            <View style={styles.stepHeader}>
              <Button
                variant="ghost"
                onPress={() => setStep("style")}
                leftIcon="arrow-left"
                size="sm"
              >
                Back
              </Button>
            </View>

            <ThemedText type="title2" style={styles.sectionTitle}>
              Your Mockup
            </ThemedText>

            <View style={styles.stepContent}>
              <MerchPreview
                product={selectedProduct}
                mockupImage={mockupResult?.mockupImage || null}
                isGenerating={isGenerating}
                error={error}
                onGenerate={handleGenerate}
                onDownload={handleDownload}
                onShare={handleShare}
                onRetry={handleRetry}
              />

              {!isGenerating && !mockupResult && !error && (
                <View style={styles.generatePrompt}>
                  <ThemedText type="body" secondary style={styles.generatePromptText}>
                    Ready to create your {selectedProduct?.name} mockup with{" "}
                    {stylePreference} style photography.
                  </ThemedText>
                  <Button onPress={handleGenerate} leftIcon="zap" fullWidth>
                    Generate Mockup
                  </Button>
                </View>
              )}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <ScreenKeyboardAwareScrollView>
      {hasApiKey === false && (
        <View style={[styles.apiKeyBanner, { backgroundColor: theme.warning + "20" }]}>
          <Feather name="alert-triangle" size={18} color={theme.warning} />
          <ThemedText type="caption" style={{ flex: 1, marginLeft: Spacing.sm }}>
            Gemini API key required for AI generation.
          </ThemedText>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => navigation.navigate("Settings")}
          >
            Add Key
          </Button>
        </View>
      )}

      {renderStep()}
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  stepHeader: {
    marginBottom: Spacing.md,
  },
  stepContent: {
    marginBottom: Spacing.lg,
  },
  stepActions: {
    marginTop: Spacing.md,
  },
  apiKeyBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  generatePrompt: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  generatePromptText: {
    textAlign: "center",
  },
});
