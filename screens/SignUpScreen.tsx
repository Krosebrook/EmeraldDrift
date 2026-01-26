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

type SignUpScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "SignUp">;
};

export default function SignUpScreen({ navigation }: SignUpScreenProps) {
  const { theme } = useTheme();
  const { signUp, isLoading } = useAuthContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
    } = {};

    if (!name.trim()) {
      newErrors.name = "Name is required";
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validate()) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    const success = await signUp(email.trim(), password, name.trim());

    if (success) {
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      Alert.alert("Sign Up Failed", "Please try again.");
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
          Create Account
        </ThemedText>
        <ThemedText secondary style={styles.subtitle}>
          Start your content creation journey
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.form}>
        <View style={styles.fieldContainer}>
          <ThemedText type="subhead" style={styles.label}>
            Full Name
          </ThemedText>
          <TextInput
            style={inputStyle(errors.name)}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errors.name)
                setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder="Your full name"
            placeholderTextColor={theme.placeholder}
            autoCapitalize="words"
            autoComplete="name"
            returnKeyType="next"
            editable={!isLoading}
            accessibilityLabel="Full Name"
          />
          {errors.name ? (
            <ThemedText
              type="caption"
              style={{ color: theme.error, marginTop: 4 }}
            >
              {errors.name}
            </ThemedText>
          ) : null}
        </View>

        <Spacer height={Spacing.base} />

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
              placeholder="Create a password"
              placeholderTextColor={theme.placeholder}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="next"
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

        <Spacer height={Spacing.base} />

        <View style={styles.fieldContainer}>
          <ThemedText type="subhead" style={styles.label}>
            Confirm Password
          </ThemedText>
          <TextInput
            style={inputStyle(errors.confirmPassword)}
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword)
                setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }}
            placeholder="Confirm your password"
            placeholderTextColor={theme.placeholder}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            returnKeyType="done"
            onSubmitEditing={handleSignUp}
            editable={!isLoading}
            accessibilityLabel="Confirm Password"
          />
          {errors.confirmPassword ? (
            <ThemedText
              type="caption"
              style={{ color: theme.error, marginTop: 4 }}
            >
              {errors.confirmPassword}
            </ThemedText>
          ) : null}
        </View>

        <Spacer height={Spacing.lg} />

        <Button onPress={handleSignUp} disabled={isLoading} loading={isLoading}>
          Create Account
        </Button>

        <Spacer height={Spacing.base} />

        <ThemedText type="caption" secondary style={styles.terms}>
          By signing up, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </View>

      <Spacer height={Spacing.xl} />

      <View style={styles.footer}>
        <ThemedText secondary>Already have an account? </ThemedText>
        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
          accessibilityLabel="Sign In"
        >
          <ThemedText type="link" style={{ fontWeight: "600" }}>
            Sign In
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
  terms: {
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
  },
});
