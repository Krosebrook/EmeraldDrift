# Contributing to Creator Studio Lite

> **Version**: 2.0.0  
> **Last Updated**: December 2025

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Environment](#development-environment)
3. [Code Style Guide](#code-style-guide)
4. [Git Workflow](#git-workflow)
5. [Development Workflow](#development-workflow)
6. [Testing Guidelines](#testing-guidelines)
7. [Pull Request Process](#pull-request-process)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo Go app on your mobile device
- Git for version control

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd creator-studio-lite

# Install dependencies
npm install

# Start development server
npm run dev

# Scan QR code with Expo Go app to preview
```

---

## Development Environment

### Project Structure Overview

```
├── types/          # TypeScript type definitions
├── core/           # Core infrastructure (persistence, errors, validation)
├── repositories/   # Data access layer
├── state/          # State management contexts
├── hooks/          # React hooks
├── services/       # External service integrations
├── navigation/     # Navigation configuration
├── components/     # Reusable UI components
├── screens/        # Screen components
└── constants/      # Design system constants
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `types/index.ts` | All TypeScript interfaces |
| `core/index.ts` | Core utilities export |
| `constants/theme.ts` | Design tokens |
| `hooks/index.ts` | Custom hooks export |
| `repositories/index.ts` | Data repositories export |

### IDE Setup

**VS Code Extensions (Recommended)**:
- ESLint
- Prettier
- TypeScript Hero
- React Native Tools

**Settings**:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

---

## Code Style Guide

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `Button.tsx`, `ContentCard.tsx` |
| Hooks | camelCase with `use` prefix | `useTheme.ts`, `useAuth.ts` |
| Utilities | camelCase | `storage.ts`, `validation.ts` |
| Types | PascalCase | `ContentItem`, `User` |
| Constants | UPPER_SNAKE_CASE | `STORAGE_KEYS`, `API_ENDPOINTS` |

### Import Order

```typescript
// 1. React and React Native
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

// 2. Third-party libraries
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

// 3. Internal absolute imports
import { useTheme, useResponsive } from "@/hooks";
import { contentRepository } from "@/repositories";
import type { ContentItem } from "@/types";

// 4. Relative imports
import { Button } from "./Button";
```

### Component Structure

```typescript
// 1. Imports (ordered as above)
import React, { useState, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "@/hooks";
import { Spacing, BorderRadius } from "@/constants/theme";
import type { ContentItem } from "@/types";

// 2. Type definitions
interface ContentCardProps {
  item: ContentItem;
  onPress: (id: string) => void;
  showActions?: boolean;
}

// 3. Component definition
export function ContentCard({ item, onPress, showActions = true }: ContentCardProps) {
  // Hooks first (theme, navigation, state)
  const { theme } = useTheme();
  
  // Local state
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Derived values
  const displayTitle = item.title || "Untitled";
  
  // Callbacks
  const handlePress = useCallback(() => {
    onPress(item.id);
  }, [item.id, onPress]);
  
  // Render
  return (
    <View style={[styles.container, { backgroundColor: theme.cardBackground }]}>
      {/* Component JSX */}
    </View>
  );
}

// 4. Styles (at bottom)
const styles = StyleSheet.create({
  container: {
    padding: Spacing.base,
    borderRadius: BorderRadius.md,
  },
});
```

### TypeScript Guidelines

```typescript
// DO: Use explicit types for function parameters
function calculateEngagement(views: number, likes: number): number {
  return (likes / views) * 100;
}

// DO: Use type imports for types-only
import type { ContentItem, User } from "@/types";

// DO: Use interfaces for objects with known shape
interface UserPreferences {
  theme: "light" | "dark";
  notifications: boolean;
}

// DO: Use type unions for variants
type ContentStatus = "draft" | "scheduled" | "published" | "failed";

// DON'T: Use `any` type
// DON'T: Use implicit any in function parameters
// DON'T: Ignore TypeScript errors with @ts-ignore
```

### Error Handling

```typescript
// DO: Use Result type for fallible operations
async function fetchContent(id: string): AsyncResult<ContentItem> {
  return tryCatch(
    () => contentRepository.getById(id),
    "Failed to fetch content"
  );
}

// DO: Log errors with context
try {
  await saveContent(data);
} catch (error) {
  logError(error, { operation: "saveContent", contentId: data.id });
  throw AppError.persistence("save", "content");
}

// DON'T: Silently swallow errors
// DON'T: Use console.log for error logging in production
```

---

## Git Workflow

### Standard Development Flow

Follow this workflow for contributing to EmeraldDrift:

```bash
# 1. Start by ensuring you're on main and up to date
git checkout main
git pull origin main

# 2. Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description

# 3. Make your changes and commit frequently
git add [files]
git commit -m "feat: add new feature"

# 4. Before pushing, sync with latest main
git fetch origin
git merge origin/main
# or use rebase for linear history
git rebase origin/main

# 5. Push your branch
git push origin feature/your-feature-name

# 6. Create Pull Request on GitHub
```

### Branch Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-analytics-dashboard` |
| Bug Fix | `fix/description` | `fix/navigation-crash` |
| Documentation | `docs/description` | `docs/update-contributing` |
| Refactor | `refactor/description` | `refactor/simplify-auth` |
| Performance | `perf/description` | `perf/optimize-image-loading` |

### Keeping Your Branch Updated

**Regularly sync with main** to avoid large conflicts later:

```bash
# Option 1: Merge (preserves all history)
git checkout feature/your-feature
git fetch origin
git merge origin/main

# Option 2: Rebase (creates linear history)
git checkout feature/your-feature
git fetch origin
git rebase origin/main
```

### Handling Remote Updates

#### Scenario: Can't Push Due to Unpulled Changes

**Symptoms**:
- Error: "Can't push: unpulled changes must be merged first"
- Status shows "5 down 36 up" (5 commits to pull, 36 to push)

**Solution**:

```bash
# 1. Check current status
git status
git fetch origin

# 2. See what's different
git log --oneline origin/main..HEAD  # Your local commits not on remote
git log --oneline HEAD..origin/main  # Remote commits you don't have

# 3. Pull and merge remote changes
git pull origin main
# This will attempt to merge automatically

# 4. If conflicts occur, see "Resolving Conflicts" below

# 5. After resolving, push
git push origin main
```

### Resolving Merge Conflicts

When Git can't automatically merge changes:

**Step 1: Identify Conflicts**
```bash
git status
# Look for "both modified:" files
```

**Step 2: Open Conflicted Files**

Conflicts are marked with:
```
<<<<<<< HEAD
your changes
=======
remote changes
>>>>>>> origin/main
```

**Step 3: Resolve the Conflict**

Edit the file to keep the correct code:

```typescript
// Before (with conflict):
<<<<<<< HEAD
const API_URL = "http://localhost:3000";
=======
const API_URL = "https://api.production.com";
>>>>>>> origin/main

// After (resolved - keep both with environment variable):
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000";
```

**Step 4: Mark as Resolved**
```bash
git add [resolved-file]
```

**Step 5: Complete the Merge**
```bash
git commit -m "Merge remote changes and resolve conflicts"
git push origin main
```

### Common Conflict Scenarios

#### 1. Package.json Conflicts

```bash
# If package.json has conflicts:
# 1. Manually merge dependencies in package.json
# 2. Only if necessary, regenerate lock file (try resolving lock file conflicts first)
rm package-lock.json

# 3. Regenerate lock file
npm install

# 4. Commit
git add package.json package-lock.json
git commit -m "Merge package.json and regenerate lock file"
```

**Note**: Avoid deleting `package-lock.json` unless absolutely necessary, as it ensures consistent dependency versions.

#### 2. Same File, Different Lines

**Resolution**: Usually auto-merged by Git. If not, keep both changes if they don't conflict logically.

#### 3. Same File, Same Lines

**Resolution**: Choose the correct version or combine both changes manually.

### Undoing Mistakes

#### Undo Uncommitted Changes

```bash
# Discard changes in a specific file
git checkout -- [file]

# Discard all changes
git reset --hard HEAD
```

#### Undo Last Commit (Not Pushed)

```bash
# Keep changes, undo commit
git reset --soft HEAD~1

# Discard changes and commit
git reset --hard HEAD~1
```

#### Abort a Merge

```bash
# If merge is going wrong
git merge --abort
```

#### Abort a Rebase

```bash
# If rebase is going wrong
git rebase --abort
```

### Using Stash for Quick Context Switching

```bash
# Save work in progress temporarily
git stash save "WIP: working on feature"

# Switch branches or pull updates
git checkout main
git pull origin main

# Return to your branch
git checkout feature/your-feature

# Restore your work
git stash pop

# List all stashes
git stash list

# Apply specific stash without removing it
git stash apply stash@{0}

# Clear all stashes
git stash clear
```

### Pre-Push Checklist

Before pushing your changes:

- [ ] **Fetch latest**: `git fetch origin`
- [ ] **Sync with main**: `git merge origin/main` or `git rebase origin/main`
- [ ] **Run linter**: `npm run lint`
- [ ] **Check types**: `npm run check:format`
- [ ] **Test locally**: `npm run dev` and verify functionality
- [ ] **Review changes**: `git diff origin/main`
- [ ] **Commit messages follow convention**: `type(scope): description`

### Checking Branch Status

```bash
# See commits ahead/behind remote
git status

# Detailed branch comparison
git log --oneline --graph --all

# Count commits ahead/behind
git rev-list --left-right --count origin/main...HEAD
# Output: "5  36" means 5 behind, 36 ahead

# See what files changed
git diff --name-status origin/main
```

### Best Practices

1. **Commit Often**: Make small, logical commits
2. **Pull Frequently**: Start each session with `git pull`
3. **Write Clear Messages**: Use conventional commit format
4. **Test Before Pushing**: Ensure code works
5. **Review Your Changes**: Use `git diff` before committing
6. **Keep Branches Short-Lived**: Merge/delete after PR is accepted
7. **Use Feature Branches**: Never commit directly to main
8. **Communicate**: Coordinate on shared files with team

### Getting Help with Git

If you're stuck:

1. **Check status**: `git status` shows current state
2. **View history**: `git log --oneline` shows recent commits
3. **Abort operation**: `git merge --abort` or `git rebase --abort`
4. **Seek help**: Ask in PR comments or team chat
5. **Refer to docs**: See [TROUBLESHOOTING.md](TROUBLESHOOTING.md#git--version-control)

---

## Development Workflow

### Adding a New Feature

1. **Define Types** (`types/index.ts`)
   ```typescript
   export interface NewFeature {
     id: string;
     name: string;
     createdAt: string;
   }
   ```

2. **Create Repository** (if data persistence needed)
   ```typescript
   // repositories/newFeatureRepository.ts
   import { persistence } from "@/core/persistence";
   import { STORAGE_KEYS } from "@/core/constants";
   import type { NewFeature } from "@/types";

   const repository = persistence.createRepository<NewFeature>(
     STORAGE_KEYS.NEW_FEATURE
   );

   export const newFeatureRepository = {
     async getAll(): Promise<NewFeature[]> {
       return repository.getAll();
     },
     // ... other methods
   };
   ```

3. **Add Storage Key** (`core/constants.ts`)
   ```typescript
   export const STORAGE_KEYS = {
     // ... existing keys
     NEW_FEATURE: "@creator_studio_new_feature",
   };
   ```

4. **Create Screen/Component**
   ```typescript
   // screens/NewFeatureScreen.tsx
   import { ScreenScrollView } from "@/components/ScreenScrollView";
   import { ThemedText } from "@/components/ThemedText";
   import { useTheme } from "@/hooks";
   
   export default function NewFeatureScreen() {
     const { theme } = useTheme();
     return (
       <ScreenScrollView>
         <ThemedText type="title1">New Feature</ThemedText>
       </ScreenScrollView>
     );
   }
   ```

5. **Add Navigation Route** (`navigation/[Stack]Navigator.tsx`)

6. **Update Exports** (relevant `index.ts` files)

7. **Update Documentation** (`replit.md`)

### Creating a Custom Hook

```typescript
// hooks/useNewFeature.ts
import { useState, useEffect, useCallback } from "react";
import { newFeatureRepository } from "@/repositories";
import type { NewFeature } from "@/types";

export function useNewFeature() {
  const [items, setItems] = useState<NewFeature[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await newFeatureRepository.getAll();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { items, isLoading, error, refresh: load };
}
```

### Adding a State Context

```typescript
// state/NewFeatureState.tsx
import React, { createContext, useContext, useReducer, useMemo } from "react";
import type { NewFeature } from "@/types";

// State shape
interface NewFeatureState {
  items: NewFeature[];
  selectedId: string | null;
}

// Actions
type NewFeatureAction =
  | { type: "SET_ITEMS"; payload: NewFeature[] }
  | { type: "SELECT"; payload: string }
  | { type: "CLEAR_SELECTION" };

// Initial state
const initialState: NewFeatureState = {
  items: [],
  selectedId: null,
};

// Reducer
function reducer(state: NewFeatureState, action: NewFeatureAction): NewFeatureState {
  switch (action.type) {
    case "SET_ITEMS":
      return { ...state, items: action.payload };
    case "SELECT":
      return { ...state, selectedId: action.payload };
    case "CLEAR_SELECTION":
      return { ...state, selectedId: null };
    default:
      return state;
  }
}

// Context
const NewFeatureContext = createContext<{
  state: NewFeatureState;
  dispatch: React.Dispatch<NewFeatureAction>;
} | null>(null);

// Provider
export function NewFeatureProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <NewFeatureContext.Provider value={value}>
      {children}
    </NewFeatureContext.Provider>
  );
}

// Hook
export function useNewFeatureState() {
  const context = useContext(NewFeatureContext);
  if (!context) {
    throw new Error("useNewFeatureState must be used within NewFeatureProvider");
  }
  return context;
}
```

---

## Testing Guidelines

### Manual Testing Checklist

Before submitting changes:

- [ ] Test on mobile via Expo Go (scan QR code)
- [ ] Test on web via browser
- [ ] Check light and dark themes
- [ ] Test with empty states
- [ ] Test error scenarios
- [ ] Verify responsive layouts (resize browser)

### E2E Testing

The project uses Playwright for end-to-end testing:

```typescript
// Test mobile viewport
{ width: 402, height: 874 }

// Key flows to test:
// 1. Authentication (signup, login, logout)
// 2. Content creation (draft, save, publish)
// 3. Navigation between tabs
// 4. Form validation
// 5. Error handling
```

### Testing Responsive Layouts

1. Use browser DevTools to simulate viewports
2. Test breakpoints: 375px, 480px, 768px, 1024px
3. Verify grid layouts adapt correctly
4. Check touch targets are appropriately sized

---

## Pull Request Process

### Before Creating a PR

1. **Lint**: Run `npm run lint` and fix errors
2. **Types**: Ensure no TypeScript errors
3. **Test**: Manually test your changes
4. **Docs**: Update documentation if needed

### PR Checklist

- [ ] Code follows style guide
- [ ] Types added/updated in `types/index.ts`
- [ ] Components use design system tokens
- [ ] Responsive design implemented
- [ ] No console.log statements in production code
- [ ] Error handling in place
- [ ] Documentation updated

### Commit Message Format

```
type(scope): description

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(content): add scheduling functionality
fix(auth): resolve session persistence issue
docs(readme): update installation steps
refactor(hooks): consolidate theme hooks
```

---

## Common Patterns

### Async Data Loading

```typescript
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadData = async () => {
  try {
    setIsLoading(true);
    setError(null);
    const result = await repository.getAll();
    setData(result);
  } catch (err) {
    setError(getErrorMessage(err));
    logError(err);
  } finally {
    setIsLoading(false);
  }
};

useEffect(() => {
  loadData();
}, []);
```

### Autosave Pattern

```typescript
const formDataRef = useRef(formData);

// Keep ref in sync with state
useEffect(() => {
  formDataRef.current = formData;
}, [formData]);

// Autosave interval (never resets due to empty deps)
useEffect(() => {
  const interval = setInterval(() => {
    const data = formDataRef.current;
    if (data.hasChanges) {
      saveData(data);
    }
  }, 30000);

  return () => clearInterval(interval);
}, []);
```

### Responsive Grid

```typescript
const { isMobile, isTablet, cardWidth, contentWidth } = useResponsive();

<View style={[styles.grid, { maxWidth: contentWidth }]}>
  {items.map(item => (
    <View key={item.id} style={{ width: cardWidth }}>
      <ItemCard item={item} />
    </View>
  ))}
</View>
```

---

## Getting Help

- Check existing code for patterns
- Review ARCHITECTURE.md for design decisions
- Ask questions in PR comments
- Refer to Expo documentation for platform APIs

---

*This guide is maintained as part of the codebase. Update it when processes change.*
