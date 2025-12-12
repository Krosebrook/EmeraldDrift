import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { Result, ok, err, AsyncResult } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import type { BaseEntity } from "./types";

const isSecureStoreAvailable = Platform.OS !== "web";

export interface RepositoryConfig {
  storageKey: string;
  useSecureStore?: boolean;
}

export interface Repository<T extends BaseEntity> {
  getById(id: string): AsyncResult<T | null, AppError>;
  getAll(): AsyncResult<T[], AppError>;
  getFiltered(predicate: (item: T) => boolean): AsyncResult<T[], AppError>;
  save(item: T): AsyncResult<T, AppError>;
  saveAll(items: T[]): AsyncResult<void, AppError>;
  update(id: string, updates: Partial<T>): AsyncResult<T, AppError>;
  delete(id: string): AsyncResult<void, AppError>;
  deleteMany(ids: string[]): AsyncResult<void, AppError>;
  clear(): AsyncResult<void, AppError>;
  count(): AsyncResult<number, AppError>;
}

async function secureGet<T>(key: string): Promise<T | null> {
  if (!isSecureStoreAvailable) {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  const data = await SecureStore.getItemAsync(key);
  return data ? JSON.parse(data) : null;
}

async function secureSet<T>(key: string, value: T): Promise<void> {
  const json = JSON.stringify(value);
  if (!isSecureStoreAvailable) {
    await AsyncStorage.setItem(key, json);
    return;
  }
  await SecureStore.setItemAsync(key, json);
}

async function secureRemove(key: string): Promise<void> {
  if (!isSecureStoreAvailable) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

async function standardGet<T>(key: string): Promise<T | null> {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

async function standardSet<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

async function standardRemove(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export function createFeatureRepository<T extends BaseEntity>(
  config: RepositoryConfig
): Repository<T> {
  const { storageKey, useSecureStore = false } = config;

  const get = useSecureStore ? secureGet : standardGet;
  const set = useSecureStore ? secureSet : standardSet;
  const remove = useSecureStore ? secureRemove : standardRemove;

  return {
    async getById(id: string): AsyncResult<T | null, AppError> {
      try {
        const items = await get<T[]>(storageKey);
        const item = items?.find((i) => i.id === id) ?? null;
        return ok(item);
      } catch (error) {
        return err(AppError.persistence("get", id, error instanceof Error ? error : undefined));
      }
    },

    async getAll(): AsyncResult<T[], AppError> {
      try {
        const items = await get<T[]>(storageKey);
        return ok(items ?? []);
      } catch (error) {
        return err(AppError.persistence("getAll", storageKey, error instanceof Error ? error : undefined));
      }
    },

    async getFiltered(predicate: (item: T) => boolean): AsyncResult<T[], AppError> {
      try {
        const items = await get<T[]>(storageKey);
        const filtered = (items ?? []).filter(predicate);
        return ok(filtered);
      } catch (error) {
        return err(AppError.persistence("filter", storageKey, error instanceof Error ? error : undefined));
      }
    },

    async save(item: T): AsyncResult<T, AppError> {
      try {
        const items = (await get<T[]>(storageKey)) ?? [];
        const index = items.findIndex((i) => i.id === item.id);
        const now = new Date().toISOString();
        const updated = { ...item, updatedAt: now };

        if (index >= 0) {
          items[index] = updated;
        } else {
          items.unshift({ ...updated, createdAt: now });
        }

        await set(storageKey, items);
        return ok(updated);
      } catch (error) {
        return err(AppError.persistence("save", item.id, error instanceof Error ? error : undefined));
      }
    },

    async saveAll(items: T[]): AsyncResult<void, AppError> {
      try {
        await set(storageKey, items);
        return ok(undefined);
      } catch (error) {
        return err(AppError.persistence("saveAll", storageKey, error instanceof Error ? error : undefined));
      }
    },

    async update(id: string, updates: Partial<T>): AsyncResult<T, AppError> {
      try {
        const items = (await get<T[]>(storageKey)) ?? [];
        const index = items.findIndex((i) => i.id === id);

        if (index < 0) {
          return err(AppError.notFound(`Item: ${id}`));
        }

        const updated = {
          ...items[index],
          ...updates,
          id,
          updatedAt: new Date().toISOString(),
        };
        items[index] = updated;

        await set(storageKey, items);
        return ok(updated);
      } catch (error) {
        return err(AppError.persistence("update", id, error instanceof Error ? error : undefined));
      }
    },

    async delete(id: string): AsyncResult<void, AppError> {
      try {
        const items = (await get<T[]>(storageKey)) ?? [];
        const filtered = items.filter((i) => i.id !== id);
        await set(storageKey, filtered);
        return ok(undefined);
      } catch (error) {
        return err(AppError.persistence("delete", id, error instanceof Error ? error : undefined));
      }
    },

    async deleteMany(ids: string[]): AsyncResult<void, AppError> {
      try {
        const items = (await get<T[]>(storageKey)) ?? [];
        const idSet = new Set(ids);
        const filtered = items.filter((i) => !idSet.has(i.id));
        await set(storageKey, filtered);
        return ok(undefined);
      } catch (error) {
        return err(AppError.persistence("deleteMany", ids.join(","), error instanceof Error ? error : undefined));
      }
    },

    async clear(): AsyncResult<void, AppError> {
      try {
        await remove(storageKey);
        return ok(undefined);
      } catch (error) {
        return err(AppError.persistence("clear", storageKey, error instanceof Error ? error : undefined));
      }
    },

    async count(): AsyncResult<number, AppError> {
      try {
        const items = await get<T[]>(storageKey);
        return ok(items?.length ?? 0);
      } catch (error) {
        return err(AppError.persistence("count", storageKey, error instanceof Error ? error : undefined));
      }
    },
  };
}

export function createUserScopedRepository<T extends BaseEntity>(
  userId: string,
  baseKey: string
): Repository<T> {
  return createFeatureRepository<T>({
    storageKey: `@user_${userId}_${baseKey}`,
  });
}
