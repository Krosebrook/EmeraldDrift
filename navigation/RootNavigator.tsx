import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import MainTabNavigator from "@/navigation/MainTabNavigator";
import AuthStackNavigator from "@/navigation/AuthStackNavigator";
import OnboardingScreen from "@/screens/OnboardingScreen";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { userStatsService } from "@/services/userStats";

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

interface OnboardingContextType {
  completeOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType>({
  completeOnboarding: () => {},
});

export function useOnboardingContext() {
  return useContext(OnboardingContext);
}

function OnboardingScreenWrapper() {
  const { user } = useAuthContext();
  const { completeOnboarding } = useOnboardingContext();

  const handleComplete = useCallback(async () => {
    if (user) {
      const state = await userStatsService.getOnboardingState(user.id);
      state.completed = true;
      state.completedAt = new Date().toISOString();
      await userStatsService.saveOnboardingState(user.id, state);
    }
    completeOnboarding();
  }, [user, completeOnboarding]);

  return <OnboardingScreen onComplete={handleComplete} />;
}

export default function RootNavigator() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (isAuthenticated && user) {
        try {
          await userStatsService.initializeUser(user.id);
          const onboardingState = await userStatsService.getOnboardingState(user.id);
          const completed = onboardingState?.completed ?? false;
          setNeedsOnboarding(!completed);
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          setNeedsOnboarding(false);
        }
      } else {
        setNeedsOnboarding(null);
      }
      setIsInitialized(true);
    };

    if (!isLoading) {
      checkOnboardingStatus();
    }
  }, [isAuthenticated, isLoading, user]);

  const completeOnboarding = useCallback(() => {
    setNeedsOnboarding(false);
  }, []);

  if (isLoading || !isInitialized) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.backgroundRoot }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <OnboardingContext.Provider value={{ completeOnboarding }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          needsOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreenWrapper} />
          ) : (
            <Stack.Screen name="Main" component={MainTabNavigator} />
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </OnboardingContext.Provider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
