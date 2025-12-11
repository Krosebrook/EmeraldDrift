# Creator Studio Lite - Architecture Documentation

## Overview

Creator Studio Lite is a production-ready mobile application built with Expo React Native for multi-platform content creation and publishing. This document outlines the architectural decisions, module structure, and coding standards.

## Module Architecture

```
creator-studio-lite/
├── types/                    # Centralized TypeScript definitions
│   └── index.ts              # All interfaces, types, and DTOs
├── core/                     # Core infrastructure
│   ├── constants.ts          # App-wide constants and configuration
│   ├── persistence.ts        # Typed persistence layer with repositories
│   ├── platform.ts           # Platform configurations and utilities
│   ├── theme.ts              # Design tokens and theming
│   └── index.ts              # Core module exports
├── repositories/             # Data access layer
│   ├── contentRepository.ts  # Content CRUD operations
│   ├── platformRepository.ts # Platform connections
│   ├── analyticsRepository.ts# Analytics data
│   ├── userRepository.ts     # User-scoped data
│   ├── mediaRepository.ts    # Media asset management
│   ├── teamRepository.ts     # Team and workspace management
│   └── index.ts              # Repository exports
├── state/                    # State management
│   ├── AuthState.tsx         # Authentication context with reducer
│   ├── TeamState.tsx         # Team context with race-resistant updates
│   └── index.ts              # State exports
├── shared/                   # Shared utilities
│   └── hooks/                # Reusable hooks
│       ├── useResponsive.ts  # Responsive design utilities
│       ├── useTheme.ts       # Theme access
│       ├── useScreenInsets.ts# Safe area management
│       └── index.ts          # Hook exports
├── navigation/               # Navigation configuration
│   ├── routes.ts             # Route constants and type definitions
│   ├── options.ts            # Screen option presets
│   └── [Stack]Navigator.tsx  # Stack navigators
├── components/               # Reusable UI components
├── screens/                  # Screen components
└── services/                 # External service integrations
```

## Design Principles

### 1. Separation of Concerns
- **Types**: All TypeScript interfaces centralized in `types/`
- **Data Access**: Repositories handle all persistence operations
- **State**: Context providers manage application state
- **UI**: Components are presentational, screens are containers

### 2. Type Safety
- All data structures have explicit TypeScript interfaces
- Repository methods return typed results
- Context values include action methods with proper typing

### 3. Testability
- Pure functions for business logic
- Dependency injection through context
- Repository pattern for data mocking

### 4. Performance
- Ref-based patterns for interval callbacks (autosave)
- Race condition prevention with request tokens
- Optimistic UI updates with rollback

## Key Architectural Decisions

### ADR-001: Repository Pattern for Persistence
**Decision**: Use repository pattern with typed interfaces for all AsyncStorage operations.
**Rationale**: Centralizes data access, enables testing, and ensures type safety.
**Status**: Implemented

### ADR-002: Reducer-Based State Management
**Decision**: Use useReducer with typed actions instead of multiple useState calls.
**Rationale**: Predictable state transitions, easier debugging, better action traceability.
**Status**: Implemented

### ADR-003: Ref-Based Interval Patterns
**Decision**: Use refs to store mutable values accessed by setInterval callbacks.
**Rationale**: Prevents interval reset on state changes, ensures consistent autosave behavior.
**Status**: Implemented

### ADR-004: Race Condition Prevention
**Decision**: Use request token pattern for async operations that update state.
**Rationale**: Prevents stale data from overwriting fresh data when requests complete out of order.
**Status**: Implemented

## Data Flow

```
User Action
    ↓
Screen Component
    ↓
State Context (dispatch action)
    ↓
Reducer (pure state transition)
    ↓
Repository (async persistence)
    ↓
AsyncStorage
```

## Responsive Design System

The app uses a mobile-first responsive design approach:

| Breakpoint | Width     | Columns | Card Width |
|------------|-----------|---------|------------|
| Mobile     | < 480px   | 2       | 48%        |
| Tablet     | 480-768px | 3       | 31%        |
| Desktop    | > 768px   | 4       | 23%        |

Use the `useResponsive` hook to access responsive values:
```typescript
const { isMobile, isTablet, isDesktop, cardWidth, contentWidth } = useResponsive();
```

## State Management Patterns

### Authentication State
```typescript
// Access auth state
const { user, isAuthenticated, signIn, signOut } = useAuth();

// Selectors for specific values
const user = useUser();
const isLoggedIn = useIsAuthenticated();
```

### Team State
```typescript
// Access team state
const { members, invitations, inviteMember, canPerformAction } = useTeam();

// Check permissions
if (canPerformAction("invite")) {
  // Show invite button
}
```

## Repository Usage

```typescript
import { contentRepository } from "@/repositories";

// Create content
const content = await contentRepository.create({
  title: "New Post",
  caption: "Caption text",
  platforms: ["instagram", "tiktok"],
  status: "draft",
});

// Filter content
const drafts = await contentRepository.getFiltered({
  status: "draft",
  searchQuery: "morning",
});

// Update content
await contentRepository.update(contentId, { title: "Updated Title" });
```

## Coding Standards

### Naming Conventions
- **Files**: camelCase for utilities, PascalCase for components
- **Types**: PascalCase with descriptive names
- **Constants**: UPPER_SNAKE_CASE
- **Functions**: camelCase, verb-first (get, set, update, delete)

### Component Structure
```typescript
// 1. Imports
import { ... } from "react";

// 2. Types/Interfaces
interface Props { ... }

// 3. Component
export function ComponentName({ prop1, prop2 }: Props) {
  // Hooks first
  const theme = useTheme();
  const { isMobile } = useResponsive();
  
  // State
  const [value, setValue] = useState();
  
  // Effects
  useEffect(() => { ... }, []);
  
  // Handlers
  const handleAction = useCallback(() => { ... }, []);
  
  // Render
  return <View>...</View>;
}

// 4. Styles
const styles = StyleSheet.create({ ... });
```

### Error Handling
- Use try-catch in async functions
- Log errors with context information
- Show user-friendly error messages
- Provide fallback UI states

## Testing Guidelines

- Test repositories with mock AsyncStorage
- Test state reducers with action dispatches
- Test components with React Testing Library
- E2E tests with Playwright for critical flows

## Performance Guidelines

1. **Memoization**: Use useMemo for expensive calculations
2. **Callbacks**: Use useCallback for handlers passed as props
3. **Lists**: Use FlatList instead of ScrollView for long lists
4. **Images**: Use expo-image for optimized image loading
5. **State**: Avoid unnecessary re-renders with proper state structure
