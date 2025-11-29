import React, { useState } from "react";
import { StyleSheet, View, TextInput, Alert, Platform, ActivityIndicator, Image } from "react-native";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "ForgotPassword">;
};

export default function ForgotPasswordScreen({ navigation }: ForgotPasswordScreenProps) {
  const { theme } = useTheme();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleReset = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      "Check Your Email",
      "If an account exists with this email, you will receive password reset instructions.",
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="title1" style={styles.title}>Reset Password</ThemedText>
        <ThemedText secondary style={styles.subtitle}>
          Enter your email and we'll send you instructions to reset your password
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <ThemedText type="subhead" style={styles.label}>Email</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.backgroundDefault,
                color: theme.text,
                borderColor: error ? theme.error : theme.border,
              },
            ]}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (error) setError(undefined);
            }}
            placeholder="your@email.com"
            placeholderTextColor={theme.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="done"
            onSubmitEditing={handleReset}
            editable={!isLoading}
          />
          {error ? (
            <ThemedText type="caption" style={{ color: theme.error, marginTop: 4 }}>
              {error}
            </ThemedText>
          ) : null}
        </View>

        <Spacer height={Spacing.lg} />

        <Button onPress={handleReset} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            "Send Reset Link"
          )}
        </Button>
      </View>

      <Spacer height={Spacing.xl} />
    </ScreenKeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
  },
  headerSection: {
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  form: {
    width: "100%",
  },
  fieldContainer: {
    width: "100%",
  },
  label: {
    marginBottom: Spacing.sm,
    fontWeight: "600",
  },
  input: {
    height: Spacing.inputHeight,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.base,
    fontSize: Typography.body.fontSize,
  },
});
