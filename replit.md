# Creator Studio Lite

## Overview

Creator Studio Lite is a production-ready mobile application built with Expo React Native for multi-platform content creation and publishing. The app enables creators to manage their social media presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest with AI-powered content generation, analytics dashboards, and real-time publishing capabilities.

## Architecture

### Core Modules

```
├── types/              # Centralized TypeScript definitions
├── core/               # Core infrastructure (persistence, theme, platform config)
├── repositories/       # Data access layer with typed repositories
├── state/              # Reducer-based state management contexts
├── shared/             # Shared hooks and utilities
├── navigation/         # Navigation configuration and routes
├── components/         # Reusable UI components
├── screens/            # Screen components
└── services/           # External service integrations
```

### Technology Stack
- **Framework**: Expo SDK 54+ with React Native
- **Navigation**: React Navigation 7 (bottom tabs + nested stacks)
- **State Management**: Reducer-based Context API with typed actions
- **Data Layer**: Repository pattern with AsyncStorage persistence
- **UI**: SparkLabs Mobile Design Guidelines

### Key Patterns

1. **Repository Pattern**: All data access through typed repositories in `repositories/`
2. **Reducer State**: State contexts use useReducer with typed actions
3. **Ref-Based Intervals**: Autosave uses refs to prevent interval resets
4. **Race Prevention**: Request token pattern for async state updates

## Directory Structure

```
├── types/index.ts              # All TypeScript interfaces and types
├── core/
│   ├── constants.ts            # Storage keys, API endpoints, limits
│   ├── persistence.ts          # Typed persistence layer
│   ├── platform.ts             # Platform configurations
│   ├── theme.ts                # Design tokens (colors, spacing, typography)
│   └── index.ts                # Core exports
├── repositories/
│   ├── contentRepository.ts    # Content CRUD with filtering/sorting
│   ├── platformRepository.ts   # Platform connection management
│   ├── analyticsRepository.ts  # Analytics data access
│   ├── userRepository.ts       # User-scoped data (stats, onboarding)
│   ├── mediaRepository.ts      # Media asset management
│   ├── teamRepository.ts       # Team/workspace with permissions
│   └── index.ts                # Repository exports
├── state/
│   ├── AuthState.tsx           # Authentication with reducer pattern
│   ├── TeamState.tsx           # Team context with race prevention
│   └── index.ts                # State exports
├── shared/hooks/
│   ├── useResponsive.ts        # Responsive design (mobile/tablet/desktop)
│   ├── useTheme.ts             # Theme access hook
│   ├── useScreenInsets.ts      # Safe area management
│   └── index.ts                # Hook exports
├── navigation/
│   ├── routes.ts               # Route constants and param types
│   ├── options.ts              # Screen option presets
│   └── [Stack]Navigator.tsx    # Stack navigators
├── components/                 # Reusable UI components
├── screens/                    # Screen components
├── services/                   # External integrations (AI, notifications)
└── docs/                       # Architecture and contributing guides
```

## Data Models

### ContentItem
```typescript
interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: PlatformType[];
  status: ContentStatus;
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}
```

### PlatformConnection
```typescript
interface PlatformConnection {
  id: string;
  platform: PlatformType;
  username: string;
  displayName: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
}
```

### UserStats
```typescript
interface UserStats {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  postsCreated: number;
  postsScheduled: number;
  postsPublished: number;
  engagementRate: number;
  growthRate: number;
  lastUpdated: string;
}
```

## Development Guidelines

### Adding New Features
1. Define types in `types/index.ts`
2. Create repository in `repositories/` if data persistence needed
3. Update state context if global state management needed
4. Create screen/component with proper typing
5. Add navigation route and options
6. Update this documentation

### Using Repositories
```typescript
import { contentRepository } from "@/repositories";

const drafts = await contentRepository.getFiltered({ status: "draft" });
await contentRepository.update(id, { title: "Updated" });
```

### Using State
```typescript
import { useAuth, useTeam } from "@/state";

const { user, signIn, signOut } = useAuth();
const { members, canPerformAction } = useTeam();
```

### Styling
- Use `useTheme()` hook for theme colors
- Reference `core/theme.ts` for spacing and typography
- Use `useResponsive()` for adaptive layouts
- No inline color values - always use theme tokens

## Design System

### SparkLabs Mobile Design Guidelines
- **Primary Color**: #8B5CF6 (Brand Purple)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Grid**: 8pt spacing system
- **Typography**: System fonts with defined scale

### Responsive Breakpoints
| Screen Size | Width     | Columns | Card Width |
|-------------|-----------|---------|------------|
| Mobile      | < 480px   | 2       | 48%        |
| Tablet      | 480-768px | 3       | 31%        |
| Desktop     | > 768px   | 4       | 23%        |

## Services Architecture

### Repository Layer
- **contentRepository**: Content CRUD with status filtering and search
- **platformRepository**: Platform connections with follower tracking
- **analyticsRepository**: Analytics aggregation and platform stats
- **userRepository**: User-scoped data with onboarding/tutorial state
- **mediaRepository**: Media assets with favorites and tagging
- **teamRepository**: Workspaces, members, invitations with role hierarchy

### State Contexts
- **AuthState**: User authentication with reducer pattern
- **TeamState**: Team management with race-resistant updates

## Recent Changes
- 2025-12-01: Major architecture refactor at maximum depth
- 2025-12-01: Created centralized types module
- 2025-12-01: Implemented repository pattern for all data access
- 2025-12-01: Formalized state management with reducer pattern
- 2025-12-01: Created core module with persistence, platform, theme
- 2025-12-01: Centralized navigation routes and screen options
- 2025-12-01: Added shared hooks (useResponsive, useTheme, useScreenInsets)
- 2025-12-01: Created architecture and contributing documentation
- 2025-12-01: Fixed autosave with ref-based interval pattern

## User Preferences
- Clean code architecture at maximum depth
- SparkLabs Mobile Design Guidelines compliance
- Production-ready implementation
- Type safety throughout codebase
- Separation of concerns with clear module boundaries
