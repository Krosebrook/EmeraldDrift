import { useWindowDimensions, Platform } from "react-native";

export type ScreenSize = "mobile" | "tablet" | "desktop";

export interface ResponsiveBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
}

const DEFAULT_BREAKPOINTS: ResponsiveBreakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
};

export function useResponsive(breakpoints = DEFAULT_BREAKPOINTS) {
  const { width, height } = useWindowDimensions();

  const screenSize: ScreenSize =
    width >= breakpoints.desktop
      ? "desktop"
      : width >= breakpoints.tablet
        ? "tablet"
        : "mobile";

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";
  const isDesktop = screenSize === "desktop";
  const isSmallScreen = width < breakpoints.tablet;
  const isLargeScreen = width >= breakpoints.desktop;

  const numColumns = isDesktop ? 4 : isTablet ? 2 : 1;
  const contentWidth = Math.min(width - 32, isDesktop ? 1200 : isTablet ? 768 : 480);

  return {
    width,
    height,
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    isLargeScreen,
    numColumns,
    contentWidth,
    breakpoints,
    isNative: Platform.OS !== "web",
  };
}

export function getGridItemWidth(screenWidth: number, columns: number, gap: number): number {
  return (screenWidth - gap * (columns - 1)) / columns;
}

export function getFontSizeForScreen(
  screenWidth: number,
  baseMobile: number,
  baseTablet: number,
  baseDesktop: number
): number {
  if (screenWidth >= 1024) return baseDesktop;
  if (screenWidth >= 768) return baseTablet;
  return baseMobile;
}
