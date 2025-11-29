import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert, Platform, TextInput, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { storage, PlatformConnection } from "@/utils/storage";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { ProfileStackParamList } from "@/navigation/ProfileStackNavigator";

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<ProfileStackParamList, "Profile">;
};

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

function SettingsRow({ icon, label, value, onPress, showArrow = true, danger = false }: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: theme.cardBackground, opacity: pressed && onPress ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: danger ? theme.error + "20" : theme.primary + "20" }]}>
        <Feather name={icon} size={18} color={danger ? theme.error : theme.primary} />
      </View>
      <View style={styles.settingsContent}>
        <ThemedText style={[danger ? { color: theme.error } : null]}>{label}</ThemedText>
        {value ? <ThemedText type="caption" secondary>{value}</ThemedText> : null}
      </View>
      {showArrow && onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { theme, isDark } = useTheme();
  const { user, signOut, updateProfile, isLoading } = useAuthContext();
  const [platforms, setPlatforms] = useState<PlatformConnection[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");

  useFocusEffect(
    useCallback(() => {
      loadPlatforms();
      setEditName(user?.name || "");
    }, [user?.name])
  );

  const loadPlatforms = async () => {
    const platformsData = await storage.getPlatforms();
    setPlatforms(platformsData);
  };

  const handleSaveName = async () => {
    if (editName.trim() && editName.trim() !== user?.name) {
      const success = await updateProfile({ name: editName.trim() });
      if (success) {
        if (Platform.OS !== "web") {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    }
    setIsEditing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            await signOut();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action cannot be undone. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await storage.clearAll();
            await signOut();
          },
        },
      ]
    );
  };

  const getInitials = (name: string): string => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <ScreenScrollView>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
          <ThemedText style={styles.avatarText}>{getInitials(user?.name || "U")}</ThemedText>
        </View>
        {isEditing ? (
          <View style={styles.editNameContainer}>
            <TextInput
              style={[
                styles.nameInput,
                { backgroundColor: theme.backgroundDefault, color: theme.text, borderColor: theme.borderFocus },
              ]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Your name"
              placeholderTextColor={theme.placeholder}
              autoFocus
              onBlur={handleSaveName}
              onSubmitEditing={handleSaveName}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => setIsEditing(true)}
            style={({ pressed }) => [styles.nameContainer, { opacity: pressed ? 0.7 : 1 }]}
          >
            <ThemedText type="title2">{user?.name || "Anonymous"}</ThemedText>
            <Feather name="edit-2" size={16} color={theme.textSecondary} style={{ marginLeft: 8 }} />
          </Pressable>
        )}
        <ThemedText secondary>{user?.email}</ThemedText>
        <ThemedText type="caption" secondary style={{ marginTop: 4 }}>
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
        </ThemedText>
      </View>

      <Spacer height={Spacing.lg} />

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{platforms.length}</ThemedText>
          <ThemedText type="caption" secondary>Platforms</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>0</ThemedText>
          <ThemedText type="caption" secondary>Posts</ThemedText>
        </View>
        <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>0</ThemedText>
          <ThemedText type="caption" secondary>Scheduled</ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Account</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="link"
        label="Connected Platforms"
        value={`${platforms.length} connected`}
        onPress={() => navigation.navigate("Platforms")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="bell"
        label="Notifications"
        onPress={() => navigation.navigate("Notifications")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="shield"
        label="Privacy & Security"
        onPress={() => navigation.navigate("Privacy")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="image"
        label="Media Library"
        onPress={() => navigation.navigate("MediaLibrary")}
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Preferences</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon={isDark ? "moon" : "sun"}
        label="Appearance"
        value={isDark ? "Dark" : "Light"}
        onPress={() => {}}
        showArrow={false}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="globe"
        label="Language"
        value="English"
        onPress={() => {}}
      />

      <Spacer height={Spacing.lg} />

      <ThemedText type="title3" style={styles.sectionTitle}>Support</ThemedText>
      <Spacer height={Spacing.sm} />

      <SettingsRow
        icon="help-circle"
        label="Help Center"
        onPress={() => navigation.navigate("Help")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="message-circle"
        label="Contact Support"
        onPress={() => navigation.navigate("Support")}
      />
      <Spacer height={Spacing.sm} />
      <SettingsRow
        icon="info"
        label="About"
        value="Version 1.0.0"
        onPress={() => navigation.navigate("About")}
      />

      <Spacer height={Spacing.lg} />

      <Button onPress={handleSignOut}>Sign Out</Button>

      <Spacer height={Spacing.md} />

      <Pressable
        onPress={handleDeleteAccount}
        style={({ pressed }) => [
          styles.deleteButton,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <ThemedText style={{ color: theme.error }}>Delete Account</ThemedText>
      </Pressable>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profileHeader: {
    alignItems: "center",
    paddingTop: Spacing.md,
  },
  avatar: {
    width: Spacing.avatarLarge,
    height: Spacing.avatarLarge,
    borderRadius: Spacing.avatarLarge / 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  editNameContainer: {
    marginBottom: 4,
  },
  nameInput: {
    fontSize: Typography.title2.fontSize,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    minWidth: 200,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
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
  deleteButton: {
    alignItems: "center",
    padding: Spacing.base,
  },
});
