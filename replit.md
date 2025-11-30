# Creator Studio Lite

## Overview
Creator Studio Lite is a production-ready mobile application built with Expo React Native for multi-platform content creation and publishing. The app enables creators to manage their social media presence across Instagram, TikTok, YouTube, LinkedIn, and Pinterest with AI-powered content generation, analytics dashboards, and real-time publishing capabilities.

## Project Architecture

### Technology Stack
- **Framework**: Expo SDK 54+ with React Native
- **Navigation**: React Navigation 7 (bottom tabs + nested stacks)
- **State Management**: React Context API with custom hooks
- **Storage**: AsyncStorage for local data persistence
- **UI**: Custom component library following SparkLabs Mobile Design Guidelines

### Directory Structure
```
├── App.tsx                    # Root component with providers
├── components/                # Reusable UI components
│   ├── Button.tsx            # Primary/secondary buttons
│   ├── ScreenScrollView.tsx  # Safe area scroll container
│   ├── ThemedText.tsx        # Typography component
│   └── ThemedView.tsx        # Themed container
├── constants/
│   └── theme.ts              # Design tokens and colors
├── context/
│   ├── AuthContext.tsx       # Authentication state provider
│   └── TeamContext.tsx       # Team/workspace state with race-resistant updates
├── hooks/
│   ├── useAuth.ts            # Authentication logic
│   ├── useTheme.ts           # Theme access hook
│   └── useScreenInsets.ts    # Safe area management
├── navigation/
│   ├── RootNavigator.tsx     # Auth flow management
│   ├── MainTabNavigator.tsx  # 4-tab bottom navigation
│   ├── DashboardStackNavigator.tsx
│   ├── StudioStackNavigator.tsx
│   ├── AnalyticsStackNavigator.tsx
│   └── ProfileStackNavigator.tsx
├── screens/                   # All app screens
│   ├── DashboardScreen.tsx   # Home with KPIs and platforms
│   ├── StudioScreen.tsx      # Content creation
│   ├── AnalyticsScreen.tsx   # Metrics and charts
│   ├── ProfileScreenNew.tsx  # User profile and settings
│   ├── LoginScreen.tsx       # Authentication
│   ├── SignUpScreen.tsx      # Registration
│   └── [Additional screens]  # Settings, Help, etc.
└── utils/
    └── storage.ts            # AsyncStorage wrapper
```

### Key Features
1. **Dashboard**: KPI cards, platform connections, recent posts
2. **Content Studio**: Create and schedule posts with media, AI-powered content generation
3. **Analytics**: Engagement metrics, growth charts, platform stats
4. **Profile**: User settings, account management
5. **Team Collaboration**: Workspaces, role-based permissions (owner/admin/editor/viewer), member invitations
6. **Media Library**: Asset management with favorites, filtering, batch operations

### Navigation Structure
- **Auth Stack**: Login, SignUp, ForgotPassword
- **Main Tabs** (authenticated):
  - Dashboard → Schedule, Platforms, ContentList, ContentDetail
  - Studio (content creation)
  - Analytics
  - Profile → Settings, Help, Support, About, Notifications, Privacy

## Design System

### SparkLabs Mobile Design Guidelines
- **Primary Color**: #8B5CF6 (Brand Purple)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Grid**: 8pt spacing system
- **Typography**: System fonts with defined scale (Display to Caption)

### Component Patterns
- Use `ScreenScrollView` for scrollable content with safe areas
- Use `ScreenKeyboardAwareScrollView` for forms with inputs
- Use `ThemedText` with type prop for typography variants
- Use `Button` component for primary actions

## Data Models

### ContentItem
```typescript
interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  platforms: string[];
  status: "draft" | "scheduled" | "published" | "failed";
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
  platform: "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";
  username: string;
  displayName: string;
  avatar?: string;
  connected: boolean;
  connectedAt: string;
  followerCount: number;
}
```

### AnalyticsData
```typescript
interface AnalyticsData {
  totalFollowers: number;
  totalEngagement: number;
  totalViews: number;
  totalPosts: number;
  growthRate: number;
  recentPosts: PostStats[];
  platformStats: PlatformStats[];
}
```

## Development Guidelines

### Adding New Screens
1. Create screen component in `screens/`
2. Add to appropriate stack navigator
3. Use `ScreenScrollView` or `ScreenKeyboardAwareScrollView` as root
4. Follow SparkLabs design guidelines from `design_guidelines.md`

### Authentication
- AuthContext provides user state and auth methods
- useAuthContext hook for accessing auth in components
- AsyncStorage persists user session

### Styling
- Use `useTheme()` hook for theme colors
- Reference `constants/theme.ts` for spacing and typography
- No inline color values - always use theme tokens

## Recent Changes
- 2025-11-29: Initial production build complete
- 2025-11-29: Implemented full authentication flow
- 2025-11-29: Created all navigation stacks and screens
- 2025-11-29: Fixed useScreenInsets hook for compatibility
- 2025-11-29: Implemented Team Collaboration with role-based permissions
- 2025-11-29: Added race-resistant TeamContext with request-token pattern
- 2025-11-29: Enhanced team service with duplicate invitation prevention
- 2025-11-29: Media Library batch operations optimized to single read/write
- 2025-11-29: All screens verified with E2E Playwright tests (15 steps passed)
- 2025-11-30: Added Landing page with hero section, feature highlights, platform badges
- 2025-11-30: Created userStatsService for per-user data persistence and tracking
- 2025-11-30: Implemented 3-step onboarding wizard (Welcome, Profile, Platforms)
- 2025-11-30: Updated navigation flow: Landing → Auth → Onboarding (new users) → Main app
- 2025-11-30: Dashboard now displays real user stats starting at zero for new users
- 2025-11-30: E2E test verified complete user journey (16 steps passed)

## User Preferences
- Clean code architecture with maximum depth
- SparkLabs Mobile Design Guidelines compliance
- Production-ready implementation

## Services Architecture

### teamService.ts
- Workspace CRUD with ownership tracking
- Role hierarchy enforcement (owner cannot be demoted/removed)
- Invitation system with duplicate detection (already_member, already_invited errors)
- Permission matrix for actions per role

### mediaLibrary.ts
- Asset management with type filtering (image, video, audio, document)
- Favorites with optimistic UI updates
- Batch import using addAssetsBatch for O(1) storage writes
- Date-based and type-based organization

### TeamContext Race Condition Prevention
- loadRequestRef counter tracks latest async request
- isMountedRef prevents updates after unmount
- All state updates gated by request ID comparison
- Promise.all for parallel fetches reduces race window
