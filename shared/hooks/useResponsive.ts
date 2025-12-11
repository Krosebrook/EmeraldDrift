import { useWindowDimensions } from "react-native";
import { useMemo } from "react";
import { BREAKPOINTS, GRID_COLUMNS } from "../../core/constants";
import type { ResponsiveConfig } from "../../types";

export function useResponsive(): ResponsiveConfig {
  const { width } = useWindowDimensions();

  return useMemo(() => {
    const isMobile = width < BREAKPOINTS.MOBILE;
    const isTablet = width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET;
    const isDesktop = width >= BREAKPOINTS.TABLET;

    const screenSize: "mobile" | "tablet" | "desktop" = isMobile
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
      screenSize,
      isMobile,
      isTablet,
      isDesktop,
      numColumns,
      contentWidth,
      cardWidth,
    };
  }, [width]);
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

export function useContentWidth() {
  const { contentWidth } = useResponsive();
  return contentWidth;
}

export default useResponsive;
