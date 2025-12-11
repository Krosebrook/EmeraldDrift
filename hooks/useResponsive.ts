import { useWindowDimensions, Platform } from "react-native";
import { useMemo } from "react";
import type { ResponsiveConfig } from "@/types";

export type ScreenSize = "mobile" | "tablet" | "desktop";

export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1200,
} as const;

export const GRID_COLUMNS = {
  MOBILE: 2,
  TABLET: 3,
  DESKTOP: 4,
} as const;

export function useResponsive(): ResponsiveConfig & {
  width: number;
  height: number;
  isSmallScreen: boolean;
  isLargeScreen: boolean;
  isNative: boolean;
} {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < BREAKPOINTS.MOBILE;
    const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
    const isDesktop = width >= BREAKPOINTS.TABLET;

    const screenSize: ScreenSize = isMobile
      ? "mobile"
      : isTablet
        ? "tablet"
        : "desktop";

    const numColumns = isMobile
      ? GRID_COLUMNS.MOBILE
      : isTablet
        ? GRID_COLUMNS.TABLET
        : GRID_COLUMNS.DESKTOP;

    const contentWidth = isDesktop
      ? Math.min(width * 0.8, BREAKPOINTS.WIDE)
      : isTablet
        ? width * 0.9
        : width;

    const cardWidth = isMobile ? "48%" : isTablet ? "31%" : "23%";

    return {
      width,
      height,
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      isSmallScreen: width < BREAKPOINTS.TABLET,
      isLargeScreen: width >= BREAKPOINTS.DESKTOP,
      numColumns,
      contentWidth,
      cardWidth,
      isNative: Platform.OS !== "web",
    };
  }, [width, height]);
}

export function useGridLayout() {
  const { screenSize, numColumns, cardWidth } = useResponsive();

  return useMemo(
    () => ({
      numColumns,
      cardWidth,
      gap: screenSize === "mobile" ? 8 : screenSize === "tablet" ? 12 : 16,
    }),
    [screenSize, numColumns, cardWidth]
  );
}

export function useContentWidth(): number {
  const { contentWidth } = useResponsive();
  return contentWidth;
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
  if (screenWidth >= BREAKPOINTS.DESKTOP) return baseDesktop;
  if (screenWidth >= BREAKPOINTS.TABLET) return baseTablet;
  return baseMobile;
}

export default useResponsive;
