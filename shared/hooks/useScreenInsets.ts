import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useMemo } from "react";
import { ComponentSizes, Spacing } from "../../core/theme";

interface ScreenInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
  headerHeight: number;
  tabBarHeight: number;
  contentPaddingTop: number;
  contentPaddingBottom: number;
}

interface UseScreenInsetsOptions {
  hasTabBar?: boolean;
  hasTransparentHeader?: boolean;
}

export function useScreenInsets(options: UseScreenInsetsOptions = {}): ScreenInsets {
  const { hasTabBar = true, hasTransparentHeader = false } = options;
  const insets = useSafeAreaInsets();

  let headerHeight = 0;
  try {
    headerHeight = useHeaderHeight();
  } catch {
    headerHeight = ComponentSizes.headerCompact;
  }

  return useMemo(() => {
    const tabBarHeight = hasTabBar ? ComponentSizes.tabBarHeight : 0;

    const contentPaddingTop = hasTransparentHeader
      ? headerHeight + Spacing.xl
      : Spacing.xl;

    const contentPaddingBottom = hasTabBar
      ? tabBarHeight + Spacing.xl
      : insets.bottom + Spacing.xl;

    return {
      top: insets.top,
      bottom: insets.bottom,
      left: insets.left,
      right: insets.right,
      headerHeight,
      tabBarHeight,
      contentPaddingTop,
      contentPaddingBottom,
    };
  }, [insets, headerHeight, hasTabBar, hasTransparentHeader]);
}

export default useScreenInsets;
