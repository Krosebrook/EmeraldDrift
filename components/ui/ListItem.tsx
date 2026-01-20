import React, { ReactNode } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export interface ListItemProps {
  title: string;
  subtitle?: string;
  leftIcon?: FeatherIconName;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ListItem({
  title,
  subtitle,
  leftIcon,
  leftContent,
  rightContent,
  showChevron = false,
  onPress,
  disabled = false,
  destructive = false,
  style,
}: ListItemProps) {
  const { theme } = useTheme();

  const titleColor = destructive ? theme.error : theme.text;

  const content = (
    <View style={[styles.container, style]}>
      {leftContent ? (
        <View style={styles.leftContent}>{leftContent}</View>
      ) : leftIcon ? (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: destructive
                ? `${theme.error}15`
                : theme.backgroundSecondary,
            },
          ]}
        >
          <Feather
            name={leftIcon}
            size={20}
            color={destructive ? theme.error : theme.primary}
          />
        </View>
      ) : null}

      <View style={styles.textContainer}>
        <ThemedText
          type="body"
          style={{ color: titleColor, opacity: disabled ? 0.5 : 1 }}
          numberOfLines={1}
        >
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText type="caption" secondary numberOfLines={1}>
            {subtitle}
          </ThemedText>
        ) : null}
      </View>

      {rightContent ? (
        <View style={styles.rightContent}>{rightContent}</View>
      ) : null}

      {showChevron ? (
        <Feather
          name="chevron-right"
          size={20}
          color={theme.textSecondary}
          style={styles.chevron}
        />
      ) : null}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
      >
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
    paddingVertical: Spacing.md,
    minHeight: 56,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  leftContent: {
    marginRight: Spacing.md,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rightContent: {
    marginLeft: Spacing.sm,
  },
  chevron: {
    marginLeft: Spacing.sm,
  },
});
