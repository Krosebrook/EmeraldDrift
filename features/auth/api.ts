import { ok, err, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import Constants from "expo-constants";

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

function getApiBaseUrl(): string {
  if (__DEV__) {
    const devDomain = Constants.expoConfig?.extra?.REPLIT_DEV_DOMAIN;
    if (devDomain) {
      return `https://${devDomain}`;
    }
    return "http://localhost:3001";
  }
  return "";
}

export const authApi = {
  async getMe(): AsyncResult<ReplitUser | null, AppError> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/me`, {
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
      return err(AppError.network(error instanceof Error ? error.message : "Failed to check auth"));
    }
  },

  async login(): AsyncResult<ReplitUser, AppError> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
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
      return err(AppError.network(error instanceof Error ? error.message : "Failed to login"));
    }
  },

  async logout(): AsyncResult<void, AppError> {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return ok(undefined);
    } catch (error) {
      return err(AppError.network(error instanceof Error ? error.message : "Failed to logout"));
    }
  },

  getLoginUrl(): string {
    return `${getApiBaseUrl()}/api/auth/login`;
  },
};
