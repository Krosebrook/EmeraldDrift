import React, { useState, useCallback } from "react";
import { StyleSheet, View, Pressable, Alert, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { platformService } from "@/features";
import { isOk } from "@/core/result";
import type { PlatformConnection, PlatformType } from "@/features/shared/types";
import { Spacing, BorderRadius } from "@/constants/theme";
import Spacer from "@/components/Spacer";

type PlatformsScreenProps = {
  navigation: NativeStackNavigationProp<any, "Platforms">;
};

const AVAILABLE_PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "instagram" as const, color: "#E4405F", description: "Photos, Reels, Stories" },
  { id: "tiktok", name: "TikTok", icon: "video" as const, color: "#000000", description: "Short-form videos" },
  { id: "youtube", name: "YouTube", icon: "youtube" as const, color: "#FF0000", description: "Videos, Shorts" },
  { id: "linkedin", name: "LinkedIn", icon: "linkedin" as const, color: "#0A66C2", description: "Professional content" },
  { id: "pinterest", name: "Pinterest", icon: "target" as const, color: "#E60023", description: "Pins, Ideas" },
];

export default function PlatformsScreen({ navigation }: PlatformsScreenProps) {
  const { theme, isDark } = useTheme();
  const [connectedPlatforms, setConnectedPlatforms] = useState<PlatformConnection[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPlatforms();
    }, [])
  );

  const loadPlatforms = async () => {
    const result = await platformService.getConnected();
    if (isOk(result)) {
      setConnectedPlatforms(result.data);
    }
  };

  const handleConnect = async (platformId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const platformInfo = AVAILABLE_PLATFORMS.find((p) => p.id === platformId);
    if (!platformInfo) return;

    const result = await platformService.connect({
      platform: platformId as PlatformType,
      username: `creator_${Math.random().toString(36).substr(2, 6)}`,
      displayName: `My ${platformInfo.name}`,
      followerCount: Math.floor(Math.random() * 50000) + 1000,
    });

    if (isOk(result)) {
      await loadPlatforms();
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Connected!", `${platformInfo.name} has been connected successfully.`);
    } else {
      Alert.alert("Connection Failed", `Could not connect ${platformInfo.name}. Please try again.`);
    }
  };

  const handleDisconnect = (platform: PlatformConnection) => {
    const platformInfo = AVAILABLE_PLATFORMS.find((p) => p.id === platform.platform);

    Alert.alert(
      "Disconnect Platform",
      `Are you sure you want to disconnect ${platformInfo?.name || platform.platform}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            const result = await platformService.disconnect(platform.platform);
            if (isOk(result)) {
              await loadPlatforms();
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            } else {
              Alert.alert("Disconnect Failed", "Could not disconnect the platform. Please try again.");
            }
          },
        },
      ]
    );
  };

  const isConnected = (platformId: string): PlatformConnection | undefined => {
    return connectedPlatforms.find((p) => p.platform === platformId);
  };

  return (
    <ScreenScrollView>
      <ThemedText type="title2">Connected Platforms</ThemedText>
      <ThemedText secondary style={{ marginTop: Spacing.xs }}>
        Link your social accounts to publish content
      </ThemedText>

      <Spacer height={Spacing.lg} />

      {AVAILABLE_PLATFORMS.map((platform) => {
        const connection = isConnected(platform.id);

        return (
          <React.Fragment key={platform.id}>
            <View style={[styles.platformCard, { backgroundColor: theme.cardBackground }]}>
              <View style={[styles.platformIcon, { backgroundColor: (isDark && platform.id === "tiktok" ? "#FFFFFF" : platform.color) + "20" }]}>
                <Feather
                  name={platform.icon}
                  size={24}
                  color={isDark && platform.id === "tiktok" ? "#FFFFFF" : platform.color}
                />
              </View>
              <View style={styles.platformInfo}>
                <ThemedText style={styles.platformName}>{platform.name}</ThemedText>
                <ThemedText type="caption" secondary>
                  {connection ? `@${connection.username}` : platform.description}
                </ThemedText>
              </View>
              {connection ? (
                <View style={styles.connectedActions}>
                  <View style={[styles.connectedBadge, { backgroundColor: theme.success + "20" }]}>
                    <Feather name="check" size={12} color={theme.success} />
                    <ThemedText type="caption" style={{ color: theme.success, marginLeft: 4 }}>
                      Connected
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleDisconnect(connection)}
                    style={({ pressed }) => [
                      styles.disconnectButton,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="x" size={16} color={theme.error} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => handleConnect(platform.id)}
                  style={({ pressed }) => [
                    styles.connectButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.95 : 1 }] },
                  ]}
                >
                  <ThemedText style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 14 }}>
                    Connect
                  </ThemedText>
                </Pressable>
              )}
            </View>
            <Spacer height={Spacing.sm} />
          </React.Fragment>
        );
      })}

      <Spacer height={Spacing.lg} />

      <View style={[styles.infoCard, { backgroundColor: theme.primaryLight }]}>
        <Feather name="info" size={20} color={theme.primary} />
        <View style={styles.infoContent}>
          <ThemedText style={{ fontWeight: "600" }}>Why connect platforms?</ThemedText>
          <ThemedText type="small" secondary style={{ marginTop: 4 }}>
            Connecting your social accounts allows you to publish content directly from Creator Studio, 
            track analytics, and manage all your platforms in one place.
          </ThemedText>
        </View>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  platformCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  platformIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  platformInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  platformName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 2,
  },
  connectedActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  disconnectButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  connectButton: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  infoCard: {
    flexDirection: "row",
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
});
