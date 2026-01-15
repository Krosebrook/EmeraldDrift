import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import { STYLE_INFO, type StylePreference } from "@/features/merch/types";

interface StyleSelectorProps {
  selectedStyle: StylePreference;
  onSelectStyle: (style: StylePreference) => void;
}

const STYLES: StylePreference[] = [
  "studio",
  "lifestyle",
  "editorial",
  "minimal",
  "dramatic",
  "vibrant",
  "vintage",
  "professional",
];

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function StyleOption({
  style,
  selected,
  onSelect,
}: {
  style: StylePreference;
  selected: boolean;
  onSelect: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const info = STYLE_INFO[style];

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  return (
    <AnimatedPressable
      onPress={onSelect}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.styleOption,
        {
          backgroundColor: selected ? theme.primaryLight : theme.backgroundSecondary,
          borderColor: selected ? theme.primary : "transparent",
        },
        animatedStyle,
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: selected ? theme.primary : theme.backgroundTertiary },
        ]}
      >
        <Feather
          name={info.icon as React.ComponentProps<typeof Feather>["name"]}
          size={18}
          color={selected ? "#FFFFFF" : theme.textSecondary}
        />
      </View>
      <View style={styles.styleContent}>
        <ThemedText
          type="subhead"
          style={{ fontWeight: selected ? "600" : "400" }}
        >
          {info.name}
        </ThemedText>
        <ThemedText type="caption" secondary numberOfLines={1}>
          {info.description}
        </ThemedText>
      </View>
      {selected && (
        <Feather name="check" size={18} color={theme.primary} />
      )}
    </AnimatedPressable>
  );
}

export function StyleSelector({ selectedStyle, onSelectStyle }: StyleSelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <ThemedText type="title3" style={styles.title}>
        Visual Style
      </ThemedText>
      <ThemedText type="caption" secondary style={styles.subtitle}>
        Choose how your mockup will be photographed
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {STYLES.map((style) => (
          <StyleOption
            key={style}
            style={style}
            selected={selectedStyle === style}
            onSelect={() => onSelectStyle(style)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export function StyleSelectorCompact({
  selectedStyle,
  onSelectStyle,
}: StyleSelectorProps) {
  const { theme } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.compactScrollContent}
    >
      {STYLES.map((style) => {
        const info = STYLE_INFO[style];
        const selected = selectedStyle === style;

        return (
          <Pressable
            key={style}
            onPress={() => onSelectStyle(style)}
            style={[
              styles.compactOption,
              {
                backgroundColor: selected ? theme.primary : theme.backgroundSecondary,
                borderColor: selected ? theme.primary : theme.border,
              },
            ]}
          >
            <Feather
              name={info.icon as React.ComponentProps<typeof Feather>["name"]}
              size={14}
              color={selected ? "#FFFFFF" : theme.textSecondary}
            />
            <ThemedText
              type="caption"
              style={{
                color: selected ? "#FFFFFF" : theme.text,
                marginLeft: 4,
              }}
            >
              {info.name}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.md,
  },
  scrollContent: {
    paddingRight: Spacing.base,
    gap: Spacing.sm,
  },
  styleOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    minWidth: 200,
    marginRight: Spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  styleContent: {
    flex: 1,
    gap: 2,
  },
  compactScrollContent: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  compactOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
  },
});
