import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PromptTemplate, PromptExecutionResult } from "./types";

const TEMPLATES_KEY = "@prompt_templates";
const HISTORY_KEY = "@prompt_history";
const MAX_HISTORY = 100;

export interface PromptRepository {
  getTemplates(): Promise<PromptTemplate[]>;
  getTemplate(id: string): Promise<PromptTemplate | null>;
  saveTemplate(template: PromptTemplate): Promise<PromptTemplate>;
  updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null>;
  deleteTemplate(id: string): Promise<void>;
  getExecutionHistory(): Promise<PromptExecutionResult[]>;
  saveExecution(result: PromptExecutionResult): Promise<void>;
  clearHistory(): Promise<void>;
}

export const promptRepository: PromptRepository = {
  async getTemplates(): Promise<PromptTemplate[]> {
    try {
      const data = await AsyncStorage.getItem(TEMPLATES_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to get prompt templates:", error);
      return [];
    }
  },

  async getTemplate(id: string): Promise<PromptTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find((t) => t.id === id) || null;
  },

  async saveTemplate(template: PromptTemplate): Promise<PromptTemplate> {
    const templates = await this.getTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    
    if (index >= 0) {
      templates[index] = { ...template, updatedAt: new Date().toISOString() };
    } else {
      templates.unshift(template);
    }
    
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return template;
  },

  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    const templates = await this.getTemplates();
    const index = templates.findIndex((t) => t.id === id);
    
    if (index === -1) return null;
    
    templates[index] = { 
      ...templates[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    return templates[index];
  },

  async deleteTemplate(id: string): Promise<void> {
    const templates = await this.getTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    await AsyncStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
  },

  async getExecutionHistory(): Promise<PromptExecutionResult[]> {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to get prompt execution history:", error);
      return [];
    }
  },

  async saveExecution(result: PromptExecutionResult): Promise<void> {
    const history = await this.getExecutionHistory();
    const updated = [result, ...history].slice(0, MAX_HISTORY);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  },

  async clearHistory(): Promise<void> {
    await AsyncStorage.removeItem(HISTORY_KEY);
  },
};
