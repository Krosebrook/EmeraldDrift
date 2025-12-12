import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp, ImageStyle } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface AvatarProps {
  source?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  style?: StyleProp<ViewStyle>;
}

const SIZES = {
  sm: Spacing.avatarSmall,
  md: Spacing.avatarDefault,
  lg: Spacing.avatarLarge,
  xl: 96,
};

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function Avatar({ source, name, size = "md", style }: AvatarProps) {
  const { theme } = useTheme();
  const dimension = SIZES[size];
  const fontSize = dimension / 2.5;

  const containerStyle: ViewStyle = {
    width: dimension,
    height: dimension,
    borderRadius: BorderRadius.full,
    backgroundColor: theme.primaryLight,
  };

  const imageStyle: ImageStyle = {
    width: dimension,
    height: dimension,
    borderRadius: BorderRadius.full,
  };

  if (source) {
    return (
      <Image
        source={{ uri: source }}
        style={imageStyle}
        contentFit="cover"
      />
    );
  }

  if (name) {
    return (
      <View style={[styles.container, containerStyle, style]}>
        <ThemedText style={{ color: theme.primary, fontSize, fontWeight: "600" }}>
          {getInitials(name)}
        </ThemedText>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle, style]}>
      <Feather name="user" size={dimension / 2} color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
