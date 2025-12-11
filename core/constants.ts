export const STORAGE_KEYS = {
  CONTENT: "@creator_studio_content",
  PLATFORMS: "@creator_studio_platforms",
  ANALYTICS: "@creator_studio_analytics",
  SCHEDULED_POSTS: "@creator_studio_scheduled",
  DEMO_INITIALIZED: "@creator_studio_demo_init",
  USER: "@creator_studio_user",
  AUTH_TOKEN: "@creator_studio_auth_token",
  MEDIA_LIBRARY: "@creator_studio_media_library",
  WORKSPACES: "@creator_studio_workspaces",
  TEAM_MEMBERS: "@creator_studio_team_members",
  INVITATIONS: "@creator_studio_invitations",
} as const;

export const USER_STORAGE_KEYS = {
  STATS: "stats",
  ACTIVITIES: "activities",
  PLATFORM_STATS: "platform_stats",
  ONBOARDING: "onboarding",
  TUTORIAL: "tutorial",
  PREFERENCES: "preferences",
  NOTIFICATIONS: "notifications",
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    SIGNUP: "/auth/signup",
    LOGOUT: "/auth/logout",
    REFRESH: "/auth/refresh",
  },
  CONTENT: {
    LIST: "/content",
    CREATE: "/content",
    UPDATE: (id: string) => `/content/${id}`,
    DELETE: (id: string) => `/content/${id}`,
    PUBLISH: (id: string) => `/content/${id}/publish`,
    SCHEDULE: (id: string) => `/content/${id}/schedule`,
  },
  PLATFORMS: {
    LIST: "/platforms",
    CONNECT: (platform: string) => `/platforms/${platform}/connect`,
    DISCONNECT: (platform: string) => `/platforms/${platform}/disconnect`,
    CALLBACK: (platform: string) => `/platforms/${platform}/callback`,
  },
  ANALYTICS: {
    OVERVIEW: "/analytics/overview",
    PLATFORM: (platform: string) => `/analytics/platform/${platform}`,
    CONTENT: (contentId: string) => `/analytics/content/${contentId}`,
  },
  AI: {
    GENERATE: "/ai/generate",
    SUGGEST: "/ai/suggest",
    IMPROVE: "/ai/improve",
  },
} as const;

export const TIMING = {
  AUTOSAVE_INTERVAL: 30000,
  DEBOUNCE_DEFAULT: 300,
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  REFRESH_INTERVAL: 60000,
  SESSION_TIMEOUT: 3600000,
} as const;

export const LIMITS = {
  MAX_MEDIA_SIZE_MB: 100,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 500,
  MAX_PLATFORMS_PER_POST: 5,
  MAX_SCHEDULED_POSTS: 100,
  MAX_TEAM_MEMBERS: 50,
  MAX_WORKSPACES: 10,
  ACTIVITY_HISTORY_LIMIT: 100,
  CONTENT_PREVIEW_LENGTH: 100,
} as const;

export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
  WIDE: 1280,
} as const;

export const GRID_COLUMNS = {
  MOBILE: 2,
  TABLET: 3,
  DESKTOP: 4,
} as const;

export const ERROR_MESSAGES = {
  NETWORK: "Unable to connect. Please check your internet connection.",
  UNAUTHORIZED: "Your session has expired. Please sign in again.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER: "Something went wrong. Please try again later.",
  VALIDATION: "Please check your input and try again.",
  PERMISSION: "You don't have permission to perform this action.",
  RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
} as const;

export const SUCCESS_MESSAGES = {
  CONTENT_SAVED: "Content saved successfully",
  CONTENT_PUBLISHED: "Content published successfully",
  CONTENT_SCHEDULED: "Content scheduled successfully",
  PLATFORM_CONNECTED: "Platform connected successfully",
  PLATFORM_DISCONNECTED: "Platform disconnected",
  SETTINGS_UPDATED: "Settings updated successfully",
  INVITATION_SENT: "Invitation sent successfully",
} as const;
