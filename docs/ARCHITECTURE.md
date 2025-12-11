# Creator Studio Lite - Architecture Documentation

> **Version**: 2.0.0  
> **Last Updated**: December 2025  
> **Status**: Production Ready

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Module Structure](#module-structure)
4. [Core Infrastructure](#core-infrastructure)
5. [Data Layer](#data-layer)
6. [State Management](#state-management)
7. [Navigation Architecture](#navigation-architecture)
8. [Design System](#design-system)
9. [Error Handling](#error-handling)
10. [Architectural Decision Records](#architectural-decision-records)

---

## Overview

Creator Studio Lite is a production-ready mobile application built with Expo React Native for multi-platform content creation and publishing. The application enables creators to manage their social media presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest.

### Core Capabilities

- **Content Creation**: AI-powered content generation with draft management
- **Multi-Platform Publishing**: Simultaneous posting across 5+ platforms
- **Analytics Dashboard**: Real-time engagement metrics and growth tracking
- **Team Collaboration**: Role-based permissions and workspace management
- **Media Library**: Asset management with favorites and tagging
- **Smart Scheduling**: Optimal posting time recommendations

### Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo SDK 54+ with React Native |
| Navigation | React Navigation 7 (tabs + stacks) |
| State | Reducer-based Context API |
| Persistence | AsyncStorage with Repository pattern |
| Styling | StyleSheet with design tokens |
| Type Safety | TypeScript 5.x strict mode |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Screens   │  │ Components  │  │      Navigation         │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                       APPLICATION LAYER                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Hooks     │  │   State     │  │       Services          │  │
│  │ (useTheme)  │  │ (Contexts)  │  │  (AI, Notifications)    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
└─────────┼────────────────┼──────────────────────┼───────────────┘
          │                │                      │
          ▼                ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Repositories                             ││
│  │  content | platform | analytics | user | media | team       ││
│  └──────────────────────────┬──────────────────────────────────┘│
│                              │                                   │
│  ┌──────────────────────────▼──────────────────────────────────┐│
│  │                    Core/Persistence                          ││
│  │           AsyncStorage with typed operations                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Module Structure

```
creator-studio-lite/
├── types/                      # Centralized TypeScript definitions
│   └── index.ts                # All interfaces, types, and DTOs
│
├── core/                       # Core infrastructure
│   ├── constants.ts            # App-wide constants, storage keys, limits
│   ├── persistence.ts          # Typed persistence with repository factory
│   ├── result.ts               # Result type for error handling
│   ├── errors.ts               # Error classes and utilities
│   ├── validation.ts           # Validation rules and utilities
│   ├── platform.ts             # Platform configurations
│   ├── theme.ts                # Design tokens (deprecated, use constants/theme)
│   └── index.ts                # Core module exports
│
├── repositories/               # Data access layer
│   ├── contentRepository.ts    # Content CRUD with filtering/sorting
│   ├── platformRepository.ts   # Platform connection management
│   ├── analyticsRepository.ts  # Analytics data aggregation
│   ├── userRepository.ts       # User-scoped data persistence
│   ├── mediaRepository.ts      # Media asset management
│   ├── teamRepository.ts       # Team/workspace management
│   └── index.ts                # Repository exports
│
├── state/                      # State management contexts
│   ├── AuthState.tsx           # Authentication with reducer pattern
│   ├── TeamState.tsx           # Team context with race prevention
│   └── index.ts                # State exports
│
├── hooks/                      # React hooks
│   ├── useTheme.ts             # Theme access with memoization
│   ├── useResponsive.ts        # Responsive design utilities
│   ├── useScreenInsets.ts      # Safe area management
│   ├── useColorScheme.ts       # System color scheme detection
│   ├── useAuth.ts              # Authentication hook
│   └── index.ts                # Hook exports
│
├── services/                   # External service integrations
│   ├── aiContent.ts            # AI content generation (OpenAI)
│   ├── mediaLibrary.ts         # Media asset service
│   ├── notifications.ts        # Push notification service
│   ├── teamService.ts          # Team operations
│   ├── userStats.ts            # User statistics service
│   └── index.ts                # Service exports
│
├── navigation/                 # Navigation configuration
│   ├── routes.ts               # Route constants and param types
│   ├── options.ts              # Screen option presets
│   ├── screenOptions.ts        # Common screen options factory
│   ├── RootNavigator.tsx       # Root navigator with auth flow
│   ├── MainTabNavigator.tsx    # Bottom tab navigator
│   └── [Stack]Navigator.tsx    # Feature stack navigators
│
├── components/                 # Reusable UI components
│   ├── Button.tsx              # Primary button component
│   ├── Card.tsx                # Card container
│   ├── ThemedText.tsx          # Text with typography variants
│   ├── ThemedView.tsx          # View with background colors
│   ├── ErrorBoundary.tsx       # Error boundary wrapper
│   ├── ScreenScrollView.tsx    # Safe area scroll container
│   └── ...                     # Other components
│
├── screens/                    # Screen components
│   └── [Feature]Screen.tsx     # Feature screens
│
└── constants/                  # Design system constants
    └── theme.ts                # Colors, spacing, typography, shadows
```

### Module Responsibilities

| Module | Responsibility |
|--------|---------------|
| `types/` | Single source of truth for TypeScript types |
| `core/` | Framework-agnostic infrastructure |
| `repositories/` | Data access with business logic |
| `state/` | Global state management |
| `hooks/` | Reusable React logic |
| `services/` | External API integrations |
| `navigation/` | Route configuration and transitions |
| `components/` | Presentational UI elements |
| `screens/` | Feature containers with layouts |

---

## Core Infrastructure

### Result Type Pattern

All operations that can fail use the Result type for explicit error handling:

```typescript
import { Result, ok, err, tryCatch } from "@/core/result";

// Success case
const success: Result<User> = ok(user);

// Error case
const failure: Result<never, AppError> = err(AppError.notFound("User"));

// Async operations
const result = await tryCatch(
  () => fetchUserData(id),
  "Failed to fetch user data"
);

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

### Error Handling

Structured error handling with categorized error codes:

```typescript
import { AppError, ErrorCode, logError } from "@/core/errors";

// Create typed errors
throw AppError.validation("Email is required");
throw AppError.notFound("Content");
throw AppError.persistence("read", "content_key");

// Handle unknown errors
const appError = AppError.fromUnknown(error);

// Log with context
logError(error, { screen: "Dashboard", action: "loadData" });
```

### Validation

Declarative validation with composable rules:

```typescript
import { validate, rules, createValidator } from "@/core/validation";

// Simple validation
const result = validate(email, [
  rules.required("Email"),
  rules.email("Email"),
]);

// Complex object validation
const contentValidator = createValidator<ContentItem>()
  .field("title", [rules.required("Title"), rules.maxLength("Title", 100)])
  .field("platforms", [rules.array.minItems("Platforms", 1)]);

const validation = contentValidator.validate(content);
```

---

## Data Layer

### Repository Pattern

All data access flows through typed repositories:

```typescript
import { contentRepository } from "@/repositories";

// Create with auto-generated ID and timestamps
const content = await contentRepository.create({
  title: "New Post",
  caption: "Caption text",
  platforms: ["instagram", "tiktok"],
  status: "draft",
});

// Query with filters and sorting
const scheduled = await contentRepository.getFiltered(
  { status: "scheduled", platform: "instagram" },
  { field: "scheduledAt", direction: "asc" }
);

// Update with timestamp management
await contentRepository.update(id, { title: "Updated Title" });

// Domain operations
await contentRepository.publish(id);
await contentRepository.schedule(id, "2025-01-15T10:00:00Z");
```

### User-Scoped Storage

Isolated storage per user for multi-account support:

```typescript
import { createUserScopedStorage } from "@/core/persistence";

const userStorage = createUserScopedStorage(userId);

await userStorage.set("preferences", { theme: "dark" });
const prefs = await userStorage.get("preferences");
```

---

## State Management

### Reducer Pattern

State contexts use useReducer for predictable state transitions:

```typescript
// Define action types
type AuthAction =
  | { type: "SET_USER"; payload: User }
  | { type: "SIGN_OUT" }
  | { type: "SET_LOADING"; payload: boolean };

// Pure reducer function
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_USER":
      return { ...state, user: action.payload, isAuthenticated: true };
    case "SIGN_OUT":
      return { ...state, user: null, isAuthenticated: false };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}
```

### Race Condition Prevention

Request token pattern for async operations:

```typescript
const requestTokenRef = useRef(0);

const loadData = async () => {
  const token = ++requestTokenRef.current;
  const data = await fetchData();
  
  // Only update if this is still the latest request
  if (token === requestTokenRef.current) {
    setData(data);
  }
};
```

---

## Navigation Architecture

### Route Structure

```
RootNavigator
├── AuthStack (unauthenticated)
│   ├── Landing
│   ├── Login
│   ├── SignUp
│   └── ForgotPassword
│
└── MainTabs (authenticated)
    ├── DashboardStack
    │   ├── Dashboard
    │   ├── ContentList
    │   └── ContentDetail
    ├── StudioStack
    │   └── Studio
    ├── AnalyticsStack
    │   ├── Analytics
    │   └── Schedule
    └── ProfileStack
        ├── Profile
        ├── Platforms
        ├── Team
        ├── MediaLibrary
        └── Settings
```

### Type-Safe Navigation

```typescript
// Define param types
export type DashboardStackParamList = {
  Dashboard: undefined;
  ContentDetail: { contentId: string };
  ContentList: { filter?: ContentStatus };
};

// Use in component
const navigation = useNavigation<NativeStackNavigationProp<DashboardStackParamList>>();
navigation.navigate("ContentDetail", { contentId: "123" });
```

---

## Design System

### Responsive Breakpoints

| Breakpoint | Width | Columns | Card Width |
|------------|-------|---------|------------|
| Mobile | < 480px | 2 | 48% |
| Tablet | 480-768px | 3 | 31% |
| Desktop | > 768px | 4 | 23% |

### Theme Tokens

```typescript
// Colors (SparkLabs Mobile Design)
primary: "#8B5CF6"      // Brand Purple
success: "#10B981"      // Success Green
warning: "#F59E0B"      // Warning Amber
error: "#EF4444"        // Error Red

// Spacing (8pt Grid)
xs: 4    sm: 8    md: 12    base: 16    lg: 24    xl: 32

// Typography Scale
display: 34px   title1: 28px   title2: 22px   title3: 20px
body: 17px      caption: 12px
```

### Component Usage

```typescript
import { useTheme, useResponsive } from "@/hooks";
import { Spacing, BorderRadius } from "@/constants/theme";

function MyComponent() {
  const { theme, isDark } = useTheme();
  const { isMobile, contentWidth, cardWidth } = useResponsive();

  return (
    <View style={[
      { backgroundColor: theme.cardBackground },
      { padding: isMobile ? Spacing.md : Spacing.lg },
      { maxWidth: contentWidth },
    ]}>
      <ThemedText type="title2">Heading</ThemedText>
    </View>
  );
}
```

---

## Error Handling

### Layered Approach

1. **Component Level**: Try-catch in handlers with user feedback
2. **Service Level**: Result types with error classification
3. **Global Level**: ErrorBoundary for unhandled exceptions

### Error Boundary

```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <RootNavigator />
    </ErrorBoundary>
  );
}
```

---

## Architectural Decision Records

### ADR-001: Repository Pattern for Persistence

**Status**: Accepted  
**Context**: Need consistent data access with type safety  
**Decision**: Implement repository pattern with typed interfaces  
**Consequences**: Centralized data access, easier testing, consistent API

### ADR-002: Reducer-Based State Management

**Status**: Accepted  
**Context**: Complex state transitions with multiple related updates  
**Decision**: Use useReducer with typed actions over multiple useState  
**Consequences**: Predictable transitions, action traceability, easier debugging

### ADR-003: Result Type for Error Handling

**Status**: Accepted  
**Context**: Need explicit error handling without try-catch pollution  
**Decision**: Implement Result<T, E> pattern for fallible operations  
**Consequences**: Type-safe error handling, forced error consideration

### ADR-004: Race Condition Prevention

**Status**: Accepted  
**Context**: Async operations can complete out of order  
**Decision**: Use request token pattern to invalidate stale updates  
**Consequences**: Consistent UI state, prevents data corruption

### ADR-005: Ref-Based Interval Patterns

**Status**: Accepted  
**Context**: setInterval callbacks capture stale state  
**Decision**: Store mutable values in refs for interval access  
**Consequences**: Correct autosave behavior, no interval reset

### ADR-006: Consolidated Hooks Module

**Status**: Accepted  
**Context**: Duplicate hooks in multiple locations  
**Decision**: Single `/hooks` directory as source of truth  
**Consequences**: Reduced duplication, clear import paths

---

## Performance Guidelines

1. **Memoization**: Use `useMemo` for expensive calculations
2. **Callbacks**: Use `useCallback` for handlers passed as props
3. **Lists**: Use `FlatList` with `keyExtractor` for long lists
4. **Images**: Use `expo-image` for optimized loading
5. **State**: Minimize context value changes to prevent re-renders

---

## Security Considerations

1. **Secrets**: Never commit API keys; use AsyncStorage for user keys
2. **Validation**: Validate all user input before processing
3. **Sanitization**: Sanitize content before rendering
4. **Permissions**: Request minimum required permissions
5. **Data**: Use user-scoped storage for isolation

---

*This document is maintained as part of the codebase and should be updated when architectural decisions change.*
