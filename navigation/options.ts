import { Platform } from "react-native";
import { NativeStackNavigationOptions } from "@react-navigation/native-stack";
import { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { LightTheme, DarkTheme, Spacing, BorderRadius } from "../core/theme";
import type { AppTheme } from "../types";

type ColorScheme = "light" | "dark";

function getTheme(colorScheme: ColorScheme): AppTheme {
  return colorScheme === "dark" ? DarkTheme : LightTheme;
}

export function getStackScreenOptions(colorScheme: ColorScheme): NativeStackNavigationOptions {
  const theme = getTheme(colorScheme);

  return {
    headerStyle: {
      backgroundColor: theme.backgroundRoot,
    },
    headerTintColor: theme.text,
    headerTitleStyle: {
      fontWeight: "600",
      fontSize: 17,
    },
    headerShadowVisible: false,
    headerBackVisible: true,
    contentStyle: {
      backgroundColor: theme.backgroundRoot,
    },
    animation: Platform.OS === "ios" ? "default" : "fade_from_bottom",
  };
}

export function getTransparentHeaderOptions(colorScheme: ColorScheme): NativeStackNavigationOptions {
  const theme = getTheme(colorScheme);

  return {
    ...getStackScreenOptions(colorScheme),
    headerTransparent: true,
    headerBlurEffect: colorScheme === "dark" ? "dark" : "light",
    headerStyle: {
      backgroundColor: "transparent",
    },
    headerTintColor: theme.text,
  };
}

export function getModalScreenOptions(colorScheme: ColorScheme): NativeStackNavigationOptions {
  const theme = getTheme(colorScheme);

  return {
    presentation: "modal",
    headerStyle: {
      backgroundColor: theme.backgroundDefault,
    },
    headerTintColor: theme.text,
    headerShadowVisible: false,
    gestureEnabled: true,
  };
}

export function getTabBarOptions(colorScheme: ColorScheme): BottomTabNavigationOptions {
  const theme = getTheme(colorScheme);

  return {
    tabBarActiveTintColor: theme.primary,
    tabBarInactiveTintColor: theme.tabIconDefault,
    tabBarStyle: {
      backgroundColor: theme.backgroundRoot,
      borderTopColor: theme.border,
      borderTopWidth: 1,
      paddingTop: Spacing.xs,
      height: Platform.OS === "ios" ? 85 : 60,
      position: "absolute",
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "500",
      marginBottom: Platform.OS === "ios" ? 0 : Spacing.xs,
    },
    headerShown: false,
  };
}

export function getTabBarBadgeStyle(colorScheme: ColorScheme) {
  const theme = getTheme(colorScheme);

  return {
    backgroundColor: theme.error,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600" as const,
    minWidth: 18,
    height: 18,
    borderRadius: BorderRadius.full,
  };
}

export function getAuthStackOptions(colorScheme: ColorScheme): NativeStackNavigationOptions {
  return {
    ...getStackScreenOptions(colorScheme),
    headerShown: false,
  };
}

export function getOnboardingOptions(colorScheme: ColorScheme): NativeStackNavigationOptions {
  return {
    ...getStackScreenOptions(colorScheme),
    headerShown: false,
    gestureEnabled: false,
  };
}

export const screenOptionsPresets = {
  stack: getStackScreenOptions,
  transparentHeader: getTransparentHeaderOptions,
  modal: getModalScreenOptions,
  auth: getAuthStackOptions,
  onboarding: getOnboardingOptions,
  tabBar: getTabBarOptions,
};

export default screenOptionsPresets;
