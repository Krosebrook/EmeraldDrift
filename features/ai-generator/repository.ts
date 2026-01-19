import AsyncStorage from "@react-native-async-storage/async-storage";
import type { GeneratedContent } from "./types";

const STORAGE_KEY = "@ai_generator_history";
const MAX_HISTORY = 50;

export interface AIGeneratorRepository {
  getHistory(): Promise<GeneratedContent[]>;
  saveGeneration(content: GeneratedContent): Promise<GeneratedContent>;
  deleteGeneration(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<GeneratedContent | null>;
  clearHistory(): Promise<void>;
  getFavorites(): Promise<GeneratedContent[]>;
}

export const aiGeneratorRepository: AIGeneratorRepository = {
  async getHistory(): Promise<GeneratedContent[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      const items: GeneratedContent[] = JSON.parse(data);
      return items.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Failed to get AI generation history:", error);
      return [];
    }
  },

  async saveGeneration(content: GeneratedContent): Promise<GeneratedContent> {
    try {
      const history = await this.getHistory();
      const updated = [content, ...history].slice(0, MAX_HISTORY);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return content;
    } catch (error) {
      console.error("Failed to save AI generation:", error);
      throw error;
    }
  },

  async deleteGeneration(id: string): Promise<void> {
    try {
      const history = await this.getHistory();
      const updated = history.filter((item) => item.id !== id);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete AI generation:", error);
      throw error;
    }
  },

  async toggleFavorite(id: string): Promise<GeneratedContent | null> {
    try {
      const history = await this.getHistory();
      const index = history.findIndex((item) => item.id === id);
      if (index === -1) return null;
      
      history[index].isFavorite = !history[index].isFavorite;
      history[index].updatedAt = new Date().toISOString();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      return history[index];
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      throw error;
    }
  },

  async clearHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Failed to clear history:", error);
      throw error;
    }
  },

  async getFavorites(): Promise<GeneratedContent[]> {
    const history = await this.getHistory();
    return history.filter((item) => item.isFavorite);
  },
};
