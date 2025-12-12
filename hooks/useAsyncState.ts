import { useState, useCallback } from "react";
import {
  AsyncState,
  createInitialAsyncState,
  createLoadingState,
  createSuccessState,
  createErrorState,
  isLoading,
  isSuccess,
  isError,
  isIdle,
} from "@/core/types";
import { Result, isOk } from "@/core/result";
import { AppError } from "@/core/errors";

export interface UseAsyncStateReturn<T> {
  state: AsyncState<T, AppError>;
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  data: T | null;
  error: AppError | null;
  execute: (fn: () => Promise<Result<T, AppError>>) => Promise<Result<T, AppError>>;
  setData: (data: T) => void;
  reset: () => void;
}

export function useAsyncState<T>(
  initialData: T | null = null
): UseAsyncStateReturn<T> {
  const [state, setState] = useState<AsyncState<T, AppError>>(() =>
    initialData
      ? createSuccessState(initialData)
      : createInitialAsyncState<T, AppError>()
  );

  const execute = useCallback(
    async (fn: () => Promise<Result<T, AppError>>): Promise<Result<T, AppError>> => {
      setState((prev) => createLoadingState(prev));

      const result = await fn();

      if (isOk(result)) {
        setState(createSuccessState(result.data));
      } else {
        setState(createErrorState(result.error));
      }

      return result;
    },
    []
  );

  const setData = useCallback((data: T) => {
    setState(createSuccessState(data));
  }, []);

  const reset = useCallback(() => {
    setState(createInitialAsyncState<T, AppError>());
  }, []);

  return {
    state,
    isIdle: isIdle(state),
    isLoading: isLoading(state),
    isSuccess: isSuccess(state),
    isError: isError(state),
    data: state.data,
    error: state.error,
    execute,
    setData,
    reset,
  };
}

export function useAsyncAction() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const execute = useCallback(
    async <T>(fn: () => Promise<Result<T, AppError>>): Promise<Result<T, AppError>> => {
      setLoading(true);
      setError(null);

      const result = await fn();

      setLoading(false);
      if (!isOk(result)) {
        setError(result.error);
      }

      return result;
    },
    []
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, execute, reset };
}
