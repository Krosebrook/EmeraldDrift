import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { storage } from "@/utils/storage";
import { userStatsService } from "@/services/userStats";

const AUTH_STORAGE_KEY = "@creator_studio_auth";
const USER_STORAGE_KEY = "@creator_studio_user";

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  isNewUser?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const loadUser = useCallback(async () => {
    try {
      const userJson = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userJson) {
        const user = JSON.parse(userJson) as User;
        await userStatsService.initializeUser(user.id);
        setState({
          user: { ...user, isNewUser: false },
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const existingUserJson = await AsyncStorage.getItem(`${USER_STORAGE_KEY}_${email}`);
      let user: User;
      let isNewUser = false;
      
      if (existingUserJson) {
        user = JSON.parse(existingUserJson);
      } else {
        user = {
          id: `user_${Date.now()}`,
          email,
          name: email.split("@")[0],
          createdAt: new Date().toISOString(),
        };
        isNewUser = true;
        await AsyncStorage.setItem(`${USER_STORAGE_KEY}_${email}`, JSON.stringify(user));
      }

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ ...user, isNewUser }));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, "true");
      await userStatsService.initializeUser(user.id);

      setState({
        user: { ...user, isNewUser },
        isLoading: false,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error("Sign in failed:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const user: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        createdAt: new Date().toISOString(),
        isNewUser: true,
      };

      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      await AsyncStorage.setItem(`${USER_STORAGE_KEY}_${email}`, JSON.stringify(user));
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, "true");
      await userStatsService.initializeUser(user.id);

      setState({
        user,
        isLoading: false,
        isAuthenticated: true,
      });

      return true;
    } catch (error) {
      console.error("Sign up failed:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
      return false;
    }
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await AsyncStorage.multiRemove([USER_STORAGE_KEY, AUTH_STORAGE_KEY]);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>): Promise<boolean> => {
    try {
      if (!state.user) return false;
      
      const updatedUser = { ...state.user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      
      setState((prev) => ({
        ...prev,
        user: updatedUser,
      }));
      
      return true;
    } catch (error) {
      console.error("Profile update failed:", error);
      return false;
    }
  }, [state.user]);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    updateProfile,
    reload: loadUser,
  };
}
