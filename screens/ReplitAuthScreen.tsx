import React, { useState, useRef, useCallback } from "react";
import { StyleSheet, View, ActivityIndicator, Platform, Pressable } from "react-native";
import { WebView } from "react-native-webview";
import { Feather } from "@expo/vector-icons";
import Constants from "expo-constants";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { useTheme } from "@/hooks/useTheme";
import { useAuthContext } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { AuthStackParamList } from "@/navigation/AuthStackNavigator";

type ReplitAuthScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, "ReplitAuth">;
};

function getAuthUrl(): string {
  if (__DEV__) {
    const devDomain = Constants.expoConfig?.extra?.REPLIT_DEV_DOMAIN;
    if (devDomain) {
      return `https://${devDomain}/api/auth/login`;
    }
    return "http://localhost:3001/api/auth/login";
  }
  return "/api/auth/login";
}

export default function ReplitAuthScreen({ navigation }: ReplitAuthScreenProps) {
  const { theme } = useTheme();
  const { reload } = useAuthContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = useCallback(async (event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.success && data.user) {
        await reload();
        navigation.goBack();
      }
    } catch {
    }
  }, [reload, navigation]);

  const handleNavigationStateChange = useCallback(async (navState: { url: string }) => {
    if (navState.url.includes("/api/auth/login") && !navState.url.includes("replit.com")) {
      try {
        const response = await fetch(navState.url, { credentials: "include" });
        const text = await response.text();
        if (text.startsWith("{")) {
          const data = JSON.parse(text);
          if (data.success && data.user) {
            await reload();
            navigation.goBack();
          }
        }
      } catch {
      }
    }
  }, [reload, navigation]);

  const injectedJavaScript = `
    (function() {
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        return originalFetch.apply(this, args).then(response => {
          if (args[0] && args[0].includes && args[0].includes('/api/auth')) {
            response.clone().json().then(data => {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            }).catch(() => {});
          }
          return response;
        });
      };

      window.addEventListener('message', function(event) {
        if (event.data && typeof event.data === 'object') {
          window.ReactNativeWebView.postMessage(JSON.stringify(event.data));
        }
      });
      
      true;
    })();
  `;

  if (Platform.OS === "web") {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.webFallback}>
          <Feather name="globe" size={48} color={theme.primary} />
          <ThemedText type="title2" style={styles.webTitle}>
            Replit Login
          </ThemedText>
          <ThemedText secondary style={styles.webMessage}>
            Replit authentication works best in the native app.
            Please use the email/password login on web.
          </ThemedText>
          <Pressable
            style={[styles.backButton, { backgroundColor: theme.primary }]}
            onPress={() => navigation.goBack()}
          >
            <ThemedText style={{ color: "#FFFFFF" }}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText secondary style={styles.loadingText}>
            Loading Replit Login...
          </ThemedText>
        </View>
      ) : null}

      {error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={48} color={theme.error} />
          <ThemedText type="title3" style={[styles.errorTitle, { color: theme.error }]}>
            Connection Error
          </ThemedText>
          <ThemedText secondary style={styles.errorMessage}>
            {error}
          </ThemedText>
          <Pressable
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              setError(null);
              setLoading(true);
              webViewRef.current?.reload();
            }}
          >
            <ThemedText style={{ color: "#FFFFFF" }}>Try Again</ThemedText>
          </Pressable>
        </View>
      ) : null}

      <WebView
        ref={webViewRef}
        source={{ uri: getAuthUrl() }}
        style={[styles.webview, (loading || error) && styles.hidden]}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          setError(nativeEvent.description || "Failed to load login page");
          setLoading(false);
        }}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        injectedJavaScript={injectedJavaScript}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
      />

      <Pressable
        style={[styles.closeButton, { backgroundColor: theme.backgroundSecondary }]}
        onPress={() => navigation.goBack()}
      >
        <Feather name="x" size={24} color={theme.text} />
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  hidden: {
    opacity: 0,
    height: 0,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: Spacing.md,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.md,
  },
  errorMessage: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  closeButton: {
    position: "absolute",
    top: Spacing.xl + 40,
    right: Spacing.base,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  webFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  webTitle: {
    marginTop: Spacing.md,
  },
  webMessage: {
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  backButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
});
