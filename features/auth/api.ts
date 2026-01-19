import { ok, err, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import Constants from "expo-constants";
import { Platform } from "react-native";

export interface ReplitUser {
  id: string;
  name: string;
  bio?: string;
  url?: string;
  profileImage?: string;
  roles?: string[];
  teams?: string[];
}

interface AuthResponse {
  authenticated: boolean;
  user: ReplitUser | null;
}

interface LoginResponse {
  success: boolean;
  user: ReplitUser;
}

const AUTH_TIMEOUT_MS = 5000;

function getApiBaseUrl(): string {
  const devDomain = Constants.expoConfig?.extra?.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    return `https://${devDomain}`;
  }
  
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }
  
  return "";
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number = AUTH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const authApi = {
  async getMe(): AsyncResult<ReplitUser | null, AppError> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return ok(null);
    }
    
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/auth/me`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          return ok(null);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      return ok(data.user);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Auth check timed out, proceeding without auth");
        return ok(null);
      }
      console.warn("Auth check failed:", error);
      return ok(null);
    }
  },

  async login(): AsyncResult<ReplitUser, AppError> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return err(AppError.network("Unable to determine API URL"));
    }
    
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/auth/login`, {
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          return err(AppError.unauthorized("Login required"));
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data: LoginResponse = await response.json();
      if (!data.success || !data.user) {
        return err(AppError.unauthorized("Login failed"));
      }

      return ok(data.user);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return err(AppError.network("Login request timed out"));
      }
      return err(AppError.network(error instanceof Error ? error.message : "Failed to login"));
    }
  },

  async logout(): AsyncResult<void, AppError> {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
      return ok(undefined);
    }
    
    try {
      const response = await fetchWithTimeout(`${baseUrl}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return ok(undefined);
    } catch (error) {
      console.warn("Logout failed:", error);
      return ok(undefined);
    }
  },

  getLoginUrl(): string {
    return `${getApiBaseUrl()}/api/auth/login`;
  },
};
