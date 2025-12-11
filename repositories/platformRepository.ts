import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { PlatformConnection, PlatformType } from "../types";

const repository = persistence.createRepository<PlatformConnection>(STORAGE_KEYS.PLATFORMS);

export const platformRepository = {
  async getById(id: string): Promise<PlatformConnection | null> {
    return repository.getById(id);
  },

  async getAll(): Promise<PlatformConnection[]> {
    return repository.getAll();
  },

  async getConnected(): Promise<PlatformConnection[]> {
    const platforms = await repository.getAll();
    return platforms.filter((p) => p.connected);
  },

  async getByPlatform(platform: PlatformType): Promise<PlatformConnection | null> {
    const platforms = await repository.getAll();
    return platforms.find((p) => p.platform === platform) ?? null;
  },

  async isConnected(platform: PlatformType): Promise<boolean> {
    const connection = await this.getByPlatform(platform);
    return connection?.connected ?? false;
  },

  async connect(data: Omit<PlatformConnection, "id" | "connectedAt">): Promise<PlatformConnection> {
    const existing = await this.getByPlatform(data.platform);
    const connection: PlatformConnection = {
      ...data,
      id: existing?.id || `platform_${data.platform}_${Date.now()}`,
      connected: true,
      connectedAt: new Date().toISOString(),
    };
    await repository.save(connection);
    return connection;
  },

  async disconnect(platform: PlatformType): Promise<void> {
    const connection = await this.getByPlatform(platform);
    if (connection) {
      await repository.delete(connection.id);
    }
  },

  async disconnectById(id: string): Promise<void> {
    await repository.delete(id);
  },

  async updateFollowerCount(platform: PlatformType, count: number): Promise<PlatformConnection | null> {
    const connection = await this.getByPlatform(platform);
    if (!connection) return null;
    
    const updated: PlatformConnection = {
      ...connection,
      followerCount: count,
    };
    await repository.save(updated);
    return updated;
  },

  async getTotalFollowers(): Promise<number> {
    const connected = await this.getConnected();
    return connected.reduce((total, p) => total + p.followerCount, 0);
  },

  async getConnectedCount(): Promise<number> {
    const connected = await this.getConnected();
    return connected.length;
  },

  async saveAll(platforms: PlatformConnection[]): Promise<void> {
    await repository.saveAll(platforms);
  },

  async clear(): Promise<void> {
    await repository.clear();
  },
};

export default platformRepository;
