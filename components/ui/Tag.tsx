import React from "react";
import { View, Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

export interface TagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Tag({
  label,
  selected = false,
  onPress,
  onRemove,
  disabled = false,
  style,
}: TagProps) {
  const { theme } = useTheme();

  const backgroundColor = selected ? theme.primary : theme.backgroundSecondary;
  const textColor = selected ? "#FFFFFF" : theme.text;

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <ThemedText type="subhead" style={{ color: textColor }}>
        {label}
      </ThemedText>

      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeButton}>
          <Feather name="x" size={14} color={textColor} />
        </Pressable>
      ) : null}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  removeButton: {
    marginLeft: Spacing.xs,
  },
});
