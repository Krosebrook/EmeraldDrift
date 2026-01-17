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
- **Merch Studio (PoDGen)**: AI-powered product mockup generator using Google Gemini for Print-on-Demand merchandise visualization

## Architecture

### Module Structure

```
├── server/             # Express backend for Replit Auth
│   └── index.js        # Server with session management and auth endpoints
├── features/           # Feature-first domain modules
│   ├── shared/         # Shared types, repository factory, Result pattern
│   ├── auth/           # Authentication (Replit OAuth, secure storage, API client)
│   ├── offline/        # Offline mode (storage, sync queue, sync service)
│   ├── content/        # Content management (CRUD, publish, schedule)
│   ├── platforms/      # Platform connections (connect, disconnect)
│   ├── analytics/      # Analytics snapshots and metrics
│   ├── team/           # Team collaboration and roles
│   └── merch/          # Merch Studio with Gemini AI mockup generation
├── core/               # Core infrastructure (errors, result, validation)
├── context/            # React contexts (Auth, Team)
├── hooks/              # React hooks (useTheme, useResponsive, useAuth)
├── services/           # External integrations (AI, notifications, userStats)
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
// Feature Services (primary import pattern)
import { contentService, platformService, analyticsService } from "@/features";
import { isOk, isErr } from "@/core/result";

// Feature Types
import type { ContentItem, PlatformConnection, AnalyticsSnapshot } from "@/features/shared/types";

// Hooks
import { useTheme, useResponsive } from "@/hooks";
import { useAuthContext } from "@/context/AuthContext";

// Core utilities
import { AppError, logError } from "@/core/errors";
import { ok, err, tryCatch } from "@/core/result";

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

### Feature Service Usage

```typescript
// All service methods return Result<T, AppError>
import { contentService, platformService } from "@/features";
import { isOk } from "@/core/result";

// Get all content
const result = await contentService.getAll();
if (isOk(result)) {
  setContent(result.data);
}

// Create new content
const createResult = await contentService.create({
  title: "New Post",
  caption: "Caption",
  platforms: ["instagram"],
});

// Domain operations with Result handling
if (isOk(createResult)) {
  await contentService.publish(createResult.data.id);
  // or schedule
  await contentService.schedule(createResult.data.id, scheduledAt);
}

// Platform connections
const platformsResult = await platformService.getConnected();
await platformService.connect({ platform: "instagram", username: "user" });
await platformService.disconnect("instagram");
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
│   ├── Landing, Login, SignUp, ForgotPassword, ReplitAuth (modal)
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

- **2026-01-17**: Offline Mode with Smart Sync
  - Network status detection using `@react-native-community/netinfo`
  - Offline storage service for local data persistence (`features/offline/storage.ts`)
  - Sync queue manager for pending operations (`features/offline/syncQueue.ts`)
  - Sync service with conflict resolution (`features/offline/syncService.ts`)
  - Offline context provider for app-wide state (`context/OfflineContext.tsx`)
  - Offline indicator UI component shows pending changes and sync button
  - Sync notification component shows sync results (success/failure)
  - `useOfflineContent` hook for offline-aware content operations
  - Auto-sync when returning online or app foregrounded
  - Queue operations offline, execute when back online

- **2026-01-16**: Replit Authentication Integration
  - Added Express backend server (`server/index.js`) on port 3001 with session management
  - Integrated `@replit/repl-auth` package for OAuth authentication
  - Created API client service (`features/auth/api.ts`) for mobile-backend communication
  - Built WebView-based OAuth login screen (`ReplitAuthScreen.tsx`) with modal presentation
  - Updated auth service with hybrid approach: Replit Auth primary, local storage fallback
  - Added "Sign in with Replit" button to LoginScreen with Replit brand color (#F26207)
  - Backend endpoints: `/api/auth/me`, `/api/auth/login`, `/api/auth/logout`, `/api/health`
  - Session management: express-session with 7-day cookie expiry

- **2025-12-12**: Feature-first architecture refactor completed
  - Migrated all screens from deprecated `utils/storage.ts` to feature modules
  - Implemented `features/` directory with domain services:
    - `features/content/` - Content CRUD, publish, schedule operations
    - `features/platforms/` - Platform connections management
    - `features/analytics/` - Analytics snapshot retrieval
    - `features/auth/` - Secure authentication with expo-secure-store
    - `features/shared/` - Shared types, repository factory, Result pattern
  - All services return `Result<T, AppError>` for explicit error handling
  - Unified import pattern via `@/features` barrel export
  - Deleted deprecated `utils/storage.ts`
  - Updated 8 screens: Dashboard, Studio, Analytics, Platforms, ContentList, ContentDetail, Schedule, Profile

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
