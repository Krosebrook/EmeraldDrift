export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.data;
  }
  return defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> {
  if (result.success) {
    return ok(fn(result.data));
  }
  return result;
}

export async function tryCatch<T>(
  fn: () => Promise<T>,
  errorMessage?: string
): AsyncResult<T> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    const message = errorMessage || (error instanceof Error ? error.message : "Unknown error");
    return err(new Error(message));
  }
}

export function tryCatchSync<T>(
  fn: () => T,
  errorMessage?: string
): Result<T> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    const message = errorMessage || (error instanceof Error ? error.message : "Unknown error");
    return err(new Error(message));
  }
}
