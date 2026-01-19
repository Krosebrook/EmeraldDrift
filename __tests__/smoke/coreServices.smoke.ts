import { createSmokeTestSuite } from "../utils/smokeTestRunner";
import { featureFlags } from "@/core/featureFlags";
import { cacheManager, withCache } from "@/core/cache";
import { withRetry, withTimeout, gracefulDegradation } from "@/core/gracefulDegradation";
import { ok, isOk } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";

export const coreServicesSmokeTests = createSmokeTestSuite("Core Services")
  .addTest("Feature flags should initialize with defaults", async () => {
    const flags = await featureFlags.get();
    if (!flags) throw new Error("Feature flags not initialized");
    if (typeof flags.aiProvider !== "string") throw new Error("aiProvider missing");
    if (typeof flags.enableCaching !== "boolean") throw new Error("enableCaching missing");
  })

  .addTest("Feature flags should update correctly", async () => {
    const original = featureFlags.getSync();
    await featureFlags.set({ aiProvider: "openai" });
    const updated = featureFlags.getSync();
    if (updated.aiProvider !== "openai") throw new Error("Failed to update aiProvider");
    await featureFlags.set({ aiProvider: original.aiProvider });
  })

  .addTest("Cache manager should store and retrieve data", async () => {
    await cacheManager.init();
    const testKey = "smoke_test_key";
    const testData = { value: "test", timestamp: Date.now() };
    
    await cacheManager.set(testKey, testData, 60000);
    const retrieved = await cacheManager.get<typeof testData>(testKey);
    
    if (!retrieved) throw new Error("Failed to retrieve cached data");
    if (retrieved.value !== testData.value) throw new Error("Cached data mismatch");
    
    await cacheManager.remove(testKey);
  })

  .addTest("withCache should cache function results", async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      return { count: callCount };
    };

    const cacheKey = "smoke_withCache_test";
    await cacheManager.remove(cacheKey);

    const result1 = await withCache(cacheKey, fetcher);
    const result2 = await withCache(cacheKey, fetcher);

    if (callCount !== 1) throw new Error(`Fetcher called ${callCount} times, expected 1`);
    if (result1.count !== result2.count) throw new Error("Cache returned different results");

    await cacheManager.remove(cacheKey);
  })

  .addTest("withRetry should retry on failure", async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 2) throw new Error("Simulated failure");
      return "success";
    };

    const result = await withRetry(operation, { maxAttempts: 3, baseDelay: 100 });
    if (result !== "success") throw new Error("Retry did not succeed");
    if (attempts !== 2) throw new Error(`Expected 2 attempts, got ${attempts}`);
  })

  .addTest("withTimeout should timeout long operations", async () => {
    const slowOperation = () => new Promise<void>((resolve) => setTimeout(resolve, 5000));
    
    try {
      await withTimeout(slowOperation, 100);
      throw new Error("Should have timed out");
    } catch (error) {
      if (!(error instanceof Error) || !error.message.includes("timed out")) {
        throw new Error("Expected timeout error");
      }
    }
  })

  .addTest("Graceful degradation should track service failures", () => {
    gracefulDegradation.reset();
    const serviceName = "smoke_test_service";
    
    gracefulDegradation.markServiceFailed(serviceName);
    const state = gracefulDegradation.getState();
    
    if (!state.failedServices.has(serviceName)) {
      throw new Error("Service not marked as failed");
    }
    if (!state.degradedMode) {
      throw new Error("Degraded mode not enabled");
    }

    gracefulDegradation.markServiceRecovered(serviceName);
    const recoveredState = gracefulDegradation.getState();
    
    if (recoveredState.failedServices.has(serviceName)) {
      throw new Error("Service still marked as failed after recovery");
    }
  })

  .addTest("Result type helpers should work correctly", () => {
    const successResult = ok({ data: "test" });
    if (!isOk(successResult)) throw new Error("isOk failed for success result");
    
    const appError = new AppError({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Test validation error",
    });
    if (appError.code !== ErrorCode.VALIDATION_ERROR) {
      throw new Error("AppError code mismatch");
    }
  })

  .addTest("Cache should handle TTL expiration", async () => {
    const shortTTL = 50;
    const testKey = "smoke_ttl_test";
    
    await cacheManager.set(testKey, { expires: true }, shortTTL);
    
    await new Promise((resolve) => setTimeout(resolve, 100));
    
    const expired = await cacheManager.get(testKey);
    if (expired !== null) throw new Error("Cache should have expired");
  });

export async function runCoreServicesSmoke(): Promise<void> {
  const results = await coreServicesSmokeTests.run();
  console.log(createSmokeTestSuite("").constructor.name);
  console.log(JSON.stringify(results, null, 2));
}
