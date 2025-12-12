import React, { useState, useEffect } from "react";
import { StyleSheet, View, TextInput, Alert, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useTheme } from "@/hooks/useTheme";
import { designService, PLATFORM_INFO } from "@/features";
import type { DesignPlatform, PlatformConfig } from "@/features";
import { isOk } from "@/core/result";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";

type PlatformSettingsScreenProps = {
  navigation: NativeStackNavigationProp<any, "PlatformSettings">;
  route: RouteProp<{ PlatformSettings: { platform: DesignPlatform } }, "PlatformSettings">;
};

interface PlatformField {
  key: keyof PlatformConfig;
  label: string;
  placeholder: string;
  secure?: boolean;
  required?: boolean;
}

const PLATFORM_FIELDS: Record<DesignPlatform, PlatformField[]> = {
  printify: [
    { key: "apiKey", label: "API Key", placeholder: "Enter Printify API key", secure: true, required: true },
    { key: "shopId", label: "Shop ID", placeholder: "Enter your shop ID", required: true },
  ],
  shopify: [
    { key: "storeUrl", label: "Store URL", placeholder: "your-store.myshopify.com", required: true },
    { key: "accessToken", label: "Access Token", placeholder: "Enter Shopify access token", secure: true, required: true },
  ],
  amazon_kdp: [
    { key: "apiKey", label: "API Key", placeholder: "Enter Amazon API key", secure: true, required: true },
  ],
  etsy: [
    { key: "apiKey", label: "API Key", placeholder: "Enter Etsy API key", secure: true, required: true },
    { key: "shopId", label: "Shop ID", placeholder: "Enter your shop ID", required: true },
  ],
  tiktok_shop: [
    { key: "apiKey", label: "API Key", placeholder: "Enter TikTok Shop API key", secure: true, required: true },
    { key: "shopId", label: "Shop ID", placeholder: "Enter your shop ID", required: true },
  ],
  instagram: [
    { key: "accessToken", label: "Access Token", placeholder: "Enter Instagram access token", secure: true, required: true },
  ],
  pinterest: [
    { key: "accessToken", label: "Access Token", placeholder: "Enter Pinterest access token", secure: true, required: true },
  ],
  gumroad: [
    { key: "apiKey", label: "API Key", placeholder: "Enter Gumroad API key", secure: true, required: true },
  ],
};

export default function PlatformSettingsScreen({ navigation, route }: PlatformSettingsScreenProps) {
  const { theme } = useTheme();
  const { platform } = route.params;
  const platformInfo = PLATFORM_INFO[platform];
  const fields = PLATFORM_FIELDS[platform];

  const [config, setConfig] = useState<Partial<PlatformConfig>>({
    platform,
    isConfigured: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadConfig();
  }, [platform]);

  const loadConfig = async () => {
    const result = await designService.getPlatformConfig(platform);
    if (isOk(result) && result.data) {
      setConfig(result.data);
    }
  };

  const updateField = (key: keyof PlatformConfig, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const requiredFields = fields.filter((f) => f.required);
    for (const field of requiredFields) {
      const value = config[field.key];
      if (!value || (typeof value === "string" && !value.trim())) {
        Alert.alert("Missing Field", `Please enter ${field.label}`);
        return;
      }
    }

    setSaving(true);

    const result = await designService.savePlatformConfig({
      ...config,
      platform,
      isConfigured: true,
    } as Omit<PlatformConfig, "id" | "createdAt" | "updatedAt">);

    setSaving(false);

    if (isOk(result)) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Saved!", `${platformInfo.name} has been configured.`, [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Error", result.error.message);
    }
  };

  const handleDisconnect = async () => {
    Alert.alert(
      "Disconnect Platform",
      `Are you sure you want to disconnect ${platformInfo.name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            await designService.savePlatformConfig({
              platform,
              isConfigured: false,
            } as Omit<PlatformConfig, "id" | "createdAt" | "updatedAt">);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScreenKeyboardAwareScrollView>
      <Card style={[styles.headerCard, { backgroundColor: platformInfo.color + "20" }]}>
        <ThemedText type="title2" style={{ color: platformInfo.color }}>
          {platformInfo.name}
        </ThemedText>
        <ThemedText secondary>{platformInfo.description}</ThemedText>
      </Card>

      <Spacer height={Spacing.xl} />

      <ThemedText type="title3">API Configuration</ThemedText>
      <ThemedText secondary type="caption">
        Enter your API credentials to enable publishing
      </ThemedText>

      <Spacer height={Spacing.lg} />

      {fields.map((field) => (
        <View key={field.key}>
          <ThemedText style={styles.label}>
            {field.label} {field.required ? "*" : ""}
          </ThemedText>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: theme.backgroundSecondary, 
                color: theme.text, 
                borderColor: theme.border,
              },
            ]}
            value={(config[field.key] as string) || ""}
            onChangeText={(value) => updateField(field.key, value)}
            placeholder={field.placeholder}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry={field.secure}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Spacer height={Spacing.base} />
        </View>
      ))}

      <Spacer height={Spacing.lg} />

      <Button onPress={handleSave} disabled={saving}>
        {saving ? "Saving..." : "Save Configuration"}
      </Button>

      {config.isConfigured ? (
        <>
          <Spacer height={Spacing.base} />
          <Button variant="secondary" onPress={handleDisconnect}>
            Disconnect Platform
          </Button>
        </>
      ) : null}

      <Spacer height={Spacing.xl} />

      <Card style={styles.helpCard}>
        <ThemedText style={{ fontWeight: "600" }}>Where to find your API credentials?</ThemedText>
        <Spacer height={Spacing.sm} />
        <ThemedText secondary type="caption">
          Visit your {platformInfo.name} developer dashboard or account settings to generate API keys. 
          Make sure to keep your credentials secure and never share them publicly.
        </ThemedText>
      </Card>
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  label: {
    ...Typography.body,
    fontWeight: "600" as const,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.body,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  helpCard: {
    padding: Spacing.base,
  },
});
