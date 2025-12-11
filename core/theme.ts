import { Platform } from "react-native";
import type { AppTheme } from "../types";

export const LightTheme: AppTheme = {
  text: "#171717",
  textSecondary: "#525252",
  buttonText: "#FFFFFF",
  tabIconDefault: "#687076",
  tabIconSelected: "#8B5CF6",
  link: "#8B5CF6",
  primary: "#8B5CF6",
  primaryPressed: "#7C3AED",
  primaryLight: "#F5F3FF",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  backgroundRoot: "#FFFFFF",
  backgroundDefault: "#FAFAFA",
  backgroundSecondary: "#F5F5F5",
  backgroundTertiary: "#E5E5E5",
  border: "#E5E5E5",
  borderFocus: "#8B5CF6",
  placeholder: "#A3A3A3",
  cardBackground: "#FFFFFF",
  instagram: "#E4405F",
  tiktok: "#000000",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  pinterest: "#E60023",
};

export const DarkTheme: AppTheme = {
  text: "#FFFFFF",
  textSecondary: "#A3A3A3",
  buttonText: "#FFFFFF",
  tabIconDefault: "#9BA1A6",
  tabIconSelected: "#A78BFA",
  link: "#A78BFA",
  primary: "#A78BFA",
  primaryPressed: "#8B5CF6",
  primaryLight: "#2E1065",
  success: "#34D399",
  warning: "#FBBF24",
  error: "#F87171",
  backgroundRoot: "#171717",
  backgroundDefault: "#262626",
  backgroundSecondary: "#404040",
  backgroundTertiary: "#525252",
  border: "#404040",
  borderFocus: "#A78BFA",
  placeholder: "#737373",
  cardBackground: "#262626",
  instagram: "#E4405F",
  tiktok: "#FFFFFF",
  youtube: "#FF0000",
  linkedin: "#0A66C2",
  pinterest: "#E60023",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
} as const;

export const ComponentSizes = {
  inputHeight: 44,
  buttonHeight: 50,
  cardHeight: 120,
  iconContainer: 40,
  avatarSmall: 32,
  avatarDefault: 40,
  avatarLarge: 64,
  tabBarHeight: 50,
  headerCompact: 44,
  headerLarge: 96,
  chartHeight: 200,
  chipHeight: 32,
} as const;

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  "2xl": 32,
  full: 9999,
} as const;

export const Typography = {
  display: { fontSize: 34, fontWeight: "700" as const },
  title1: { fontSize: 28, fontWeight: "700" as const },
  title2: { fontSize: 22, fontWeight: "700" as const },
  title3: { fontSize: 20, fontWeight: "600" as const },
  body: { fontSize: 17, fontWeight: "400" as const },
  callout: { fontSize: 16, fontWeight: "400" as const },
  subhead: { fontSize: 15, fontWeight: "400" as const },
  caption: { fontSize: 12, fontWeight: "400" as const },
  h1: { fontSize: 34, fontWeight: "700" as const },
  h2: { fontSize: 28, fontWeight: "700" as const },
  h3: { fontSize: 22, fontWeight: "600" as const },
  h4: { fontSize: 20, fontWeight: "600" as const },
  small: { fontSize: 14, fontWeight: "400" as const },
  link: { fontSize: 17, fontWeight: "400" as const },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  android: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
});

export const Shadows = {
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  strong: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export function getTheme(colorScheme: "light" | "dark"): AppTheme {
  return colorScheme === "dark" ? DarkTheme : LightTheme;
}

export type ThemeSpacing = typeof Spacing;
export type ThemeBorderRadius = typeof BorderRadius;
export type ThemeTypography = typeof Typography;
export type ThemeShadows = typeof Shadows;
