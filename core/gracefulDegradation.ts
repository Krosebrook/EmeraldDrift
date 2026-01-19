import { AppError } from "./errors";
import { err, ok, AsyncResult, isOk } from "./result";
import { featureFlags } from "./featureFlags";

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export interface FallbackConfig<T> {
  fallbackValue: T;
  shouldUseFallback: (error: AppError) => boolean;
  onFallbackUsed?: (error: AppError) => void;
}

export interface DegradationState {
  isOffline: boolean;
  failedServices: Set<string>;
  lastError: AppError | null;
  degradedMode: boolean;
}

let degradationState: DegradationState = {
  isOffline: false,
  failedServices: new Set(),
  lastError: null,
  degradedMode: false,
};

export const gracefulDegradation = {
  getState(): DegradationState {
    return { ...degradationState };
  },

  setOffline(offline: boolean): void {
    degradationState.isOffline = offline;
    degradationState.degradedMode = offline || degradationState.failedServices.size > 0;
  },

  markServiceFailed(serviceName: string): void {
    degradationState.failedServices.add(serviceName);
    degradationState.degradedMode = true;
  },

  markServiceRecovered(serviceName: string): void {
    degradationState.failedServices.delete(serviceName);
    degradationState.degradedMode = 
      degradationState.isOffline || degradationState.failedServices.size > 0;
  },

  setLastError(error: AppError | null): void {
    degradationState.lastError = error;
  },

  reset(): void {
    degradationState = {
      isOffline: false,
      failedServices: new Set(),
      lastError: null,
      degradedMode: false,
    };
  },
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T> {
  const flags = featureFlags.getSync();
  const retryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: flags.maxRetryAttempts,
    ...config,
  };

  let lastError: Error | null = null;
  let delay = retryConfig.baseDelay;

  for (let attempt = 1; attempt <= retryConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === retryConfig.maxAttempts) break;

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * retryConfig.backoffMultiplier, retryConfig.maxDelay);
    }
  }

  throw lastError;
}

export async function withFallback<T, E extends AppError>(
  operation: () => AsyncResult<T, E>,
  config: FallbackConfig<T>
): AsyncResult<T, E> {
  try {
    const result = await operation();
    
    if (isOk(result)) {
      return result;
    }

    if (config.shouldUseFallback(result.error)) {
      config.onFallbackUsed?.(result.error);
      return ok(config.fallbackValue);
    }

    return result;
  } catch (error) {
    const appError = AppError.fromUnknown(error);
    if (config.shouldUseFallback(appError)) {
      config.onFallbackUsed?.(appError);
      return ok(config.fallbackValue);
    }
    return err(appError as E);
  }
}

export async function withTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs?: number
): Promise<T> {
  const flags = featureFlags.getSync();
  const timeout = timeoutMs ?? flags.requestTimeout;

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeout}ms`));
    }, timeout);

    operation()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function withGracefulDegradation<T, E extends AppError>(
  operation: () => AsyncResult<T, E>,
  serviceName: string,
  fallbackValue: T
): AsyncResult<T, E> {
  const state = gracefulDegradation.getState();
  
  if (state.failedServices.has(serviceName)) {
    return ok(fallbackValue);
  }

  try {
    const result = await withTimeout(() => operation());
    
    if (isOk(result)) {
      gracefulDegradation.markServiceRecovered(serviceName);
      return result;
    }

    gracefulDegradation.markServiceFailed(serviceName);
    gracefulDegradation.setLastError(result.error);
    return ok(fallbackValue);
  } catch (error) {
    gracefulDegradation.markServiceFailed(serviceName);
    const appError = AppError.fromUnknown(error);
    gracefulDegradation.setLastError(appError);
    return ok(fallbackValue);
  }
}

export function isRecoverableError(error: AppError): boolean {
  const recoverableCodes = ["NETWORK_ERROR", "TIMEOUT", "SERVICE_UNAVAILABLE"];
  return recoverableCodes.includes(error.code);
}

export function shouldRetry(error: AppError, attempt: number, maxAttempts: number): boolean {
  if (attempt >= maxAttempts) return false;
  return isRecoverableError(error);
}
