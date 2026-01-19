# AI Content Generation Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide covers the AI Content Generation feature for creating various types of written content using advanced AI models.

## Table of Contents

1. [Overview](#overview)
2. [Content Types](#content-types)
3. [Configuration Options](#configuration-options)
4. [Getting Started](#getting-started)
5. [Advanced Features](#advanced-features)
6. [Generation History](#generation-history)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The AI Content Generation feature provides powerful tools for creating professional written content across 8 different content types, with customizable tone, audience targeting, and length.

### Key Features

- **8 Content Types**: Marketing copy, technical docs, social media, blog articles, emails, press releases, video scripts, ad copy
- **6 Tone Presets**: Professional, casual, enthusiastic, informative, persuasive, friendly
- **6 Target Audiences**: General, B2B, B2C, technical, creative, enterprise
- **Flexible Length**: 250-2000 words
- **Platform Optimization**: Tailor content for specific platforms
- **Keyword Integration**: SEO-optimized content
- **Generation History**: Track and reuse successful content

---

## Content Types

### Available Content Types

| Type | Description | Typical Length | Best For |
|------|-------------|----------------|----------|
| **Marketing Copy** | Promotional sales content | 250-500 words | Landing pages, ads, brochures |
| **Technical Documentation** | Detailed technical guides | 500-2000 words | API docs, user manuals, tutorials |
| **Social Media Posts** | Short engaging posts | 250-300 words | Twitter, LinkedIn, Instagram |
| **Blog Articles** | Long-form informative content | 800-2000 words | SEO, thought leadership, education |
| **Email Campaigns** | Marketing or newsletter emails | 300-600 words | Newsletters, drip campaigns, outreach |
| **Press Releases** | Official announcements | 400-600 words | Product launches, company news |
| **Video Scripts** | Video narration and scripts | 500-1000 words | YouTube, TikTok, explainers |
| **Ad Copy** | Short advertisement text | 250-400 words | Google Ads, Facebook Ads, banners |

### Content Type Configurations

```typescript
import { CONTENT_TYPES } from '@/features/ai-generator';

// View all content type configurations
console.log('Available types:', CONTENT_TYPES);

// Example: Marketing Copy configuration
{
  type: 'marketing_copy',
  name: 'Marketing Copy',
  description: 'Persuasive sales and marketing content',
  defaultLength: 400,
  minLength: 250,
  maxLength: 600,
  suggestedTones: ['persuasive', 'enthusiastic', 'professional']
}
```

---

## Configuration Options

### Tone Presets

| Tone | Characteristics | Best For |
|------|----------------|----------|
| **Professional** | Formal, authoritative, polished | Business content, corporate communications |
| **Casual** | Relaxed, conversational, friendly | Social media, blog posts, newsletters |
| **Enthusiastic** | Energetic, passionate, exciting | Product launches, promotions, announcements |
| **Informative** | Educational, clear, objective | Tutorials, guides, documentation |
| **Persuasive** | Compelling, convincing, action-oriented | Sales copy, ads, landing pages |
| **Friendly** | Warm, approachable, personable | Customer service, community content |

### Target Audiences

| Audience | Focus | Content Style |
|----------|-------|---------------|
| **General** | Broad appeal | Clear, accessible language |
| **B2B** | Business decision-makers | Professional, value-focused |
| **B2C** | Individual consumers | Benefit-oriented, emotional |
| **Technical** | Developers, engineers | Precise, detailed, technical |
| **Creative** | Designers, artists | Inspiring, imaginative, expressive |
| **Enterprise** | Large organizations | Scalable, secure, compliant |

### Word Count Options

Available word counts: 250, 500, 750, 1000, 1500, 2000

```typescript
import { WORD_COUNTS } from '@/features/ai-generator';

// Available word count options
const wordCounts = [250, 500, 750, 1000, 1500, 2000];
```

---

## Getting Started

### Access AI Content Generator

1. Open EmeraldDrift
2. Navigate to **Studio** > **AI Generator**
3. Or access via main navigation

### Generate Your First Content

```typescript
import { aiGeneratorService } from '@/features/ai-generator';

const result = await aiGeneratorService.generate({
  contentType: 'blog_article',
  topic: 'Benefits of morning meditation',
  tone: 'informative',
  targetAudience: 'general',
  wordCount: 800,
  keywords: ['meditation', 'mindfulness', 'wellness'],
  customInstructions: 'Include scientific research and practical tips'
});

if (result.success) {
  console.log('Generated content:', result.data.content);
  console.log('Word count:', result.data.wordCount);
  console.log('Tokens used:', result.data.tokensUsed);
}
```

### Basic Generation Request

```typescript
interface GenerationRequest {
  contentType: ContentType;
  topic: string;
  tone: ContentTone;
  targetAudience: TargetAudience;
  wordCount: number;
  keywords?: string[];
  customInstructions?: string;
  platform?: string;  // Optional: 'instagram', 'linkedin', etc.
}
```

---

## Advanced Features

### Platform-Specific Optimization

Generate content optimized for specific platforms:

```typescript
// LinkedIn article
const linkedinPost = await aiGeneratorService.generate({
  contentType: 'social_media',
  topic: 'Leadership lessons from startup founders',
  tone: 'professional',
  targetAudience: 'b2b',
  wordCount: 300,
  platform: 'linkedin',
  customInstructions: 'Include call-to-action and relevant hashtags'
});

// Instagram caption
const instagramCaption = await aiGeneratorService.generate({
  contentType: 'social_media',
  topic: 'New product launch',
  tone: 'enthusiastic',
  targetAudience: 'b2c',
  wordCount: 250,
  platform: 'instagram',
  customInstructions: 'Include emojis and engagement questions'
});
```

### Keyword Integration

Optimize content for SEO:

```typescript
const seoArticle = await aiGeneratorService.generate({
  contentType: 'blog_article',
  topic: 'Best practices for remote work',
  tone: 'informative',
  targetAudience: 'general',
  wordCount: 1200,
  keywords: [
    'remote work',
    'work from home',
    'productivity tips',
    'digital nomad',
    'virtual collaboration'
  ],
  customInstructions: 'Include keywords naturally throughout the article'
});
```

### Custom Instructions

Add specific requirements:

```typescript
const customContent = await aiGeneratorService.generate({
  contentType: 'email_campaign',
  topic: 'Summer sale announcement',
  tone: 'friendly',
  targetAudience: 'b2c',
  wordCount: 400,
  customInstructions: `
    - Start with a summer-themed opening
    - Highlight 3 main product categories
    - Include a 20% discount code
    - End with urgency (limited time offer)
    - Add a clear call-to-action button
  `
});
```

### Batch Generation

Generate multiple content pieces at once:

```typescript
const topics = [
  'Benefits of early morning routines',
  '10 productivity hacks for entrepreneurs',
  'How to build a sustainable business'
];

const articles = await Promise.all(
  topics.map(topic => 
    aiGeneratorService.generate({
      contentType: 'blog_article',
      topic,
      tone: 'informative',
      targetAudience: 'general',
      wordCount: 1000
    })
  )
);

articles.forEach((article, index) => {
  console.log(`Article ${index + 1}:`, article.data.title);
});
```

---

## Generation History

### Save Generated Content

```typescript
// Content is automatically saved to history
const history = await aiGeneratorService.getHistory();

history.data.forEach(item => {
  console.log('Topic:', item.topic);
  console.log('Generated at:', item.createdAt);
  console.log('Tokens used:', item.tokensUsed);
});
```

### Retrieve Past Content

```typescript
// Get specific content from history
const historicalContent = await aiGeneratorService.getHistoryItem(contentId);

if (historicalContent.success) {
  const content = historicalContent.data.content;
  const metadata = historicalContent.data.metadata;
  
  console.log('Original topic:', metadata.topic);
  console.log('Generated content:', content);
}
```

### Filter History

```typescript
// Filter by content type
const blogArticles = await aiGeneratorService.getHistory({
  contentType: 'blog_article',
  limit: 10
});

// Filter by date range
const recentContent = await aiGeneratorService.getHistory({
  startDate: '2026-01-01',
  endDate: '2026-01-31'
});
```

---

## Content Quality Tips

### Writing Better Prompts

**Good Prompts:**
- ✅ "Write an informative blog article about the benefits of intermittent fasting for busy professionals, including scientific research and practical implementation tips"
- ✅ "Create an enthusiastic product launch email for a new eco-friendly water bottle targeting environmentally conscious millennials"
- ✅ "Draft a professional press release announcing our Series A funding round, highlighting our growth metrics and future plans"

**Poor Prompts:**
- ❌ "Write something about health" (too vague)
- ❌ "Make it good" (no specific requirements)
- ❌ "Blog post" (missing topic and context)

### Refining Generated Content

```typescript
// If initial generation isn't perfect, refine with more specific instructions
const refined = await aiGeneratorService.generate({
  contentType: 'blog_article',
  topic: 'Remote work productivity',
  tone: 'informative',
  targetAudience: 'general',
  wordCount: 1000,
  customInstructions: `
    Previous version was too generic.
    - Include specific tools and software recommendations
    - Add real-world examples from successful remote companies
    - Include a section on work-life balance
    - End with an actionable checklist
  `
});
```

---

## Use Cases by Content Type

### Marketing Copy

```typescript
// Landing page hero section
const heroSection = await aiGeneratorService.generate({
  contentType: 'marketing_copy',
  topic: 'AI-powered content creation platform',
  tone: 'persuasive',
  targetAudience: 'b2b',
  wordCount: 300,
  keywords: ['AI', 'content creation', 'productivity'],
  customInstructions: 'Include headline, subheadline, and CTA'
});
```

### Technical Documentation

```typescript
// API documentation
const apiDocs = await aiGeneratorService.generate({
  contentType: 'technical_docs',
  topic: 'REST API authentication endpoints',
  tone: 'informative',
  targetAudience: 'technical',
  wordCount: 1500,
  customInstructions: 'Include code examples, parameters, and response formats'
});
```

### Social Media Posts

```typescript
// Twitter thread
const twitterThread = await aiGeneratorService.generate({
  contentType: 'social_media',
  topic: '5 lessons learned from building a startup',
  tone: 'casual',
  targetAudience: 'general',
  wordCount: 280,
  platform: 'twitter',
  customInstructions: 'Format as a thread with numbered points'
});
```

### Email Campaigns

```typescript
// Newsletter
const newsletter = await aiGeneratorService.generate({
  contentType: 'email_campaign',
  topic: 'Monthly product updates and tips',
  tone: 'friendly',
  targetAudience: 'b2c',
  wordCount: 500,
  customInstructions: 'Include product updates, user tips, and community highlights'
});
```

---

## Performance & Costs

### Token Usage

Monitor token consumption:

```typescript
const stats = await aiGeneratorService.getUsageStats();

console.log('Total generations:', stats.data.totalGenerations);
console.log('Total tokens used:', stats.data.totalTokens);
console.log('Average tokens per generation:', stats.data.avgTokensPerGeneration);
console.log('Estimated cost:', `$${stats.data.estimatedCost}`);
```

### Cost Optimization

1. **Choose Appropriate Length**: Don't request 2000 words if 500 will suffice
2. **Reuse Content**: Check history before generating new
3. **Batch Requests**: Generate multiple pieces together
4. **Clear Instructions**: Reduce need for regeneration

### Typical Token Usage

| Content Type | Typical Tokens | Estimated Cost* |
|-------------|---------------|-----------------|
| Social Media Post | 500-800 | $0.001-0.002 |
| Marketing Copy | 800-1200 | $0.002-0.003 |
| Email Campaign | 1000-1500 | $0.002-0.004 |
| Blog Article | 2000-4000 | $0.005-0.010 |
| Technical Docs | 3000-6000 | $0.008-0.015 |

*Costs are estimates based on typical GPT-4 pricing

---

## Troubleshooting

### "Generation Failed"

**Common Causes:**
1. Invalid API key
2. Rate limit exceeded
3. Content policy violation
4. Network timeout

**Solutions:**
1. Verify AI service credentials in Settings
2. Wait before retrying
3. Modify topic/prompt to comply with policies
4. Check internet connection

### "Poor Quality Output"

**Improvements:**
1. Provide more specific instructions
2. Include relevant keywords
3. Choose appropriate tone and audience
4. Add context in custom instructions
5. Try different word count

### "Content Too Generic"

**Solutions:**
1. Add specific details in custom instructions
2. Include examples of desired style
3. Specify unique angles or perspectives
4. Provide relevant data points or statistics
5. Request specific section structure

---

## Best Practices

### Content Strategy
1. **Define Clear Goals**: Know what you want to achieve
2. **Know Your Audience**: Choose appropriate tone and language
3. **Provide Context**: Give AI relevant background information
4. **Iterate and Refine**: First draft is starting point, not finish line
5. **Human Review**: Always review and edit generated content

### Quality Control
1. **Fact-Check**: Verify all claims and statistics
2. **Brand Alignment**: Ensure content matches brand voice
3. **Compliance**: Check against industry regulations
4. **Originality**: Run through plagiarism checker if needed
5. **Readability**: Test with target audience

### Workflow Integration
1. **Save Successful Prompts**: Build library of effective prompts
2. **Track Performance**: Monitor which content performs best
3. **A/B Testing**: Generate variations to test
4. **Regular Updates**: Keep content fresh and current
5. **Consistent Voice**: Maintain brand consistency

---

## API Reference

For detailed API documentation, see [API.md](API.md#ai-generator-service).

---

## Examples

### Example 1: Product Description

```typescript
const productDesc = await aiGeneratorService.generate({
  contentType: 'marketing_copy',
  topic: 'Ergonomic standing desk with height adjustment',
  tone: 'persuasive',
  targetAudience: 'b2c',
  wordCount: 300,
  keywords: ['ergonomic', 'standing desk', 'health', 'productivity'],
  customInstructions: 'Highlight health benefits, features, and value proposition'
});
```

### Example 2: Tutorial Blog Post

```typescript
const tutorial = await aiGeneratorService.generate({
  contentType: 'blog_article',
  topic: 'How to set up Google Analytics 4 for your website',
  tone: 'informative',
  targetAudience: 'technical',
  wordCount: 1200,
  keywords: ['Google Analytics', 'GA4', 'web analytics', 'tracking'],
  customInstructions: 'Include step-by-step instructions with screenshots placeholders'
});
```

### Example 3: Social Media Campaign

```typescript
const campaign = await Promise.all([
  // Instagram
  aiGeneratorService.generate({
    contentType: 'social_media',
    topic: 'Summer sale announcement',
    tone: 'enthusiastic',
    targetAudience: 'b2c',
    wordCount: 250,
    platform: 'instagram'
  }),
  // LinkedIn
  aiGeneratorService.generate({
    contentType: 'social_media',
    topic: 'Summer sale announcement',
    tone: 'professional',
    targetAudience: 'b2b',
    wordCount: 300,
    platform: 'linkedin'
  }),
  // Twitter
  aiGeneratorService.generate({
    contentType: 'social_media',
    topic: 'Summer sale announcement',
    tone: 'casual',
    targetAudience: 'general',
    wordCount: 280,
    platform: 'twitter'
  })
]);
```

---

*This guide is maintained as part of the EmeraldDrift documentation and should be updated when AI Content Generation features change.*
