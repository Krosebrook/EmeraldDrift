import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PersistenceResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}

export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly operation: "read" | "write" | "delete",
    public readonly key: string,
    public readonly cause?: Error,
  ) {
    super(message);
    this.name = "PersistenceError";
  }
}

async function safeGet<T>(key: string): Promise<T | null> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    throw new PersistenceError(
      `Failed to read data for key: ${key}`,
      "read",
      key,
      error instanceof Error ? error : undefined,
    );
  }
}

async function safeSet<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    throw new PersistenceError(
      `Failed to write data for key: ${key}`,
      "write",
      key,
      error instanceof Error ? error : undefined,
    );
  }
}

async function safeMultiSet(pairs: [string, any][]): Promise<void> {
  try {
    const stringPairs = pairs.map(
      ([key, value]) => [key, JSON.stringify(value)] as [string, string],
    );
    await AsyncStorage.multiSet(stringPairs);
  } catch (error) {
    throw new PersistenceError(
      `Failed to write multiple keys`,
      "write",
      pairs.map((p) => p[0]).join(", "),
      error instanceof Error ? error : undefined,
    );
  }
}

async function safeRemove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    throw new PersistenceError(
      `Failed to delete data for key: ${key}`,
      "delete",
      key,
      error instanceof Error ? error : undefined,
    );
  }
}

async function safeMultiRemove(keys: string[]): Promise<void> {
  try {
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    throw new PersistenceError(
      `Failed to delete multiple keys`,
      "delete",
      keys.join(", "),
      error instanceof Error ? error : undefined,
    );
  }
}

async function safeMultiGet<T>(keys: string[]): Promise<(T | null)[]> {
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    const map = new Map(pairs);
    return keys.map((key) => {
      const val = map.get(key);
      try {
        return val ? JSON.parse(val) : null;
      } catch {
        return null;
      }
    });
  } catch (error) {
    throw new PersistenceError(
      `Failed to read multiple keys`,
      "read",
      keys.join(", "),
      error instanceof Error ? error : undefined,
    );
  }
}

export interface Repository<T, ID = string> {
  getById(id: ID): Promise<T | null>;
  getAll(): Promise<T[]>;
  save(item: T): Promise<void>;
  saveAll(items: T[]): Promise<void>;
  delete(id: ID): Promise<void>;
  clear(): Promise<void>;
}

export function createRepository<T extends { id: string }>(
  storageKey: string,
): Repository<T> {
  return {
    async getById(id: string): Promise<T | null> {
      const items = await safeGet<T[]>(storageKey);
      return items?.find((item) => item.id === id) ?? null;
    },

    async getAll(): Promise<T[]> {
      return (await safeGet<T[]>(storageKey)) ?? [];
    },

    async save(item: T): Promise<void> {
      const items = (await safeGet<T[]>(storageKey)) ?? [];
      const index = items.findIndex((i) => i.id === item.id);
      if (index >= 0) {
        items[index] = item;
      } else {
        items.unshift(item);
      }
      await safeSet(storageKey, items);
    },

    async saveAll(items: T[]): Promise<void> {
      await safeSet(storageKey, items);
    },

    async delete(id: string): Promise<void> {
      const items = (await safeGet<T[]>(storageKey)) ?? [];
      const filtered = items.filter((item) => item.id !== id);
      await safeSet(storageKey, filtered);
    },

    async clear(): Promise<void> {
      await safeRemove(storageKey);
    },
  };
}

export function createUserScopedStorage(userId: string) {
  const prefix = `@user_${userId}_`;

  return {
    async get<T>(key: string): Promise<T | null> {
      return safeGet<T>(`${prefix}${key}`);
    },

    async set<T>(key: string, value: T): Promise<void> {
      await safeSet(`${prefix}${key}`, value);
    },

    async multiSet(pairs: [string, any][]): Promise<void> {
      const prefixedPairs = pairs.map(
        ([key, value]) => [`${prefix}${key}`, value] as [string, any],
      );
      await safeMultiSet(prefixedPairs);
    },

    async remove(key: string): Promise<void> {
      await safeRemove(`${prefix}${key}`);
    },

    async clearAll(keys: string[]): Promise<void> {
      await safeMultiRemove(keys.map((k) => `${prefix}${k}`));
    },
  };
}

export const persistence = {
  get: safeGet,
  set: safeSet,
  multiSet: safeMultiSet,
  remove: safeRemove,
  multiGet: safeMultiGet,
  multiRemove: safeMultiRemove,
  createRepository,
  createUserScopedStorage,
};

export default persistence;
