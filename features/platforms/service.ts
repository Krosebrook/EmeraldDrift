import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { platformRepository } from "./repository";
import type { PlatformConnection, PlatformType } from "@/features/shared/types";

const PLATFORM_DISPLAY_NAMES: Record<PlatformType, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
};

const PLATFORM_ICONS: Record<PlatformType, string> = {
  instagram: "instagram",
  tiktok: "music",
  youtube: "youtube",
  linkedin: "linkedin",
  pinterest: "aperture",
};

export interface PlatformInfo {
  type: PlatformType;
  displayName: string;
  icon: string;
  connection: PlatformConnection | null;
  isConnected: boolean;
}

export interface PlatformStats {
  totalConnected: number;
  totalFollowers: number;
  platforms: PlatformInfo[];
}

export interface ConnectPlatformInput {
  platform: PlatformType;
  username: string;
  displayName: string;
  avatar?: string;
  followerCount?: number;
  accessToken?: string;
  refreshToken?: string;
}

export interface PlatformService {
  getAllPlatforms(): AsyncResult<PlatformInfo[], AppError>;
  getConnected(): AsyncResult<PlatformConnection[], AppError>;
  getStats(): AsyncResult<PlatformStats, AppError>;
  connect(input: ConnectPlatformInput): AsyncResult<PlatformConnection, AppError>;
  disconnect(platform: PlatformType): AsyncResult<void, AppError>;
  refreshConnection(platform: PlatformType): AsyncResult<PlatformConnection, AppError>;
  getDisplayName(platform: PlatformType): string;
  getIcon(platform: PlatformType): string;
}

export const platformService: PlatformService = {
  async getAllPlatforms(): AsyncResult<PlatformInfo[], AppError> {
    const allPlatforms: PlatformType[] = ["instagram", "tiktok", "youtube", "linkedin", "pinterest"];
    const connectionsResult = await platformRepository.getAll();
    if (!isOk(connectionsResult)) return connectionsResult as any;

    const connectionMap = new Map<PlatformType, PlatformConnection>();
    for (const conn of connectionsResult.data) {
      connectionMap.set(conn.platform, conn);
    }

    const platforms: PlatformInfo[] = allPlatforms.map((type) => {
      const connection = connectionMap.get(type) ?? null;
      return {
        type,
        displayName: PLATFORM_DISPLAY_NAMES[type],
        icon: PLATFORM_ICONS[type],
        connection,
        isConnected: connection?.connected ?? false,
      };
    });

    return ok(platforms);
  },

  async getConnected(): AsyncResult<PlatformConnection[], AppError> {
    return platformRepository.getConnected();
  },

  async getStats(): AsyncResult<PlatformStats, AppError> {
    const platformsResult = await this.getAllPlatforms();
    if (!isOk(platformsResult)) return platformsResult as any;

    const platforms = platformsResult.data;
    const connected = platforms.filter((p) => p.isConnected);
    const totalFollowers = connected.reduce(
      (sum, p) => sum + (p.connection?.followerCount ?? 0),
      0
    );

    return ok({
      totalConnected: connected.length,
      totalFollowers,
      platforms,
    });
  },

  async connect(input: ConnectPlatformInput): AsyncResult<PlatformConnection, AppError> {
    if (!input.username.trim()) {
      return err(AppError.validation("Username is required"));
    }

    return platformRepository.connect({
      platform: input.platform,
      username: input.username.trim(),
      displayName: input.displayName.trim() || input.username.trim(),
      avatar: input.avatar,
      followerCount: input.followerCount ?? 0,
      accessToken: input.accessToken,
      refreshToken: input.refreshToken,
      connected: true,
      connectedAt: new Date().toISOString(),
    });
  },

  async disconnect(platform: PlatformType): AsyncResult<void, AppError> {
    return platformRepository.disconnect(platform);
  },

  async refreshConnection(platform: PlatformType): AsyncResult<PlatformConnection, AppError> {
    const connectionResult = await platformRepository.getByPlatform(platform);
    if (!isOk(connectionResult)) return connectionResult as any;

    if (!connectionResult.data) {
      return err(AppError.notFound(`Platform connection: ${platform}`));
    }

    return ok(connectionResult.data);
  },

  getDisplayName(platform: PlatformType): string {
    return PLATFORM_DISPLAY_NAMES[platform];
  },

  getIcon(platform: PlatformType): string {
    return PLATFORM_ICONS[platform];
  },
};
