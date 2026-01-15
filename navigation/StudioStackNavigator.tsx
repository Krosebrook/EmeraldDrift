import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StudioScreen from "@/screens/StudioScreen";
import ScheduleScreen from "@/screens/ScheduleScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import DesignStudioScreen from "@/screens/DesignStudioScreen";
import MerchStudioScreen from "@/screens/MerchStudioScreen";
import DesignListScreen from "@/screens/DesignListScreen";
import DesignDetailScreen from "@/screens/DesignDetailScreen";
import PublishDesignScreen from "@/screens/PublishDesignScreen";
import PlatformSettingsScreen from "@/screens/PlatformSettingsScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";
import type { DesignPlatform } from "@/features";

export type StudioStackParamList = {
  Studio: undefined;
  Schedule: {
    title: string;
    caption: string;
    mediaUri?: string;
    platforms: string[];
  };
  Settings: undefined;
  DesignStudio: undefined;
  MerchStudio: undefined;
  DesignList: undefined;
  DesignDetail: { designId: string };
  PublishDesign: { designId: string };
  PlatformSettings: { platform: DesignPlatform };
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
      <Stack.Screen
        name="DesignStudio"
        component={DesignStudioScreen}
        options={{ headerTitle: "Design Studio" }}
      />
      <Stack.Screen
        name="MerchStudio"
        component={MerchStudioScreen}
        options={{ headerTitle: "Merch Studio" }}
      />
      <Stack.Screen
        name="DesignList"
        component={DesignListScreen}
        options={{ headerTitle: "My Designs" }}
      />
      <Stack.Screen
        name="DesignDetail"
        component={DesignDetailScreen}
        options={{ headerTitle: "Design Details" }}
      />
      <Stack.Screen
        name="PublishDesign"
        component={PublishDesignScreen}
        options={{ headerTitle: "Publish Design" }}
      />
      <Stack.Screen
        name="PlatformSettings"
        component={PlatformSettingsScreen}
        options={{ headerTitle: "Platform Settings" }}
      />
    </Stack.Navigator>
  );
}
