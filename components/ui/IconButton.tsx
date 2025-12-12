import React from "react";
import { Pressable, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export interface IconButtonProps {
  icon: FeatherIconName;
  onPress?: () => void;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const SIZES = {
  sm: { button: 32, icon: 16 },
  md: { button: 40, icon: 20 },
  lg: { button: 48, icon: 24 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function IconButton({
  icon,
  onPress,
  size = "md",
  variant = "ghost",
  disabled = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const dimensions = SIZES[size];

  const getColors = () => {
    switch (variant) {
      case "primary":
        return { bg: theme.primary, icon: "#FFFFFF" };
      case "secondary":
        return { bg: theme.backgroundSecondary, icon: theme.text };
      case "danger":
        return { bg: theme.error, icon: "#FFFFFF" };
      case "ghost":
      default:
        return { bg: "transparent", icon: theme.textSecondary };
    }
  };

  const colors = getColors();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled) scale.value = withSpring(0.9);
  };

  const handlePressOut = () => {
    if (!disabled) scale.value = withSpring(1);
  };

  return (
    <AnimatedPressable
      onPress={disabled ? undefined : onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={[
        styles.button,
        {
          width: dimensions.button,
          height: dimensions.button,
          borderRadius: BorderRadius.full,
          backgroundColor: colors.bg,
          opacity: disabled ? 0.5 : 1,
        },
        style,
        animatedStyle,
      ]}
    >
      <Feather name={icon} size={dimensions.icon} color={colors.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
