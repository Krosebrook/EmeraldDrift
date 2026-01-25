import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { ContentItem, ContentStatus, PlatformType } from "../types";

// Key definitions
const ALL_IDS_KEY = STORAGE_KEYS.CONTENT;
const ITEM_PREFIX = `${STORAGE_KEYS.CONTENT}_item_`;
const INDEX_STATUS_PREFIX = `${STORAGE_KEYS.CONTENT}_idx_status_`;
const INDEX_PLATFORM_PREFIX = `${STORAGE_KEYS.CONTENT}_idx_platform_`;

const getItemKey = (id: string) => `${ITEM_PREFIX}${id}`;
const getStatusIndexKey = (status: ContentStatus) =>
  `${INDEX_STATUS_PREFIX}${status}`;
const getPlatformIndexKey = (platform: PlatformType) =>
  `${INDEX_PLATFORM_PREFIX}${platform}`;

export interface ContentFilters {
  status?: ContentStatus;
  platform?: PlatformType;
  searchQuery?: string;
  startDate?: string;
  endDate?: string;
}

export interface ContentSortOptions {
  field: "createdAt" | "updatedAt" | "scheduledAt" | "title";
  direction: "asc" | "desc";
}

function matchesFilters(item: ContentItem, filters: ContentFilters): boolean {
  if (filters.status && item.status !== filters.status) return false;
  if (filters.platform && !item.platforms.includes(filters.platform))
    return false;
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase();
    const matchesTitle = item.title.toLowerCase().includes(query);
    const matchesCaption = item.caption.toLowerCase().includes(query);
    if (!matchesTitle && !matchesCaption) return false;
  }
  if (filters.startDate && item.createdAt < filters.startDate) return false;
  if (filters.endDate && item.createdAt > filters.endDate) return false;
  return true;
}

function sortContent(
  items: ContentItem[],
  options: ContentSortOptions,
): ContentItem[] {
  return [...items].sort((a, b) => {
    const aValue = a[options.field] || "";
    const bValue = b[options.field] || "";
    const comparison = aValue.localeCompare(bValue);
    return options.direction === "asc" ? comparison : -comparison;
  });
}

// Internal Helpers
async function migrateLegacyData(items: ContentItem[]) {
  // 1. Build Indexes in Memory
  const statusMap = new Map<string, string[]>();
  const platformMap = new Map<string, string[]>();
  const allIds: string[] = [];

  const itemPairs: [string, ContentItem][] = [];

  for (const item of items) {
    allIds.push(item.id);
    itemPairs.push([getItemKey(item.id), item]);

    // Status
    const sKey = getStatusIndexKey(item.status);
    if (!statusMap.has(sKey)) statusMap.set(sKey, []);
    statusMap.get(sKey)!.push(item.id);

    // Platforms
    for (const p of item.platforms) {
      const pKey = getPlatformIndexKey(p);
      if (!platformMap.has(pKey)) platformMap.set(pKey, []);
      platformMap.get(pKey)!.push(item.id);
    }
  }

  // 2. Prepare MultiSet pairs
  const pairs: [string, any][] = [...itemPairs, [ALL_IDS_KEY, allIds]];

  statusMap.forEach((ids, key) => pairs.push([key, ids]));
  platformMap.forEach((ids, key) => pairs.push([key, ids]));

  // 3. Save Everything
  await persistence.multiSet(pairs);
}

async function getIds(key: string): Promise<string[]> {
  // We use `any` here because we might get legacy ContentItem[]
  const data = await persistence.get<any>(key);

  if (!data) return [];

  // Migration Check: If we read ALL_IDS_KEY and got an array of Objects (legacy format)
  // We check if the first item is an object (not string) to detect legacy format.
  if (
    key === ALL_IDS_KEY &&
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] !== "string"
  ) {
    console.log("Migrating content repository to new format...");
    await migrateLegacyData(data);
    // After migration, return IDs
    return data.map((i: any) => i.id);
  }

  return data;
}

async function addToIndex(key: string, id: string) {
  const ids = await getIds(key);
  if (!ids.includes(id)) {
    await persistence.set(key, [id, ...ids]); // Prepend for LIFO-ish
  }
}

async function removeFromIndex(key: string, id: string) {
  const ids = await getIds(key);
  const newIds = ids.filter((i) => i !== id);
  if (newIds.length !== ids.length) {
    await persistence.set(key, newIds);
  }
}

export const contentRepository = {
  async getById(id: string): Promise<ContentItem | null> {
    return persistence.get<ContentItem>(getItemKey(id));
  },

  async getAll(): Promise<ContentItem[]> {
    const ids = await getIds(ALL_IDS_KEY);
    const items = await persistence.multiGet<ContentItem>(ids.map(getItemKey));
    return items.filter((i): i is ContentItem => i !== null);
  },

  async getFiltered(
    filters: ContentFilters,
    sort?: ContentSortOptions,
  ): Promise<ContentItem[]> {
    let candidateIds: string[] | null = null;

    // 1. Filter by Status (Index)
    if (filters.status) {
      candidateIds = await getIds(getStatusIndexKey(filters.status));
    }

    // 2. Filter by Platform (Index)
    if (filters.platform) {
      const platformIds = await getIds(getPlatformIndexKey(filters.platform));
      if (candidateIds === null) {
        candidateIds = platformIds;
      } else {
        // Intersect
        const platformSet = new Set(platformIds);
        candidateIds = candidateIds.filter((id) => platformSet.has(id));
      }
    }

    // 3. If no indexed filters used, we must fetch all IDs
    if (candidateIds === null) {
      candidateIds = await getIds(ALL_IDS_KEY);
    }

    // If candidateIds is empty, return early
    if (candidateIds.length === 0) {
      return [];
    }

    // 4. Fetch Items
    const keys = candidateIds.map(getItemKey);
    const itemsNullable = await persistence.multiGet<ContentItem>(keys);
    let items = itemsNullable.filter((i): i is ContentItem => i !== null);

    // 5. Apply remaining filters in memory
    items = items.filter((item) => matchesFilters(item, filters));

    if (sort) {
      items = sortContent(items, sort);
    }
    return items;
  },

  async getByStatus(status: ContentStatus): Promise<ContentItem[]> {
    return this.getFiltered({ status });
  },

  async getDrafts(): Promise<ContentItem[]> {
    return this.getByStatus("draft");
  },

  async getScheduled(): Promise<ContentItem[]> {
    const items = await this.getByStatus("scheduled");
    return items.sort((a, b) =>
      (a.scheduledAt || "").localeCompare(b.scheduledAt || ""),
    );
  },

  async getPublished(): Promise<ContentItem[]> {
    return this.getByStatus("published");
  },

  async getLatestDraft(): Promise<ContentItem | null> {
    const drafts = await this.getDrafts();
    return drafts.length > 0 ? drafts[0] : null;
  },

  async create(
    data: Omit<ContentItem, "id" | "createdAt" | "updatedAt">,
  ): Promise<ContentItem> {
    const now = new Date().toISOString();
    const item: ContentItem = {
      ...data,
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.save(item);
    return item;
  },

  async update(
    id: string,
    updates: Partial<ContentItem>,
  ): Promise<ContentItem | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const updated: ContentItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await this.save(updated);
    return updated;
  },

  async save(item: ContentItem): Promise<void> {
    // 1. Get old item to check for index changes
    const oldItem = await this.getById(item.id);

    // 2. Identify all index keys to read
    const keysToRead = new Set<string>();

    // Always need Global ID List and New Status Index
    keysToRead.add(ALL_IDS_KEY);
    keysToRead.add(getStatusIndexKey(item.status));

    // Old Status Index (if changed)
    if (oldItem && oldItem.status !== item.status) {
      keysToRead.add(getStatusIndexKey(oldItem.status));
    }

    // Platforms (New and Old)
    item.platforms.forEach((p) => keysToRead.add(getPlatformIndexKey(p)));
    if (oldItem) {
      oldItem.platforms.forEach((p) => keysToRead.add(getPlatformIndexKey(p)));
    }

    // 3. Fetch all indexes in one go
    const uniqueKeys = Array.from(keysToRead);
    const values = await persistence.multiGet<any>(uniqueKeys);

    // Map key -> current IDs
    const indexMap = new Map<string, string[]>();
    const pendingUpdates = new Map<string, any>();

    for (let i = 0; i < uniqueKeys.length; i++) {
      const key = uniqueKeys[i];
      let val = values[i];

      // Migration Check for ALL_IDS_KEY
      if (
        key === ALL_IDS_KEY &&
        Array.isArray(val) &&
        val.length > 0 &&
        typeof val[0] !== "string"
      ) {
        console.log("Migrating content repository (during save)...");
        await migrateLegacyData(val);
        val = val.map((item: any) => item.id);
      }

      indexMap.set(key, val || []);
    }

    // Helper to update list
    const updateList = (key: string, shouldAdd: boolean) => {
      let ids = indexMap.get(key) || [];
      const hasId = ids.includes(item.id);

      let changed = false;
      if (shouldAdd && !hasId) {
        ids = [item.id, ...ids];
        changed = true;
      } else if (!shouldAdd && hasId) {
        ids = ids.filter((id) => id !== item.id);
        changed = true;
      }

      if (changed) {
        indexMap.set(key, ids);
        pendingUpdates.set(key, ids);
      }
    };

    // Global ID List
    updateList(ALL_IDS_KEY, true);

    // Status
    if (oldItem && oldItem.status !== item.status) {
      updateList(getStatusIndexKey(oldItem.status), false);
    }
    updateList(getStatusIndexKey(item.status), true);

    // Platforms
    const newPlatforms = new Set(item.platforms);

    // Add to new
    for (const p of item.platforms) {
      updateList(getPlatformIndexKey(p), true);
    }
    // Remove from old (only if not in new)
    if (oldItem) {
      for (const p of oldItem.platforms) {
        if (!newPlatforms.has(p)) {
          updateList(getPlatformIndexKey(p), false);
        }
      }
    }

    // 5. Save Item + Updated Indexes
    const updates: [string, any][] = Array.from(pendingUpdates.entries());
    updates.push([getItemKey(item.id), item]);

    await persistence.multiSet(updates);
  },

  async delete(id: string): Promise<void> {
    const item = await this.getById(id);
    if (!item) return;

    // 1. Remove Item
    await persistence.remove(getItemKey(id));

    // 2. Remove from Global ID List
    await removeFromIndex(ALL_IDS_KEY, id);

    // 3. Remove from Indexes
    await removeFromIndex(getStatusIndexKey(item.status), id);
    for (const p of item.platforms) {
      await removeFromIndex(getPlatformIndexKey(p), id);
    }
  },

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    const idSet = new Set(ids);

    // 1. Load All Indexes to update
    const statuses: ContentStatus[] = [
      "draft",
      "scheduled",
      "published",
      "failed",
    ];
    const platforms: PlatformType[] = [
      "instagram",
      "tiktok",
      "youtube",
      "linkedin",
      "pinterest",
    ];

    const statusKeys = statuses.map(getStatusIndexKey);
    const platformKeys = platforms.map(getPlatformIndexKey);
    const indexKeys = [ALL_IDS_KEY, ...statusKeys, ...platformKeys];

    // Fetch all index contents
    const indexValues = await persistence.multiGet<string[]>(indexKeys);

    // 2. Update Indexes in Memory
    const updates: [string, string[]][] = [];

    // indexValues matches indexKeys order
    for (let i = 0; i < indexKeys.length; i++) {
      const key = indexKeys[i];
      const currentIds = indexValues[i] || [];
      // Filter out deleted IDs
      const newIds = currentIds.filter((id) => !idSet.has(id));

      if (newIds.length !== currentIds.length) {
        updates.push([key, newIds]);
      }
    }

    // 3. Save Updated Indexes
    if (updates.length > 0) {
      await persistence.multiSet(updates);
    }

    // 4. Remove Items
    await persistence.multiRemove(ids.map(getItemKey));
  },

  async publish(id: string): Promise<ContentItem | null> {
    return this.update(id, {
      status: "published",
      publishedAt: new Date().toISOString(),
    });
  },

  async schedule(id: string, scheduledAt: string): Promise<ContentItem | null> {
    return this.update(id, {
      status: "scheduled",
      scheduledAt,
    });
  },

  async unschedule(id: string): Promise<ContentItem | null> {
    return this.update(id, {
      status: "draft",
      scheduledAt: undefined,
    });
  },

  async getStats(): Promise<{
    total: number;
    drafts: number;
    scheduled: number;
    published: number;
    failed: number;
  }> {
    const keys = [
      ALL_IDS_KEY,
      getStatusIndexKey("draft"),
      getStatusIndexKey("scheduled"),
      getStatusIndexKey("published"),
      getStatusIndexKey("failed"),
    ];

    // Use multiGet to fetch all stats in a single bridge call
    const values = await persistence.multiGet<any>(keys);
    const allIdsData = values[0];

    // Migration Check: If we read ALL_IDS_KEY and got an array of Objects (legacy format)
    if (
      allIdsData &&
      Array.isArray(allIdsData) &&
      allIdsData.length > 0 &&
      typeof allIdsData[0] !== "string"
    ) {
      console.log("Migrating content repository to new format...");
      await migrateLegacyData(allIdsData);

      // Recalculate stats from the legacy data we just migrated
      const items = allIdsData as ContentItem[];
      return {
        total: items.length,
        drafts: items.filter((i) => i.status === "draft").length,
        scheduled: items.filter((i) => i.status === "scheduled").length,
        published: items.filter((i) => i.status === "published").length,
        failed: items.filter((i) => i.status === "failed").length,
      };
    }

    const totalIds = values[0] as string[] | null;
    const draftsIds = values[1] as string[] | null;
    const scheduledIds = values[2] as string[] | null;
    const publishedIds = values[3] as string[] | null;
    const failedIds = values[4] as string[] | null;

    return {
      total: totalIds?.length ?? 0,
      drafts: draftsIds?.length ?? 0,
      scheduled: scheduledIds?.length ?? 0,
      published: publishedIds?.length ?? 0,
      failed: failedIds?.length ?? 0,
    };
  },

  async clear(): Promise<void> {
    const ids = await getIds(ALL_IDS_KEY);

    // Remove all items
    await persistence.multiRemove(ids.map(getItemKey));

    // Remove Global List
    await persistence.remove(ALL_IDS_KEY);

    // Remove All Indexes
    const statuses: ContentStatus[] = [
      "draft",
      "scheduled",
      "published",
      "failed",
    ];
    const platforms: PlatformType[] = [
      "instagram",
      "tiktok",
      "youtube",
      "linkedin",
      "pinterest",
    ];

    const indexKeys = [
      ...statuses.map(getStatusIndexKey),
      ...platforms.map(getPlatformIndexKey),
    ];
    await persistence.multiRemove(indexKeys);
  },
};

export default contentRepository;
