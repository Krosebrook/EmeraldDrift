import React, { useState, useCallback } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { useResponsive } from "@/hooks/useResponsive";
import { promptService, PROMPT_CATEGORIES, DEFAULT_LLM_SETTINGS } from "@/features";
import type { PromptTemplate, PromptCategory, LLMSettings } from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

export default function PromptStudioScreen() {
  const { theme, isDark } = useTheme();
  const { isMobile, contentWidth } = useResponsive();
  
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState("");
  const [category, setCategory] = useState<PromptCategory>("custom");
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [executionResult, setExecutionResult] = useState<string | null>(null);
  const [settings, setSettings] = useState<LLMSettings>(DEFAULT_LLM_SETTINGS);

  useFocusEffect(
    useCallback(() => {
      loadTemplates();
    }, [])
  );

  const loadTemplates = async () => {
    const result = await promptService.getTemplates();
    if (isOk(result)) {
      setTemplates(result.data);
    }
  };

  const handleCreateTemplate = async () => {
    if (!name.trim() || !template.trim()) {
      Alert.alert("Required Fields", "Please enter a name and template content.");
      return;
    }

    const variables = extractVariables(template);
    
    const result = await promptService.createTemplate({
      name: name.trim(),
      description: description.trim(),
      template: template.trim(),
      variables: variables.map((v) => ({
        name: v,
        type: "string",
        required: true,
      })),
      category,
    });

    if (isOk(result)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      loadTemplates();
      resetForm();
      setIsEditing(false);
    } else {
      Alert.alert("Error", "Failed to create template.");
    }
  };

  const handleExecutePrompt = async () => {
    if (!selectedTemplate) return;

    setIsExecuting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await promptService.executePrompt(
      selectedTemplate.id,
      variableValues,
      settings
    );

    setIsExecuting(false);

    if (isOk(result)) {
      setExecutionResult(result.data.output);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Execution Failed", "Unable to execute prompt.");
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    Alert.alert(
      "Delete Template",
      "Are you sure you want to delete this template?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await promptService.deleteTemplate(id);
            if (isOk(result)) {
              loadTemplates();
              if (selectedTemplate?.id === id) {
                setSelectedTemplate(null);
                setExecutionResult(null);
              }
            }
          },
        },
      ]
    );
  };

  const extractVariables = (text: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (!matches.includes(match[1])) {
        matches.push(match[1]);
      }
    }
    return matches;
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTemplate("");
    setCategory("custom");
  };

  const selectTemplate = (t: PromptTemplate) => {
    setSelectedTemplate(t);
    setExecutionResult(null);
    const initialValues: Record<string, string> = {};
    t.variables.forEach((v) => {
      initialValues[v.name] = v.defaultValue || "";
    });
    setVariableValues(initialValues);
  };

  const styles = createStyles(theme, isDark, isMobile, contentWidth);

  return (
    <ScreenKeyboardAwareScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <ThemedText type="title2">Prompt Studio</ThemedText>
            <ThemedText type="body" secondary>
              Create, manage, and execute prompt templates
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              setIsEditing(!isEditing);
              setSelectedTemplate(null);
              resetForm();
            }}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Feather name={isEditing ? "x" : "plus"} size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <Spacer height={Spacing.lg} />

        {isEditing ? (
          <Card style={styles.editorCard}>
            <ThemedText type="subhead" style={styles.cardTitle}>
              New Prompt Template
            </ThemedText>

            <Spacer height={Spacing.md} />

            <ThemedText type="caption" secondary style={styles.label}>Name</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Template name..."
              placeholderTextColor={theme.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary style={styles.label}>Description</ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="What does this template do?"
              placeholderTextColor={theme.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary style={styles.label}>Category</ThemedText>
            <View style={styles.categoryRow}>
              {PROMPT_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.value}
                  onPress={() => setCategory(cat.value)}
                  style={[
                    styles.categoryButton,
                    {
                      backgroundColor: category === cat.value ? theme.primary : theme.backgroundSecondary,
                      borderColor: category === cat.value ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Feather
                    name={cat.icon as keyof typeof Feather.glyphMap}
                    size={14}
                    color={category === cat.value ? "#FFFFFF" : theme.textSecondary}
                  />
                  <ThemedText
                    style={{
                      color: category === cat.value ? "#FFFFFF" : theme.text,
                      fontSize: Typography.caption.fontSize,
                      marginLeft: Spacing.xs,
                    }}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer height={Spacing.sm} />

            <ThemedText type="caption" secondary style={styles.label}>
              Template (use {"{{variable}}"} for variables)
            </ThemedText>
            <TextInput
              style={[styles.input, styles.templateInput, { color: theme.text }]}
              placeholder="Write your prompt template here..."
              placeholderTextColor={theme.textSecondary}
              value={template}
              onChangeText={setTemplate}
              multiline
              numberOfLines={6}
            />

            <Spacer height={Spacing.md} />

            <Button onPress={handleCreateTemplate}>
              <View style={styles.buttonContent}>
                <Feather name="save" size={18} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Save Template</ThemedText>
              </View>
            </Button>
          </Card>
        ) : null}

        {selectedTemplate ? (
          <Card style={styles.executionCard}>
            <View style={styles.templateHeader}>
              <View style={styles.templateInfo}>
                <ThemedText type="subhead">{selectedTemplate.name}</ThemedText>
                <ThemedText type="caption" secondary>
                  {selectedTemplate.category} | {selectedTemplate.usageCount} uses
                </ThemedText>
              </View>
              <Pressable
                onPress={() => setSelectedTemplate(null)}
                style={styles.closeButton}
              >
                <Feather name="x" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <Spacer height={Spacing.md} />

            {selectedTemplate.variables.length > 0 ? (
              <>
                <ThemedText type="caption" secondary style={styles.label}>
                  Variables
                </ThemedText>
                {selectedTemplate.variables.map((variable) => (
                  <View key={variable.name} style={styles.variableRow}>
                    <ThemedText type="body" style={styles.variableName}>
                      {variable.name}
                    </ThemedText>
                    <TextInput
                      style={[styles.variableInput, { color: theme.text }]}
                      placeholder={`Enter ${variable.name}...`}
                      placeholderTextColor={theme.textSecondary}
                      value={variableValues[variable.name] || ""}
                      onChangeText={(text) =>
                        setVariableValues({ ...variableValues, [variable.name]: text })
                      }
                    />
                  </View>
                ))}
                <Spacer height={Spacing.md} />
              </>
            ) : null}

            <ThemedText type="caption" secondary style={styles.label}>
              Temperature: {settings.temperature}
            </ThemedText>
            <View style={styles.sliderRow}>
              {[0.1, 0.3, 0.5, 0.7, 0.9].map((temp) => (
                <Pressable
                  key={temp}
                  onPress={() => setSettings({ ...settings, temperature: temp })}
                  style={[
                    styles.tempButton,
                    {
                      backgroundColor: settings.temperature === temp ? theme.primary : theme.backgroundSecondary,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      color: settings.temperature === temp ? "#FFFFFF" : theme.text,
                      fontSize: Typography.caption.fontSize,
                    }}
                  >
                    {temp}
                  </ThemedText>
                </Pressable>
              ))}
            </View>

            <Spacer height={Spacing.lg} />

            <Button onPress={handleExecutePrompt} disabled={isExecuting}>
              {isExecuting ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="#FFFFFF" size="small" />
                  <ThemedText style={styles.buttonText}>Executing...</ThemedText>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Feather name="play" size={18} color="#FFFFFF" />
                  <ThemedText style={styles.buttonText}>Execute Prompt</ThemedText>
                </View>
              )}
            </Button>

            {executionResult ? (
              <>
                <Spacer height={Spacing.lg} />
                <View style={[styles.resultBox, { backgroundColor: theme.backgroundSecondary }]}>
                  <ThemedText type="caption" secondary style={styles.resultLabel}>
                    Output
                  </ThemedText>
                  <ThemedText type="body">{executionResult}</ThemedText>
                </View>
              </>
            ) : null}
          </Card>
        ) : null}

        <Spacer height={Spacing.lg} />

        <ThemedText type="subhead" style={styles.sectionTitle}>
          Templates ({templates.length})
        </ThemedText>

        <Spacer height={Spacing.sm} />

        {templates.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Feather name="file-text" size={40} color={theme.textSecondary} />
            <Spacer height={Spacing.sm} />
            <ThemedText type="body" secondary>
              No templates yet. Create your first one!
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.templatesList}>
            {templates.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => selectTemplate(t)}
                style={[
                  styles.templateCard,
                  {
                    backgroundColor: selectedTemplate?.id === t.id ? theme.backgroundTertiary : theme.backgroundSecondary,
                    borderColor: selectedTemplate?.id === t.id ? theme.primary : theme.border,
                  },
                ]}
              >
                <View style={styles.templateCardContent}>
                  <View style={styles.templateCardHeader}>
                    <Feather
                      name={PROMPT_CATEGORIES.find((c) => c.value === t.category)?.icon as keyof typeof Feather.glyphMap || "file"}
                      size={16}
                      color={theme.primary}
                    />
                    <ThemedText type="subhead" style={styles.templateName}>
                      {t.name}
                    </ThemedText>
                    {t.isFavorite ? (
                      <Feather name="star" size={14} color="#F59E0B" />
                    ) : null}
                  </View>
                  <ThemedText type="caption" secondary numberOfLines={2}>
                    {t.description || t.template.substring(0, 80) + "..."}
                  </ThemedText>
                  <View style={styles.templateMeta}>
                    <ThemedText type="caption" secondary>
                      {t.variables.length} variables | {t.usageCount} uses
                    </ThemedText>
                    <Pressable
                      onPress={() => handleDeleteTemplate(t.id)}
                      hitSlop={8}
                    >
                      <Feather name="trash-2" size={14} color={theme.error} />
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    addButton: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.full,
      justifyContent: "center",
      alignItems: "center",
    },
    editorCard: {
      padding: Spacing.base,
    },
    executionCard: {
      padding: Spacing.base,
    },
    cardTitle: {
      marginBottom: Spacing.xs,
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
      minHeight: 44,
    },
    templateInput: {
      minHeight: 120,
      textAlignVertical: "top",
    },
    categoryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.xs,
    },
    categoryButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
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
    templateHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
    },
    templateInfo: {
      flex: 1,
    },
    closeButton: {
      padding: Spacing.xs,
    },
    variableRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.sm,
    },
    variableName: {
      width: 100,
      fontWeight: "500",
    },
    variableInput: {
      flex: 1,
      backgroundColor: theme.backgroundSecondary,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: BorderRadius.sm,
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      fontSize: Typography.body.fontSize,
    },
    sliderRow: {
      flexDirection: "row",
      gap: Spacing.xs,
    },
    tempButton: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.sm,
    },
    resultBox: {
      padding: Spacing.md,
      borderRadius: BorderRadius.md,
    },
    resultLabel: {
      marginBottom: Spacing.xs,
    },
    sectionTitle: {
      marginBottom: Spacing.xs,
    },
    emptyCard: {
      padding: Spacing.xl,
      alignItems: "center",
    },
    templatesList: {
      gap: Spacing.sm,
    },
    templateCard: {
      borderWidth: 1,
      borderRadius: BorderRadius.md,
      overflow: "hidden",
    },
    templateCardContent: {
      padding: Spacing.md,
    },
    templateCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing.xs,
    },
    templateName: {
      flex: 1,
    },
    templateMeta: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: Spacing.xs,
    },
  });
