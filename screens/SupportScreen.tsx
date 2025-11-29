import React, { useState } from "react";
import { StyleSheet, View, TextInput, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

const ISSUE_TYPES = [
  { id: "bug", label: "Bug Report", icon: "alert-circle" as const },
  { id: "feature", label: "Feature Request", icon: "lightbulb" as const },
  { id: "account", label: "Account Issue", icon: "user" as const },
  { id: "billing", label: "Billing Question", icon: "credit-card" as const },
  { id: "other", label: "Other", icon: "help-circle" as const },
];

export default function SupportScreen() {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert("Select Issue Type", "Please select the type of issue you're experiencing.");
      return;
    }
    if (!subject.trim()) {
      Alert.alert("Add Subject", "Please add a subject for your support request.");
      return;
    }
    if (!message.trim()) {
      Alert.alert("Add Message", "Please describe your issue in the message field.");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      "Request Submitted",
      "Thank you for contacting us. We'll get back to you within 24-48 hours.",
    );

    setSelectedType(null);
    setSubject("");
    setMessage("");
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <ThemedText type="title2">Contact Support</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        We're here to help
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <ThemedText type="subhead" style={styles.label}>Issue Type</ThemedText>
      <Spacer height={Spacing.sm} />

      <View style={styles.issueTypeGrid}>
        {ISSUE_TYPES.map((type) => (
          <Pressable
            key={type.id}
            onPress={() => {
              setSelectedType(type.id);
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            style={({ pressed }) => [
              styles.issueTypeCard,
              {
                backgroundColor: selectedType === type.id ? theme.primary : theme.cardBackground,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
          >
            <Feather
              name={type.icon}
              size={20}
              color={selectedType === type.id ? "#FFFFFF" : theme.primary}
            />
            <ThemedText
              type="caption"
              style={{
                marginTop: Spacing.xs,
                color: selectedType === type.id ? "#FFFFFF" : theme.text,
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {type.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.fieldContainer}>
        <ThemedText type="subhead" style={styles.label}>Subject</ThemedText>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
          ]}
          value={subject}
          onChangeText={setSubject}
          placeholder="Brief description of your issue"
          placeholderTextColor={theme.placeholder}
          maxLength={100}
        />
      </View>

      <Spacer height={Spacing.base} />

      <View style={styles.fieldContainer}>
        <ThemedText type="subhead" style={styles.label}>Message</ThemedText>
        <TextInput
          style={[
            styles.input,
            styles.messageInput,
            { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.border },
          ]}
          value={message}
          onChangeText={setMessage}
          placeholder="Please provide as much detail as possible..."
          placeholderTextColor={theme.placeholder}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />
        <ThemedText type="caption" secondary style={styles.charCount}>
          {message.length}/2000
        </ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <Button onPress={handleSubmit} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          "Submit Request"
        )}
      </Button>

      <Spacer height={Spacing.lg} />

      <View style={[styles.infoCard, { backgroundColor: theme.primaryLight }]}>
        <Feather name="mail" size={20} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={{ fontWeight: "600" }}>Email Support</ThemedText>
          <ThemedText type="small" secondary>support@creatorstudio.app</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontWeight: "600",
    marginBottom: Spacing.sm,
  },
  issueTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  issueTypeCard: {
    width: "31%",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  fieldContainer: {
    width: "100%",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.body.fontSize,
  },
  messageInput: {
    height: 150,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  charCount: {
    textAlign: "right",
    marginTop: Spacing.xs,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  infoContent: {
    marginLeft: Spacing.md,
  },
});
