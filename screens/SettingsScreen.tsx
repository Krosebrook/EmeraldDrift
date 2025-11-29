import React from "react";
import { StyleSheet, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
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
}

function SettingsRow({ icon, label, description, onPress }: SettingsRowProps) {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingsRow,
        { backgroundColor: theme.cardBackground, opacity: pressed && onPress ? 0.9 : 1 },
      ]}
    >
      <View style={[styles.settingsIcon, { backgroundColor: theme.primary + "20" }]}>
        <Feather name={icon} size={18} color={theme.primary} />
      </View>
      <View style={styles.settingsContent}>
        <ThemedText style={{ fontWeight: "500" }}>{label}</ThemedText>
        {description ? (
          <ThemedText type="caption" secondary>{description}</ThemedText>
        ) : null}
      </View>
      {onPress ? (
        <Feather name="chevron-right" size={20} color={theme.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen({ navigation }: SettingsScreenProps) {
  return (
    <ScreenScrollView>
      <ThemedText type="title2">Settings</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Manage your app preferences
      </ThemedText>

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
});
