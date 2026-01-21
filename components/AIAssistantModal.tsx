import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import {
  aiContentService,
  ContentIdea,
  CaptionSuggestion,
  HashtagSuggestion,
} from "@/services/aiContent";

type AIMode = "ideas" | "captions" | "hashtags" | "improve" | "setup";

interface AIAssistantModalProps {
  visible: boolean;
  onClose: () => void;
  currentTitle?: string;
  currentCaption?: string;
  selectedPlatforms?: string[];
  onSelectIdea?: (idea: ContentIdea) => void;
  onSelectCaption?: (caption: CaptionSuggestion) => void;
  onSelectHashtags?: (hashtags: string[]) => void;
  onImproveCaption?: (improved: string) => void;
}

export function AIAssistantModal({
  visible,
  onClose,
  currentTitle = "",
  currentCaption = "",
  selectedPlatforms = [],
  onSelectIdea,
  onSelectCaption,
  onSelectHashtags,
  onImproveCaption,
}: AIAssistantModalProps) {
  const { theme } = useTheme();
  const [mode, setMode] = useState<AIMode>("ideas");
  const [isLoading, setIsLoading] = useState(false);
  const [topic, setTopic] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [captions, setCaptions] = useState<CaptionSuggestion[]>([]);
  const [hashtags, setHashtags] = useState<HashtagSuggestion | null>(null);
  const [improvedCaption, setImprovedCaption] = useState("");
  const [usingTemplates, setUsingTemplates] = useState(false);

  React.useEffect(() => {
    if (visible) {
      checkApiKey();
      setUsingTemplates(false);
    }
  }, [visible]);

  const checkApiKey = async () => {
    const has = await aiContentService.hasApiKey();
    setHasApiKey(has);
  };

  const saveApiKey = async () => {
    if (apiKeyInput.trim()) {
      await aiContentService.setApiKey(apiKeyInput.trim());
      setHasApiKey(true);
      setApiKeyInput("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const removeApiKey = async () => {
    await aiContentService.removeApiKey();
    setHasApiKey(false);
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const generateIdeas = async () => {
    setIsLoading(true);
    setUsingTemplates(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const result = await aiContentService.generateContentIdeas(
      topic || undefined,
      5,
    );
    setIdeas(result.ideas);
    setUsingTemplates(!result.usedAI);
    setIsLoading(false);
  };

  const generateCaptions = async () => {
    if (!currentTitle.trim()) return;
    setIsLoading(true);
    setUsingTemplates(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const result = await aiContentService.generateCaptions(
      currentTitle,
      currentCaption,
      selectedPlatforms.length > 0 ? selectedPlatforms : ["instagram"],
      3,
    );
    setCaptions(result.captions);
    setUsingTemplates(!result.usedAI);
    setIsLoading(false);
  };

  const generateHashtags = async () => {
    const content = currentTitle || currentCaption;
    if (!content.trim()) return;
    setIsLoading(true);
    setUsingTemplates(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const result = await aiContentService.generateHashtags(
      content,
      selectedPlatforms.length > 0 ? selectedPlatforms : ["instagram"],
      20,
    );
    setHashtags(result.result);
    setUsingTemplates(!result.usedAI);
    setIsLoading(false);
  };

  const improveCurrentCaption = async () => {
    if (!currentCaption.trim()) return;
    setIsLoading(true);
    setUsingTemplates(false);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    const result = await aiContentService.improveCaption(currentCaption);
    setImprovedCaption(result.improved);
    setUsingTemplates(!result.usedAI);
    setIsLoading(false);
  };

  const handleSelectIdea = (idea: ContentIdea) => {
    onSelectIdea?.(idea);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleSelectCaption = (caption: CaptionSuggestion) => {
    onSelectCaption?.(caption);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleSelectHashtags = (tags: string[]) => {
    onSelectHashtags?.(tags);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const handleApplyImproved = () => {
    onImproveCaption?.(improvedCaption);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onClose();
  };

  const renderModeSelector = () => (
    <View style={styles.modeContainer}>
      {[
        { id: "ideas" as AIMode, label: "Ideas", icon: "zap" as const },
        {
          id: "captions" as AIMode,
          label: "Captions",
          icon: "edit-3" as const,
        },
        { id: "hashtags" as AIMode, label: "Hashtags", icon: "hash" as const },
        {
          id: "improve" as AIMode,
          label: "Improve",
          icon: "trending-up" as const,
        },
      ].map((item) => (
        <Pressable
          key={item.id}
          onPress={() => {
            setMode(item.id);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }}
          style={[
            styles.modeButton,
            {
              backgroundColor:
                mode === item.id ? theme.primary : theme.backgroundDefault,
              borderColor: mode === item.id ? theme.primary : theme.border,
            },
          ]}
        >
          <Feather
            name={item.icon}
            size={16}
            color={mode === item.id ? "#FFFFFF" : theme.text}
          />
          <ThemedText
            type="caption"
            style={{
              color: mode === item.id ? "#FFFFFF" : theme.text,
              marginLeft: 4,
              fontWeight: "600",
            }}
          >
            {item.label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const renderIdeasContent = () => (
    <View style={styles.contentSection}>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.topicInput,
            {
              backgroundColor: theme.backgroundDefault,
              borderColor: theme.border,
              color: theme.text,
            },
          ]}
          value={topic}
          onChangeText={setTopic}
          placeholder="Topic (optional)..."
          placeholderTextColor={theme.placeholder}
        />
        <Pressable
          onPress={generateIdeas}
          disabled={isLoading}
          style={[styles.generateButton, { backgroundColor: theme.primary }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          )}
        </Pressable>
      </View>

      {ideas.length > 0 ? (
        <ScrollView
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
        >
          {ideas.map((idea, index) => (
            <Pressable
              key={index}
              onPress={() => handleSelectIdea(idea)}
              style={({ pressed }) => [
                styles.ideaCard,
                {
                  backgroundColor: theme.cardBackground,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <ThemedText style={styles.ideaTitle}>{idea.title}</ThemedText>
              <ThemedText type="caption" secondary style={styles.ideaHook}>
                "{idea.hook}"
              </ThemedText>
              <View style={styles.ideaAngle}>
                <Feather name="compass" size={12} color={theme.primary} />
                <ThemedText
                  type="caption"
                  style={{ marginLeft: 4, color: theme.primary }}
                >
                  {idea.angle}
                </ThemedText>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="zap" size={32} color={theme.textSecondary} />
          <ThemedText
            secondary
            style={{ marginTop: Spacing.sm, textAlign: "center" }}
          >
            Enter a topic and tap generate{"\n"}for content ideas
          </ThemedText>
        </View>
      )}
    </View>
  );

  const renderCaptionsContent = () => (
    <View style={styles.contentSection}>
      {!currentTitle.trim() ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="edit-3" size={32} color={theme.textSecondary} />
          <ThemedText
            secondary
            style={{ marginTop: Spacing.sm, textAlign: "center" }}
          >
            Add a title first to generate{"\n"}caption suggestions
          </ThemedText>
        </View>
      ) : (
        <>
          <Pressable
            onPress={generateCaptions}
            disabled={isLoading}
            style={[styles.fullWidthButton, { backgroundColor: theme.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="edit-3" size={18} color="#FFFFFF" />
                <ThemedText
                  style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}
                >
                  Generate Captions for "{currentTitle.slice(0, 20)}..."
                </ThemedText>
              </>
            )}
          </Pressable>

          {captions.length > 0 ? (
            <ScrollView
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            >
              {captions.map((cap, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleSelectCaption(cap)}
                  style={({ pressed }) => [
                    styles.captionCard,
                    {
                      backgroundColor: theme.cardBackground,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}
                >
                  <ThemedText numberOfLines={3}>{cap.caption}</ThemedText>
                  <View style={styles.hashtagPreview}>
                    {cap.hashtags.slice(0, 5).map((tag, i) => (
                      <View
                        key={i}
                        style={[
                          styles.hashtagChip,
                          { backgroundColor: theme.primary + "20" },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{ color: theme.primary }}
                        >
                          {tag}
                        </ThemedText>
                      </View>
                    ))}
                    {cap.hashtags.length > 5 ? (
                      <ThemedText type="caption" secondary>
                        +{cap.hashtags.length - 5}
                      </ThemedText>
                    ) : null}
                  </View>
                  <View style={styles.ctaPreview}>
                    <Feather
                      name="message-circle"
                      size={12}
                      color={theme.success}
                    />
                    <ThemedText
                      type="caption"
                      style={{ marginLeft: 4, color: theme.success }}
                    >
                      {cap.callToAction}
                    </ThemedText>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
        </>
      )}
    </View>
  );

  const renderHashtagsContent = () => (
    <View style={styles.contentSection}>
      {!currentTitle.trim() && !currentCaption.trim() ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="hash" size={32} color={theme.textSecondary} />
          <ThemedText
            secondary
            style={{ marginTop: Spacing.sm, textAlign: "center" }}
          >
            Add a title or caption first{"\n"}to generate hashtags
          </ThemedText>
        </View>
      ) : (
        <>
          <Pressable
            onPress={generateHashtags}
            disabled={isLoading}
            style={[styles.fullWidthButton, { backgroundColor: theme.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="hash" size={18} color="#FFFFFF" />
                <ThemedText
                  style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}
                >
                  Generate Hashtags
                </ThemedText>
              </>
            )}
          </Pressable>

          {hashtags ? (
            <ScrollView
              style={styles.resultsList}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.hashtagSection,
                  { backgroundColor: theme.cardBackground },
                ]}
              >
                <ThemedText
                  type="subhead"
                  style={{ fontWeight: "600", marginBottom: Spacing.sm }}
                >
                  All Hashtags ({hashtags.hashtags.length})
                </ThemedText>
                <View style={styles.hashtagGrid}>
                  {hashtags.hashtags.map((tag, index) => (
                    <Pressable
                      key={index}
                      onPress={() => handleSelectHashtags([tag])}
                      style={[
                        styles.selectableHashtag,
                        { backgroundColor: theme.primary + "20" },
                      ]}
                    >
                      <ThemedText
                        type="caption"
                        style={{ color: theme.primary }}
                      >
                        {tag}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={() => handleSelectHashtags(hashtags.hashtags)}
                  style={[styles.useAllButton, { borderColor: theme.primary }]}
                >
                  <ThemedText
                    style={{ color: theme.primary, fontWeight: "600" }}
                  >
                    Use All Hashtags
                  </ThemedText>
                </Pressable>
              </View>
            </ScrollView>
          ) : null}
        </>
      )}
    </View>
  );

  const renderImproveContent = () => (
    <View style={styles.contentSection}>
      {!currentCaption.trim() ? (
        <View
          style={[
            styles.emptyState,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <Feather name="trending-up" size={32} color={theme.textSecondary} />
          <ThemedText
            secondary
            style={{ marginTop: Spacing.sm, textAlign: "center" }}
          >
            Write a caption first to{"\n"}get improvement suggestions
          </ThemedText>
        </View>
      ) : (
        <>
          <Pressable
            onPress={improveCurrentCaption}
            disabled={isLoading}
            style={[styles.fullWidthButton, { backgroundColor: theme.primary }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Feather name="trending-up" size={18} color="#FFFFFF" />
                <ThemedText
                  style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}
                >
                  Improve My Caption
                </ThemedText>
              </>
            )}
          </Pressable>

          {improvedCaption ? (
            <View
              style={[
                styles.improvedCard,
                { backgroundColor: theme.cardBackground },
              ]}
            >
              <View style={styles.comparisonHeader}>
                <Feather name="arrow-down" size={16} color={theme.success} />
                <ThemedText
                  style={{
                    marginLeft: 8,
                    fontWeight: "600",
                    color: theme.success,
                  }}
                >
                  Improved Version
                </ThemedText>
              </View>
              <ThemedText style={{ marginTop: Spacing.sm }}>
                {improvedCaption}
              </ThemedText>
              <Pressable
                onPress={handleApplyImproved}
                style={[styles.applyButton, { backgroundColor: theme.success }]}
              >
                <Feather name="check" size={18} color="#FFFFFF" />
                <ThemedText
                  style={{ color: "#FFFFFF", marginLeft: 8, fontWeight: "600" }}
                >
                  Apply This Caption
                </ThemedText>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </View>
  );

  const renderSetupContent = () => (
    <View style={styles.contentSection}>
      <View
        style={[styles.setupCard, { backgroundColor: theme.cardBackground }]}
      >
        <View style={styles.setupHeader}>
          <Feather name="key" size={24} color={theme.primary} />
          <ThemedText
            style={{ marginLeft: Spacing.sm, fontWeight: "600", fontSize: 18 }}
          >
            OpenAI API Key
          </ThemedText>
        </View>
        <ThemedText type="caption" secondary style={{ marginTop: Spacing.sm }}>
          {hasApiKey
            ? "Your API key is configured. AI features will use OpenAI for enhanced results."
            : "Add your OpenAI API key for enhanced AI-powered suggestions. Without it, basic templates will be used."}
        </ThemedText>

        {hasApiKey ? (
          <Pressable
            onPress={removeApiKey}
            style={[styles.removeKeyButton, { borderColor: theme.error }]}
          >
            <Feather name="trash-2" size={16} color={theme.error} />
            <ThemedText
              style={{ marginLeft: 8, color: theme.error, fontWeight: "600" }}
            >
              Remove API Key
            </ThemedText>
          </Pressable>
        ) : (
          <View style={styles.apiKeyInputContainer}>
            <TextInput
              style={[
                styles.apiKeyInput,
                {
                  backgroundColor: theme.backgroundDefault,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="sk-..."
              placeholderTextColor={theme.placeholder}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={saveApiKey}
              disabled={!apiKeyInput.trim()}
              style={[
                styles.saveKeyButton,
                {
                  backgroundColor: apiKeyInput.trim()
                    ? theme.primary
                    : theme.border,
                },
              ]}
            >
              <Feather name="save" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.aiIcon, { backgroundColor: theme.primary + "20" }]}
            >
              <Feather name="cpu" size={20} color={theme.primary} />
            </View>
            <ThemedText type="title3" style={{ marginLeft: Spacing.sm }}>
              AI Assistant
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => setMode("setup")}
              style={({ pressed }) => [
                styles.settingsButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather
                name="settings"
                size={20}
                color={hasApiKey ? theme.success : theme.textSecondary}
              />
            </Pressable>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="x" size={24} color={theme.text} />
            </Pressable>
          </View>
        </View>

        {mode !== "setup" ? renderModeSelector() : null}

        {(usingTemplates || !hasApiKey) && mode !== "setup" ? (
          <View
            style={[
              styles.templateBanner,
              {
                backgroundColor: hasApiKey
                  ? theme.warning + "15"
                  : theme.primary + "10",
              },
            ]}
          >
            <Feather
              name={hasApiKey ? "info" : "key"}
              size={14}
              color={hasApiKey ? theme.warning : theme.primary}
            />
            <ThemedText
              type="caption"
              style={{
                marginLeft: 6,
                color: hasApiKey ? theme.warning : theme.primary,
                flex: 1,
              }}
            >
              {hasApiKey
                ? "Using built-in templates. AI generation encountered an issue."
                : "Add your OpenAI API key in Settings to unlock personalized AI-powered content."}
            </ThemedText>
            {!hasApiKey ? (
              <Pressable
                onPress={() => setMode("setup")}
                style={{ marginLeft: 8 }}
              >
                <Feather name="settings" size={16} color={theme.primary} />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {mode === "ideas" ? renderIdeasContent() : null}
        {mode === "captions" ? renderCaptionsContent() : null}
        {mode === "hashtags" ? renderHashtagsContent() : null}
        {mode === "improve" ? renderImproveContent() : null}
        {mode === "setup" ? renderSetupContent() : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  aiIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsButton: {
    padding: 4,
  },
  closeButton: {
    padding: 4,
  },
  modeContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  templateBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  contentSection: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
  },
  inputRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  topicInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  generateButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidthButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  resultsList: {
    flex: 1,
  },
  ideaCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  ideaTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  ideaHook: {
    fontStyle: "italic",
    marginBottom: Spacing.sm,
  },
  ideaAngle: {
    flexDirection: "row",
    alignItems: "center",
  },
  captionCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  hashtagPreview: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: Spacing.sm,
  },
  hashtagChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  ctaPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  hashtagSection: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  hashtagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectableHashtag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  useAllButton: {
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginTop: Spacing.md,
  },
  improvedCard: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  comparisonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.md,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
  },
  setupCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  setupHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  apiKeyInputContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  apiKeyInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
  },
  saveKeyButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  removeKeyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginTop: Spacing.md,
  },
});
