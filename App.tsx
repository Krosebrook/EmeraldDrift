import React from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import RootNavigator from "@/navigation/RootNavigator";
import { AuthProvider } from "@/context/AuthContext";
import { TeamProvider } from "@/context/TeamContext";
import { OfflineProvider } from "@/context/OfflineContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { SyncNotification } from "@/components/SyncNotification";

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
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
