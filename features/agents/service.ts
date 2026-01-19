import { ok, err, type AsyncResult } from "@/core/result";
import { AppError, logError } from "@/core/errors";
import { agentRepository } from "./repository";
import type { 
  Agent, 
  AgentTask, 
  AgentWorkflow,
  AgentConfig,
  AgentStatus,
  AgentOrchestrationResult,
} from "./types";
import { DEFAULT_AGENT_CONFIG } from "./types";

export interface CreateAgentInput {
  name: string;
  description: string;
  avatar?: string;
  config?: Partial<AgentConfig>;
}

export interface CreateWorkflowInput {
  name: string;
  description: string;
  agents: string[];
}

export interface AgentService {
  getAgents(): AsyncResult<Agent[], AppError>;
  getAgent(id: string): AsyncResult<Agent | null, AppError>;
  createAgent(input: CreateAgentInput): AsyncResult<Agent, AppError>;
  updateAgent(id: string, updates: Partial<CreateAgentInput>): AsyncResult<Agent | null, AppError>;
  deleteAgent(id: string): AsyncResult<void, AppError>;
  executeAgent(id: string, input: string): AsyncResult<AgentTask, AppError>;
  getAgentTasks(agentId?: string): AsyncResult<AgentTask[], AppError>;
  getWorkflows(): AsyncResult<AgentWorkflow[], AppError>;
  createWorkflow(input: CreateWorkflowInput): AsyncResult<AgentWorkflow, AppError>;
  executeWorkflow(workflowId: string, input: string): AsyncResult<AgentOrchestrationResult, AppError>;
  deleteWorkflow(id: string): AsyncResult<void, AppError>;
  toggleAgentActive(id: string): AsyncResult<Agent | null, AppError>;
}

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const agentService: AgentService = {
  async getAgents(): AsyncResult<Agent[], AppError> {
    try {
      const agents = await agentRepository.getAgents();
      return ok(agents);
    } catch (error) {
      logError(error, { context: "agentService.getAgents" });
      return err(AppError.server("Failed to load agents"));
    }
  },

  async getAgent(id: string): AsyncResult<Agent | null, AppError> {
    try {
      const agent = await agentRepository.getAgent(id);
      return ok(agent);
    } catch (error) {
      logError(error, { context: "agentService.getAgent" });
      return err(AppError.server("Failed to load agent"));
    }
  },

  async createAgent(input: CreateAgentInput): AsyncResult<Agent, AppError> {
    try {
      if (!input.name.trim()) {
        return err(AppError.validation("Agent name is required"));
      }

      const now = new Date().toISOString();
      const agent: Agent = {
        id: generateId("agent"),
        name: input.name.trim(),
        description: input.description.trim(),
        avatar: input.avatar,
        config: { ...DEFAULT_AGENT_CONFIG, ...input.config },
        status: "idle",
        isActive: true,
        executionCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await agentRepository.saveAgent(agent);
      return ok(agent);
    } catch (error) {
      logError(error, { context: "agentService.createAgent" });
      return err(AppError.server("Failed to create agent"));
    }
  },

  async updateAgent(id: string, updates: Partial<CreateAgentInput>): AsyncResult<Agent | null, AppError> {
    try {
      const result = await agentRepository.updateAgent(id, updates as Partial<Agent>);
      return ok(result);
    } catch (error) {
      logError(error, { context: "agentService.updateAgent" });
      return err(AppError.server("Failed to update agent"));
    }
  },

  async deleteAgent(id: string): AsyncResult<void, AppError> {
    try {
      await agentRepository.deleteAgent(id);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "agentService.deleteAgent" });
      return err(AppError.server("Failed to delete agent"));
    }
  },

  async executeAgent(id: string, input: string): AsyncResult<AgentTask, AppError> {
    try {
      const agent = await agentRepository.getAgent(id);
      if (!agent) {
        return err(AppError.notFound("Agent"));
      }

      if (!agent.isActive) {
        return err(AppError.validation("Agent is not active"));
      }

      const task: AgentTask = {
        id: generateId("task"),
        agentId: id,
        input,
        status: "running",
        startedAt: new Date().toISOString(),
      };

      await agentRepository.saveTask(task);
      await agentRepository.updateAgent(id, { status: "running" });

      await new Promise((resolve) => setTimeout(resolve, 1500));

      const completedTask: AgentTask = {
        ...task,
        output: `Agent "${agent.name}" processed: ${input}\n\nResponse generated using ${agent.config.model} with capabilities: ${agent.config.capabilities.join(", ")}.`,
        status: "completed",
        completedAt: new Date().toISOString(),
        tokensUsed: Math.floor(input.length / 2),
      };

      await agentRepository.saveTask(completedTask);
      await agentRepository.updateAgent(id, { 
        status: "idle",
        executionCount: agent.executionCount + 1,
        lastExecutedAt: new Date().toISOString(),
      });

      return ok(completedTask);
    } catch (error) {
      logError(error, { context: "agentService.executeAgent" });
      return err(AppError.server("Failed to execute agent"));
    }
  },

  async getAgentTasks(agentId?: string): AsyncResult<AgentTask[], AppError> {
    try {
      const tasks = await agentRepository.getTasks(agentId);
      return ok(tasks);
    } catch (error) {
      logError(error, { context: "agentService.getAgentTasks" });
      return err(AppError.server("Failed to load agent tasks"));
    }
  },

  async getWorkflows(): AsyncResult<AgentWorkflow[], AppError> {
    try {
      const workflows = await agentRepository.getWorkflows();
      return ok(workflows);
    } catch (error) {
      logError(error, { context: "agentService.getWorkflows" });
      return err(AppError.server("Failed to load workflows"));
    }
  },

  async createWorkflow(input: CreateWorkflowInput): AsyncResult<AgentWorkflow, AppError> {
    try {
      if (!input.name.trim()) {
        return err(AppError.validation("Workflow name is required"));
      }
      if (input.agents.length === 0) {
        return err(AppError.validation("At least one agent is required"));
      }

      const now = new Date().toISOString();
      const workflow: AgentWorkflow = {
        id: generateId("workflow"),
        name: input.name.trim(),
        description: input.description.trim(),
        agents: input.agents,
        connections: input.agents.slice(0, -1).map((agentId, i) => ({
          from: agentId,
          to: input.agents[i + 1],
        })),
        isActive: true,
        executionCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await agentRepository.saveWorkflow(workflow);
      return ok(workflow);
    } catch (error) {
      logError(error, { context: "agentService.createWorkflow" });
      return err(AppError.server("Failed to create workflow"));
    }
  },

  async executeWorkflow(workflowId: string, input: string): AsyncResult<AgentOrchestrationResult, AppError> {
    try {
      const workflows = await agentRepository.getWorkflows();
      const workflow = workflows.find((w) => w.id === workflowId);
      
      if (!workflow) {
        return err(AppError.notFound("Workflow"));
      }

      const tasks: AgentTask[] = [];
      let currentInput = input;
      let totalTokens = 0;
      const startTime = Date.now();

      for (const agentId of workflow.agents) {
        const taskResult = await this.executeAgent(agentId, currentInput);
        if (taskResult.success && taskResult.data) {
          tasks.push(taskResult.data);
          currentInput = taskResult.data.output || currentInput;
          totalTokens += taskResult.data.tokensUsed || 0;
        }
      }

      const result: AgentOrchestrationResult = {
        workflowId,
        tasks,
        totalTokens,
        totalTime: Date.now() - startTime,
        status: "completed",
        completedAt: new Date().toISOString(),
      };

      return ok(result);
    } catch (error) {
      logError(error, { context: "agentService.executeWorkflow" });
      return err(AppError.server("Failed to execute workflow"));
    }
  },

  async deleteWorkflow(id: string): AsyncResult<void, AppError> {
    try {
      await agentRepository.deleteWorkflow(id);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "agentService.deleteWorkflow" });
      return err(AppError.server("Failed to delete workflow"));
    }
  },

  async toggleAgentActive(id: string): AsyncResult<Agent | null, AppError> {
    try {
      const agent = await agentRepository.getAgent(id);
      if (!agent) return ok(null);
      
      const result = await agentRepository.updateAgent(id, {
        isActive: !agent.isActive,
      });
      return ok(result);
    } catch (error) {
      logError(error, { context: "agentService.toggleAgentActive" });
      return err(AppError.server("Failed to toggle agent status"));
    }
  },
};
