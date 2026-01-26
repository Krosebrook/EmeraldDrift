import React, { ReactNode } from "react";
import {
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  View,
  ActivityIndicator,
  Platform,
  PressableProps,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export interface ButtonProps
  extends Omit<PressableProps, "style" | "children" | "onPress"> {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  fullWidth?: boolean;
}

const springConfig: WithSpringConfig = {
  damping: 15,
  mass: 0.3,
  stiffness: 150,
  overshootClamping: true,
  energyThreshold: 0.001,
};

const SIZES = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 14, iconSize: 14 },
  md: {
    height: Spacing.buttonHeight,
    paddingHorizontal: 16,
    fontSize: 16,
    iconSize: 18,
  },
  lg: { height: 56, paddingHorizontal: 24, fontSize: 18, iconSize: 20 },
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  onPress,
  children,
  style,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...rest
}: ButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const sizeConfig = SIZES[size];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(0.98, springConfig);
    }
  };

  const handlePressOut = () => {
    if (!disabled && !loading) {
      scale.value = withSpring(1, springConfig);
    }
  };

  const handlePress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    onPress?.();
  };

  const getStyles = (): { bg: string; text: string; border?: string } => {
    switch (variant) {
      case "primary":
        return { bg: theme.primary, text: "#FFFFFF" };
      case "secondary":
        return { bg: theme.backgroundSecondary, text: theme.text };
      case "outline":
        return {
          bg: "transparent",
          text: theme.primary,
          border: theme.primary,
        };
      case "ghost":
        return { bg: "transparent", text: theme.primary };
      case "danger":
        return { bg: theme.error, text: "#FFFFFF" };
      default:
        return { bg: theme.primary, text: "#FFFFFF" };
    }
  };

  const colors = getStyles();
  const isDisabled = disabled || loading;

  return (
    <AnimatedPressable
      onPress={isDisabled ? undefined : handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      style={[
        styles.button,
        {
          height: sizeConfig.height,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          backgroundColor: colors.bg,
          borderWidth: colors.border ? 1.5 : 0,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : 1,
          alignSelf: fullWidth ? "stretch" : "auto",
        },
        style,
        animatedStyle,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.text} />
      ) : (
        <View style={styles.content}>
          {leftIcon ? (
            <Feather
              name={leftIcon}
              size={sizeConfig.iconSize}
              color={colors.text}
              style={styles.leftIcon}
            />
          ) : null}
          <ThemedText
            type="body"
            style={[
              styles.buttonText,
              { color: colors.text, fontSize: sizeConfig.fontSize },
            ]}
          >
            {children}
          </ThemedText>
          {rightIcon ? (
            <Feather
              name={rightIcon}
              size={sizeConfig.iconSize}
              color={colors.text}
              style={styles.rightIcon}
            />
          ) : null}
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
  leftIcon: {
    marginRight: Spacing.sm,
  },
  rightIcon: {
    marginLeft: Spacing.sm,
  },
});
