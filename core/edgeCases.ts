import NetInfo from "@react-native-community/netinfo";
import { gracefulDegradation } from "./gracefulDegradation";

export interface EdgeCaseHandler<T, R> {
  condition: (input: T) => boolean;
  handler: (input: T) => R;
}

export function handleEdgeCases<T, R>(
  input: T,
  handlers: EdgeCaseHandler<T, R>[],
  defaultHandler: (input: T) => R
): R {
  for (const { condition, handler } of handlers) {
    if (condition(input)) {
      return handler(input);
    }
  }
  return defaultHandler(input);
}

export function isEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length === 0;
}

export function isEmptyArray(value: unknown): value is unknown[] {
  return Array.isArray(value) && value.length === 0;
}

export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

export function hasProperty<T extends object, K extends PropertyKey>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(value: unknown, fallback = "{}"): string {
  try {
    return JSON.stringify(value);
  } catch {
    return fallback;
  }
}

export async function withNetworkCheck<T>(
  operation: () => Promise<T>,
  offlineFallback: T
): Promise<T> {
  const netState = await NetInfo.fetch();
  
  if (!netState.isConnected) {
    gracefulDegradation.setOffline(true);
    return offlineFallback;
  }
  
  gracefulDegradation.setOffline(false);
  return operation();
}

export function createSafeHandler<T extends (...args: unknown[]) => unknown>(
  handler: T,
  errorHandler?: (error: unknown) => ReturnType<T>
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = handler(...args);
      if (result instanceof Promise) {
        return result.catch((error) => {
          console.error("Handler error:", error);
          return errorHandler?.(error);
        });
      }
      return result;
    } catch (error) {
      console.error("Handler error:", error);
      return errorHandler?.(error);
    }
  }) as T;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  
  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
  };
  
  return debounced;
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): T {
  let lastCall = 0;
  
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      fn(...args);
    }
  }) as T;
}

export function memoize<T extends (...args: unknown[]) => unknown>(
  fn: T,
  keyResolver?: (...args: Parameters<T>) => string
): T & { cache: Map<string, ReturnType<T>>; clear: () => void } {
  const cache = new Map<string, ReturnType<T>>();
  
  const memoized = ((...args: Parameters<T>) => {
    const key = keyResolver ? keyResolver(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = fn(...args) as ReturnType<T>;
    cache.set(key, result);
    return result;
  }) as T & { cache: Map<string, ReturnType<T>>; clear: () => void };
  
  memoized.cache = cache;
  memoized.clear = () => cache.clear();
  
  return memoized;
}

export function once<T extends (...args: unknown[]) => unknown>(fn: T): T {
  let called = false;
  let result: ReturnType<T>;
  
  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args) as ReturnType<T>;
    }
    return result;
  }) as T;
}

export function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = 2,
    shouldRetry = () => true,
  } = options;
  
  return new Promise((resolve, reject) => {
    let attempt = 0;
    
    const tryFn = () => {
      attempt++;
      fn()
        .then(resolve)
        .catch((error) => {
          if (attempt < maxAttempts && shouldRetry(error, attempt)) {
            setTimeout(tryFn, delay * Math.pow(backoff, attempt - 1));
          } else {
            reject(error);
          }
        });
    };
    
    tryFn();
  });
}

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, " ").trim();
}

export function removeNullish<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

export function deepMerge<T extends object>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (
      sourceValue !== undefined &&
      typeof sourceValue === "object" &&
      sourceValue !== null &&
      !Array.isArray(sourceValue) &&
      typeof targetValue === "object" &&
      targetValue !== null &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue as object, sourceValue as object) as T[keyof T];
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue as T[keyof T];
    }
  }
  
  return result;
}

export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
