import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Agent, AgentTask, AgentWorkflow } from "./types";

const AGENTS_KEY = "@agents";
const TASKS_KEY = "@agent_tasks";
const WORKFLOWS_KEY = "@agent_workflows";
const MAX_TASKS = 200;

export interface AgentRepository {
  getAgents(): Promise<Agent[]>;
  getAgent(id: string): Promise<Agent | null>;
  saveAgent(agent: Agent): Promise<Agent>;
  updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null>;
  deleteAgent(id: string): Promise<void>;
  getTasks(agentId?: string): Promise<AgentTask[]>;
  saveTask(task: AgentTask): Promise<AgentTask>;
  getWorkflows(): Promise<AgentWorkflow[]>;
  saveWorkflow(workflow: AgentWorkflow): Promise<AgentWorkflow>;
  deleteWorkflow(id: string): Promise<void>;
}

export const agentRepository: AgentRepository = {
  async getAgents(): Promise<Agent[]> {
    try {
      const data = await AsyncStorage.getItem(AGENTS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to get agents:", error);
      return [];
    }
  },

  async getAgent(id: string): Promise<Agent | null> {
    const agents = await this.getAgents();
    return agents.find((a) => a.id === id) || null;
  },

  async saveAgent(agent: Agent): Promise<Agent> {
    const agents = await this.getAgents();
    const index = agents.findIndex((a) => a.id === agent.id);
    
    if (index >= 0) {
      agents[index] = { ...agent, updatedAt: new Date().toISOString() };
    } else {
      agents.unshift(agent);
    }
    
    await AsyncStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
    return agent;
  },

  async updateAgent(id: string, updates: Partial<Agent>): Promise<Agent | null> {
    const agents = await this.getAgents();
    const index = agents.findIndex((a) => a.id === id);
    
    if (index === -1) return null;
    
    agents[index] = { 
      ...agents[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    
    await AsyncStorage.setItem(AGENTS_KEY, JSON.stringify(agents));
    return agents[index];
  },

  async deleteAgent(id: string): Promise<void> {
    const agents = await this.getAgents();
    const filtered = agents.filter((a) => a.id !== id);
    await AsyncStorage.setItem(AGENTS_KEY, JSON.stringify(filtered));
  },

  async getTasks(agentId?: string): Promise<AgentTask[]> {
    try {
      const data = await AsyncStorage.getItem(TASKS_KEY);
      if (!data) return [];
      const tasks: AgentTask[] = JSON.parse(data);
      if (agentId) {
        return tasks.filter((t) => t.agentId === agentId);
      }
      return tasks;
    } catch (error) {
      console.error("Failed to get tasks:", error);
      return [];
    }
  },

  async saveTask(task: AgentTask): Promise<AgentTask> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex((t) => t.id === task.id);
    
    if (index >= 0) {
      tasks[index] = task;
    } else {
      tasks.unshift(task);
    }
    
    const trimmed = tasks.slice(0, MAX_TASKS);
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(trimmed));
    return task;
  },

  async getWorkflows(): Promise<AgentWorkflow[]> {
    try {
      const data = await AsyncStorage.getItem(WORKFLOWS_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error("Failed to get workflows:", error);
      return [];
    }
  },

  async saveWorkflow(workflow: AgentWorkflow): Promise<AgentWorkflow> {
    const workflows = await this.getWorkflows();
    const index = workflows.findIndex((w) => w.id === workflow.id);
    
    if (index >= 0) {
      workflows[index] = { ...workflow, updatedAt: new Date().toISOString() };
    } else {
      workflows.unshift(workflow);
    }
    
    await AsyncStorage.setItem(WORKFLOWS_KEY, JSON.stringify(workflows));
    return workflow;
  },

  async deleteWorkflow(id: string): Promise<void> {
    const workflows = await this.getWorkflows();
    const filtered = workflows.filter((w) => w.id !== id);
    await AsyncStorage.setItem(WORKFLOWS_KEY, JSON.stringify(filtered));
  },
};
