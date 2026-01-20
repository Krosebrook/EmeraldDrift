import { Text, type TextProps } from "react-native";

import { useTheme } from "@/hooks/useTheme";
import { Typography } from "@/constants/theme";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "display"
    | "title1"
    | "title2"
    | "title3"
    | "body"
    | "callout"
    | "subhead"
    | "caption"
    | "h1"
    | "h2"
    | "h3"
    | "h4"
    | "small"
    | "link";
  secondary?: boolean;
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "body",
  secondary = false,
  ...rest
}: ThemedTextProps) {
  const { theme, isDark } = useTheme();

  const getColor = () => {
    if (isDark && darkColor) {
      return darkColor;
    }

    if (!isDark && lightColor) {
      return lightColor;
    }

    if (type === "link") {
      return theme.link;
    }

    if (secondary) {
      return theme.textSecondary;
    }

    return theme.text;
  };

  const getTypeStyle = () => {
    switch (type) {
      case "display":
        return Typography.display;
      case "title1":
        return Typography.title1;
      case "title2":
        return Typography.title2;
      case "title3":
        return Typography.title3;
      case "callout":
        return Typography.callout;
      case "subhead":
        return Typography.subhead;
      case "caption":
        return Typography.caption;
      case "h1":
        return Typography.h1;
      case "h2":
        return Typography.h2;
      case "h3":
        return Typography.h3;
      case "h4":
        return Typography.h4;
      case "small":
        return Typography.small;
      case "link":
        return Typography.link;
      case "body":
      default:
        return Typography.body;
    }
  };

  return (
    <Text style={[{ color: getColor() }, getTypeStyle(), style]} {...rest} />
  );
}
