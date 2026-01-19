# Merch Studio Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide covers the Merch Studio feature, which enables AI-powered mockup generation for merchandise products.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Getting Started](#getting-started)
4. [Product Types](#product-types)
5. [AI Mockup Generation](#ai-mockup-generation)
6. [Style Presets](#style-presets)
7. [Text Overlays](#text-overlays)
8. [Batch Generation](#batch-generation)
9. [Integration with Marketplaces](#integration-with-marketplaces)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The Merch Studio allows you to:

- Generate AI-powered product mockups using Google Gemini
- Create designs for 18+ product types
- Apply professional style presets
- Add custom text overlays
- Generate multiple variations for A/B testing
- Integrate with print-on-demand services (Printify)
- Track usage and costs

### Key Features

- **AI-Powered**: Uses Google Gemini for realistic mockup generation
- **18+ Product Types**: T-shirts, hoodies, mugs, tote bags, and more
- **8 Style Presets**: Professional, lifestyle, minimal, dramatic, etc.
- **Text Overlay System**: Customizable fonts, colors, and positioning
- **Smart Caching**: Reduces API costs and improves generation speed
- **Usage Tracking**: Monitor token usage and generation costs

---

## Prerequisites

### 1. Google Gemini API Key

Merch Studio requires a Google Gemini API key:

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the API key

### 2. Configure in EmeraldDrift

**Option A: Via Settings Screen**
1. Open EmeraldDrift
2. Navigate to **Settings**
3. Scroll to **AI Configuration**
4. Enter your Gemini API key
5. Click **Save**

**Option B: Via Environment Variable**

In your `.env.local`:
```env
EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Enable Feature

Ensure merch studio is enabled:
```env
EXPO_PUBLIC_ENABLE_MERCH_STUDIO=true
```

---

## Getting Started

### Access Merch Studio

1. Open EmeraldDrift
2. Navigate to **Studio** tab
3. Select **Merch Studio** from the menu
4. Or use the main navigation to access directly

### Create Your First Mockup

1. **Select Product Type**: Choose from 18+ available products
2. **Enter Design Prompt**: Describe the design you want
3. **Choose Style**: Select from 8 professional presets
4. **Add Text (Optional)**: Include custom text overlays
5. **Generate**: Click generate and wait for AI processing
6. **Review & Export**: Save or directly upload to marketplaces

---

## Product Types

### Available Products

| Category | Products |
|----------|----------|
| **Apparel** | T-Shirt, Hoodie, Tank Top, Long Sleeve |
| **Drinkware** | Mug (Ceramic), Travel Mug, Water Bottle |
| **Accessories** | Tote Bag, Baseball Cap, Beanie, Phone Case |
| **Home Decor** | Poster, Canvas Print, Pillow, Blanket |
| **Stationery** | Notebook, Sticker Pack, Art Print |

### Product Specifications

Each product type has specific dimensions and requirements:

```typescript
// Example: T-Shirt specifications
{
  type: "tshirt",
  printArea: { width: 12, height: 16 }, // inches
  resolution: 300, // DPI
  formats: ["PNG", "JPEG"],
  colors: ["white", "black", "navy", "grey"]
}
```

### Selecting a Product

```typescript
import { MERCH_PRODUCTS, getProductById } from '@/features/merch';

// Get all products
const allProducts = MERCH_PRODUCTS;

// Get specific product
const tshirt = getProductById('tshirt');
console.log(tshirt.name); // "T-Shirt"
console.log(tshirt.basePrice); // "$19.99"
```

---

## AI Mockup Generation

### How It Works

1. **Prompt Processing**: Your design description is processed
2. **Style Application**: Selected style preset is applied
3. **Image Generation**: Gemini generates the base design
4. **Mockup Creation**: Design is placed on product template
5. **Enhancement**: Final touches and quality checks
6. **Output**: High-resolution mockup ready for use

### Writing Effective Prompts

**Good Prompts:**
- ✅ "Minimalist mountain landscape with geometric shapes"
- ✅ "Vintage-style coffee shop logo with retro colors"
- ✅ "Abstract watercolor flowers in pastel tones"
- ✅ "Bold typography saying 'Create Daily' in modern font"

**Avoid:**
- ❌ "Nice design" (too vague)
- ❌ Trademarked content or celebrity names
- ❌ Overly complex multi-element descriptions
- ❌ Copyrighted characters or logos

### Generation Parameters

```typescript
interface MerchGenerationRequest {
  productType: MerchProductType;
  prompt: string;
  style: StylePreference;
  textOverlay?: TextOverlay;
  aspectRatio?: AspectRatio;
  imageSize?: ImageSize;
}
```

### Example Usage

```typescript
import { merchService } from '@/features/merch';

const result = await merchService.generateMockup({
  productType: 'tshirt',
  prompt: 'Minimalist mountain landscape with sunset',
  style: 'minimal',
  textOverlay: {
    text: 'Adventure Awaits',
    fontSize: 24,
    color: '#FFFFFF',
    position: 'bottom'
  },
  aspectRatio: '1:1',
  imageSize: 'large'
});

if (result.success) {
  console.log('Mockup URL:', result.data.mockupUrl);
  console.log('Tokens used:', result.data.tokensUsed);
}
```

---

## Style Presets

### Available Styles

| Style | Description | Best For |
|-------|-------------|----------|
| **Studio** | Clean, professional product photography | E-commerce listings |
| **Lifestyle** | Models wearing/using products in real settings | Social media marketing |
| **Editorial** | Magazine-style layouts with creative angles | Brand storytelling |
| **Minimal** | Simple, clean backgrounds | Focus on design |
| **Dramatic** | High contrast, moody lighting | Artistic products |
| **Vibrant** | Bright colors, energetic feel | Youth-oriented products |
| **Vintage** | Retro film photography aesthetic | Nostalgic designs |
| **Professional** | Corporate, business-appropriate | B2B products |

### Applying Styles

Styles are automatically applied during generation:

```typescript
const styles = [
  'studio',
  'lifestyle', 
  'editorial',
  'minimal',
  'dramatic',
  'vibrant',
  'vintage',
  'professional'
];
```

### Style Recommendations

**T-Shirts & Apparel**: `lifestyle`, `minimal`  
**Mugs & Drinkware**: `studio`, `lifestyle`  
**Posters & Art**: `editorial`, `dramatic`  
**Phone Cases**: `minimal`, `vibrant`  
**Business Products**: `professional`, `studio`

---

## Text Overlays

### Adding Text to Designs

```typescript
interface TextOverlay {
  text: string;
  fontSize?: number;        // 12-72 pt
  fontFamily?: string;      // 'Inter', 'Roboto', 'Playfair'
  color?: string;           // Hex color code
  position?: TextPosition;  // 'top', 'center', 'bottom'
  opacity?: number;         // 0-1
  rotation?: number;        // -45 to 45 degrees
}
```

### Example

```typescript
const textOverlay: TextOverlay = {
  text: 'Code & Coffee',
  fontSize: 32,
  fontFamily: 'Inter',
  color: '#1F2937',
  position: 'center',
  opacity: 0.9,
  rotation: 0
};

const result = await merchService.generateMockup({
  productType: 'mug',
  prompt: 'Abstract coffee beans pattern',
  style: 'minimal',
  textOverlay
});
```

### Font Options

Available fonts:
- **Inter**: Modern, clean, highly readable
- **Roboto**: Friendly, professional
- **Playfair Display**: Elegant, serif
- **Montserrat**: Geometric, contemporary
- **Open Sans**: Neutral, versatile

### Positioning

Text can be positioned:
- `top`: Upper third of design
- `center`: Middle of design (default)
- `bottom`: Lower third of design
- `custom`: Specify exact coordinates

---

## Batch Generation

Generate multiple variations at once:

```typescript
const variations = await merchService.generateBatch({
  productType: 'tshirt',
  basePrompt: 'Mountain landscape',
  styles: ['minimal', 'dramatic', 'vintage'],
  count: 3
});

variations.data.forEach((mockup, index) => {
  console.log(`Variation ${index + 1}:`, mockup.mockupUrl);
});
```

### Use Cases

- **A/B Testing**: Generate different styles to test performance
- **Color Variations**: Create same design in multiple colors
- **Size Options**: Generate mockups for different product sizes
- **Style Exploration**: Try multiple aesthetics quickly

---

## Integration with Marketplaces

### Direct Upload to Printify

```typescript
import { merchService } from '@/features/merch';
import { printifyService } from '@/features/marketplaces/services/printify';

// 1. Generate mockup
const mockup = await merchService.generateMockup({
  productType: 'tshirt',
  prompt: 'Minimalist logo design',
  style: 'studio'
});

// 2. Upload to Printify
if (mockup.success) {
  const printifyProduct = await printifyService.createProduct({
    title: 'Minimalist Logo Tee',
    description: 'High-quality cotton t-shirt',
    imageUrl: mockup.data.mockupUrl,
    variants: [
      { size: 'S', color: 'black' },
      { size: 'M', color: 'black' },
      { size: 'L', color: 'black' }
    ]
  });
}
```

### Publish to Multiple Marketplaces

```typescript
// Publish to Shopify, Etsy, and Amazon
const marketplaces = ['shopify', 'etsy', 'amazon'];

for (const marketplace of marketplaces) {
  const service = marketplaceService.getService(marketplace);
  if (service) {
    await service.createProduct({
      title: 'Mountain Landscape Tee',
      description: 'Premium quality graphic tee',
      price: 29.99,
      imageUrl: mockup.data.mockupUrl
    });
  }
}
```

---

## Usage Tracking & Costs

### Monitor Usage

```typescript
import { merchService } from '@/features/merch';

const usage = await merchService.getUsageMetrics();

console.log('Mockups generated:', usage.totalGenerations);
console.log('Tokens used:', usage.totalTokens);
console.log('Estimated cost:', `$${usage.estimatedCost}`);
```

### Cost Estimation

Google Gemini pricing (as of Jan 2026):
- **Text generation**: ~$0.001 per 1K tokens
- **Image generation**: ~$0.04 per image

Typical mockup generation:
- Simple design: ~2,000 tokens (~$0.002)
- Complex design: ~5,000 tokens (~$0.005)
- With image: ~$0.045 total

### Reducing Costs

1. **Use Caching**: Identical prompts are cached for 1 hour
2. **Batch Generations**: Generate multiple at once
3. **Optimize Prompts**: Clear, concise prompts use fewer tokens
4. **Reuse Designs**: Save generated designs for reuse

---

## Troubleshooting

### "Gemini API Key Required"

**Solution**: Add API key in Settings or `.env.local`:
```env
EXPO_PUBLIC_GOOGLE_GEMINI_API_KEY=your_key_here
```

### "Generation Failed"

**Possible Causes:**
1. Invalid API key
2. API quota exceeded
3. Content policy violation
4. Network connection issue

**Solutions:**
1. Verify API key is correct
2. Check Gemini API quotas
3. Review prompt for policy violations
4. Check internet connection

### "Poor Quality Mockups"

**Improvements:**
1. Write more detailed, specific prompts
2. Try different style presets
3. Adjust image size to "large"
4. Use appropriate style for product type

### "Slow Generation"

**Causes:**
1. Large image size selected
2. Complex prompts
3. API latency

**Solutions:**
1. Start with "medium" size
2. Simplify prompts
3. Use caching for repeated prompts

---

## Best Practices

1. **Start Simple**: Begin with basic prompts and refine
2. **Test Styles**: Try multiple styles to find what works
3. **Brand Consistency**: Save successful prompts for reuse
4. **Quality Over Quantity**: Focus on high-quality designs
5. **Monitor Costs**: Track usage to stay within budget
6. **Respect Policies**: Follow content guidelines
7. **Backup Designs**: Save generated mockups locally

---

## API Reference

For detailed API documentation, see [API.md](API.md#merch-service).

---

## Examples

### Example 1: Simple T-Shirt Design

```typescript
const result = await merchService.generateMockup({
  productType: 'tshirt',
  prompt: 'Geometric mountain peaks in navy blue',
  style: 'minimal'
});
```

### Example 2: Coffee Mug with Text

```typescript
const result = await merchService.generateMockup({
  productType: 'mug',
  prompt: 'Abstract watercolor coffee stains',
  style: 'lifestyle',
  textOverlay: {
    text: 'But First, Coffee',
    fontSize: 28,
    color: '#4B5563',
    position: 'center'
  }
});
```

### Example 3: Batch Generation

```typescript
const results = await merchService.generateBatch({
  productType: 'poster',
  basePrompt: 'Inspirational workspace',
  styles: ['minimal', 'professional', 'dramatic'],
  count: 3
});
```

---

*This guide is maintained as part of the EmeraldDrift documentation and should be updated when Merch Studio features change.*
