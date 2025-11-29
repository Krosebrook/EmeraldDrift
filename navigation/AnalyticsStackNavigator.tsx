import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AnalyticsScreen from "@/screens/AnalyticsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type AnalyticsStackParamList = {
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<AnalyticsStackParamList>();

export default function AnalyticsStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark })}
    >
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{ headerTitle: "Analytics" }}
      />
    </Stack.Navigator>
  );
}
