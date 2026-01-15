import React from "react";
import { View, StyleSheet, Image, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface UploadAreaProps {
  label: string;
  description?: string;
  image: string | null;
  onImageSelected: (uri: string, base64: string) => void;
  onRemove?: () => void;
  aspectRatio?: number;
  optional?: boolean;
}

export function UploadArea({
  label,
  description,
  image,
  onImageSelected,
  onRemove,
  aspectRatio = 1,
  optional = false,
}: UploadAreaProps) {
  const { theme } = useTheme();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [aspectRatio, 1],
      quality: 0.9,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const base64 = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : "";
      onImageSelected(asset.uri, base64);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title3">{label}</ThemedText>
        {optional && (
          <ThemedText type="caption" secondary>
            Optional
          </ThemedText>
        )}
      </View>
      {description && (
        <ThemedText type="caption" secondary style={styles.description}>
          {description}
        </ThemedText>
      )}

      {image ? (
        <View style={styles.previewContainer}>
          <Image
            source={{ uri: image }}
            style={[styles.preview, { aspectRatio }]}
            resizeMode="contain"
          />
          <View style={styles.previewActions}>
            <Pressable
              onPress={pickImage}
              style={[styles.previewAction, { backgroundColor: theme.backgroundSecondary }]}
            >
              <Feather name="edit-2" size={16} color={theme.text} />
            </Pressable>
            {onRemove && (
              <Pressable
                onPress={onRemove}
                style={[styles.previewAction, { backgroundColor: theme.error }]}
              >
                <Feather name="trash-2" size={16} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          onPress={pickImage}
          style={[
            styles.dropzone,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={[styles.uploadIcon, { backgroundColor: theme.backgroundTertiary }]}>
            <Feather name="upload" size={24} color={theme.textSecondary} />
          </View>
          <ThemedText type="body" style={styles.uploadText}>
            Tap to upload
          </ThemedText>
          <ThemedText type="caption" secondary>
            PNG, JPG up to 10MB
          </ThemedText>
        </Pressable>
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
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.md,
  },
  dropzone: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 150,
  },
  uploadIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  uploadText: {
    fontWeight: "500",
    marginBottom: Spacing.xs,
  },
  previewContainer: {
    position: "relative",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
  },
  preview: {
    width: "100%",
    backgroundColor: "#f0f0f0",
    borderRadius: BorderRadius.lg,
  },
  previewActions: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: "row",
    gap: Spacing.sm,
  },
  previewAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});
