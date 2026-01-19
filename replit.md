# Creator Studio Lite

## Overview

Creator Studio Lite is a comprehensive social media management platform built with Expo React Native. It enables creators to manage their presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest with AI-powered content generation, analytics dashboards, and team collaboration. The project aims to be a production-ready mobile application for multi-platform content creation and publishing, offering a streamlined workflow for content creators. Key capabilities include:

-   **Content Studio**: Create, edit, and manage content with AI assistance.
-   **Multi-Platform Publishing**: Publish to 5+ social platforms simultaneously.
-   **Analytics Dashboard**: Real-time metrics for engagement and growth.
-   **Team Collaboration**: Role-based permissions with workspace management.
-   **Smart Scheduling**: Schedule posts with optimal timing recommendations.
-   **Media Library**: Asset management with favorites and tagging.
-   **Merch Studio (PoDGen)**: AI-powered product mockup generator for Print-on-Demand merchandise visualization.
-   **AI Content Generator**: Advanced content generation with various content types, tones, and target audiences.
-   **Prompt Studio**: Create, manage, and execute reusable prompt templates with variable support.
-   **Agent Orchestrator**: Multi-agent management system with workflow creation and task execution.

## User Preferences

-   Clean code architecture at maximum depth
-   SparkLabs Mobile Design Guidelines compliance
-   Production-ready implementation
-   Type safety throughout codebase
-   Separation of concerns with clear module boundaries
-   Comprehensive documentation

## System Architecture

The project employs a feature-first domain module structure, emphasizing clear separation of concerns.

### Module Structure

```
├── server/             # Express backend for Replit Auth
├── features/           # Feature-first domain modules (e.g., auth, content, analytics, merch, ai-generator, prompts, agents)
├── core/               # Core infrastructure (errors, result, validation, featureFlags, cache, edgeCases)
├── __tests__/          # Test utilities and smoke test suites
├── context/            # React contexts (Auth, Team)
├── hooks/              # React hooks (e.g., useTheme, useResponsive, useAuth)
├── services/           # External integrations (AI, notifications, userStats)
├── navigation/         # Navigation configuration
├── components/         # Reusable UI components
├── screens/            # Screen components
└── constants/          # Design system (colors, spacing, typography)
```

### Key Patterns

-   **Repository Pattern**: Typed data access.
-   **Reducer State**: `useReducer` with typed actions.
-   **Result Type**: Explicit error handling.
-   **Race Prevention**: Request token pattern for async operations.
-   **Ref Intervals**: Stable autosave without interval resets.
-   **Feature Flags**: Runtime configuration for AI provider switching (simulated/OpenAI/Gemini).
-   **Smart Caching**: Hybrid cache with background refresh, 5-minute TTL, LRU eviction.
-   **Graceful Degradation**: Service failure tracking with exponential backoff retry.

### UI/UX Decisions

-   **Responsive Design**: Utilizes `useResponsive` hook with breakpoints for mobile, tablet, and desktop.
-   **Design System**: Adheres to SparkLabs Mobile Design Guidelines with defined colors, spacing (8pt grid), and typography (Display, Title1-3, Body, Caption).
-   **Component Usage**: Standardized components like `ThemedText`, `ThemedView`, `Button`, and `Card` for consistent UI.

### Technical Implementations

-   **Error Handling**: Implemented with `Result` type for async operations and `FeatureErrorBoundary` for isolated error handling.
-   **Validation**: Comprehensive content and input validation with 20+ validators, sanitization utilities, and field-level errors.
-   **Type-Safe Navigation**: Defined `ParamList` types for secure navigation.
-   **Offline Mode**: Includes network status detection, offline storage, sync queue manager, and conflict resolution, with an auto-sync mechanism.
-   **PWA Configuration**: Supports PWA with web manifest, mobile-first meta tags, and standalone display mode.
-   **Edge Case Handling**: Debounce, throttle, memoize, retry with exponential backoff, safe JSON parsing, deep merge utilities.
-   **Lazy Loading**: Suspense-based component loading for AI features with preloading capabilities.
-   **Test Infrastructure**: Custom smoke test runner, test helpers, comprehensive assertion utilities.

### Feature Specifications

-   **AI Content Generator**: Supports 8 content types, 6 tones, 6 target audiences, and configurable word counts.
-   **Prompt Studio**: Template management with variable support, 6 categories, and LLM settings configuration.
-   **Agent Orchestrator**: Multi-agent creation with 6 capabilities and workflow creation with agent chaining.

## External Dependencies

-   **Replit Auth**: For user authentication via `@replit/repl-auth`.
-   **Google Gemini**: Used for AI-powered product mockup generation in Merch Studio.
-   **Expo React Native**: Core framework for mobile application development.
-   **React Navigation**: For managing application navigation.
-   **@react-native-community/netinfo**: For network status detection in offline mode.
-   **expo-secure-store**: For secure authentication storage.
-   **express-session**: For session management in the Express backend.