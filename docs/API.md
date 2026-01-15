# API Documentation

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This document provides comprehensive API documentation for EmeraldDrift's feature services, repositories, and core utilities.

## Table of Contents

1. [Feature Services](#feature-services)
2. [Repository APIs](#repository-apis)
3. [Core Utilities](#core-utilities)
4. [React Hooks](#react-hooks)
5. [Type Definitions](#type-definitions)
6. [Error Handling](#error-handling)

---

## Feature Services

All feature services return `Result<T, AppError>` for explicit error handling. Import services from `@/features`.

### Content Service

Manages content creation, editing, publishing, and scheduling.

```typescript
import { contentService } from "@/features";
import { isOk, isErr } from "@/core/result";
```

#### Methods

##### `getAll(): Promise<Result<ContentItem[]>>`

Retrieves all content items.

```typescript
const result = await contentService.getAll();
if (isOk(result)) {
  console.log(result.data); // ContentItem[]
}
```

##### `getById(id: string): Promise<Result<ContentItem>>`

Retrieves a specific content item by ID.

```typescript
const result = await contentService.getById("content-123");
if (isOk(result)) {
  console.log(result.data); // ContentItem
} else {
  console.error(result.error); // AppError
}
```

##### `create(data: Partial<ContentItem>): Promise<Result<ContentItem>>`

Creates a new content item with auto-generated ID and timestamps.

```typescript
const result = await contentService.create({
  title: "New Post",
  caption: "Check out this amazing content!",
  platforms: ["instagram", "tiktok"],
  status: "draft",
  mediaUri: "file:///path/to/image.jpg",
});

if (isOk(result)) {
  console.log("Created:", result.data.id);
}
```

##### `update(id: string, data: Partial<ContentItem>): Promise<Result<ContentItem>>`

Updates an existing content item. Automatically updates `updatedAt` timestamp.

```typescript
const result = await contentService.update("content-123", {
  title: "Updated Title",
  caption: "Updated caption text",
});
```

##### `delete(id: string): Promise<Result<void>>`

Deletes a content item permanently.

```typescript
const result = await contentService.delete("content-123");
if (isOk(result)) {
  console.log("Deleted successfully");
}
```

##### `publish(id: string): Promise<Result<ContentItem>>`

Publishes a content item immediately. Sets status to "published" and updates `publishedAt`.

```typescript
const result = await contentService.publish("content-123");
if (isOk(result)) {
  console.log("Published at:", result.data.publishedAt);
}
```

##### `schedule(id: string, scheduledAt: string): Promise<Result<ContentItem>>`

Schedules a content item for future publication.

```typescript
const scheduledTime = new Date(Date.now() + 3600000).toISOString();
const result = await contentService.schedule("content-123", scheduledTime);
```

##### `getFiltered(filter: ContentFilter, sort?: SortOptions): Promise<Result<ContentItem[]>>`

Retrieves filtered and sorted content.

```typescript
const result = await contentService.getFiltered(
  { status: "scheduled", platform: "instagram" },
  { field: "scheduledAt", direction: "asc" }
);
```

**ContentFilter Interface:**
```typescript
interface ContentFilter {
  status?: "draft" | "scheduled" | "published" | "failed";
  platform?: PlatformType;
  dateFrom?: string;
  dateTo?: string;
}
```

**SortOptions Interface:**
```typescript
interface SortOptions {
  field: "createdAt" | "updatedAt" | "scheduledAt" | "publishedAt";
  direction: "asc" | "desc";
}
```

---

### Platform Service

Manages platform connections and integrations.

```typescript
import { platformService } from "@/features";
```

#### Methods

##### `getAll(): Promise<Result<PlatformConnection[]>>`

Retrieves all platform connections.

```typescript
const result = await platformService.getAll();
```

##### `getConnected(): Promise<Result<PlatformConnection[]>>`

Retrieves only connected platforms.

```typescript
const result = await platformService.getConnected();
if (isOk(result)) {
  const connectedPlatforms = result.data; // Only platforms with connected: true
}
```

##### `connect(data: Partial<PlatformConnection>): Promise<Result<PlatformConnection>>`

Connects a new platform.

```typescript
const result = await platformService.connect({
  platform: "instagram",
  username: "@mycreatorname",
  displayName: "My Creator Name",
  followerCount: 10000,
});
```

##### `disconnect(platform: PlatformType): Promise<Result<void>>`

Disconnects a platform.

```typescript
const result = await platformService.disconnect("instagram");
```

##### `updateFollowerCount(platform: PlatformType, count: number): Promise<Result<PlatformConnection>>`

Updates the follower count for a platform.

```typescript
const result = await platformService.updateFollowerCount("instagram", 10500);
```

---

### Analytics Service

Manages analytics data and snapshots.

```typescript
import { analyticsService } from "@/features";
```

#### Methods

##### `getSnapshot(): Promise<Result<AnalyticsSnapshot>>`

Retrieves the latest analytics snapshot.

```typescript
const result = await analyticsService.getSnapshot();
if (isOk(result)) {
  const snapshot = result.data;
  console.log("Total views:", snapshot.totalViews);
  console.log("Total likes:", snapshot.totalLikes);
}
```

##### `saveSnapshot(data: AnalyticsSnapshot): Promise<Result<void>>`

Saves an analytics snapshot.

```typescript
const result = await analyticsService.saveSnapshot({
  totalViews: 50000,
  totalLikes: 2500,
  totalComments: 500,
  totalShares: 150,
  growthRate: 12.5,
  engagementRate: 5.2,
  timestamp: new Date().toISOString(),
});
```

**AnalyticsSnapshot Interface:**
```typescript
interface AnalyticsSnapshot {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  growthRate: number;      // Percentage
  engagementRate: number;  // Percentage
  timestamp: string;       // ISO 8601
}
```

---

### Authentication Service

Manages user authentication and sessions.

```typescript
import { authService } from "@/features/auth";
```

#### Methods

##### `signIn(email: string, password: string): Promise<Result<User>>`

Authenticates a user and creates a session.

```typescript
const result = await authService.signIn("user@example.com", "password123");
if (isOk(result)) {
  const user = result.data;
  console.log("Signed in:", user.name);
}
```

##### `signUp(data: SignUpData): Promise<Result<User>>`

Creates a new user account.

```typescript
const result = await authService.signUp({
  email: "newuser@example.com",
  password: "securePassword123",
  name: "New User",
});
```

##### `signOut(): Promise<Result<void>>`

Signs out the current user and clears session.

```typescript
const result = await authService.signOut();
```

##### `getCurrentUser(): Promise<Result<User | null>>`

Retrieves the currently authenticated user.

```typescript
const result = await authService.getCurrentUser();
if (isOk(result) && result.data) {
  console.log("Current user:", result.data.name);
}
```

##### `updateProfile(data: Partial<User>): Promise<Result<User>>`

Updates the current user's profile.

```typescript
const result = await authService.updateProfile({
  name: "Updated Name",
  avatar: "https://example.com/avatar.jpg",
});
```

---

### Team Service

Manages team workspaces and members.

```typescript
import { teamService } from "@/features/team";
```

#### Methods

##### `getTeam(): Promise<Result<Team | null>>`

Retrieves the current user's team.

```typescript
const result = await teamService.getTeam();
```

##### `createTeam(name: string): Promise<Result<Team>>`

Creates a new team workspace.

```typescript
const result = await teamService.createTeam("My Agency");
```

##### `inviteMember(email: string, role: TeamRole): Promise<Result<TeamMember>>`

Invites a new team member.

```typescript
const result = await teamService.inviteMember("colleague@example.com", "editor");
```

##### `removeMember(memberId: string): Promise<Result<void>>`

Removes a team member.

```typescript
const result = await teamService.removeMember("member-123");
```

##### `updateMemberRole(memberId: string, role: TeamRole): Promise<Result<TeamMember>>`

Updates a team member's role.

```typescript
const result = await teamService.updateMemberRole("member-123", "admin");
```

**TeamRole Type:**
```typescript
type TeamRole = "admin" | "editor" | "viewer";
```

---

## Repository APIs

Repositories provide low-level data access. Services are the recommended interface for application logic.

### Creating a Repository

```typescript
import { createRepository } from "@/features/shared/repository";
import type { ContentItem } from "@/features/shared/types";

const contentRepository = createRepository<ContentItem>("@app_content");
```

### Repository Methods

All repositories created with `createRepository` have these methods:

##### `getAll(): Promise<T[]>`

```typescript
const items = await repository.getAll();
```

##### `getById(id: string): Promise<T | null>`

```typescript
const item = await repository.getById("123");
```

##### `create(data: Partial<T>): Promise<T>`

Auto-generates ID and timestamps.

```typescript
const item = await repository.create({ title: "New Item" });
```

##### `update(id: string, data: Partial<T>): Promise<T>`

Updates `updatedAt` timestamp automatically.

```typescript
const updated = await repository.update("123", { title: "Updated" });
```

##### `delete(id: string): Promise<void>`

```typescript
await repository.delete("123");
```

##### `clear(): Promise<void>`

Removes all items from the repository.

```typescript
await repository.clear();
```

---

## Core Utilities

### Result Type

Explicit error handling without try-catch pollution.

```typescript
import { Result, ok, err, isOk, isErr, tryCatch } from "@/core/result";
```

#### Creating Results

```typescript
// Success
const success: Result<User> = ok(user);

// Error
const failure: Result<never, AppError> = err(AppError.notFound("User"));

// Async with automatic error handling
const result = await tryCatch(
  () => fetchData(id),
  "Failed to fetch data"
);
```

#### Checking Results

```typescript
if (isOk(result)) {
  console.log(result.data); // Type: T
} else {
  console.error(result.error); // Type: E
}

// Alternative
if (isErr(result)) {
  console.error(result.error);
} else {
  console.log(result.data);
}
```

---

### Error Handling

```typescript
import { AppError, ErrorCode, logError } from "@/core/errors";
```

#### Creating Errors

```typescript
// Validation error
throw AppError.validation("Email is required");

// Not found error
throw AppError.notFound("Content");

// Persistence error
throw AppError.persistence("read", "content_key");

// Network error
throw AppError.network("Failed to fetch data");

// Unauthorized error
throw AppError.unauthorized("Invalid credentials");

// From unknown error
const appError = AppError.fromUnknown(error);
```

#### Error Logging

```typescript
logError(error, {
  screen: "Dashboard",
  action: "loadData",
  userId: "user-123",
});
```

#### ErrorCode Enum

```typescript
enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  NETWORK_ERROR = "NETWORK_ERROR",
  PERSISTENCE_ERROR = "PERSISTENCE_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}
```

---

### Validation

```typescript
import { validate, rules, createValidator } from "@/core/validation";
```

#### Simple Validation

```typescript
const result = validate(email, [
  rules.required("Email"),
  rules.email("Email"),
]);

if (!result.isValid) {
  console.error(result.errors); // string[]
}
```

#### Object Validation

```typescript
const contentValidator = createValidator<ContentItem>()
  .field("title", [rules.required("Title"), rules.maxLength("Title", 100)])
  .field("caption", [rules.maxLength("Caption", 2000)])
  .field("platforms", [rules.array.minItems("Platforms", 1)]);

const validation = contentValidator.validate(content);
if (!validation.isValid) {
  console.error(validation.errors);
}
```

#### Available Rules

```typescript
rules.required(fieldName: string)
rules.email(fieldName: string)
rules.minLength(fieldName: string, min: number)
rules.maxLength(fieldName: string, max: number)
rules.pattern(fieldName: string, pattern: RegExp, message: string)
rules.min(fieldName: string, min: number)
rules.max(fieldName: string, max: number)
rules.array.minItems(fieldName: string, min: number)
rules.array.maxItems(fieldName: string, max: number)
```

---

## React Hooks

### useTheme

Access the design system theme.

```typescript
import { useTheme } from "@/hooks";

function MyComponent() {
  const { theme, isDark, toggleTheme } = useTheme();
  
  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>Hello</Text>
    </View>
  );
}
```

**Theme Object:**
```typescript
interface Theme {
  background: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  primary: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  // ... more colors
}
```

---

### useResponsive

Responsive design utilities.

```typescript
import { useResponsive } from "@/hooks";

function MyComponent() {
  const { isMobile, isTablet, isDesktop, contentWidth, cardWidth, columns } = useResponsive();
  
  return (
    <View style={{ maxWidth: contentWidth }}>
      {items.map(item => (
        <View key={item.id} style={{ width: cardWidth }}>
          <ItemCard item={item} />
        </View>
      ))}
    </View>
  );
}
```

**Breakpoints:**
- Mobile: < 480px (2 columns)
- Tablet: 480-768px (3 columns)
- Desktop: > 768px (4 columns)

---

### useAuth

Access authentication context.

```typescript
import { useAuth } from "@/hooks";

function MyComponent() {
  const { user, isAuthenticated, signIn, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
  return (
    <View>
      <Text>Welcome, {user.name}!</Text>
      <Button onPress={signOut}>Sign Out</Button>
    </View>
  );
}
```

---

### useScreenInsets

Safe area insets for notch and status bar.

```typescript
import { useScreenInsets } from "@/hooks";

function MyComponent() {
  const { top, bottom, left, right } = useScreenInsets();
  
  return (
    <View style={{ paddingTop: top, paddingBottom: bottom }}>
      <Content />
    </View>
  );
}
```

---

## Type Definitions

### ContentItem

```typescript
interface ContentItem {
  id: string;
  title: string;
  caption: string;
  mediaUri?: string;
  mediaType?: "image" | "video" | "carousel";
  platforms: PlatformType[];
  status: "draft" | "scheduled" | "published" | "failed";
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  userId?: string;
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
  avatar?: string;
}

type PlatformType = "instagram" | "tiktok" | "youtube" | "linkedin" | "pinterest";
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

### Team

```typescript
interface Team {
  id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: TeamRole;
  joinedAt: string;
}

type TeamRole = "admin" | "editor" | "viewer";
```

---

## Error Handling

All feature services return `Result<T, AppError>`. Always check results before accessing data.

### Best Practices

```typescript
// ✅ DO: Check result before accessing data
const result = await contentService.getById(id);
if (isOk(result)) {
  setContent(result.data);
} else {
  showError(result.error.message);
}

// ✅ DO: Log errors with context
if (isErr(result)) {
  logError(result.error, { contentId: id, screen: "ContentDetail" });
}

// ❌ DON'T: Access data without checking
const result = await contentService.getById(id);
setContent(result.data); // TypeScript error!

// ❌ DON'T: Silently ignore errors
if (isOk(result)) {
  setContent(result.data);
}
// Missing error handling
```

---

## Examples

### Complete Content Creation Flow

```typescript
import { contentService } from "@/features";
import { isOk, isErr } from "@/core/result";
import { logError } from "@/core/errors";

async function createAndPublishContent(data: Partial<ContentItem>) {
  // Create draft
  const createResult = await contentService.create({
    ...data,
    status: "draft",
  });
  
  if (isErr(createResult)) {
    logError(createResult.error, { action: "createContent" });
    return { success: false, error: createResult.error.message };
  }
  
  const content = createResult.data;
  
  // Publish immediately
  const publishResult = await contentService.publish(content.id);
  
  if (isErr(publishResult)) {
    logError(publishResult.error, { action: "publishContent", contentId: content.id });
    return { success: false, error: publishResult.error.message };
  }
  
  return { success: true, content: publishResult.data };
}

// Usage
const result = await createAndPublishContent({
  title: "My New Post",
  caption: "Check this out!",
  platforms: ["instagram", "tiktok"],
  mediaUri: "file:///path/to/image.jpg",
});

if (result.success) {
  console.log("Published:", result.content.id);
} else {
  console.error("Failed:", result.error);
}
```

### Platform Connection Management

```typescript
import { platformService } from "@/features";
import { isOk } from "@/core/result";

async function connectAllPlatforms(connections: Array<{platform: PlatformType, username: string}>) {
  const results = await Promise.all(
    connections.map(conn => platformService.connect(conn))
  );
  
  const succeeded = results.filter(isOk).map(r => r.data);
  const failed = results.filter(r => !isOk(r));
  
  return {
    connected: succeeded,
    failed: failed.length,
  };
}
```

---

*This API documentation is maintained as part of the codebase and should be updated when APIs change.*
