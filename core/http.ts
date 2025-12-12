import { ok, err, AsyncResult } from "./result";
import { AppError, ErrorCode } from "./errors";
import { config, log } from "./config";

export interface HttpRequestConfig {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retries?: number;
}

export interface HttpResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt), 30000);
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export async function httpRequest<T>(
  url: string,
  requestConfig: HttpRequestConfig = {}
): AsyncResult<HttpResponse<T>, AppError> {
  const {
    method = "GET",
    headers = {},
    body,
    timeout = config.apiTimeout,
    retries = config.maxRetries,
  } = requestConfig;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
  };

  let lastError: AppError | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      log.debug(`HTTP ${method} ${url} (attempt ${attempt + 1})`);

      const response = await fetchWithTimeout(url, requestOptions, timeout);

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorJson = JSON.parse(errorBody);
          errorMessage = errorJson.message || errorJson.error || errorMessage;
        } catch {
          if (errorBody) errorMessage = errorBody;
        }

        if (response.status === 401) {
          return err(AppError.unauthorized(errorMessage));
        }
        if (response.status === 403) {
          return err(AppError.forbidden(errorMessage));
        }
        if (response.status === 404) {
          return err(AppError.notFound("Resource"));
        }
        if (response.status === 429) {
          return err(
            new AppError({
              code: ErrorCode.RATE_LIMITED,
              message: "Too many requests. Please try again later.",
              recoverable: true,
            })
          );
        }
        if (response.status >= 500) {
          lastError = AppError.server(errorMessage);
          if (attempt < retries) {
            await delay(getRetryDelay(attempt));
            continue;
          }
        }

        return err(AppError.server(errorMessage));
      }

      const data = (await response.json()) as T;
      return ok({
        data,
        status: response.status,
        headers: response.headers,
      });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        lastError = AppError.network("Request timed out");
      } else {
        lastError = AppError.network(
          error instanceof Error ? error.message : "Network error"
        );
      }

      if (attempt < retries) {
        await delay(getRetryDelay(attempt));
        continue;
      }
    }
  }

  return err(lastError || AppError.network("Request failed"));
}

export const http = {
  get: <T>(url: string, config?: Omit<HttpRequestConfig, "method" | "body">) =>
    httpRequest<T>(url, { ...config, method: "GET" }),

  post: <T>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, "method" | "body">) =>
    httpRequest<T>(url, { ...config, method: "POST", body }),

  put: <T>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, "method" | "body">) =>
    httpRequest<T>(url, { ...config, method: "PUT", body }),

  patch: <T>(url: string, body?: unknown, config?: Omit<HttpRequestConfig, "method" | "body">) =>
    httpRequest<T>(url, { ...config, method: "PATCH", body }),

  delete: <T>(url: string, config?: Omit<HttpRequestConfig, "method" | "body">) =>
    httpRequest<T>(url, { ...config, method: "DELETE" }),
};
