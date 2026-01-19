import { ok, err, Result, isOk, isErr } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import { featureFlags } from "@/core/featureFlags";

export function createMockAppError(
  code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
  message = "Test error"
): AppError {
  return new AppError({ code, message });
}

export function createSuccessResult<T>(data: T): Result<T, AppError> {
  return ok(data);
}

export function createErrorResult<T>(error: AppError): Result<T, AppError> {
  return err(error);
}

export function expectOk<T, E>(result: Result<T, E>): T {
  if (!isOk(result)) {
    throw new Error(`Expected Ok result, got Error: ${JSON.stringify(result)}`);
  }
  return result.data;
}

export function expectErr<T, E>(result: Result<T, E>): E {
  if (!isErr(result)) {
    throw new Error(`Expected Err result, got Ok: ${JSON.stringify(result)}`);
  }
  return result.error;
}

export async function withTestFeatureFlags<T>(
  flags: Partial<Parameters<typeof featureFlags.set>[0]>,
  fn: () => Promise<T>
): Promise<T> {
  const originalFlags = featureFlags.getSync();
  await featureFlags.set(flags);
  try {
    return await fn();
  } finally {
    await featureFlags.set(originalFlags);
  }
}

interface MockFn {
  (...args: unknown[]): unknown;
  calls: unknown[][];
  mockReset: () => void;
  mockReturnValue: (value: unknown) => void;
}

export function createMockFn(): MockFn {
  let returnValue: unknown;
  const calls: unknown[][] = [];
  
  const fn: MockFn = (...args: unknown[]) => {
    calls.push(args);
    return returnValue;
  };
  
  fn.calls = calls;
  fn.mockReset = () => {
    calls.length = 0;
    returnValue = undefined;
  };
  fn.mockReturnValue = (value: unknown) => {
    returnValue = value;
  };
  
  return fn;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateTestId(prefix = "test"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function createMockData<T>(base: T, overrides?: DeepPartial<T>): T {
  return { ...base, ...overrides } as T;
}

export const TEST_TIMEOUTS = {
  SHORT: 1000,
  MEDIUM: 5000,
  LONG: 10000,
  NETWORK: 30000,
};

export const mockNavigate = createMockFn();
export const mockGoBack = createMockFn();

export const mockNavigation = {
  navigate: mockNavigate,
  goBack: mockGoBack,
  setOptions: createMockFn(),
  addListener: createMockFn(),
  removeListener: createMockFn(),
  reset: createMockFn(),
  isFocused: createMockFn(),
};

export function resetMocks(): void {
  mockNavigate.mockReset();
  mockGoBack.mockReset();
  mockNavigation.setOptions.mockReset();
  mockNavigation.addListener.mockReset();
  mockNavigation.removeListener.mockReset();
  mockNavigation.reset.mockReset();
  mockNavigation.isFocused.mockReset();
}

export function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message || "Value is undefined or null");
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

export function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      message || `Deep equality failed:\nActual: ${JSON.stringify(actual)}\nExpected: ${JSON.stringify(expected)}`
    );
  }
}

export function assertTrue(condition: boolean, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || "Assertion failed: expected true");
  }
}

export function assertFalse(condition: boolean, message?: string): void {
  if (condition) {
    throw new Error(message || "Assertion failed: expected false");
  }
}

export async function assertThrows(
  fn: () => Promise<unknown> | unknown,
  expectedMessage?: string
): Promise<Error> {
  try {
    await fn();
    throw new Error("Expected function to throw but it did not");
  } catch (error) {
    if (error instanceof Error && error.message === "Expected function to throw but it did not") {
      throw error;
    }
    if (expectedMessage && error instanceof Error && !error.message.includes(expectedMessage)) {
      throw new Error(`Expected error message to include "${expectedMessage}" but got "${error.message}"`);
    }
    return error instanceof Error ? error : new Error(String(error));
  }
}
