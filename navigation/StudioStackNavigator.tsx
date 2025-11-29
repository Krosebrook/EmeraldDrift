import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StudioScreen from "@/screens/StudioScreen";
import ScheduleScreen from "@/screens/ScheduleScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type StudioStackParamList = {
  Studio: undefined;
  Schedule: {
    title: string;
    caption: string;
    mediaUri?: string;
    platforms: string[];
  };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<StudioStackParamList>();

export default function StudioStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark })}
    >
      <Stack.Screen
        name="Studio"
        component={StudioScreen}
        options={{ headerTitle: "Create Content" }}
      />
      <Stack.Screen
        name="Schedule"
        component={ScheduleScreen}
        options={{ headerTitle: "Schedule" }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerTitle: "Settings" }}
      />
    </Stack.Navigator>
  );
}
