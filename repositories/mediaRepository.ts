import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { MediaAsset, MediaAssetType } from "../types";

const repository = persistence.createRepository<MediaAsset>(
  STORAGE_KEYS.MEDIA_LIBRARY,
);

export interface MediaFilters {
  type?: MediaAssetType;
  isFavorite?: boolean;
  searchQuery?: string;
  tags?: string[];
  startDate?: string;
  endDate?: string;
}

function matchesFilters(asset: MediaAsset, filters: MediaFilters): boolean {
  if (filters.type && asset.type !== filters.type) return false;
  if (
    filters.isFavorite !== undefined &&
    asset.isFavorite !== filters.isFavorite
  )
    return false;
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    if (!asset.name.toLowerCase().includes(query)) return false;
  }
  if (filters.tags && filters.tags.length > 0) {
    if (!asset.tags || !filters.tags.some((tag) => asset.tags?.includes(tag)))
      return false;
  }
  if (filters.startDate && asset.createdAt < filters.startDate) return false;
  if (filters.endDate && asset.createdAt > filters.endDate) return false;
  return true;
}

export const mediaRepository = {
  async getById(id: string): Promise<MediaAsset | null> {
    return repository.getById(id);
  },

  async getAll(): Promise<MediaAsset[]> {
    return repository.getAll();
  },

  async getFiltered(filters: MediaFilters): Promise<MediaAsset[]> {
    const assets = await repository.getAll();
    return assets.filter((asset) => matchesFilters(asset, filters));
  },

  async getByType(type: MediaAssetType): Promise<MediaAsset[]> {
    return this.getFiltered({ type });
  },

  async getFavorites(): Promise<MediaAsset[]> {
    return this.getFiltered({ isFavorite: true });
  },

  async add(data: Omit<MediaAsset, "id" | "createdAt">): Promise<MediaAsset> {
    const asset: MediaAsset = {
      ...data,
      id: `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    await repository.save(asset);
    return asset;
  },

  async addBatch(
    assets: Omit<MediaAsset, "id" | "createdAt">[],
  ): Promise<MediaAsset[]> {
    const existingAssets = await repository.getAll();
    const now = new Date().toISOString();

    const newAssets: MediaAsset[] = assets.map((data, index) => ({
      ...data,
      id: `media_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    }));

    await repository.saveAll([...newAssets, ...existingAssets]);
    return newAssets;
  },

  async update(
    id: string,
    updates: Partial<MediaAsset>,
  ): Promise<MediaAsset | null> {
    const existing = await repository.getById(id);
    if (!existing) return null;

    const updated: MediaAsset = { ...existing, ...updates, id: existing.id };
    await repository.save(updated);
    return updated;
  },

  async toggleFavorite(id: string): Promise<MediaAsset | null> {
    const asset = await repository.getById(id);
    if (!asset) return null;
    return this.update(id, { isFavorite: !asset.isFavorite });
  },

  async setFavorite(
    id: string,
    isFavorite: boolean,
  ): Promise<MediaAsset | null> {
    return this.update(id, { isFavorite });
  },

  async addTags(id: string, tags: string[]): Promise<MediaAsset | null> {
    const asset = await repository.getById(id);
    if (!asset) return null;

    const existingTags = asset.tags ?? [];
    const uniqueTags = [...new Set([...existingTags, ...tags])];
    return this.update(id, { tags: uniqueTags });
  },

  async removeTags(id: string, tags: string[]): Promise<MediaAsset | null> {
    const asset = await repository.getById(id);
    if (!asset) return null;

    const filteredTags = (asset.tags ?? []).filter((t) => !tags.includes(t));
    return this.update(id, { tags: filteredTags });
  },

  async delete(id: string): Promise<void> {
    await repository.delete(id);
  },

  async deleteMany(ids: string[]): Promise<void> {
    const assets = await repository.getAll();
    const idsSet = new Set(ids);
    const filtered = assets.filter((asset) => !idsSet.has(asset.id));
    await repository.saveAll(filtered);
  },

  async getStats(): Promise<{
    total: number;
    images: number;
    videos: number;
    audio: number;
    documents: number;
    favorites: number;
    totalSize: number;
  }> {
    const assets = await repository.getAll();
    return {
      total: assets.length,
      images: assets.filter((a) => a.type === "image").length,
      videos: assets.filter((a) => a.type === "video").length,
      audio: assets.filter((a) => a.type === "audio").length,
      documents: assets.filter((a) => a.type === "document").length,
      favorites: assets.filter((a) => a.isFavorite).length,
      totalSize: assets.reduce((sum, a) => sum + a.size, 0),
    };
  },

  async clear(): Promise<void> {
    await repository.clear();
  },
};

export default mediaRepository;
