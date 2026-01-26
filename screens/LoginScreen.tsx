import React, { useState } from "react";
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  Platform,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ScreenKeyboardAwareScrollView } from "@/components/ScreenKeyboardAwareScrollView";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { Spacing, BorderRadius, Typography } from "@/constants/theme";
import Spacer from "@/components/Spacer";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "Login">;
};

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { theme, isDark } = useTheme();
  const { signIn, isLoading } = useAuthContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const success = await signIn(email.trim(), password);

    if (success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert(
        "Login Failed",
        "Please check your credentials and try again.",
      );
    }
  };

  const inputStyle = (error?: string) => [
    styles.input,
    {
      backgroundColor: theme.backgroundDefault,
      color: theme.text,
      borderColor: error ? theme.error : theme.border,
    },
  ];

  return (
    <ScreenKeyboardAwareScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerSection}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <ThemedText type="display" style={styles.title}>
          Welcome Back
        </ThemedText>
        <ThemedText secondary style={styles.subtitle}>
          Sign in to continue to Creator Studio
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <ThemedText type="subhead" style={styles.label}>
            Email
          </ThemedText>
          <TextInput
            style={inputStyle(errors.email)}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errors.email)
                setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="your@email.com"
            placeholderTextColor={theme.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            editable={!isLoading}
            accessibilityLabel="Email address"
          />
          {errors.email ? (
            <ThemedText
              type="caption"
              style={{ color: theme.error, marginTop: 4 }}
            >
              {errors.email}
            </ThemedText>
          ) : null}
        </View>

        <Spacer height={Spacing.base} />

        <View style={styles.fieldContainer}>
          <ThemedText type="subhead" style={styles.label}>
            Password
          </ThemedText>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[inputStyle(errors.password), styles.passwordInput]}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (errors.password)
                  setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="Enter your password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!isLoading}
              accessibilityLabel="Password"
            />
            <Pressable
              onPress={() => {
                setShowPassword(!showPassword);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              style={styles.eyeButton}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={theme.textSecondary}
              />
            </Pressable>
          </View>
          {errors.password ? (
            <ThemedText
              type="caption"
              style={{ color: theme.error, marginTop: 4 }}
            >
              {errors.password}
            </ThemedText>
          ) : null}
        </View>

        <Spacer height={Spacing.sm} />

        <Pressable
          onPress={() => navigation.navigate("ForgotPassword")}
          style={({ pressed }) => [
            { opacity: pressed ? 0.7 : 1, alignSelf: "flex-end" },
          ]}
          accessibilityRole="link"
          accessibilityLabel="Forgot Password"
        >
          <ThemedText type="link">Forgot Password?</ThemedText>
        </Pressable>

        <Spacer height={Spacing.lg} />

        <Button onPress={handleLogin} disabled={isLoading} loading={isLoading}>
          Sign In
        </Button>

        <Spacer height={Spacing.lg} />

        <View style={styles.divider}>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.border }]}
          />
          <ThemedText type="caption" secondary style={styles.dividerText}>
            or continue with
          </ThemedText>
          <View
            style={[styles.dividerLine, { backgroundColor: theme.border }]}
          />
        </View>

        <Spacer height={Spacing.lg} />

        <Pressable
          style={({ pressed }) => [
            styles.replitButton,
            { backgroundColor: "#F26207", opacity: pressed ? 0.9 : 1 },
          ]}
          onPress={() => navigation.navigate("ReplitAuth")}
          accessibilityRole="button"
          accessibilityLabel="Sign in with Replit"
        >
          <Feather name="code" size={20} color="#FFFFFF" />
          <ThemedText style={styles.replitButtonText}>
            Sign in with Replit
          </ThemedText>
        </Pressable>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.footer}>
        <ThemedText secondary>Don't have an account? </ThemedText>
        <Pressable
          onPress={() => navigation.navigate("SignUp")}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Sign Up"
        >
          <ThemedText type="link" style={{ fontWeight: "600" }}>
            Sign Up
          </ThemedText>
        </Pressable>
      </View>
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
  passwordContainer: {
    position: "relative",
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: "absolute",
    right: 0,
    top: 0,
    height: Spacing.inputHeight,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.md,
  },
  socialButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.md,
  },
  replitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.md,
  },
  replitButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
