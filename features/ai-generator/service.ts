import { ok, err, type AsyncResult } from "@/core/result";
import { AppError, logError } from "@/core/errors";
import { aiGeneratorRepository } from "./repository";
import type { 
  GenerationRequest, 
  GeneratedContent, 
} from "./types";
import { CONTENT_TYPES as contentTypes } from "./types";

export interface AIGeneratorService {
  generate(request: GenerationRequest): AsyncResult<GeneratedContent, AppError>;
  getHistory(): AsyncResult<GeneratedContent[], AppError>;
  getFavorites(): AsyncResult<GeneratedContent[], AppError>;
  deleteGeneration(id: string): AsyncResult<void, AppError>;
  toggleFavorite(id: string): AsyncResult<GeneratedContent | null, AppError>;
  clearHistory(): AsyncResult<void, AppError>;
  buildPrompt(request: GenerationRequest): string;
}

function generateId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export const aiGeneratorService: AIGeneratorService = {
  buildPrompt(request: GenerationRequest): string {
    const contentConfig = contentTypes.find((c) => c.value === request.contentType);
    const contentPrompt = contentConfig?.prompt || "engaging content";

    let prompt = `Generate ${contentPrompt} with the following specifications:

Topic: ${request.topic}
Target Audience: ${request.audience.charAt(0).toUpperCase() + request.audience.slice(1)}
Tone: ${request.tone.charAt(0).toUpperCase() + request.tone.slice(1)}
Target Word Count: ${request.wordCount} words`;

    if (request.keywords) {
      prompt += `\nKeywords to include: ${request.keywords}`;
    }

    if (request.platform) {
      prompt += `\nOptimized for platform: ${request.platform}`;
    }

    if (request.additionalInstructions) {
      prompt += `\n\nAdditional Instructions:\n${request.additionalInstructions}`;
    }

    prompt += `

BRAND VOICE GUIDELINES:
- Use vivid, engaging language that resonates with the target audience
- Maintain a ${request.tone} tone throughout
- Include relevant calls-to-action where appropriate
- Format with clear sections and compelling headlines
- Ensure content is scannable with bullet points where helpful

Please format the content professionally and make it ready for immediate use.`;

    return prompt;
  },

  async generate(request: GenerationRequest): AsyncResult<GeneratedContent, AppError> {
    try {
      if (!request.topic.trim()) {
        return err(AppError.validation("Topic is required"));
      }

      const prompt = this.buildPrompt(request);
      const generatedText = await simulateAIGeneration(prompt, request);
      
      const content: GeneratedContent = {
        id: generateId(),
        request,
        content: generatedText,
        wordCount: countWords(generatedText),
        generatedAt: new Date().toISOString(),
        model: "gpt-4",
        isFavorite: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await aiGeneratorRepository.saveGeneration(content);
      return ok(content);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.generate" });
      return err(AppError.server("Failed to generate content"));
    }
  },

  async getHistory(): AsyncResult<GeneratedContent[], AppError> {
    try {
      const history = await aiGeneratorRepository.getHistory();
      return ok(history);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.getHistory" });
      return err(AppError.server("Failed to load generation history"));
    }
  },

  async getFavorites(): AsyncResult<GeneratedContent[], AppError> {
    try {
      const favorites = await aiGeneratorRepository.getFavorites();
      return ok(favorites);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.getFavorites" });
      return err(AppError.server("Failed to load favorites"));
    }
  },

  async deleteGeneration(id: string): AsyncResult<void, AppError> {
    try {
      await aiGeneratorRepository.deleteGeneration(id);
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.deleteGeneration" });
      return err(AppError.server("Failed to delete generation"));
    }
  },

  async toggleFavorite(id: string): AsyncResult<GeneratedContent | null, AppError> {
    try {
      const result = await aiGeneratorRepository.toggleFavorite(id);
      return ok(result);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.toggleFavorite" });
      return err(AppError.server("Failed to toggle favorite"));
    }
  },

  async clearHistory(): AsyncResult<void, AppError> {
    try {
      await aiGeneratorRepository.clearHistory();
      return ok(undefined);
    } catch (error) {
      logError(error, { context: "aiGeneratorService.clearHistory" });
      return err(AppError.server("Failed to clear history"));
    }
  },
};

async function simulateAIGeneration(
  prompt: string, 
  request: GenerationRequest
): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));
  
  const templates: Record<string, string> = {
    marketing: `# ${request.topic}

## Transform Your Experience

In today's fast-paced world, ${request.topic.toLowerCase()} represents a pivotal opportunity for growth and innovation. Our solution delivers unmatched value that resonates with ${request.audience} audiences.

### Key Benefits

- **Increased Efficiency**: Streamline your workflow and save valuable time
- **Enhanced Results**: Achieve measurable improvements in your outcomes
- **Seamless Integration**: Works perfectly with your existing systems

### Why Choose Us?

We understand what ${request.audience} professionals need. Our ${request.tone} approach ensures you get exactly what you're looking for.

> "This solution transformed how we approach ${request.topic.toLowerCase()}." - Industry Leader

### Take Action Today

Don't wait to experience the difference. Contact us now to learn more about how we can help you succeed.`,

    social: `Are you ready to level up? Here's what you need to know about ${request.topic}:

Key insight #1 about ${request.topic.toLowerCase()}
Key insight #2 that ${request.audience} will love
Key insight #3 for maximum impact

Pro tip: The best time to start is now!

${request.keywords ? `#${request.keywords.split(",").map(k => k.trim().replace(/\s+/g, "")).join(" #")}` : ""}

Drop a comment if you agree!`,

    blog: `# ${request.topic}: A Comprehensive Guide

*Published: ${new Date().toLocaleDateString()} | Reading time: ${Math.ceil(request.wordCount / 200)} min*

## Introduction

${request.topic} has become increasingly important for ${request.audience} professionals. In this comprehensive guide, we'll explore everything you need to know to master this topic and achieve your goals.

## Understanding the Basics

Before diving deep, let's establish a foundation. ${request.topic} encompasses several key concepts that every practitioner should understand.

### What Makes This Important?

The significance of ${request.topic.toLowerCase()} cannot be overstated. Here's why it matters:

1. **Industry Relevance**: Direct impact on outcomes
2. **Future-Proofing**: Stay ahead of the curve
3. **Competitive Advantage**: Stand out from the crowd

## Key Strategies for Success

### Strategy 1: Start with the Fundamentals
Every expert journey begins with mastering the basics. Focus on building a solid foundation before advancing.

### Strategy 2: Continuous Learning
The landscape evolves rapidly. Commit to ongoing education and skill development.

### Strategy 3: Practical Application
Theory without practice is incomplete. Apply what you learn in real-world scenarios.

## Conclusion

Mastering ${request.topic.toLowerCase()} is a journey worth taking. With the right approach and dedication, you'll see remarkable results.`,

    email: `Subject: ${request.topic} - You Won't Want to Miss This

Hi there,

I hope this email finds you well. I'm reaching out because ${request.topic.toLowerCase()} is something that directly impacts ${request.audience} like you.

**Here's what you need to know:**

We've been working on something special, and I wanted to make sure you're the first to hear about it.

**The Highlights:**
- Benefit 1: Save time and resources
- Benefit 2: Achieve better results
- Benefit 3: Stay ahead of the competition

**Ready to Learn More?**

Click below to discover how this can work for you.

Best regards,
Your Team`,

    technical: `# ${request.topic}

## Overview

This documentation provides comprehensive guidance on ${request.topic.toLowerCase()} for ${request.audience}.

## Prerequisites

Before proceeding, ensure you have:
- Requirement 1
- Requirement 2
- Requirement 3

## Getting Started

### Step 1: Initial Setup
Begin by configuring your environment according to the specifications outlined below.

### Step 2: Implementation
Follow these steps to implement the solution:
1. Initialize the core components
2. Configure the necessary parameters
3. Execute the main process
4. Verify the results

## Best Practices

- Always validate inputs before processing
- Implement proper error handling
- Follow security guidelines
- Document your code`,

    press: `FOR IMMEDIATE RELEASE

**${request.topic}**

*${new Date().toLocaleDateString()}*

Today announced ${request.topic.toLowerCase()}, marking a significant milestone for ${request.audience} and the industry at large.

**Key Highlights:**
- Major development point 1
- Significant achievement 2
- Industry-leading innovation 3

"This represents a transformative moment for our organization and the people we serve."

**About Us**
A leader in innovation since day one.

###`,

    script: `# ${request.topic}

## VIDEO SCRIPT

**DURATION:** ${Math.ceil(request.wordCount / 150)} minutes

---

### HOOK (0:00 - 0:10)

**NARRATOR:**
"What if I told you that ${request.topic.toLowerCase()} could change everything?"

---

### INTRODUCTION (0:10 - 0:30)

"Welcome back. Today, we're diving deep into ${request.topic.toLowerCase()}."

---

### MAIN CONTENT

**SECTION 1: The Foundation**
"Let's start with the basics..."

**SECTION 2: Deep Dive**
"Now that we've covered the fundamentals..."

---

### CALL TO ACTION

"If you found this valuable, like and subscribe for more content like this!"`,

    ad: `${request.topic.toUpperCase()}

Attention ${request.audience}!

Are you tired of common pain points?
Ready to finally achieve your desired outcome?

Introducing the solution you've been waiting for.

- Benefit that solves problem 1
- Benefit that addresses concern 2
- Benefit that delivers result 3

"Changed my life!" - Happy Customer

LIMITED TIME OFFER

Get started TODAY!`,
  };

  return templates[request.contentType] || templates.marketing;
}
