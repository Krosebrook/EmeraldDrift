import type { BaseEntity } from "../shared/types";

export type PromptCategory = 
  | "agent"
  | "api"
  | "workflow"
  | "analysis"
  | "generation"
  | "custom";

export type VariableType = "string" | "number" | "boolean" | "array" | "object";

export interface PromptVariable {
  name: string;
  type: VariableType;
  description?: string;
  defaultValue?: string;
  required: boolean;
}

export interface PromptTemplate extends BaseEntity {
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  category: PromptCategory;
  tags: string[];
  isPublic: boolean;
  isFavorite: boolean;
  usageCount: number;
  lastUsedAt?: string;
}

export interface PromptExecutionResult {
  promptId: string;
  input: Record<string, unknown>;
  output: string;
  tokensUsed: number;
  executionTime: number;
  executedAt: string;
  model: string;
}

export interface LLMSettings {
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
}

export const DEFAULT_LLM_SETTINGS: LLMSettings = {
  temperature: 0.7,
  maxTokens: 1000,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export const PROMPT_CATEGORIES: { value: PromptCategory; label: string; icon: string }[] = [
  { value: "agent", label: "Agent", icon: "cpu" },
  { value: "api", label: "API", icon: "code" },
  { value: "workflow", label: "Workflow", icon: "git-branch" },
  { value: "analysis", label: "Analysis", icon: "bar-chart-2" },
  { value: "generation", label: "Generation", icon: "edit-3" },
  { value: "custom", label: "Custom", icon: "tool" },
];

export const VARIABLE_TYPES: { value: VariableType; label: string }[] = [
  { value: "string", label: "String" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "array", label: "Array" },
  { value: "object", label: "Object" },
];
