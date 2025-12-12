import React, { useState, useCallback, useEffect, useRef } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { AIAssistantModal } from "@/components/AIAssistantModal";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { contentService, platformService } from "@/features";
import { isOk } from "@/core/result";
import type { ContentItem, PlatformConnection, PlatformType } from "@/features/shared/types";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { StudioStackParamList } from "@/navigation/StudioStackNavigator";
import type { ContentIdea, CaptionSuggestion } from "@/services/aiContent";

type StudioScreenProps = {
  navigation: NativeStackNavigationProp<StudioStackParamList, "Studio">;
};

const PLATFORM_OPTIONS = [
  { id: "instagram", name: "Instagram", icon: "instagram" as const, color: "#E4405F" },
  { id: "tiktok", name: "TikTok", icon: "video" as const, color: "#000000" },
  { id: "youtube", name: "YouTube", icon: "youtube" as const, color: "#FF0000" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" as const, color: "#0A66C2" },
  { id: "pinterest", name: "Pinterest", icon: "target" as const, color: "#E60023" },
];

export default function StudioScreen({ navigation }: StudioScreenProps) {
  const { theme, isDark } = useTheme();
  const { isMobile, isTablet, contentWidth } = useResponsive();
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const autosaveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastSavedDraft, setLastSavedDraft] = useState<string | null>(null);

  const draftCreatedAtRef = useRef<string | null>(null);
  const formDataRef = useRef({ title: "", caption: "", mediaUri: null as string | null, selectedPlatforms: [] as string[] });
  const lastSavedDraftRef = useRef<string | null>(null);

  useEffect(() => {
    formDataRef.current = { title, caption, mediaUri, selectedPlatforms };
  }, [title, caption, mediaUri, selectedPlatforms]);

  useEffect(() => {
    lastSavedDraftRef.current = lastSavedDraft;
  }, [lastSavedDraft]);

  useFocusEffect(
    useCallback(() => {
      loadPlatforms();
      loadLastDraft();
    }, [])
  );

  useEffect(() => {
    autosaveIntervalRef.current = setInterval(() => {
      const { title: t, caption: c, mediaUri: m, selectedPlatforms: p } = formDataRef.current;
      const hasContent = t.trim() || c.trim() || m;
      if (hasContent) {
        performAutosaveWithData(t, c, m, p);
      }
    }, 30000);

    return () => {
      if (autosaveIntervalRef.current) {
        clearInterval(autosaveIntervalRef.current);
      }
    };
  }, []);

  const loadPlatforms = async () => {
    const result = await platformService.getConnected();
    if (isOk(result)) {
      setConnectedPlatforms(result.data);
    }
  };

  const loadLastDraft = async () => {
    const result = await contentService.getFiltered({ status: "draft" });
    if (isOk(result)) {
      const drafts = result.data.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      const latestDraft = drafts[0];

      if (latestDraft) {
        setTitle(latestDraft.title || "");
        setCaption(latestDraft.caption || "");
        setMediaUri(latestDraft.mediaUri || null);
        setSelectedPlatforms(latestDraft.platforms || []);
        setLastSavedDraft(latestDraft.id);
        draftCreatedAtRef.current = latestDraft.createdAt;
      }
    }
  };

  const performAutosaveWithData = async (t: string, c: string, m: string | null, p: string[]) => {
    const currentDraftId = lastSavedDraftRef.current;
    
    const result = await contentService.saveDraft(currentDraftId || `draft_${Date.now()}`, {
      title: t.trim(),
      caption: c.trim(),
      mediaUri: m || undefined,
      platforms: p as PlatformType[],
    });

    if (isOk(result) && !currentDraftId) {
      setLastSavedDraft(result.data.id);
      lastSavedDraftRef.current = result.data.id;
      draftCreatedAtRef.current = result.data.createdAt;
    }
  };

  const handleSelectMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to select media."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error("Error selecting media:", error);
      Alert.alert("Error", "Failed to select media. Please try again.");
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow camera access to take photos."
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        if (Platform.OS !== "web") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const togglePlatform = (platformId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleSaveDraft = async () => {
    if (!title.trim() && !caption.trim() && !mediaUri) {
      Alert.alert("Empty Content", "Please add a title, caption, or media to save as draft.");
      return;
    }

    setIsLoading(true);

    const result = await contentService.create({
      title: title.trim(),
      caption: caption.trim(),
      mediaUri: mediaUri || undefined,
      platforms: selectedPlatforms as PlatformType[],
    });

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsLoading(false);
    
    if (isOk(result)) {
      resetForm();
      Alert.alert("Draft Saved", "Your content has been saved as a draft.");
    } else {
      Alert.alert("Error", "Failed to save draft. Please try again.");
    }
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert("Select Platforms", "Please select at least one platform to publish to.");
      return;
    }

    if (!title.trim() && !caption.trim()) {
      Alert.alert("Add Content", "Please add a title or caption to publish.");
      return;
    }

    const connectedIds = connectedPlatforms.map((p) => p.platform as string);
    const unconnectedSelected = selectedPlatforms.filter((p) => !connectedIds.includes(p));

    if (unconnectedSelected.length > 0) {
      Alert.alert(
        "Connect Platforms",
        "Some selected platforms are not connected. Please connect them in Settings first.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Settings", onPress: () => navigation.navigate("Settings") },
        ]
      );
      return;
    }

    setIsLoading(true);

    const createResult = await contentService.create({
      title: title.trim(),
      caption: caption.trim(),
      mediaUri: mediaUri || undefined,
      platforms: selectedPlatforms as PlatformType[],
    });

    if (isOk(createResult)) {
      const publishResult = await contentService.publish(createResult.data.id);
      
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setIsLoading(false);
      
      if (isOk(publishResult)) {
        resetForm();
        Alert.alert("Published!", `Your content has been published to ${selectedPlatforms.length} platform${selectedPlatforms.length > 1 ? "s" : ""}.`);
      } else {
        Alert.alert("Publishing Failed", "Content was created but publishing failed. Please try again from your drafts.");
      }
    } else {
      setIsLoading(false);
      Alert.alert("Error", "Failed to create content. Please try again.");
    }
  };

  const handleSchedule = () => {
    if (selectedPlatforms.length === 0) {
      Alert.alert("Select Platforms", "Please select at least one platform to schedule.");
      return;
    }

    if (!title.trim() && !caption.trim()) {
      Alert.alert("Add Content", "Please add a title or caption to schedule.");
      return;
    }

    navigation.navigate("Schedule", {
      title: title.trim(),
      caption: caption.trim(),
      mediaUri: mediaUri || undefined,
      platforms: selectedPlatforms,
    });
  };

  const resetForm = () => {
    setTitle("");
    setCaption("");
    setMediaUri(null);
    setSelectedPlatforms([]);
  };

  const handleSelectIdea = (idea: ContentIdea) => {
    setTitle(idea.title);
    if (!caption.trim()) {
      setCaption(idea.hook);
    }
  };

  const handleSelectCaption = (captionData: CaptionSuggestion) => {
    const fullCaption = `${captionData.caption}\n\n${captionData.callToAction}\n\n${captionData.hashtags.join(" ")}`;
    setCaption(fullCaption);
  };

  const handleSelectHashtags = (hashtags: string[]) => {
    const hashtagString = hashtags.join(" ");
    if (caption.trim()) {
      setCaption((prev) => `${prev}\n\n${hashtagString}`);
    } else {
      setCaption(hashtagString);
    }
  };

  const handleImproveCaption = (improved: string) => {
    setCaption(improved);
  };

  const inputStyle = [
    styles.input,
    {
      backgroundColor: theme.backgroundDefault,
      color: theme.text,
      borderColor: theme.border,
    },
  ];

  return (
    <ScreenKeyboardAwareScrollView>
      <Pressable
        onPress={() => setShowAIModal(true)}
        style={({ pressed }) => [
          styles.aiButton,
          { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
        ]}
      >
        <Feather name="cpu" size={18} color="#FFFFFF" />
        <ThemedText style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}>
          AI Assistant
        </ThemedText>
        <Feather name="chevron-right" size={18} color="#FFFFFF" style={{ marginLeft: "auto" }} />
      </Pressable>

      <Spacer height={Spacing.lg} />

      <View style={styles.mediaSection}>
        {mediaUri ? (
          <View style={[styles.mediaPreview, { backgroundColor: theme.backgroundSecondary }]}>
            <Feather name="check-circle" size={48} color={theme.success} />
            <ThemedText style={{ marginTop: Spacing.sm }}>Media Selected</ThemedText>
            <Pressable
              onPress={() => setMediaUri(null)}
              style={({ pressed }) => [
                styles.removeMediaButton,
                { backgroundColor: theme.error, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="x" size={16} color="#FFFFFF" />
              <ThemedText style={{ color: "#FFFFFF", marginLeft: 4, fontSize: 14 }}>Remove</ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.mediaButtons}>
            <Pressable
              onPress={handleSelectMedia}
              style={({ pressed }) => [
                styles.mediaButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="image" size={32} color={theme.primary} />
              <ThemedText style={{ marginTop: Spacing.sm }}>Gallery</ThemedText>
            </Pressable>
            <Pressable
              onPress={handleTakePhoto}
              style={({ pressed }) => [
                styles.mediaButton,
                { backgroundColor: theme.backgroundDefault, opacity: pressed ? 0.9 : 1 },
              ]}
            >
              <Feather name="camera" size={32} color={theme.primary} />
              <ThemedText style={{ marginTop: Spacing.sm }}>Camera</ThemedText>
            </Pressable>
          </View>
        )}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.fieldContainer}>
        <ThemedText type="subhead" style={styles.label}>Title</ThemedText>
        <TextInput
          style={inputStyle}
          value={title}
          onChangeText={setTitle}
          placeholder="Add a catchy title..."
          placeholderTextColor={theme.placeholder}
          maxLength={100}
        />
      </View>

      <Spacer height={Spacing.base} />

      <View style={styles.fieldContainer}>
        <ThemedText type="subhead" style={styles.label}>Caption</ThemedText>
        <TextInput
          style={[inputStyle, styles.captionInput]}
          value={caption}
          onChangeText={setCaption}
          placeholder="Write your caption..."
          placeholderTextColor={theme.placeholder}
          multiline
          textAlignVertical="top"
          maxLength={2200}
        />
        <ThemedText type="caption" secondary style={styles.charCount}>
          {caption.length}/2200
        </ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="subhead" style={styles.label}>Platforms</ThemedText>
      <Spacer height={Spacing.sm} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformScroll}>
        {PLATFORM_OPTIONS.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id);
          const isConnected = connectedPlatforms.some((p) => p.platform === platform.id);
          
          return (
            <Pressable
              key={platform.id}
              onPress={() => togglePlatform(platform.id)}
              style={({ pressed }) => [
                styles.platformChip,
                {
                  backgroundColor: isSelected ? theme.primary : theme.backgroundDefault,
                  borderColor: isSelected ? theme.primary : theme.border,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Feather
                name={platform.icon}
                size={16}
                color={isSelected ? "#FFFFFF" : (isDark ? platform.color : platform.color)}
              />
              <ThemedText
                style={[
                  styles.platformChipText,
                  { color: isSelected ? "#FFFFFF" : theme.text },
                ]}
              >
                {platform.name}
              </ThemedText>
              {!isConnected ? (
                <View style={[styles.unconnectedDot, { backgroundColor: theme.warning }]} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {selectedPlatforms.some((p) => !connectedPlatforms.some((cp) => cp.platform === p)) ? (
        <>
          <Spacer height={Spacing.sm} />
          <View style={styles.warningBanner}>
            <Feather name="alert-circle" size={16} color={theme.warning} />
            <ThemedText type="caption" style={{ marginLeft: 6, color: theme.warning }}>
              Some platforms need to be connected first
            </ThemedText>
          </View>
        </>
      ) : null}

      <Spacer height={Spacing.xl} />

      <Button onPress={handlePublish} disabled={isLoading}>
        {isLoading ? "Publishing..." : "Publish Now"}
      </Button>

      <Spacer height={Spacing.md} />

      <View style={styles.secondaryActions}>
        <Pressable
          onPress={handleSchedule}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.primary, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="clock" size={18} color={theme.primary} />
          <ThemedText style={{ color: theme.primary, marginLeft: 6, fontWeight: "600" }}>
            Schedule
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={handleSaveDraft}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.secondaryButton,
            { borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
          ]}
        >
          <Feather name="save" size={18} color={theme.textSecondary} />
          <ThemedText secondary style={{ marginLeft: 6, fontWeight: "600" }}>
            Save Draft
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />

      <AIAssistantModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        currentTitle={title}
        currentCaption={caption}
        selectedPlatforms={selectedPlatforms}
        onSelectIdea={handleSelectIdea}
        onSelectCaption={handleSelectCaption}
        onSelectHashtags={handleSelectHashtags}
        onImproveCaption={handleImproveCaption}
      />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  mediaSection: {
    marginTop: Spacing.sm,
    width: "100%",
  },
  mediaButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    flexWrap: "wrap",
  },
  mediaButton: {
    flex: 1,
    minWidth: 140,
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaPreview: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
    aspectRatio: 16 / 9,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  removeMediaButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  fieldContainer: {
    width: "100%",
    maxWidth: 600,
    alignSelf: "center",
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
  captionInput: {
    height: 120,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  platformScroll: {
    marginHorizontal: -Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  platformChip: {
    flexDirection: "row",
    alignItems: "center",
    height: Spacing.chipHeight,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
  platformChipText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
  },
  unconnectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 6,
  },
  warningBanner: {
    flexDirection: "row",
    alignItems: "center",
  },
  secondaryActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
    maxWidth: 600,
    alignSelf: "center",
    width: "100%",
  },
  secondaryButton: {
    flex: 1,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
  },
});
