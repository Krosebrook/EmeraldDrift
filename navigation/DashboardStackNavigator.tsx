import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DashboardScreen from "@/screens/DashboardScreen";
import ContentListScreen from "@/screens/ContentListScreen";
import ContentDetailScreen from "@/screens/ContentDetailScreen";
import PlatformsScreen from "@/screens/PlatformsScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type DashboardStackParamList = {
  Dashboard: undefined;
  ContentList: undefined;
  ContentDetail: { id: string };
  Platforms: undefined;
};

const Stack = createNativeStackNavigator<DashboardStackParamList>();

export default function DashboardStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark })}
    >
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Creator Studio" />,
        }}
      />
      <Stack.Screen
        name="ContentList"
        component={ContentListScreen}
        options={{ headerTitle: "All Content" }}
      />
      <Stack.Screen
        name="ContentDetail"
        component={ContentDetailScreen}
        options={{ headerTitle: "Content Details" }}
      />
      <Stack.Screen
        name="Platforms"
        component={PlatformsScreen}
        options={{ headerTitle: "Platforms" }}
      />
    </Stack.Navigator>
  );
}
