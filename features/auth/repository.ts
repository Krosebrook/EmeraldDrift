import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { ok, err, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import type { User } from "@/features/shared/types";

const STORAGE_KEYS = {
  USER: "@creator_studio_user",
  AUTH_TOKEN: "@creator_studio_auth_token",
  REFRESH_TOKEN: "@creator_studio_refresh_token",
  ONBOARDING_COMPLETE: "@creator_studio_onboarding",
} as const;

const isSecureStoreAvailable = Platform.OS !== "web";

async function secureGet(key: string): Promise<string | null> {
  if (!isSecureStoreAvailable) {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function secureSet(key: string, value: string): Promise<void> {
  if (!isSecureStoreAvailable) {
    await AsyncStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function secureRemove(key: string): Promise<void> {
  if (!isSecureStoreAvailable) {
    await AsyncStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface AuthRepository {
  getUser(): AsyncResult<User | null, AppError>;
  saveUser(user: User): AsyncResult<void, AppError>;
  deleteUser(): AsyncResult<void, AppError>;
  getTokens(): AsyncResult<AuthTokens | null, AppError>;
  saveTokens(tokens: AuthTokens): AsyncResult<void, AppError>;
  deleteTokens(): AsyncResult<void, AppError>;
  isOnboardingComplete(): AsyncResult<boolean, AppError>;
  setOnboardingComplete(complete: boolean): AsyncResult<void, AppError>;
  clearAll(): AsyncResult<void, AppError>;
}

export const authRepository: AuthRepository = {
  async getUser(): AsyncResult<User | null, AppError> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      return ok(data ? JSON.parse(data) : null);
    } catch (error) {
      return err(AppError.persistence("get", "user", error instanceof Error ? error : undefined));
    }
  },

  async saveUser(user: User): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "user", error instanceof Error ? error : undefined));
    }
  },

  async deleteUser(): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("delete", "user", error instanceof Error ? error : undefined));
    }
  },

  async getTokens(): AsyncResult<AuthTokens | null, AppError> {
    try {
      const accessToken = await secureGet(STORAGE_KEYS.AUTH_TOKEN);
      if (!accessToken) return ok(null);

      const refreshToken = await secureGet(STORAGE_KEYS.REFRESH_TOKEN);
      return ok({
        accessToken,
        refreshToken: refreshToken ?? undefined,
      });
    } catch (error) {
      return err(AppError.persistence("get", "tokens", error instanceof Error ? error : undefined));
    }
  },

  async saveTokens(tokens: AuthTokens): AsyncResult<void, AppError> {
    try {
      await secureSet(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
      if (tokens.refreshToken) {
        await secureSet(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      }
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "tokens", error instanceof Error ? error : undefined));
    }
  },

  async deleteTokens(): AsyncResult<void, AppError> {
    try {
      await secureRemove(STORAGE_KEYS.AUTH_TOKEN);
      await secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("delete", "tokens", error instanceof Error ? error : undefined));
    }
  },

  async isOnboardingComplete(): AsyncResult<boolean, AppError> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return ok(value === "true");
    } catch (error) {
      return err(AppError.persistence("get", "onboarding", error instanceof Error ? error : undefined));
    }
  },

  async setOnboardingComplete(complete: boolean): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(complete));
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("save", "onboarding", error instanceof Error ? error : undefined));
    }
  },

  async clearAll(): AsyncResult<void, AppError> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.ONBOARDING_COMPLETE,
      ]);
      await secureRemove(STORAGE_KEYS.AUTH_TOKEN);
      await secureRemove(STORAGE_KEYS.REFRESH_TOKEN);
      return ok(undefined);
    } catch (error) {
      return err(AppError.persistence("clear", "auth", error instanceof Error ? error : undefined));
    }
  },
};
