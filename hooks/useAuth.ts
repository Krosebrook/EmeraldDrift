import { useState, useEffect, useCallback, useReducer } from "react";
import { isOk } from "@/core/result";
import { logError } from "@/core/errors";
import {
  authService,
  authReducer,
  initialAuthState,
  AuthState,
} from "@/features/auth";
import type { User } from "@/features/shared/types";

export type { User };

export function useAuth() {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  const loadUser = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Auth initialization timeout")), 10000)
      );
      
      const result = await Promise.race([
        authService.initialize(),
        timeoutPromise
      ]) as any;
      
      if (isOk(result)) {
        dispatch({ type: "SET_USER", payload: result.data });
      } else {
        logError(result.error, { context: "useAuth.loadUser" });
        dispatch({ type: "SET_USER", payload: null });
      }
    } catch (error) {
      logError(error, { context: "useAuth.loadUser" });
      dispatch({ type: "SET_USER", payload: null });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await authService.login(email, password);
      if (isOk(result)) {
        dispatch({ type: "SET_USER", payload: result.data });
        return true;
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return false;
      }
    } catch (error) {
      logError(error, { context: "useAuth.signIn" });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await authService.signup(email, password, name);
      if (isOk(result)) {
        dispatch({ type: "SET_USER", payload: result.data });
        return true;
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return false;
      }
    } catch (error) {
      logError(error, { context: "useAuth.signUp" });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await authService.logout();
      dispatch({ type: "LOGOUT" });
    } catch (error) {
      logError(error, { context: "useAuth.signOut" });
    }
  }, []);

  const deleteAccount = useCallback(async (): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await authService.deleteAccount();
      if (isOk(result)) {
        dispatch({ type: "LOGOUT" });
        return true;
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return false;
      }
    } catch (error) {
      logError(error, { context: "useAuth.deleteAccount" });
      dispatch({ type: "SET_LOADING", payload: false });
      return false;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    try {
      const result = await authService.updateProfile(updates);
      if (isOk(result)) {
        dispatch({ type: "SET_USER", payload: result.data });
        return true;
      } else {
        dispatch({ type: "SET_ERROR", payload: result.error });
        return false;
      }
    } catch (error) {
      logError(error, { context: "useAuth.updateProfile" });
      return false;
    }
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,
    signIn,
    signUp,
    signOut,
    deleteAccount,
    updateProfile,
    reload: loadUser,
  };
}
