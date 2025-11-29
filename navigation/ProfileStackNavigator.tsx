import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import ProfileScreen from "@/screens/ProfileScreenNew";
import PlatformsScreen from "@/screens/PlatformsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import PrivacyScreen from "@/screens/PrivacyScreen";
import HelpScreen from "@/screens/HelpScreen";
import SupportScreen from "@/screens/SupportScreen";
import AboutScreen from "@/screens/AboutScreen";
import MediaLibraryScreen from "@/screens/MediaLibraryScreen";
import TeamScreen from "@/screens/TeamScreen";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

export type ProfileStackParamList = {
  Profile: undefined;
  Platforms: undefined;
  Notifications: undefined;
  Privacy: undefined;
  Help: undefined;
  Support: undefined;
  About: undefined;
  MediaLibrary: undefined;
  Team: undefined;
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={getCommonScreenOptions({ theme, isDark })}
    >
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerTitle: "Profile" }}
      />
      <Stack.Screen
        name="Platforms"
        component={PlatformsScreen}
        options={{ headerTitle: "Platforms" }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerTitle: "Notifications" }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={{ headerTitle: "Privacy & Security" }}
      />
      <Stack.Screen
        name="Help"
        component={HelpScreen}
        options={{ headerTitle: "Help Center" }}
      />
      <Stack.Screen
        name="Support"
        component={SupportScreen}
        options={{ headerTitle: "Contact Support" }}
      />
      <Stack.Screen
        name="About"
        component={AboutScreen}
        options={{ headerTitle: "About" }}
      />
      <Stack.Screen
        name="MediaLibrary"
        component={MediaLibraryScreen}
        options={{ headerTitle: "Media Library" }}
      />
      <Stack.Screen
        name="Team"
        component={TeamScreen}
        options={{ headerTitle: "Team" }}
      />
    </Stack.Navigator>
  );
}
