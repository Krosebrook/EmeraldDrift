import { useColorScheme } from "react-native";
import { useMemo } from "react";
import { LightTheme, DarkTheme } from "../../core/theme";
import type { AppTheme } from "../../types";

export function useTheme(): AppTheme {
  const colorScheme = useColorScheme();

  return useMemo(() => {
    return colorScheme === "dark" ? DarkTheme : LightTheme;
  }, [colorScheme]);
}

export function useThemeValue<K extends keyof AppTheme>(key: K): AppTheme[K] {
  const theme = useTheme();
  return theme[key];
}

export function useIsDarkMode(): boolean {
  const colorScheme = useColorScheme();
  return colorScheme === "dark";
}

export default useTheme;
