
import AsyncStorage from "@react-native-async-storage/async-storage";

// Mock implementation
const store = new Map<string, string>();
export const counters = { get: 0, set: 0, remove: 0, multiGet: 0, multiSet: 0, multiRemove: 0 };

// We need to patch the methods.
// @ts-ignore
AsyncStorage.getItem = async (key: string) => {
  counters.get++;
  return store.get(key) || null;
};

// @ts-ignore
AsyncStorage.setItem = async (key: string, value: string) => {
  counters.set++;
  store.set(key, value);
};

// @ts-ignore
AsyncStorage.removeItem = async (key: string) => {
  counters.remove++;
  store.delete(key);
};

// @ts-ignore
AsyncStorage.multiGet = async (keys: string[]) => {
  counters.multiGet++;
  return keys.map(key => [key, store.get(key) || null]);
};

// @ts-ignore
AsyncStorage.multiSet = async (pairs: [string, string][]) => {
  counters.multiSet++;
  pairs.forEach(([key, value]) => store.set(key, value));
};

// @ts-ignore
AsyncStorage.multiRemove = async (keys: string[]) => {
  counters.multiRemove++;
  keys.forEach(key => store.delete(key));
};

// @ts-ignore
AsyncStorage.clear = async () => {
  store.clear();
};


import { contentRepository } from "../repositories/contentRepository";
import { PlatformType } from "../types";

async function runBenchmark() {
  console.log("Starting benchmark...");

  // Clear counters
  Object.keys(counters).forEach(k => counters[k as keyof typeof counters] = 0);
  store.clear();

  const numItems = 10;
  const start = performance.now();

  for (let i = 0; i < numItems; i++) {
    await contentRepository.save({
      id: `item_${i}`,
      title: `Test Item ${i}`,
      caption: "Test Caption",
      status: "draft",
      platforms: ["instagram", "tiktok", "youtube"] as PlatformType[],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mediaUri: "https://example.com/image.jpg",
    });
  }

  const end = performance.now();

  console.log("Benchmark complete.");
  console.log(`Time: ${(end - start).toFixed(2)}ms`);
  console.log("AsyncStorage Operations:", counters);

  // Calculate total relevant IO ops (reads/writes)
  // multiGet/multiSet count as 1 op but do more work.
  // We want to see if we reduced the number of calls.
  const totalCalls = Object.values(counters).reduce((a, b) => a + b, 0);
  console.log(`Total Calls: ${totalCalls}`);
}

runBenchmark().catch(console.error);
