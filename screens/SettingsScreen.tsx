import React, { useState, useEffect } from "react";
import { StyleSheet, View, Pressable, Alert, Platform, ActivityIndicator, TextInput, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { merchService } from "@/features";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any, "Settings">;
};

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  description?: string;
  onPress?: () => void;
  danger?: boolean;
  isLoading?: boolean;
}

function SettingsRow({ icon, label, description, onPress, danger, isLoading }: SettingsRowProps) {
  const { theme } = useTheme();

  const iconColor = danger ? theme.error : theme.primary;
  const textColor = danger ? theme.error : theme.text;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (onPress && !isLoading && Platform.OS !== "web") {
          Haptics.selectionAsync();
        }
      }}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={`${label}${description ? `, ${description}` : ""}`}
      accessibilityState={{ disabled: isLoading, busy: isLoading }}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: theme.cardBackground, opacity: pressed && onPress ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: iconColor + "20" }]}>
        {isLoading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Feather name={icon} size={18} color={iconColor} />
        )}
      </View>
      <View style={styles.settingsContent}>
        <ThemedText style={{ fontWeight: "500", color: textColor }}>{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" secondary>{description}</ThemedText>
        ) : null}
      </View>
      {onPress && !isLoading ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  const { theme } = useTheme();
  const { user, signOut, deleteAccount } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    checkGeminiApiKey();
  }, []);

  const checkGeminiApiKey = async () => {
    try {
      const hasKey = await merchService.hasGeminiApiKey();
      setHasGeminiKey(hasKey);
    } catch {
      setHasGeminiKey(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert("Error", "Please enter your API key.");
      return;
    }

    setIsSavingApiKey(true);
    try {
      await merchService.setGeminiApiKey(apiKeyInput.trim());
      setHasGeminiKey(true);
      setShowApiKeyModal(false);
      setApiKeyInput("");
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Gemini API key saved securely.");
    } catch {
      Alert.alert("Error", "Failed to save API key. Please try again.");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    const confirmRemove = () => {
      return new Promise<boolean>((resolve) => {
        if (Platform.OS === "web") {
          resolve(window.confirm("Remove Gemini API key?"));
        } else {
          Alert.alert(
            "Remove API Key",
            "This will disable AI mockup generation. Continue?",
            [
              { text: "Cancel", onPress: () => resolve(false), style: "cancel" },
              { text: "Remove", onPress: () => resolve(true), style: "destructive" },
            ]
          );
        }
      });
    };

    if (await confirmRemove()) {
      try {
        await merchService.removeGeminiApiKey();
        setHasGeminiKey(false);
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      } catch {
        Alert.alert("Error", "Failed to remove API key.");
      }
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to sign out?");
      if (confirmed) {
        setIsSigningOut(true);
        await signOut();
        setIsSigningOut(false);
      }
    } else {
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Sign Out",
            onPress: async () => {
              setIsSigningOut(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await signOut();
              setIsSigningOut(false);
            },
          },
        ]
      );
    }
  };

  const handleDeleteAccount = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Delete Account?\n\nThis action cannot be undone. All your data, content, and settings will be permanently deleted."
      );
      if (confirmed) {
        const finalConfirm = window.confirm(
          "Final Confirmation\n\nAre you absolutely sure? This will permanently delete your account and all data."
        );
        if (finalConfirm) {
          setIsDeleting(true);
          const success = await deleteAccount();
          if (!success) {
            setIsDeleting(false);
            window.alert("Failed to delete account. Please try again later.");
          }
        }
      }
    } else {
      Alert.alert(
        "Delete Account",
        "This action cannot be undone. All your data, content, and settings will be permanently deleted. Are you sure you want to continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => confirmDeleteAccount(),
          },
        ]
      );
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Final Confirmation",
      "This will remove all your data permanently. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I Understand, Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            
            const success = await deleteAccount();
            
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              setIsDeleting(false);
              Alert.alert("Error", "Failed to delete account. Please try again later.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Settings</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Manage your app preferences
      </ThemedText>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Account</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="user"
        label={user?.name || "User"}
        description={user?.email || "Manage your profile"}
        onPress={() => navigation.navigate("Profile")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="shield"
        label="Privacy & Security"
        description="Manage your data and privacy settings"
        onPress={() => navigation.navigate("Privacy")}
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>AI & Integrations</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="cpu"
        label="Gemini API Key"
        description={hasGeminiKey ? "Key configured - AI mockups enabled" : "Add key to enable AI mockups"}
        onPress={() => hasGeminiKey ? handleRemoveApiKey() : setShowApiKeyModal(true)}
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Publishing</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="clock"
        label="Default Schedule Time"
        description="Set your preferred posting time"
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="hash"
        label="Hashtag Sets"
        description="Manage saved hashtag groups"
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="copy"
        label="Caption Templates"
        description="Create reusable captions"
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Notifications</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="bell"
        label="Push Notifications"
        description="Manage notification preferences"
        onPress={() => navigation.navigate("Notifications")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="mail"
        label="Email Notifications"
        description="Weekly reports and updates"
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Data & Storage</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="download"
        label="Export Data"
        description="Download your content and analytics"
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="trash-2"
        label="Clear Cache"
        description="Free up storage space"
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Support</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="help-circle"
        label="Help Center"
        description="FAQs and troubleshooting"
        onPress={() => navigation.navigate("Help")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="message-circle"
        label="Contact Support"
        description="Get help from our team"
        onPress={() => navigation.navigate("Support")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="info"
        label="About"
        description="App version and legal information"
        onPress={() => navigation.navigate("About")}
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={[styles.sectionTitle, { color: theme.error }]}>
        Danger Zone
      </ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="log-out"
        label="Sign Out"
        description="Sign out of your account"
        onPress={handleSignOut}
        isLoading={isSigningOut}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="trash"
        label="Delete Account"
        description="Permanently delete your account and all data"
        onPress={handleDeleteAccount}
        danger
        isLoading={isDeleting}
      />

      <Spacer height={Spacing.xl} />

      <View style={styles.footer}>
        <ThemedText type="caption" secondary style={styles.footerText}>
          Creator Studio Lite v1.0.0
        </ThemedText>
        <ThemedText type="caption" secondary style={styles.footerText}>
          Made with care for creators
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <Modal
        visible={showApiKeyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title3">Add Gemini API Key</ThemedText>
              <Pressable
                onPress={() => setShowApiKeyModal(false)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
            </View>

            <ThemedText type="body" secondary style={styles.modalDescription}>
              Get your API key from Google AI Studio to enable AI-powered mockup generation.
            </ThemedText>

            <TextInput
              style={[
                styles.apiKeyInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                  borderColor: theme.border,
                },
              ]}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              placeholder="Enter your Gemini API key"
              placeholderTextColor={theme.textSecondary}
              accessibilityLabel="Gemini API Key Input"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.modalActions}>
              <Button
                variant="secondary"
                onPress={() => setShowApiKeyModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </Button>
              <Spacer width={Spacing.sm} />
              <Button
                onPress={handleSaveApiKey}
                disabled={isSavingApiKey || !apiKeyInput.trim()}
                style={{ flex: 1 }}
              >
                {isSavingApiKey ? "Saving..." : "Save Key"}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: Spacing.xs,
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  footer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  footerText: {
    marginBottom: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  modalDescription: {
    marginBottom: Spacing.lg,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    fontSize: 16,
    marginBottom: Spacing.lg,
  },
  modalActions: {
    flexDirection: "row",
  },
});
