export type PlatformType = "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";

export type ContentStatus = "draft" | "scheduled" | "published" | "failed";

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContentItem extends BaseEntity {
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: PlatformType[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  failedReason?: string;
}

export interface PlatformConnection extends BaseEntity {
  platform: PlatformType;
  username: string;
  displayName: string;
  avatar?: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: string;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  avatar?: string;
  isNewUser?: boolean;
}

export interface AnalyticsSnapshot {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  growthRate: number;
  recordedAt: string;
}

export interface PostAnalytics extends BaseEntity {
  contentId: string;
  platform: PlatformType;
  likes: number;
  comments: number;
  shares: number;
  views: number;
  impressions: number;
  reach: number;
  recordedAt: string;
}

export interface PlatformStats {
  platform: PlatformType;
  followers: number;
  engagement: number;
  posts: number;
  weeklyGrowth: number;
}

export interface TeamMember extends BaseEntity {
  userId: string;
  email: string;
  name: string;
  avatar?: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "active" | "pending" | "inactive";
  invitedAt: string;
  joinedAt?: string;
}

export interface Workspace extends BaseEntity {
  name: string;
  ownerId: string;
  memberCount: number;
  plan: "free" | "pro" | "team" | "enterprise";
}

export interface ScheduledPost extends BaseEntity {
  contentId: string;
  platforms: PlatformType[];
  scheduledAt: string;
  status: "pending" | "processing" | "completed" | "failed";
  publishResults?: {
    platform: PlatformType;
    success: boolean;
    postId?: string;
    error?: string;
  }[];
}

export interface MediaItem extends BaseEntity {
  uri: string;
  type: "image" | "video" | "audio";
  size: number;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUri?: string;
  tags: string[];
  favorite: boolean;
}
