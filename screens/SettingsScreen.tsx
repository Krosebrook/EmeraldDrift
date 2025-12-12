import React, { useState } from "react";
import { StyleSheet, View, Pressable, Alert, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
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
      disabled={isLoading}
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

  const handleSignOut = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          onPress: async () => {
            setIsSigningOut(true);
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            await signOut();
            setIsSigningOut(false);
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
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
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      "Final Confirmation",
      "Type DELETE in the next prompt to confirm account deletion. This will remove all your data permanently.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "I Understand, Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            
            const success = await deleteAccount();
            
            if (success) {
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
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
});
