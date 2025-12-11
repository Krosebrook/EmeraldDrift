import { persistence } from "../core/persistence";
import { STORAGE_KEYS } from "../core/constants";
import type { ContentItem, ContentStatus, PlatformType } from "../types";

const repository = persistence.createRepository<ContentItem>(STORAGE_KEYS.CONTENT);

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
  if (filters.platform && !item.platforms.includes(filters.platform)) return false;
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
  options: ContentSortOptions
): ContentItem[] {
  return [...items].sort((a, b) => {
    const aValue = a[options.field] || "";
    const bValue = b[options.field] || "";
    const comparison = aValue.localeCompare(bValue);
    return options.direction === "asc" ? comparison : -comparison;
  });
}

export const contentRepository = {
  async getById(id: string): Promise<ContentItem | null> {
    return repository.getById(id);
  },

  async getAll(): Promise<ContentItem[]> {
    return repository.getAll();
  },

  async getFiltered(
    filters: ContentFilters,
    sort?: ContentSortOptions
  ): Promise<ContentItem[]> {
    let items = await repository.getAll();
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
      (a.scheduledAt || "").localeCompare(b.scheduledAt || "")
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
    data: Omit<ContentItem, "id" | "createdAt" | "updatedAt">
  ): Promise<ContentItem> {
    const now = new Date().toISOString();
    const item: ContentItem = {
      ...data,
      id: `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    await repository.save(item);
    return item;
  },

  async update(id: string, updates: Partial<ContentItem>): Promise<ContentItem | null> {
    const existing = await repository.getById(id);
    if (!existing) return null;
    
    const updated: ContentItem = {
      ...existing,
      ...updates,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await repository.save(updated);
    return updated;
  },

  async save(item: ContentItem): Promise<void> {
    await repository.save(item);
  },

  async delete(id: string): Promise<void> {
    await repository.delete(id);
  },

  async deleteMany(ids: string[]): Promise<void> {
    const items = await repository.getAll();
    const filtered = items.filter((item) => !ids.includes(item.id));
    await repository.saveAll(filtered);
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
    const items = await repository.getAll();
    return {
      total: items.length,
      drafts: items.filter((i) => i.status === "draft").length,
      scheduled: items.filter((i) => i.status === "scheduled").length,
      published: items.filter((i) => i.status === "published").length,
      failed: items.filter((i) => i.status === "failed").length,
    };
  },

  async clear(): Promise<void> {
    await repository.clear();
  },
};

export default contentRepository;
