import React, { useState } from "react";
import { View, StyleSheet, TextInput, Pressable, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { TextOverlay } from "@/features/merch/types";

interface TextOverlayControlsProps {
  overlays: TextOverlay[];
  onAddOverlay: (overlay: TextOverlay) => void;
  onUpdateOverlay: (id: string, updates: Partial<TextOverlay>) => void;
  onRemoveOverlay: (id: string) => void;
  maxOverlays?: number;
}

const FONTS = [
  { id: "system", name: "System", family: "System" },
  { id: "serif", name: "Serif", family: "Georgia" },
  { id: "mono", name: "Mono", family: "Courier" },
  { id: "rounded", name: "Rounded", family: "Arial Rounded MT Bold" },
];

const getColors = (theme: any) => [
  theme.text,
  theme.backgroundDefault,
  theme.primary,
  theme.error,
  theme.warning,
  theme.success,
  "#3B82F6",
  "#EC4899",
];

function generateOverlayId(): string {
  return `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function TextOverlayItem({
  overlay,
  onUpdate,
  onRemove,
}: {
  overlay: TextOverlay;
  onUpdate: (updates: Partial<TextOverlay>) => void;
  onRemove: () => void;
}) {
  const { theme } = useTheme();
  const availableColors = getColors(theme);

  return (
    <View style={[styles.overlayItem, { backgroundColor: theme.backgroundSecondary }]}>
      <View style={styles.overlayHeader}>
        <ThemedText type="subhead" style={{ fontWeight: "600" }}>
          Text Layer
        </ThemedText>
        <Pressable onPress={onRemove} hitSlop={8}>
          <Feather name="trash-2" size={18} color={theme.error} />
        </Pressable>
      </View>

      <TextInput
        value={overlay.text}
        onChangeText={(text) => onUpdate({ text })}
        placeholder="Enter text..."
        placeholderTextColor={theme.placeholder}
        style={[
          styles.textInput,
          {
            backgroundColor: theme.backgroundDefault,
            color: theme.text,
            borderColor: theme.border,
          },
        ]}
        multiline
        numberOfLines={2}
      />

      <View style={styles.controlRow}>
        <ThemedText type="caption" secondary style={styles.controlLabel}>
          Font
        </ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.fontOptions}>
            {FONTS.map((font) => (
              <Pressable
                key={font.id}
                onPress={() => onUpdate({ fontFamily: font.family })}
                style={[
                  styles.fontOption,
                  {
                    backgroundColor:
                      overlay.fontFamily === font.family
                        ? theme.primary
                        : theme.backgroundTertiary,
                  },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: overlay.fontFamily === font.family ? "#FFFFFF" : theme.text,
                    fontFamily: font.family,
                  }}
                >
                  {font.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.controlRow}>
        <ThemedText type="caption" secondary style={styles.controlLabel}>
          Size
        </ThemedText>
        <View style={styles.sizeControls}>
          <Pressable
            onPress={() => onUpdate({ fontSize: Math.max(12, overlay.fontSize - 2) })}
            style={[styles.sizeButton, { backgroundColor: theme.backgroundTertiary }]}
          >
            <Feather name="minus" size={16} color={theme.text} />
          </Pressable>
          <View style={[styles.sizeDisplay, { backgroundColor: theme.backgroundDefault }]}>
            <ThemedText type="body">{overlay.fontSize}px</ThemedText>
          </View>
          <Pressable
            onPress={() => onUpdate({ fontSize: Math.min(72, overlay.fontSize + 2) })}
            style={[styles.sizeButton, { backgroundColor: theme.backgroundTertiary }]}
          >
            <Feather name="plus" size={16} color={theme.text} />
          </Pressable>
        </View>
      </View>

      <View style={styles.controlRow}>
        <ThemedText type="caption" secondary style={styles.controlLabel}>
          Color
        </ThemedText>
        <View style={styles.colorOptions}>
          {availableColors.map((color, index) => (
            <Pressable
              key={`${color}-${index}`}
              onPress={() => onUpdate({ color })}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                overlay.color === color && { borderColor: theme.primary },
              ]}
            >
              {overlay.color === color && (
                <Feather
                  name="check"
                  size={12}
                  color={index === 0 ? theme.backgroundDefault : theme.text}
                />
              )}
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.controlRow}>
        <ThemedText type="caption" secondary style={styles.controlLabel}>
          Style
        </ThemedText>
        <View style={styles.styleOptions}>
          <Pressable
            onPress={() =>
              onUpdate({
                fontWeight: overlay.fontWeight === "bold" ? "normal" : "bold",
              })
            }
            style={[
              styles.styleOption,
              {
                backgroundColor:
                  overlay.fontWeight === "bold"
                    ? theme.primary
                    : theme.backgroundTertiary,
              },
            ]}
          >
            <ThemedText
              style={{
                fontWeight: "bold",
                color: overlay.fontWeight === "bold" ? "#FFFFFF" : theme.text,
              }}
            >
              B
            </ThemedText>
          </Pressable>

          {(["left", "center", "right"] as const).map((alignment) => (
            <Pressable
              key={alignment}
              onPress={() => onUpdate({ alignment })}
              style={[
                styles.styleOption,
                {
                  backgroundColor:
                    overlay.alignment === alignment
                      ? theme.primary
                      : theme.backgroundTertiary,
                },
              ]}
            >
              <Feather
                name={
                  alignment === "left"
                    ? "align-left"
                    : alignment === "center"
                    ? "align-center"
                    : "align-right"
                }
                size={16}
                color={overlay.alignment === alignment ? "#FFFFFF" : theme.text}
              />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

export function TextOverlayControls({
  overlays,
  onAddOverlay,
  onUpdateOverlay,
  onRemoveOverlay,
  maxOverlays = 3,
}: TextOverlayControlsProps) {
  const { theme } = useTheme();

  const handleAddOverlay = () => {
    const newOverlay: TextOverlay = {
      id: generateOverlayId(),
      text: "",
      fontFamily: "System",
      fontSize: 24,
      fontWeight: "normal",
      color: "#FFFFFF",
      position: { x: 50, y: 50 },
      rotation: 0,
      alignment: "center",
    };
    onAddOverlay(newOverlay);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <ThemedText type="title3">Text Overlays</ThemedText>
          <ThemedText type="caption" secondary>
            Add custom text to your product
          </ThemedText>
        </View>
        <ThemedText type="caption" secondary>
          {overlays.length}/{maxOverlays}
        </ThemedText>
      </View>

      {overlays.map((overlay) => (
        <TextOverlayItem
          key={overlay.id}
          overlay={overlay}
          onUpdate={(updates) => onUpdateOverlay(overlay.id, updates)}
          onRemove={() => onRemoveOverlay(overlay.id)}
        />
      ))}

      {overlays.length < maxOverlays && (
        <Button
          onPress={handleAddOverlay}
          variant="outline"
          leftIcon="plus"
          fullWidth
        >
          Add Text Layer
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  overlayItem: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  overlayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: "top",
  },
  controlRow: {
    gap: Spacing.sm,
  },
  controlLabel: {
    marginBottom: 2,
  },
  fontOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  fontOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  sizeControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  sizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sizeDisplay: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: "center",
  },
  colorOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionActive: {
    borderWidth: 2,
  },
  styleOptions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  styleOption: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
