import React, { useState, forwardRef } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  StyleProp,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Spacing } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

export interface InputFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  required?: boolean;
}

export const InputField = forwardRef<TextInput, InputFieldProps>(
  (
    {
      label,
      error,
      hint,
      leftIcon,
      rightIcon,
      onRightIconPress,
      containerStyle,
      required,
      style,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isFocused, setIsFocused] = useState(false);

    const hasError = Boolean(error);
    const borderColor = hasError
      ? theme.error
      : isFocused
        ? theme.borderFocus
        : theme.border;

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <View style={styles.labelRow}>
            <ThemedText type="subhead" style={styles.label}>
              {label}
            </ThemedText>
            {required ? (
              <ThemedText type="caption" style={{ color: theme.error }}>
                {" *"}
              </ThemedText>
            ) : null}
          </View>
        ) : null}

        <View
          style={[
            styles.inputContainer,
            {
              borderColor,
              backgroundColor: theme.backgroundDefault,
            },
          ]}
        >
          {leftIcon ? (
            <Feather
              name={leftIcon}
              size={18}
              color={theme.placeholder}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: theme.text,
                paddingLeft: leftIcon ? 0 : Spacing.base,
                paddingRight: rightIcon ? 0 : Spacing.base,
              },
              style,
            ]}
            placeholderTextColor={theme.placeholder}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
          />

          {rightIcon ? (
            <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
              <Feather name={rightIcon} size={18} color={theme.placeholder} />
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <ThemedText type="caption" style={{ color: theme.error, marginTop: Spacing.xs }}>
            {error}
          </ThemedText>
        ) : hint ? (
          <ThemedText type="caption" secondary style={{ marginTop: Spacing.xs }}>
            {hint}
          </ThemedText>
        ) : null}
      </View>
    );
  }
);

InputField.displayName = "InputField";

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: Spacing.xs,
  },
  label: {
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    height: Spacing.inputHeight,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  leftIcon: {
    marginLeft: Spacing.base,
    marginRight: Spacing.sm,
  },
  rightIcon: {
    padding: Spacing.sm,
    marginRight: Spacing.xs,
  },
});
