# Design Studio Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide covers the Design Studio feature for creating platform-specific designs across 8+ digital platforms.

## Table of Contents

1. [Overview](#overview)
2. [Supported Platforms](#supported-platforms)
3. [Getting Started](#getting-started)
4. [Design Templates](#design-templates)
5. [AI Image Generation](#ai-image-generation)
6. [Design Workflow](#design-workflow)
7. [Publishing Designs](#publishing-designs)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Design Studio enables you to create professional designs optimized for specific digital platforms. Each platform has unique dimension requirements and best practices that are automatically handled.

### Key Features

- **8 Platform Templates**: Amazon KDP, Etsy, TikTok Shop, Instagram, Pinterest, Gumroad, Printify, Shopify
- **27+ Pre-built Templates**: Book covers, social media posts, product listings
- **AI Image Generation**: Generate custom graphics with AI
- **Platform-Specific Dimensions**: Automatic sizing for each platform
- **Multi-Format Export**: PNG, JPEG, PDF
- **Direct Publishing**: Upload designs directly to platforms

---

## Supported Platforms

| Platform | Design Types | Optimal Dimensions | Export Formats |
|----------|--------------|-------------------|----------------|
| **Amazon KDP** | Book covers, interiors | 6x9", 8.5x11" | PDF, JPEG |
| **Etsy** | Digital downloads, listing images | 2000x2000px | PNG, JPEG |
| **TikTok Shop** | Product thumbnails, banners | 1080x1080px | JPEG, PNG |
| **Instagram** | Posts, stories, reels covers | 1080x1080px, 1080x1920px | JPEG, PNG |
| **Pinterest** | Pins, idea pins | 1000x1500px | PNG, JPEG |
| **Gumroad** | Product covers, thumbnails | 1200x1200px | PNG, JPEG |
| **Printify** | Product mockups | 4500x5400px | PNG |
| **Shopify** | Product images, banners | 2048x2048px | JPEG, PNG |

---

## Getting Started

### Access Design Studio

1. Open EmeraldDrift
2. Navigate to **Studio** tab
3. Select **Design Studio**
4. Or access via main navigation

### Create Your First Design

1. **Choose Platform**: Select target platform (e.g., Amazon KDP)
2. **Select Template**: Pick from pre-built templates
3. **Customize**: Add text, images, colors
4. **Generate**: Create the design
5. **Export**: Download or publish directly

### Design Categories

Designs are organized by category:

- **Book Publishing**: Covers, interior pages (KDP)
- **E-Commerce**: Product images, listings (Etsy, Shopify)
- **Social Media**: Posts, stories (Instagram, Pinterest)
- **Digital Products**: Download thumbnails (Gumroad)
- **Print-on-Demand**: Mockup designs (Printify)

---

## Design Templates

### Available Templates by Platform

#### Amazon KDP (7 templates)
```typescript
const kdpTemplates = [
  {
    id: 'kdp-fiction-cover',
    name: 'Fiction Book Cover',
    category: 'book_cover',
    dimensions: { width: 6, height: 9, unit: 'inches' }
  },
  {
    id: 'kdp-non-fiction-cover',
    name: 'Non-Fiction Book Cover',
    category: 'book_cover',
    dimensions: { width: 8.5, height: 11, unit: 'inches' }
  },
  // ... more templates
];
```

#### Etsy (6 templates)
- Digital art prints
- Sticker sheets
- Planner templates
- SVG cut files
- Printable wall art
- Digital invitations

#### TikTok Shop (4 templates)
- Product thumbnail
- Feature banner
- Promotional graphic
- Story highlight cover

#### Instagram (5 templates)
- Square post (1:1)
- Portrait post (4:5)
- Story (9:16)
- Reels cover
- Carousel post

#### Pinterest (3 templates)
- Standard pin (2:3)
- Tall pin (1:2.1)
- Idea pin

### Using Templates

```typescript
import { designService, PLATFORM_TEMPLATES } from '@/features/designs';

// Get templates for a platform
const etsyTemplates = PLATFORM_TEMPLATES.filter(t => t.platform === 'etsy');

// Create design from template
const design = await designService.createFromTemplate('kdp-fiction-cover', {
  title: 'My Novel Title',
  author: 'Author Name',
  primaryColor: '#1F2937'
});
```

---

## AI Image Generation

### Generate Custom Graphics

```typescript
import { designService } from '@/features/designs';

const result = await designService.generateAIImage({
  prompt: 'Mystical forest with glowing mushrooms, fantasy art style',
  style: 'digital_art',
  aspectRatio: '1:1',
  quality: 'high'
});

if (result.success) {
  console.log('Generated image:', result.data.imageUrl);
}
```

### AI Generation Parameters

```typescript
interface AIGenerationRequest {
  prompt: string;
  style?: 'realistic' | 'digital_art' | 'illustration' | 'abstract' | 'minimal';
  aspectRatio?: '1:1' | '16:9' | '4:5' | '2:3';
  quality?: 'standard' | 'high' | 'ultra';
  negativePrompt?: string;  // What to avoid
}
```

### Effective Prompts for Design

**Book Covers:**
- "Epic fantasy landscape with mountains and castle, dramatic lighting"
- "Modern minimalist business book cover with abstract shapes"

**Product Listings:**
- "Flat lay lifestyle photo of coffee and notebook"
- "Clean product photography on white background"

**Social Media:**
- "Inspirational quote background with pastel watercolor"
- "Trendy minimalist design with geometric shapes"

### Style Guide

| Style | Best For | Description |
|-------|----------|-------------|
| `realistic` | Product photos, lifestyle | Photorealistic images |
| `digital_art` | Book covers, game art | Digital painting style |
| `illustration` | Children's books, infographics | Hand-drawn look |
| `abstract` | Modern designs, backgrounds | Abstract shapes/patterns |
| `minimal` | Clean designs, corporate | Simple, clean aesthetic |

---

## Design Workflow

### 1. Create Design

```typescript
const design = await designService.create({
  platform: 'amazon_kdp',
  title: 'Mystery Novel Cover',
  category: 'book_cover',
  templateId: 'kdp-fiction-cover'
});
```

### 2. Add Content

```typescript
// Add AI-generated image
const image = await designService.generateAIImage({
  prompt: 'Dark mysterious alley at night',
  style: 'digital_art'
});

await designService.update(design.data.id, {
  imageUrl: image.data.imageUrl
});

// Add text elements
await designService.addTextElement(design.data.id, {
  text: 'The Dark Alley',
  fontSize: 48,
  fontFamily: 'Playfair Display',
  color: '#FFFFFF',
  position: { x: 50, y: 100 }
});
```

### 3. Preview & Adjust

```typescript
// Get design preview
const preview = await designService.getPreview(design.data.id);

// Make adjustments
await designService.update(design.data.id, {
  primaryColor: '#2D3748',
  secondaryColor: '#E53E3E'
});
```

### 4. Export or Publish

```typescript
// Export for manual upload
const exported = await designService.export(design.data.id, {
  format: 'pdf',
  quality: 'high'
});

// Or publish directly
const published = await designService.publish(design.data.id, {
  platform: 'amazon_kdp',
  title: 'The Dark Alley',
  author: 'John Doe',
  price: 9.99
});
```

---

## Publishing Designs

### Direct Platform Publishing

#### Amazon KDP

```typescript
await designService.publish(designId, {
  platform: 'amazon_kdp',
  title: 'My Book Title',
  author: 'Author Name',
  description: 'Book description',
  keywords: ['mystery', 'thriller', 'suspense'],
  price: 9.99,
  categories: ['Fiction', 'Mystery']
});
```

#### Etsy

```typescript
await designService.publish(designId, {
  platform: 'etsy',
  title: 'Digital Art Print',
  description: 'High-quality printable wall art',
  price: 4.99,
  tags: ['wall art', 'printable', 'digital download'],
  isDigital: true
});
```

#### Shopify

```typescript
await designService.publish(designId, {
  platform: 'shopify',
  title: 'Product Image',
  productId: 'existing-product-id',
  position: 'primary'  // or 'additional'
});
```

### Publish to Multiple Platforms

```typescript
const platforms = ['etsy', 'gumroad', 'shopify'];

for (const platform of platforms) {
  await designService.publish(designId, {
    platform,
    title: 'Abstract Art Print',
    price: 4.99
  });
}
```

---

## Platform-Specific Guidelines

### Amazon KDP

**Book Covers:**
- Minimum 300 DPI
- Must include title and author
- Follow category conventions
- Consider genre expectations

**Interior Pages:**
- 6x9" or 8.5x11" most common
- Black & white or full color
- Proper bleed settings
- Page numbering

### Etsy

**Listing Images:**
- First image is crucial (shows in search)
- Use all 10 image slots
- White or clean background
- Show scale/size
- Lifestyle photos perform well

**Digital Products:**
- Must be downloadable format
- Include preview images
- Show what customer receives
- Provide usage instructions

### Social Media (Instagram/Pinterest)

**Instagram:**
- Square (1080x1080) safest format
- Carousel posts for tutorials
- Story highlights for products
- Reels covers with text

**Pinterest:**
- Tall pins (2:3 ratio) get more saves
- Text overlay essential
- Bright, high-contrast
- Clear value proposition

---

## Design Status Tracking

Designs progress through states:

```typescript
type DesignStatus = 
  | 'draft'        // Being created
  | 'generating'   // AI generation in progress
  | 'ready'        // Ready to publish
  | 'published'    // Published to platform
  | 'failed';      // Generation/publish failed
```

### Check Status

```typescript
const design = await designService.getById(designId);
console.log('Status:', design.data.status);

if (design.data.status === 'published') {
  console.log('Published to:', design.data.publishedPlatforms);
}
```

---

## Troubleshooting

### "Template Not Found"

**Solution**: Verify template ID exists for selected platform:
```typescript
import { PLATFORM_TEMPLATES } from '@/features/designs';
const templates = PLATFORM_TEMPLATES.filter(t => t.platform === 'amazon_kdp');
console.log('Available templates:', templates);
```

### "Invalid Dimensions"

**Cause**: Design dimensions don't match platform requirements

**Solution**: Use platform-specific templates or check dimension requirements:
```typescript
import { PLATFORM_INFO } from '@/features/designs';
const info = PLATFORM_INFO['amazon_kdp'];
console.log('Required dimensions:', info.dimensions);
```

### "AI Generation Failed"

**Possible Causes:**
1. API key missing or invalid
2. Content policy violation
3. Network timeout

**Solutions:**
1. Verify AI service credentials
2. Adjust prompt to comply with policies
3. Retry with simpler prompt

### "Publishing Failed"

**Common Issues:**
1. Platform not connected
2. Missing required fields
3. Invalid file format

**Solutions:**
1. Connect platform in Settings
2. Review platform requirements
3. Export in correct format

---

## Best Practices

### Design Quality
1. **Use High Resolution**: Minimum 300 DPI for print
2. **Follow Platform Guidelines**: Each platform has specific requirements
3. **Test on Multiple Devices**: Preview on phone, tablet, desktop
4. **Consistent Branding**: Use consistent colors, fonts, style

### Workflow Efficiency
1. **Start with Templates**: Faster than starting from scratch
2. **Save Successful Designs**: Reuse what works
3. **Batch Similar Designs**: Create variations together
4. **Use AI Wisely**: Good for base images, refine manually

### Platform-Specific
1. **Amazon KDP**: Focus on genre expectations
2. **Etsy**: Show product usage and scale
3. **Social Media**: Text overlay for context
4. **Print-on-Demand**: High resolution essential

---

## API Reference

For detailed API documentation, see [API.md](API.md#design-service).

---

## Examples

### Example 1: Amazon KDP Book Cover

```typescript
const cover = await designService.create({
  platform: 'amazon_kdp',
  title: 'Sci-Fi Novel Cover',
  templateId: 'kdp-fiction-cover'
});

const aiImage = await designService.generateAIImage({
  prompt: 'Futuristic city with flying cars, cyberpunk style',
  style: 'digital_art',
  quality: 'high'
});

await designService.update(cover.data.id, {
  imageUrl: aiImage.data.imageUrl
});

await designService.publish(cover.data.id, {
  platform: 'amazon_kdp',
  title: 'Neon Dreams',
  author: 'Jane Smith',
  price: 12.99
});
```

### Example 2: Etsy Product Listing

```typescript
const listing = await designService.create({
  platform: 'etsy',
  title: 'Printable Wall Art',
  category: 'digital_art'
});

await designService.generateAIImage({
  prompt: 'Minimalist botanical line art',
  style: 'minimal'
});

await designService.publish(listing.data.id, {
  platform: 'etsy',
  price: 4.99,
  tags: ['wall art', 'printable', 'botanical']
});
```

---

*This guide is maintained as part of the EmeraldDrift documentation and should be updated when Design Studio features change.*
