import { createSmokeTestSuite } from "../utils/smokeTestRunner";
import { aiGeneratorService } from "@/features/ai-generator";
import { promptService } from "@/features/prompts";
import { agentService } from "@/features/agents";
import { isOk, isErr } from "@/core/result";
import type { GeneratedContent } from "@/features/ai-generator";
import type { PromptTemplate } from "@/features/prompts";
import type { Agent } from "@/features/agents";

export const aiFeaturesSmokeTests = createSmokeTestSuite("AI Features")
  .addTest("AI Generator service should be available", async () => {
    if (!aiGeneratorService) throw new Error("AI Generator service not available");
    if (typeof aiGeneratorService.generate !== "function") {
      throw new Error("generate method not available");
    }
    if (typeof aiGeneratorService.getHistory !== "function") {
      throw new Error("getHistory method not available");
    }
  })

  .addTest("AI Generator should validate empty topic", async () => {
    const result = await aiGeneratorService.generate({
      topic: "",
      contentType: "marketing",
      tone: "professional",
      audience: "general",
      wordCount: 500,
    });
    
    if (isOk(result)) throw new Error("Should reject empty topic");
    if (isErr(result) && !result.error.message.toLowerCase().includes("topic")) {
      throw new Error("Error should mention topic validation");
    }
  })

  .addTest("AI Generator should generate content", async () => {
    const result = await aiGeneratorService.generate({
      topic: "Test Topic for Smoke Test",
      contentType: "marketing",
      tone: "professional",
      audience: "general",
      wordCount: 250,
    });
    
    if (!isOk(result)) throw new Error(`Generation failed: ${result.error.message}`);
    const data = result.data as GeneratedContent;
    if (!data.content) throw new Error("No content generated");
    if (!data.id) throw new Error("No ID assigned");
    if (data.wordCount <= 0) throw new Error("Invalid word count");
  })

  .addTest("AI Generator history should work", async () => {
    const result = await aiGeneratorService.getHistory();
    if (!isOk(result)) throw new Error(`Failed to get history: ${result.error.message}`);
    if (!Array.isArray(result.data)) throw new Error("History should be an array");
  })

  .addTest("Prompt Studio service should be available", async () => {
    if (!promptService) throw new Error("Prompt Studio service not available");
    if (typeof promptService.createTemplate !== "function") {
      throw new Error("createTemplate method not available");
    }
  })

  .addTest("Prompt Studio should create templates", async () => {
    const result = await promptService.createTemplate({
      name: "Smoke Test Template",
      description: "Test template for smoke testing",
      template: "Generate content about {{topic}}",
      category: "generation",
      variables: [{ name: "topic", type: "string", required: true }],
    });
    
    if (!isOk(result)) throw new Error(`Template creation failed: ${result.error.message}`);
    const data = result.data as PromptTemplate;
    if (!data.id) throw new Error("No ID assigned to template");
    
    await promptService.deleteTemplate(data.id);
  })

  .addTest("Agent Orchestrator service should be available", async () => {
    if (!agentService) {
      throw new Error("Agent Orchestrator service not available");
    }
    if (typeof agentService.createAgent !== "function") {
      throw new Error("createAgent method not available");
    }
  })

  .addTest("Agent Orchestrator should create agents", async () => {
    const result = await agentService.createAgent({
      name: "Smoke Test Agent",
      description: "Test agent for smoke testing",
      config: {
        capabilities: ["text_generation"],
        model: "gpt-4",
        maxTokens: 1000,
        temperature: 0.7,
      },
    });
    
    if (!isOk(result)) throw new Error(`Agent creation failed: ${result.error.message}`);
    const data = result.data as Agent;
    if (!data.id) throw new Error("No ID assigned to agent");
    
    await agentService.deleteAgent(data.id);
  })

  .addTest("Services should handle concurrent requests", async () => {
    const [historyResult, templatesResult, agentsResult] = await Promise.all([
      aiGeneratorService.getHistory(),
      promptService.getTemplates(),
      agentService.getAgents(),
    ]);
    
    let failures = 0;
    if (!isOk(historyResult)) failures++;
    if (!isOk(templatesResult)) failures++;
    if (!isOk(agentsResult)) failures++;
    
    if (failures > 0) {
      throw new Error(`${failures} concurrent requests failed`);
    }
  });

export async function runAIFeaturesSmoke(): Promise<void> {
  const results = await aiFeaturesSmokeTests.run();
  console.log(JSON.stringify(results, null, 2));
}
