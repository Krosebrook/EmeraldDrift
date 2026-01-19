import React, { useEffect, useCallback } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

import RootNavigator from "@/navigation/RootNavigator";
import { AuthProvider } from "@/context/AuthContext";
import { TeamProvider } from "@/context/TeamContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SyncNotification } from "@/components/SyncNotification";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  // Splash screen prevention failed, but app can continue
  console.warn("Failed to prevent splash screen auto-hide");
});

export default function App() {
  const [appIsReady, setAppIsReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // App preparation - minimal delay to ensure render cycle
        setAppIsReady(true);
      } catch (e) {
        console.warn("Error during app preparation:", e);
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide the splash screen once the app is ready
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
          <KeyboardProvider>
            <AuthProvider>
              <TeamProvider>
                <OfflineProvider>
                  <NavigationContainer>
                    <RootNavigator />
                    <OfflineIndicator position="bottom" />
                    <SyncNotification />
                  </NavigationContainer>
                </OfflineProvider>
              </TeamProvider>
            </AuthProvider>
            <StatusBar style="auto" />
          </KeyboardProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
