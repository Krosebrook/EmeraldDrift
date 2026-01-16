import { ok, err, isOk, AsyncResult } from "@/core/result";
import { AppError } from "@/core/errors";
import { authRepository, AuthTokens } from "./repository";
import { authApi, ReplitUser } from "./api";
import type { User } from "@/features/shared/types";

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function replitUserToUser(replitUser: ReplitUser): User {
  const now = new Date().toISOString();
  return {
    id: replitUser.id,
    email: `${replitUser.name}@replit.user`,
    name: replitUser.name,
    avatar: replitUser.profileImage,
    createdAt: now,
    updatedAt: now,
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: AppError | null;
}

export type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User | null }
  | { type: "SET_ERROR"; payload: AppError | null }
  | { type: "LOGOUT" };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: action.payload !== null,
        isLoading: false,
        error: null,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "LOGOUT":
      return { user: null, isAuthenticated: false, isLoading: false, error: null };
    default:
      return state;
  }
}

export const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export interface AuthService {
  initialize(): AsyncResult<User | null, AppError>;
  login(email: string, password: string): AsyncResult<User, AppError>;
  signup(email: string, password: string, name: string): AsyncResult<User, AppError>;
  logout(): AsyncResult<void, AppError>;
  deleteAccount(): AsyncResult<void, AppError>;
  updateProfile(updates: Partial<User>): AsyncResult<User, AppError>;
  isOnboardingComplete(): AsyncResult<boolean, AppError>;
  completeOnboarding(): AsyncResult<void, AppError>;
}

export const authService: AuthService = {
  async initialize(): AsyncResult<User | null, AppError> {
    const apiResult = await authApi.getMe();
    if (isOk(apiResult) && apiResult.data) {
      const user = replitUserToUser(apiResult.data);
      await authRepository.saveUser(user);
      await authRepository.saveTokens({ accessToken: `replit_${apiResult.data.id}` });
      return ok(user);
    }

    const userResult = await authRepository.getUser();
    if (!isOk(userResult)) return userResult;

    const tokensResult = await authRepository.getTokens();
    if (!isOk(tokensResult)) return tokensResult;

    if (!userResult.data || !tokensResult.data) {
      return ok(null);
    }

    return ok(userResult.data);
  },

  async login(email: string, password: string): AsyncResult<User, AppError> {
    if (!email || !password) {
      return err(AppError.validation("Email and password are required"));
    }

    const existingUserResult = await authRepository.getUser();
    if (isOk(existingUserResult) && existingUserResult.data) {
      if (existingUserResult.data.email === email) {
        const saveResult = await authRepository.saveTokens({
          accessToken: `demo_token_${Date.now()}`,
        });
        if (!isOk(saveResult)) return saveResult as any;
        return ok(existingUserResult.data);
      }
    }

    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email,
      name: email.split("@")[0],
      createdAt: now,
      updatedAt: now,
    };

    const saveUserResult = await authRepository.saveUser(user);
    if (!isOk(saveUserResult)) return saveUserResult as any;

    const saveTokensResult = await authRepository.saveTokens({
      accessToken: `demo_token_${Date.now()}`,
    });
    if (!isOk(saveTokensResult)) return saveTokensResult as any;

    return ok(user);
  },

  async signup(email: string, password: string, name: string): AsyncResult<User, AppError> {
    if (!email || !password || !name) {
      return err(AppError.validation("Email, password, and name are required"));
    }

    const now = new Date().toISOString();
    const user: User = {
      id: generateId(),
      email,
      name,
      isNewUser: true,
      createdAt: now,
      updatedAt: now,
    };

    const saveUserResult = await authRepository.saveUser(user);
    if (!isOk(saveUserResult)) return saveUserResult as any;

    const saveTokensResult = await authRepository.saveTokens({
      accessToken: `demo_token_${Date.now()}`,
    });
    if (!isOk(saveTokensResult)) return saveTokensResult as any;

    return ok(user);
  },

  async logout(): AsyncResult<void, AppError> {
    await authApi.logout();
    return authRepository.deleteTokens();
  },

  async deleteAccount(): AsyncResult<void, AppError> {
    return authRepository.clearAll();
  },

  async updateProfile(updates: Partial<User>): AsyncResult<User, AppError> {
    const userResult = await authRepository.getUser();
    if (!isOk(userResult)) return userResult as any;

    if (!userResult.data) {
      return err(AppError.unauthorized("No user found"));
    }

    const updatedUser: User = {
      ...userResult.data,
      ...updates,
      id: userResult.data.id,
      updatedAt: new Date().toISOString(),
    };

    const saveResult = await authRepository.saveUser(updatedUser);
    if (!isOk(saveResult)) return saveResult as any;

    return ok(updatedUser);
  },

  async isOnboardingComplete(): AsyncResult<boolean, AppError> {
    return authRepository.isOnboardingComplete();
  },

  async completeOnboarding(): AsyncResult<void, AppError> {
    return authRepository.setOnboardingComplete(true);
  },
};
