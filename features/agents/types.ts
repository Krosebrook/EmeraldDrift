import type { BaseEntity } from "../shared/types";

export type AgentStatus = "idle" | "running" | "paused" | "completed" | "failed";

export type AgentCapability = 
  | "text_generation"
  | "code_generation"
  | "data_analysis"
  | "web_search"
  | "image_generation"
  | "summarization"
  | "translation"
  | "content_moderation";

export interface AgentConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  capabilities: AgentCapability[];
  tools: string[];
}

export interface Agent extends BaseEntity {
  name: string;
  description: string;
  avatar?: string;
  config: AgentConfig;
  status: AgentStatus;
  isActive: boolean;
  executionCount: number;
  lastExecutedAt?: string;
  averageExecutionTime?: number;
}

export interface AgentTask {
  id: string;
  agentId: string;
  input: string;
  output?: string;
  status: AgentStatus;
  startedAt: string;
  completedAt?: string;
  error?: string;
  tokensUsed?: number;
}

export interface AgentWorkflow extends BaseEntity {
  name: string;
  description: string;
  agents: string[];
  connections: WorkflowConnection[];
  isActive: boolean;
  executionCount: number;
}

export interface WorkflowConnection {
  from: string;
  to: string;
  condition?: string;
}

export interface AgentOrchestrationResult {
  workflowId: string;
  tasks: AgentTask[];
  totalTokens: number;
  totalTime: number;
  status: AgentStatus;
  completedAt: string;
}

export const AGENT_CAPABILITIES: { value: AgentCapability; label: string; icon: string }[] = [
  { value: "text_generation", label: "Text Generation", icon: "edit-3" },
  { value: "code_generation", label: "Code Generation", icon: "code" },
  { value: "data_analysis", label: "Data Analysis", icon: "bar-chart-2" },
  { value: "web_search", label: "Web Search", icon: "search" },
  { value: "image_generation", label: "Image Generation", icon: "image" },
  { value: "summarization", label: "Summarization", icon: "file-text" },
  { value: "translation", label: "Translation", icon: "globe" },
  { value: "content_moderation", label: "Content Moderation", icon: "shield" },
];

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  model: "gpt-4",
  temperature: 0.7,
  maxTokens: 2000,
  systemPrompt: "You are a helpful AI assistant.",
  capabilities: ["text_generation"],
  tools: [],
};
