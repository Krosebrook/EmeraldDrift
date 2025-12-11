export const ROUTES = {
  AUTH: {
    LOGIN: "Login",
    SIGNUP: "SignUp",
    FORGOT_PASSWORD: "ForgotPassword",
  },
  ONBOARDING: {
    MAIN: "Onboarding",
  },
  LANDING: {
    MAIN: "Landing",
  },
  MAIN: {
    TABS: "MainTabs",
    DASHBOARD: "Dashboard",
    STUDIO: "Studio",
    ANALYTICS: "Analytics",
    PROFILE: "Profile",
  },
  DASHBOARD_STACK: {
    HOME: "DashboardHome",
    SCHEDULE: "Schedule",
    PLATFORMS: "Platforms",
    CONTENT_LIST: "ContentList",
    CONTENT_DETAIL: "ContentDetail",
  },
  STUDIO_STACK: {
    HOME: "StudioHome",
    PREVIEW: "Preview",
  },
  ANALYTICS_STACK: {
    HOME: "AnalyticsHome",
    PLATFORM_DETAIL: "PlatformDetail",
    POST_DETAIL: "PostDetail",
  },
  PROFILE_STACK: {
    HOME: "ProfileHome",
    SETTINGS: "Settings",
    NOTIFICATIONS: "Notifications",
    PRIVACY: "Privacy",
    HELP: "Help",
    SUPPORT: "Support",
    ABOUT: "About",
    MEDIA_LIBRARY: "MediaLibrary",
    TEAM: "Team",
  },
} as const;

export type AuthRoutes = typeof ROUTES.AUTH[keyof typeof ROUTES.AUTH];
export type MainRoutes = typeof ROUTES.MAIN[keyof typeof ROUTES.MAIN];
export type DashboardRoutes = typeof ROUTES.DASHBOARD_STACK[keyof typeof ROUTES.DASHBOARD_STACK];
export type ProfileRoutes = typeof ROUTES.PROFILE_STACK[keyof typeof ROUTES.PROFILE_STACK];

export interface RootStackParamList {
  [ROUTES.LANDING.MAIN]: undefined;
  [ROUTES.AUTH.LOGIN]: undefined;
  [ROUTES.AUTH.SIGNUP]: undefined;
  [ROUTES.AUTH.FORGOT_PASSWORD]: undefined;
  [ROUTES.ONBOARDING.MAIN]: undefined;
  [ROUTES.MAIN.TABS]: undefined;
}

export interface DashboardStackParamList {
  [ROUTES.DASHBOARD_STACK.HOME]: undefined;
  [ROUTES.DASHBOARD_STACK.SCHEDULE]: undefined;
  [ROUTES.DASHBOARD_STACK.PLATFORMS]: undefined;
  [ROUTES.DASHBOARD_STACK.CONTENT_LIST]: undefined;
  [ROUTES.DASHBOARD_STACK.CONTENT_DETAIL]: { contentId: string };
}

export interface ProfileStackParamList {
  [ROUTES.PROFILE_STACK.HOME]: undefined;
  [ROUTES.PROFILE_STACK.SETTINGS]: undefined;
  [ROUTES.PROFILE_STACK.NOTIFICATIONS]: undefined;
  [ROUTES.PROFILE_STACK.PRIVACY]: undefined;
  [ROUTES.PROFILE_STACK.HELP]: undefined;
  [ROUTES.PROFILE_STACK.SUPPORT]: undefined;
  [ROUTES.PROFILE_STACK.ABOUT]: undefined;
  [ROUTES.PROFILE_STACK.MEDIA_LIBRARY]: undefined;
  [ROUTES.PROFILE_STACK.TEAM]: undefined;
}

export default ROUTES;
