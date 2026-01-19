import { ok, err, type AsyncResult } from "@/core/result";
import { AppError, logError } from "@/core/errors";
import { promptRepository } from "./repository";
import type { 
  PromptTemplate, 
  PromptVariable, 
  PromptCategory,
  PromptExecutionResult,
  LLMSettings 
} from "./types";
import { DEFAULT_LLM_SETTINGS } from "./types";

export interface CreatePromptInput {
  name: string;
  description: string;
  template: string;
  variables: PromptVariable[];
  category: PromptCategory;
  tags?: string[];
}

export interface PromptService {
  getTemplates(): AsyncResult<PromptTemplate[], AppError>;
  getTemplate(id: string): AsyncResult<PromptTemplate | null, AppError>;
  createTemplate(input: CreatePromptInput): AsyncResult<PromptTemplate, AppError>;
  updateTemplate(id: string, updates: Partial<CreatePromptInput>): AsyncResult<PromptTemplate | null, AppError>;
  deleteTemplate(id: string): AsyncResult<void, AppError>;
  duplicateTemplate(id: string): AsyncResult<PromptTemplate, AppError>;
  executePrompt(templateId: string, variables: Record<string, unknown>, settings?: LLMSettings): AsyncResult<PromptExecutionResult, AppError>;
  getExecutionHistory(): AsyncResult<PromptExecutionResult[], AppError>;
  toggleFavorite(id: string): AsyncResult<PromptTemplate | null, AppError>;
  renderTemplate(template: string, variables: Record<string, unknown>): string;
}

function generateId(): string {
  return `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const promptService: PromptService = {
  async getTemplates(): AsyncResult<PromptTemplate[], AppError> {
    try {
      const templates = await promptRepository.getTemplates();
      return ok(templates);
    } catch (error) {
      logError(error, { context: "promptService.getTemplates" });
      return err(AppError.server("Failed to load prompt templates"));
    }
  },

  async getTemplate(id: string): AsyncResult<PromptTemplate | null, AppError> {
    try {
      const template = await promptRepository.getTemplate(id);
      return ok(template);
    } catch (error) {
      logError(error, { context: "promptService.getTemplate" });
      return err(AppError.server("Failed to load prompt template"));
    }
  },

  async createTemplate(input: CreatePromptInput): AsyncResult<PromptTemplate, AppError> {
    try {
      if (!input.name.trim()) {
        return err(AppError.validation("Template name is required"));
      }
      if (!input.template.trim()) {
        return err(AppError.validation("Template content is required"));
      }

      const now = new Date().toISOString();
      const template: PromptTemplate = {
        id: generateId(),
        name: input.name.trim(),
        description: input.description.trim(),
        template: input.template,
        variables: input.variables,
        category: input.category,
        tags: input.tags || [],
        isPublic: false,
        isFavorite: false,
        usageCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await promptRepository.saveTemplate(template);
      return ok(template);
    } catch (error) {
      logError(error, { context: "promptService.createTemplate" });
      return err(AppError.server("Failed to create prompt template"));
    }
  },

  async updateTemplate(id: string, updates: Partial<CreatePromptInput>): AsyncResult<PromptTemplate | null, AppError> {
    try {
      const result = await promptRepository.updateTemplate(id, updates);
      return ok(result);
    } catch (error) {
      logError(error, { context: "promptService.updateTemplate" });
      return err(AppError.server("Failed to update prompt template"));
    }
  },

  async deleteTemplate(id: string): AsyncResult<void, AppError> {
    try {
      await promptRepository.deleteTemplate(id);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "promptService.deleteTemplate" });
      return err(AppError.server("Failed to delete prompt template"));
    }
  },

  async duplicateTemplate(id: string): AsyncResult<PromptTemplate, AppError> {
    try {
      const original = await promptRepository.getTemplate(id);
      if (!original) {
        return err(AppError.notFound("Prompt template"));
      }

      const now = new Date().toISOString();
      const duplicate: PromptTemplate = {
        ...original,
        id: generateId(),
        name: `${original.name} (Copy)`,
        usageCount: 0,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };

      await promptRepository.saveTemplate(duplicate);
      return ok(duplicate);
    } catch (error) {
      logError(error, { context: "promptService.duplicateTemplate" });
      return err(AppError.server("Failed to duplicate prompt template"));
    }
  },

  async executePrompt(
    templateId: string, 
    variables: Record<string, unknown>,
    settings: LLMSettings = DEFAULT_LLM_SETTINGS
  ): AsyncResult<PromptExecutionResult, AppError> {
    try {
      const template = await promptRepository.getTemplate(templateId);
      if (!template) {
        return err(AppError.notFound("Prompt template"));
      }

      const renderedPrompt = this.renderTemplate(template.template, variables);
      
      const startTime = Date.now();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const executionTime = Date.now() - startTime;

      const simulatedOutput = `Executed prompt: ${template.name}\n\nRendered template:\n${renderedPrompt}\n\nThis is a simulated response based on the prompt with temperature ${settings.temperature}.`;

      const result: PromptExecutionResult = {
        promptId: templateId,
        input: variables,
        output: simulatedOutput,
        tokensUsed: Math.floor(renderedPrompt.length / 4),
        executionTime,
        executedAt: new Date().toISOString(),
        model: "gpt-4",
      };

      await promptRepository.saveExecution(result);
      await promptRepository.updateTemplate(templateId, {
        usageCount: template.usageCount + 1,
        lastUsedAt: new Date().toISOString(),
      } as Partial<PromptTemplate>);

      return ok(result);
    } catch (error) {
      logError(error, { context: "promptService.executePrompt" });
      return err(AppError.server("Failed to execute prompt"));
    }
  },

  async getExecutionHistory(): AsyncResult<PromptExecutionResult[], AppError> {
    try {
      const history = await promptRepository.getExecutionHistory();
      return ok(history);
    } catch (error) {
      logError(error, { context: "promptService.getExecutionHistory" });
      return err(AppError.server("Failed to load execution history"));
    }
  },

  async toggleFavorite(id: string): AsyncResult<PromptTemplate | null, AppError> {
    try {
      const template = await promptRepository.getTemplate(id);
      if (!template) return ok(null);
      
      const result = await promptRepository.updateTemplate(id, {
        isFavorite: !template.isFavorite,
      } as Partial<PromptTemplate>);
      return ok(result);
    } catch (error) {
      logError(error, { context: "promptService.toggleFavorite" });
      return err(AppError.server("Failed to toggle favorite"));
    }
  },

  renderTemplate(template: string, variables: Record<string, unknown>): string {
    let rendered = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      rendered = rendered.replace(placeholder, String(value));
    }
    return rendered;
  },
};
