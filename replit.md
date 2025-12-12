# Creator Studio Lite

> Production-ready mobile application for multi-platform content creation and publishing.

## Overview

Creator Studio Lite is a comprehensive social media management platform built with Expo React Native. It enables creators to manage their presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest with AI-powered content generation, analytics dashboards, and team collaboration.

### Core Features

- **Content Studio**: Create, edit, and manage content with AI assistance
- **Multi-Platform Publishing**: Publish to 5+ social platforms simultaneously
- **Analytics Dashboard**: Real-time metrics for engagement and growth
- **Team Collaboration**: Role-based permissions with workspace management
- **Smart Scheduling**: Schedule posts with optimal timing recommendations
- **Media Library**: Asset management with favorites and tagging

## Architecture

### Module Structure

```
├── types/              # Centralized TypeScript definitions
├── core/               # Core infrastructure (persistence, errors, validation)
├── repositories/       # Data access layer (content, platform, analytics, etc.)
├── state/              # State management contexts (Auth, Team)
├── hooks/              # React hooks (useTheme, useResponsive, useAuth)
├── services/           # External integrations (AI, notifications)
├── navigation/         # Navigation configuration
├── components/         # Reusable UI components
├── screens/            # Screen components
└── constants/          # Design system (colors, spacing, typography)
```

### Key Patterns

| Pattern | Implementation |
|---------|---------------|
| Repository | Typed data access via `repositories/` |
| Reducer State | `useReducer` with typed actions in `state/` |
| Result Type | Explicit error handling in `core/result.ts` |
| Race Prevention | Request token pattern for async operations |
| Ref Intervals | Stable autosave without interval resets |

## Data Models

### ContentItem
```typescript
interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: PlatformType[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}
```

### PlatformConnection
```typescript
interface PlatformConnection {
  id: string;
  platform: "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";
  username: string;
  displayName: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
}
```

## Development

### Commands

```bash
npm run dev       # Start Expo development server
npm run lint      # Run ESLint
npm run build     # Build for production
```

### Key Imports

```typescript
// Hooks
import { useTheme, useResponsive, useAuth } from "@/hooks";

// Repositories
import { contentRepository, platformRepository } from "@/repositories";

// Core utilities
import { AppError, logError } from "@/core/errors";
import { ok, err, tryCatch } from "@/core/result";

// Types
import type { ContentItem, User, PlatformType } from "@/types";

// Components
import { Button, Card, ThemedText } from "@/components";

// Theme
import { Colors, Spacing, BorderRadius } from "@/constants/theme";
```

### Responsive Design

```typescript
const { isMobile, isTablet, isDesktop, contentWidth, cardWidth } = useResponsive();

// Breakpoints: Mobile <480px, Tablet 480-768px, Desktop >768px
// Grid columns: Mobile 2, Tablet 3, Desktop 4
```

### Repository Usage

```typescript
// Get filtered content
const drafts = await contentRepository.getFiltered({ status: "draft" });

// Create new content
const content = await contentRepository.create({
  title: "New Post",
  caption: "Caption",
  platforms: ["instagram"],
  status: "draft",
});

// Update content
await contentRepository.update(id, { title: "Updated" });

// Domain operations
await contentRepository.publish(id);
await contentRepository.schedule(id, scheduledAt);
```

### Error Handling

```typescript
import { AppError, logError } from "@/core/errors";
import { tryCatch, isOk } from "@/core/result";

// Async with Result type
const result = await tryCatch(
  () => fetchData(id),
  "Failed to fetch data"
);

if (isOk(result)) {
  setData(result.data);
} else {
  showError(result.error.message);
}

// Error logging
try {
  await operation();
} catch (error) {
  logError(error, { context: "operationName" });
}
```

## Design System

### SparkLabs Mobile Design Guidelines

**Colors**:
- Primary: `#8B5CF6` (Brand Purple)
- Success: `#10B981`
- Warning: `#F59E0B`
- Error: `#EF4444`

**Spacing** (8pt grid):
- `xs: 4`, `sm: 8`, `md: 12`, `base: 16`, `lg: 24`, `xl: 32`

**Typography**:
- Display: 34px, Title1: 28px, Title2: 22px, Title3: 20px
- Body: 17px, Caption: 12px

### Component Usage

```typescript
// Text with variants
<ThemedText type="title1">Heading</ThemedText>
<ThemedText type="body" secondary>Secondary text</ThemedText>

// Themed View
<ThemedView style={styles.container}>
  <Content />
</ThemedView>

// Button
<Button onPress={handlePress}>Submit</Button>

// Card
<Card style={styles.card}>
  <CardContent />
</Card>
```

## Navigation

### Route Structure

```
Root
├── Auth (unauthenticated)
│   ├── Landing, Login, SignUp, ForgotPassword
└── Main (authenticated)
    ├── Dashboard → ContentList, ContentDetail
    ├── Studio
    ├── Analytics → Schedule
    └── Profile → Platforms, Team, MediaLibrary, Settings
```

### Type-Safe Navigation

```typescript
type DashboardStackParamList = {
  Dashboard: undefined;
  ContentDetail: { contentId: string };
  ContentList: { filter?: ContentStatus };
};

const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
navigation.navigate("ContentDetail", { contentId: "123" });
```

## Recent Changes

- **2025-12-12**: Google Play Store 2025 compliance preparation
  - Added account deletion feature (mandatory for Google Play)
  - Created `eas.json` for EAS Build configuration
  - Updated `app.json` with Android permissions and versionCode
  - Added privacy policy document (`docs/PRIVACY_POLICY.md`)
  - Enhanced SettingsScreen with Danger Zone section

- **2025-12-11**: Production-grade architecture refactor at maximum depth
  - Consolidated hooks into single `/hooks` directory
  - Added Result type pattern (`core/result.ts`)
  - Added comprehensive error handling (`core/errors.ts`)
  - Added validation utilities (`core/validation.ts`)
  - Updated documentation to production grade

- **2025-12-01**: Initial architecture implementation
  - Domain-driven module structure
  - Repository pattern for data access
  - Reducer-based state management
  - Responsive design system

## User Preferences

- Clean code architecture at maximum depth
- SparkLabs Mobile Design Guidelines compliance
- Production-ready implementation
- Type safety throughout codebase
- Separation of concerns with clear module boundaries
- Comprehensive documentation

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) - System architecture and ADRs
- [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md) - Development workflow and guidelines
- [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) - Privacy policy for Google Play
- [`design_guidelines.md`](design_guidelines.md) - UI/UX design specifications

## Google Play Store Requirements

### API Level 35 (Android 15) Compliance
- Target SDK configured for API Level 35
- AAB (Android App Bundle) format for production builds
- EAS Build configuration in `eas.json`

### Mandatory Features
- Account deletion: Settings → Danger Zone → Delete Account
- Privacy policy: Available in-app and at `docs/PRIVACY_POLICY.md`
- Data export: Settings → Data & Storage → Export Data

### Pre-Submission Checklist
1. Create Google Play Developer account ($25 one-time fee)
2. Generate signing key with Play App Signing
3. Complete Data Safety form in Play Console
4. Run 14-day closed testing with 20+ testers
5. Submit privacy policy URL
6. Complete content rating questionnaire
