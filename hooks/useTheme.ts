import { useColorScheme } from "react-native";
import { useMemo } from "react";
import { Colors } from "@/constants/theme";
import type { AppTheme } from "@/types";

export function useTheme(): { theme: AppTheme; isDark: boolean } {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const theme = useMemo(() => {
    return Colors[colorScheme ?? "light"];
  }, [colorScheme]);

  return { theme, isDark };
}

export function useThemeValue<K extends keyof AppTheme>(key: K): AppTheme[K] {
  const { theme } = useTheme();
  return theme[key];
}

export function useIsDarkMode(): boolean {
  const colorScheme = useColorScheme();
  return colorScheme === "dark";
}

export default useTheme;
