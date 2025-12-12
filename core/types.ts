export type Nullable<T> = T | null;
export type Optional<T> = T | undefined;
export type AsyncFn<T = void> = () => Promise<T>;
export type VoidFn = () => void;

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimestampedEntity {
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type Status = "idle" | "loading" | "success" | "error";

export interface AsyncState<T, E = Error> {
  data: Nullable<T>;
  status: Status;
  error: Nullable<E>;
}

export function createInitialAsyncState<T, E = Error>(): AsyncState<T, E> {
  return {
    data: null,
    status: "idle",
    error: null,
  };
}

export function createLoadingState<T, E = Error>(
  prev?: AsyncState<T, E>
): AsyncState<T, E> {
  return {
    data: prev?.data ?? null,
    status: "loading",
    error: null,
  };
}

export function createSuccessState<T, E = Error>(data: T): AsyncState<T, E> {
  return {
    data,
    status: "success",
    error: null,
  };
}

export function createErrorState<T, E = Error>(error: E): AsyncState<T, E> {
  return {
    data: null,
    status: "error",
    error,
  };
}

export const isIdle = <T, E>(state: AsyncState<T, E>): boolean =>
  state.status === "idle";
export const isLoading = <T, E>(state: AsyncState<T, E>): boolean =>
  state.status === "loading";
export const isSuccess = <T, E>(state: AsyncState<T, E>): boolean =>
  state.status === "success";
export const isError = <T, E>(state: AsyncState<T, E>): boolean =>
  state.status === "error";
