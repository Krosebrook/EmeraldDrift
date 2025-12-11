export type PlatformType = "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";

export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

export type TeamRole = "owner" | "admin" | "editor" | "viewer";

export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

export type MediaAssetType = "image" | "video" | "audio" | "document";

export type TimeRange = "7d" | "30d" | "90d";

export interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: PlatformType[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformConnection {
  id: string;
  platform: PlatformType;
  username: string;
  displayName: string;
  avatar?: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
}

export interface PostStats {
  id: string;
  platform: PlatformType;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  date: string;
}

export interface PlatformAnalytics {
  platform: PlatformType;
  followers: number;
  engagement: number;
  posts: number;
}

export interface AnalyticsData {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  growthRate: number;
  recentPosts: PostStats[];
  platformStats: PlatformAnalytics[];
}

export interface UserStats {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  postsDraft: number;
  mediaUploaded: number;
  platformsConnected: number;
  teamMembers: number;
  engagementRate: number;
  growthRate: number;
  lastUpdated: string;
}

export type UserActivityType = 
  | "post_created" 
  | "post_published" 
  | "post_scheduled" 
  | "platform_connected" 
  | "media_uploaded" 
  | "team_invited";

export interface UserActivity {
  id: string;
  type: UserActivityType;
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface PlatformStats {
  platform: PlatformType;
  followers: number;
  engagement: number;
  views: number;
  posts: number;
  growthRate: number;
}

export interface OnboardingState {
  completed: boolean;
  completedAt?: string;
  steps: {
    welcome: boolean;
    profile: boolean;
    platforms: boolean;
  };
}

export interface TutorialState {
  completed: boolean;
  completedAt?: string;
  screensViewed: string[];
  skipped: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  joinedAt: string;
  avatar?: string;
}

export interface TeamInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  status: InvitationStatus;
  createdAt: string;
  expiresAt: string;
}

export interface MediaAsset {
  id: string;
  uri: string;
  type: MediaAssetType;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  isFavorite: boolean;
  tags?: string[];
}

export interface AIContentRequest {
  prompt: string;
  platform?: PlatformType;
  tone?: "professional" | "casual" | "playful" | "informative";
  length?: "short" | "medium" | "long";
}

export interface AIContentResponse {
  title: string;
  caption: string;
  hashtags: string[];
  suggestions: string[];
}

export interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  scheduledReminders: boolean;
  engagementAlerts: boolean;
  teamUpdates: boolean;
}

export interface AppTheme {
  text: string;
  textSecondary: string;
  buttonText: string;
  tabIconDefault: string;
  tabIconSelected: string;
  link: string;
  primary: string;
  primaryPressed: string;
  primaryLight: string;
  success: string;
  warning: string;
  error: string;
  backgroundRoot: string;
  backgroundDefault: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  border: string;
  borderFocus: string;
  placeholder: string;
  cardBackground: string;
  instagram: string;
  tiktok: string;
  youtube: string;
  linkedin: string;
  pinterest: string;
}

export interface ResponsiveConfig {
  screenSize: "mobile" | "tablet" | "desktop";
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  numColumns: number;
  contentWidth: number;
  cardWidth: string;
}
