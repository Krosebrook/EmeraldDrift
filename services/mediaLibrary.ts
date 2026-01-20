import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";

const MEDIA_LIBRARY_KEY = "@creator_studio_media_library";

export type MediaCategory = "all" | "images" | "videos" | "favorites";

export interface MediaAsset {
  id: string;
  uri: string;
  type: "image" | "video";
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  duration?: number;
  category: string[];
  tags: string[];
  isFavorite: boolean;
  usedIn: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaLibraryState {
  assets: MediaAsset[];
  categories: string[];
}

const generateId = (): string => {
  return `media_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const extractFileName = (uri: string): string => {
  const parts = uri.split("/");
  return parts[parts.length - 1] || `media_${Date.now()}`;
};

const getMediaType = (uri: string): "image" | "video" => {
  const lowerUri = uri.toLowerCase();
  if (
    lowerUri.includes(".mp4") ||
    lowerUri.includes(".mov") ||
    lowerUri.includes(".avi") ||
    lowerUri.includes(".webm")
  ) {
    return "video";
  }
  return "image";
};

export const mediaLibraryService = {
  async getLibrary(): Promise<MediaLibraryState> {
    try {
      const data = await AsyncStorage.getItem(MEDIA_LIBRARY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading media library:", error);
    }
    return {
      assets: [],
      categories: ["Posts", "Stories", "Reels", "Thumbnails", "Covers"],
    };
  },

  async saveLibrary(library: MediaLibraryState): Promise<void> {
    try {
      await AsyncStorage.setItem(MEDIA_LIBRARY_KEY, JSON.stringify(library));
    } catch (error) {
      console.error("Error saving media library:", error);
    }
  },

  async addAsset(
    uri: string,
    options?: {
      category?: string[];
      tags?: string[];
      width?: number;
      height?: number;
      duration?: number;
      fileSize?: number;
    },
  ): Promise<MediaAsset> {
    const library = await this.getLibrary();

    let fileSize = options?.fileSize || 0;
    if (!fileSize && uri.startsWith("file://")) {
      try {
        const info = await FileSystem.getInfoAsync(uri);
        if (info.exists && "size" in info) {
          fileSize = info.size || 0;
        }
      } catch {
        fileSize = 0;
      }
    }

    const asset: MediaAsset = {
      id: generateId(),
      uri,
      type: getMediaType(uri),
      fileName: extractFileName(uri),
      fileSize,
      width: options?.width,
      height: options?.height,
      duration: options?.duration,
      category: options?.category || [],
      tags: options?.tags || [],
      isFavorite: false,
      usedIn: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    library.assets.unshift(asset);
    await this.saveLibrary(library);
    return asset;
  },

  async addAssetsBatch(
    items: Array<{
      uri: string;
      width?: number;
      height?: number;
      duration?: number;
      fileSize?: number;
    }>,
  ): Promise<MediaAsset[]> {
    const library = await this.getLibrary();
    const newAssets = await Promise.all(
      items.map(async (item) => {
        let fileSize = item.fileSize || 0;
        if (!fileSize && item.uri.startsWith("file://")) {
          try {
            const info = await FileSystem.getInfoAsync(item.uri);
            if (info.exists && "size" in info) {
              fileSize = info.size || 0;
            }
          } catch {
            fileSize = 0;
          }
        }

        const asset: MediaAsset = {
          id: generateId(),
          uri: item.uri,
          type: getMediaType(item.uri),
          fileName: extractFileName(item.uri),
          fileSize,
          width: item.width,
          height: item.height,
          duration: item.duration,
          category: [],
          tags: [],
          isFavorite: false,
          usedIn: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        return asset;
      }),
    );

    library.assets = [...newAssets, ...library.assets];
    await this.saveLibrary(library);
    return newAssets;
  },

  async updateAsset(
    id: string,
    updates: Partial<MediaAsset>,
  ): Promise<MediaAsset | null> {
    const library = await this.getLibrary();
    const index = library.assets.findIndex((a) => a.id === id);

    if (index === -1) return null;

    library.assets[index] = {
      ...library.assets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveLibrary(library);
    return library.assets[index];
  },

  async deleteAsset(id: string): Promise<boolean> {
    const library = await this.getLibrary();
    const initialLength = library.assets.length;
    library.assets = library.assets.filter((a) => a.id !== id);

    if (library.assets.length < initialLength) {
      await this.saveLibrary(library);
      return true;
    }
    return false;
  },

  async toggleFavorite(id: string): Promise<MediaAsset | null> {
    const library = await this.getLibrary();
    const asset = library.assets.find((a) => a.id === id);

    if (!asset) return null;

    asset.isFavorite = !asset.isFavorite;
    asset.updatedAt = new Date().toISOString();
    await this.saveLibrary(library);
    return asset;
  },

  async addCategory(category: string): Promise<void> {
    const library = await this.getLibrary();
    if (!library.categories.includes(category)) {
      library.categories.push(category);
      await this.saveLibrary(library);
    }
  },

  async deleteCategory(category: string): Promise<void> {
    const library = await this.getLibrary();
    library.categories = library.categories.filter((c) => c !== category);
    library.assets.forEach((asset) => {
      asset.category = asset.category.filter((c) => c !== category);
    });
    await this.saveLibrary(library);
  },

  async markAsUsed(assetId: string, contentId: string): Promise<void> {
    const library = await this.getLibrary();
    const asset = library.assets.find((a) => a.id === assetId);

    if (asset && !asset.usedIn.includes(contentId)) {
      asset.usedIn.push(contentId);
      asset.updatedAt = new Date().toISOString();
      await this.saveLibrary(library);
    }
  },

  async removeUsage(assetId: string, contentId: string): Promise<void> {
    const library = await this.getLibrary();
    const asset = library.assets.find((a) => a.id === assetId);

    if (asset) {
      asset.usedIn = asset.usedIn.filter((id) => id !== contentId);
      asset.updatedAt = new Date().toISOString();
      await this.saveLibrary(library);
    }
  },

  filterAssets(
    assets: MediaAsset[],
    options: {
      category?: MediaCategory | string;
      search?: string;
      type?: "image" | "video";
    },
  ): MediaAsset[] {
    let filtered = [...assets];

    if (options.category && options.category !== "all") {
      if (options.category === "images") {
        filtered = filtered.filter((a) => a.type === "image");
      } else if (options.category === "videos") {
        filtered = filtered.filter((a) => a.type === "video");
      } else if (options.category === "favorites") {
        filtered = filtered.filter((a) => a.isFavorite);
      } else {
        filtered = filtered.filter((a) =>
          a.category.includes(options.category as string),
        );
      }
    }

    if (options.type) {
      filtered = filtered.filter((a) => a.type === options.type);
    }

    if (options.search) {
      const searchLower = options.search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.fileName.toLowerCase().includes(searchLower) ||
          a.tags.some((t) => t.toLowerCase().includes(searchLower)) ||
          a.category.some((c) => c.toLowerCase().includes(searchLower)),
      );
    }

    return filtered;
  },

  formatFileSize,

  async getStats(): Promise<{
    totalAssets: number;
    totalImages: number;
    totalVideos: number;
    totalFavorites: number;
    totalSize: number;
    formattedSize: string;
  }> {
    const library = await this.getLibrary();
    const totalSize = library.assets.reduce(
      (acc, a) => acc + (a.fileSize || 0),
      0,
    );

    return {
      totalAssets: library.assets.length,
      totalImages: library.assets.filter((a) => a.type === "image").length,
      totalVideos: library.assets.filter((a) => a.type === "video").length,
      totalFavorites: library.assets.filter((a) => a.isFavorite).length,
      totalSize,
      formattedSize: formatFileSize(totalSize),
    };
  },
};
