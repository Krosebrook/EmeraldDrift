import React from "react";
import { View, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

export interface DividerProps {
  spacing?: keyof typeof Spacing;
  style?: StyleProp<ViewStyle>;
}

export function Divider({ spacing = "md", style }: DividerProps) {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.divider,
        {
          backgroundColor: theme.border,
          marginVertical: Spacing[spacing],
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    width: "100%",
  },
});
