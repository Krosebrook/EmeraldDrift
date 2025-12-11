import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { STORAGE_KEYS } from "../core/constants";
import { userRepository } from "../repositories";
import type { User, OnboardingState } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  onboardingState: OnboardingState | null;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_LOADING" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; onboardingState: OnboardingState } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "AUTH_LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "UPDATE_ONBOARDING"; payload: OnboardingState }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  onboardingState: null,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "AUTH_LOADING":
      return { ...state, isLoading: true, error: null };
    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        onboardingState: action.payload.onboardingState,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case "AUTH_LOGOUT":
      return { ...initialState, isLoading: false };
    case "UPDATE_USER":
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    case "UPDATE_ONBOARDING":
      return { ...state, onboardingState: action.payload };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  completeOnboardingStep: (step: keyof OnboardingState["steps"]) => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const user: User = JSON.parse(userData);
        await userRepository.initialize(user.id);
        const onboardingState = await userRepository.getOnboardingState(user.id);
        dispatch({ type: "AUTH_SUCCESS", payload: { user, onboardingState } });
      } else {
        dispatch({ type: "AUTH_LOGOUT" });
      }
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Failed to load user data" });
    }
  };

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      if (!email || !password) {
        dispatch({ type: "AUTH_FAILURE", payload: "Email and password are required" });
        return false;
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email,
        name: email.split("@")[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await userRepository.initialize(user.id);
      const onboardingState = await userRepository.getOnboardingState(user.id);
      
      dispatch({ type: "AUTH_SUCCESS", payload: { user, onboardingState } });
      return true;
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Sign in failed" });
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    dispatch({ type: "AUTH_LOADING" });
    try {
      if (!email || !password || !name) {
        dispatch({ type: "AUTH_FAILURE", payload: "All fields are required" });
        return false;
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await userRepository.initialize(user.id);
      const onboardingState = await userRepository.getOnboardingState(user.id);
      
      dispatch({ type: "AUTH_SUCCESS", payload: { user, onboardingState } });
      return true;
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Sign up failed" });
      return false;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      dispatch({ type: "AUTH_LOGOUT" });
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Sign out failed" });
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!state.user) return;
    try {
      const updatedUser: User = {
        ...state.user,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      dispatch({ type: "UPDATE_USER", payload: updates });
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Failed to update user" });
    }
  }, [state.user]);

  const completeOnboardingStep = useCallback(async (step: keyof OnboardingState["steps"]) => {
    if (!state.user) return;
    try {
      const onboardingState = await userRepository.completeOnboardingStep(state.user.id, step);
      dispatch({ type: "UPDATE_ONBOARDING", payload: onboardingState });
    } catch {
      dispatch({ type: "AUTH_FAILURE", payload: "Failed to update onboarding" });
    }
  }, [state.user]);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: AuthContextValue = {
    ...state,
    signIn,
    signUp,
    signOut,
    updateUser,
    completeOnboardingStep,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function useIsAuthenticated(): boolean {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

export function useOnboardingState(): OnboardingState | null {
  const { onboardingState } = useAuth();
  return onboardingState;
}

export default AuthContext;
