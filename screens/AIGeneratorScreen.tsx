import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ExpoClipboard from "expo-clipboard";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { 
  aiGeneratorService, 
  CONTENT_TYPES, 
  TONES, 
  AUDIENCES, 
  WORD_COUNTS 
} from "@/features";
import type { 
  ContentType, 
  ContentTone, 
  TargetAudience, 
  GeneratedContent 
} from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function AIGeneratorScreen() {
  const { theme, isDark } = useTheme();
  const { isMobile, contentWidth } = useResponsive();
  
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [additionalInstructions, setAdditionalInstructions] = useState("");
  const [contentType, setContentType] = useState<ContentType>("marketing");
  const [tone, setTone] = useState<ContentTone>("professional");
  const [audience, setAudience] = useState<TargetAudience>("general");
  const [wordCount, setWordCount] = useState(500);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [history, setHistory] = useState<GeneratedContent[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    const result = await aiGeneratorService.getHistory();
    if (isOk(result)) {
      setHistory(result.data.slice(0, 10));
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert("Required Field", "Please enter a topic for content generation.");
      return;
    }

    setIsGenerating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await aiGeneratorService.generate({
      topic: topic.trim(),
      contentType,
      tone,
      audience,
      wordCount,
      keywords: keywords.trim() || undefined,
      additionalInstructions: additionalInstructions.trim() || undefined,
    });

    setIsGenerating(false);

    if (isOk(result)) {
      setGeneratedContent(result.data);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadHistory();
    } else {
      Alert.alert("Generation Failed", "Unable to generate content. Please try again.");
    }
  };

  const handleCopyContent = async () => {
    if (generatedContent) {
      await ExpoClipboard.setStringAsync(generatedContent.content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Copied", "Content copied to clipboard!");
    }
  };

  const handleToggleFavorite = async (id: string) => {
    const result = await aiGeneratorService.toggleFavorite(id);
    if (isOk(result)) {
      loadHistory();
      if (generatedContent?.id === id && result.data) {
        setGeneratedContent(result.data);
      }
    }
  };

  const renderOptionButton = (
    label: string,
    value: string,
    selected: boolean,
    onPress: () => void,
    icon?: string
  ) => (
    <Pressable
      key={value}
      onPress={onPress}
      style={[
        styles.optionButton,
        {
          backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : theme.border,
        },
      ]}
    >
      {icon ? (
        <Feather
          name={icon as keyof typeof Feather.glyphMap}
          size={14}
          color={selected ? "#FFFFFF" : theme.textSecondary}
          style={styles.optionIcon}
        />
      ) : null}
      <ThemedText
        style={[styles.optionText, { color: selected ? "#FFFFFF" : theme.text }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const styles = createStyles(theme, isDark, isMobile, contentWidth);

  return (
    <ScreenKeyboardAwareScrollView style={styles.container}>
      <View style={styles.content}>
        <ThemedText type="title2" style={styles.sectionTitle}>
          AI Content Generator
        </ThemedText>
        <ThemedText type="body" secondary style={styles.sectionDescription}>
          Generate high-quality content using AI. Choose your content type, tone, and audience.
        </ThemedText>

        <Spacer height={Spacing.lg} />

        <ThemedText type="subhead" style={styles.label}>Topic *</ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="Enter your topic or subject..."
          placeholderTextColor={theme.textSecondary}
          value={topic}
          onChangeText={setTopic}
          multiline
        />

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Keywords</ThemedText>
        <TextInput
          style={[styles.input, { color: theme.text }]}
          placeholder="SEO keywords (comma-separated)"
          placeholderTextColor={theme.textSecondary}
          value={keywords}
          onChangeText={setKeywords}
        />

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Content Type</ThemedText>
        <View style={styles.optionsGrid}>
          {CONTENT_TYPES.map((type) =>
            renderOptionButton(
              type.label,
              type.value,
              contentType === type.value,
              () => setContentType(type.value),
              type.icon
            )
          )}
        </View>

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Tone</ThemedText>
        <View style={styles.optionsRow}>
          {TONES.map((t) =>
            renderOptionButton(t.label, t.value, tone === t.value, () =>
              setTone(t.value as ContentTone)
            )
          )}
        </View>

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Target Audience</ThemedText>
        <View style={styles.optionsRow}>
          {AUDIENCES.map((a) =>
            renderOptionButton(a.label, a.value, audience === a.value, () =>
              setAudience(a.value as TargetAudience)
            )
          )}
        </View>

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Word Count</ThemedText>
        <View style={styles.optionsRow}>
          {WORD_COUNTS.map((wc) =>
            renderOptionButton(
              `${wc} words`,
              String(wc),
              wordCount === wc,
              () => setWordCount(wc)
            )
          )}
        </View>

        <Spacer height={Spacing.md} />

        <ThemedText type="subhead" style={styles.label}>Additional Instructions</ThemedText>
        <TextInput
          style={[styles.input, styles.textArea, { color: theme.text }]}
          placeholder="Any specific requirements or style notes..."
          placeholderTextColor={theme.textSecondary}
          value={additionalInstructions}
          onChangeText={setAdditionalInstructions}
          multiline
          numberOfLines={3}
        />

        <Spacer height={Spacing.lg} />

        <Button
          onPress={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          style={styles.generateButton}
        >
          {isGenerating ? (
            <View style={styles.buttonContent}>
              <ActivityIndicator color="#FFFFFF" size="small" />
              <ThemedText style={styles.buttonText}>Generating...</ThemedText>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Feather name="zap" size={18} color="#FFFFFF" />
              <ThemedText style={styles.buttonText}>Generate Content</ThemedText>
            </View>
          )}
        </Button>

        {generatedContent ? (
          <>
            <Spacer height={Spacing.xl} />
            <Card style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <ThemedText type="subhead">Generated Content</ThemedText>
                <View style={styles.resultActions}>
                  <Pressable
                    onPress={() => handleToggleFavorite(generatedContent.id)}
                    style={styles.actionButton}
                  >
                    <Feather
                      name="heart"
                      size={20}
                      color={generatedContent.isFavorite ? "#EF4444" : theme.textSecondary}
                    />
                  </Pressable>
                  <Pressable onPress={handleCopyContent} style={styles.actionButton}>
                    <Feather name="copy" size={20} color={theme.textSecondary} />
                  </Pressable>
                </View>
              </View>
              <Spacer height={Spacing.sm} />
              <ThemedText type="caption" secondary>
                {generatedContent.wordCount} words | Generated {new Date(generatedContent.generatedAt).toLocaleString()}
              </ThemedText>
              <Spacer height={Spacing.md} />
              <ThemedText type="body" style={styles.generatedText}>
                {generatedContent.content}
              </ThemedText>
            </Card>
          </>
        ) : null}

        {history.length > 0 ? (
          <>
            <Spacer height={Spacing.xl} />
            <Pressable
              onPress={() => setShowHistory(!showHistory)}
              style={styles.historyToggle}
            >
              <ThemedText type="subhead">Recent Generations</ThemedText>
              <Feather
                name={showHistory ? "chevron-up" : "chevron-down"}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
            
            {showHistory ? (
              <View style={styles.historyList}>
                {history.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setGeneratedContent(item)}
                    style={[styles.historyItem, { backgroundColor: theme.backgroundSecondary }]}
                  >
                    <View style={styles.historyItemContent}>
                      <ThemedText type="body" numberOfLines={1}>
                        {item.request.topic}
                      </ThemedText>
                      <ThemedText type="caption" secondary>
                        {item.request.contentType} | {item.wordCount} words
                      </ThemedText>
                    </View>
                    <Feather name="chevron-right" size={18} color={theme.textSecondary} />
                  </Pressable>
                ))}
              </View>
            ) : null}
          </>
        ) : null}

        <Spacer height={Spacing.xl} />
      </View>
    </ScreenKeyboardAwareScrollView>
  );
}

const createStyles = (theme: any, isDark: boolean, isMobile: boolean, contentWidth: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundDefault,
    },
    content: {
      padding: Spacing.base,
      maxWidth: contentWidth,
      alignSelf: "center",
      width: "100%",
    },
    sectionTitle: {
      marginBottom: Spacing.xs,
    },
    sectionDescription: {
      marginBottom: Spacing.sm,
    },
    label: {
      marginBottom: Spacing.xs,
    },
    input: {
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      fontSize: Typography.body.fontSize,
      minHeight: 48,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: "top",
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    optionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    optionButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
    },
    optionIcon: {
      marginRight: Spacing.xs,
    },
    optionText: {
      fontSize: Typography.caption.fontSize,
      fontWeight: "500",
    },
    generateButton: {
      height: 52,
    },
    buttonContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    buttonText: {
      color: "#FFFFFF",
      fontSize: Typography.body.fontSize,
      fontWeight: "600",
    },
    resultCard: {
      padding: Spacing.base,
    },
    resultHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    resultActions: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    actionButton: {
      padding: Spacing.xs,
    },
    generatedText: {
      lineHeight: 24,
    },
    historyToggle: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: Spacing.sm,
    },
    historyList: {
      gap: Spacing.sm,
    },
    historyItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    historyItemContent: {
      flex: 1,
    },
  });
