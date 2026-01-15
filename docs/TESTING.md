# Testing Guide

> **Version**: 2.0.0  
> **Last Updated**: January 2026

This guide covers testing strategies, best practices, and guidelines for EmeraldDrift.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Manual Testing](#manual-testing)
4. [E2E Testing](#e2e-testing)
5. [Testing Best Practices](#testing-best-practices)
6. [Test Scenarios](#test-scenarios)

---

## Testing Philosophy

EmeraldDrift follows a pragmatic testing approach:

1. **Manual Testing First**: All features are manually tested on actual devices
2. **Critical Path Coverage**: E2E tests for user journeys that must never break
3. **Visual Testing**: UI changes are validated with screenshots
4. **Device Testing**: Test on multiple devices, screen sizes, and OS versions
5. **Accessibility Testing**: Ensure VoiceOver/TalkBack compatibility

### Testing Pyramid

```
        /\
       /  \      E2E Tests (Critical Flows)
      /____\
     /      \    Integration Tests (Feature Services)
    /________\
   /          \  Unit Tests (Pure Functions)
  /____________\
```

---

## Testing Stack

| Type | Tool | Purpose |
|------|------|---------|
| E2E | Playwright | Browser automation for web |
| Manual | Expo Go | Mobile device testing |
| Visual | Screenshots | UI verification |
| Linting | ESLint | Code quality |
| Type Safety | TypeScript | Compile-time checks |

---

## Manual Testing

### Prerequisites

- Expo Go app installed on iOS and/or Android device
- Development server running (`npm run dev`)
- Network connection between computer and device (same WiFi)

### Manual Testing Checklist

Before submitting a PR or deploying, complete this checklist:

#### Device Testing
- [ ] Test on iOS device (iPhone)
- [ ] Test on Android device
- [ ] Test on web browser (Chrome, Safari, Firefox)
- [ ] Test on tablet (iPad or Android tablet)

#### Theme Testing
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test theme switching transitions
- [ ] Verify all colors have sufficient contrast

#### Screen Size Testing
- [ ] Mobile viewport (< 480px)
- [ ] Tablet viewport (480-768px)
- [ ] Desktop viewport (> 768px)
- [ ] Test landscape orientation on mobile

#### Functionality Testing
- [ ] All navigation links work
- [ ] Forms submit successfully
- [ ] Validation messages display correctly
- [ ] Loading states appear during async operations
- [ ] Error states display helpful messages
- [ ] Empty states show appropriate content
- [ ] Pull-to-refresh works on lists
- [ ] Buttons have appropriate touch feedback
- [ ] Images load correctly with placeholders

#### Accessibility Testing
- [ ] All interactive elements have 44x44pt tap targets
- [ ] VoiceOver navigation works (iOS)
- [ ] TalkBack navigation works (Android)
- [ ] Sufficient color contrast (4.5:1 for text)
- [ ] Focus indicators visible on all interactive elements
- [ ] Content readable with system font scaling

#### Performance Testing
- [ ] App launches in < 3 seconds
- [ ] Screens transition smoothly
- [ ] Lists scroll without jank
- [ ] No memory leaks after extended use
- [ ] Images lazy load appropriately

### Testing on Physical Devices

#### iOS (via Expo Go)

1. Install Expo Go from App Store
2. Start development server: `npm run dev`
3. Scan QR code with Camera app
4. App opens in Expo Go

#### Android (via Expo Go)

1. Install Expo Go from Google Play Store
2. Start development server: `npm run dev`
3. Scan QR code with Expo Go app
4. App loads automatically

#### Web Browser

```bash
npm run web
```

Opens at `http://localhost:8081` (or next available port)

### Recording Test Results

When manually testing, capture:

1. **Screenshots** of UI states (success, error, loading, empty)
2. **Screen recordings** of flows that involve animations or transitions
3. **Console logs** if debugging issues
4. **Network logs** for API-related issues

Store test artifacts in `/docs/testing/` for reference.

---

## E2E Testing

EmeraldDrift uses Playwright for end-to-end testing of critical user flows.

### Setup

```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run in debug mode
npx playwright test --debug
```

### Writing E2E Tests

E2E tests are located in `/tests/e2e/` directory.

#### Example: Authentication Flow

```typescript
import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:8081");
  });

  test("should sign up a new user", async ({ page }) => {
    // Click Sign Up button
    await page.click('text="Sign Up"');
    
    // Fill form
    await page.fill('input[placeholder="Email"]', "test@example.com");
    await page.fill('input[placeholder="Password"]', "password123");
    await page.fill('input[placeholder="Name"]', "Test User");
    
    // Submit
    await page.click('button:has-text("Create Account")');
    
    // Verify navigation to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text="Dashboard"')).toBeVisible();
  });

  test("should sign in existing user", async ({ page }) => {
    await page.click('text="Sign In"');
    await page.fill('input[placeholder="Email"]', "user@example.com");
    await page.fill('input[placeholder="Password"]', "password123");
    await page.click('button:has-text("Sign In")');
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should show validation errors", async ({ page }) => {
    await page.click('text="Sign In"');
    await page.click('button:has-text("Sign In")');
    
    await expect(page.locator('text="Email is required"')).toBeVisible();
    await expect(page.locator('text="Password is required"')).toBeVisible();
  });
});
```

#### Example: Content Creation Flow

```typescript
import { test, expect } from "@playwright/test";

test.describe("Content Creation", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in first
    await page.goto("http://localhost:8081");
    await page.click('text="Sign In"');
    await page.fill('input[placeholder="Email"]', "user@example.com");
    await page.fill('input[placeholder="Password"]', "password123");
    await page.click('button:has-text("Sign In")');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test("should create a draft", async ({ page }) => {
    // Navigate to Studio
    await page.click('text="Studio"');
    
    // Fill content form
    await page.fill('input[placeholder="Title"]', "My Test Post");
    await page.fill('textarea[placeholder="Caption"]', "This is a test caption");
    
    // Select platform
    await page.click('button:has-text("Instagram")');
    
    // Save draft
    await page.click('button:has-text("Save Draft")');
    
    // Verify success message
    await expect(page.locator('text="Draft saved"')).toBeVisible();
  });

  test("should publish content", async ({ page }) => {
    await page.click('text="Studio"');
    
    await page.fill('input[placeholder="Title"]', "Published Post");
    await page.fill('textarea[placeholder="Caption"]', "Publishing now");
    await page.click('button:has-text("Instagram")');
    
    // Publish
    await page.click('button:has-text("Publish Now")');
    
    // Verify redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('text="Published successfully"')).toBeVisible();
  });
});
```

### Test Configuration

Create `playwright.config.ts` in project root:

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  retries: 2,
  workers: 1, // Run tests serially for React Native web
  
  use: {
    baseURL: "http://localhost:8081",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  webServer: {
    command: "npm run web",
    port: 8081,
    reuseExistingServer: true,
  },
});
```

---

## Testing Best Practices

### 1. Test User Journeys, Not Implementation

```typescript
// ✅ Good: Tests user flow
test("user can create and publish content", async () => {
  await createContent("My Post", "Caption");
  await publishContent();
  expect(await getDashboardContent()).toContain("My Post");
});

// ❌ Bad: Tests implementation details
test("contentService.create is called with correct params", async () => {
  const spy = jest.spyOn(contentService, "create");
  await createContent("My Post", "Caption");
  expect(spy).toHaveBeenCalledWith({ title: "My Post", caption: "Caption" });
});
```

### 2. Use Data Attributes for Test Selectors

Add test IDs to components:

```typescript
<Button testID="publish-button" onPress={handlePublish}>
  Publish Now
</Button>
```

Select in tests:

```typescript
await page.click('[data-testid="publish-button"]');
```

### 3. Clean Up Test Data

```typescript
test.afterEach(async () => {
  // Clear test data
  await contentService.clear();
  await platformService.disconnectAll();
});
```

### 4. Test Error States

```typescript
test("should handle network errors gracefully", async ({ page }) => {
  // Simulate offline
  await page.context().setOffline(true);
  
  await page.click('button:has-text("Load Data")');
  
  await expect(page.locator('text="No internet connection"')).toBeVisible();
});
```

### 5. Test Accessibility

```typescript
test("should be keyboard navigable", async ({ page }) => {
  // Tab through form
  await page.keyboard.press("Tab");
  await expect(page.locator('input[placeholder="Email"]')).toBeFocused();
  
  await page.keyboard.press("Tab");
  await expect(page.locator('input[placeholder="Password"]')).toBeFocused();
});
```

### 6. Test Responsive Layouts

```typescript
test.describe("Responsive Design", () => {
  test("should show mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Hamburger menu should be visible
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible();
  });

  test("should show desktop layout", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    // Full navigation should be visible
    await expect(page.locator('nav >> text="Dashboard"')).toBeVisible();
  });
});
```

---

## Test Scenarios

### Critical User Journeys

These flows **must always work**:

1. **Authentication**
   - Sign up with email
   - Sign in with credentials
   - Sign out
   - Password recovery

2. **Content Creation**
   - Create draft
   - Save draft (auto-save)
   - Edit draft
   - Publish content
   - Schedule content
   - Delete content

3. **Platform Management**
   - Connect Instagram
   - Connect TikTok
   - Disconnect platform
   - View connected platforms

4. **Navigation**
   - Tab between main screens
   - Navigate to content detail
   - Navigate back
   - Deep linking

5. **Analytics**
   - View dashboard metrics
   - Filter by date range
   - View platform-specific analytics

### Edge Cases to Test

1. **Empty States**
   - No content created yet
   - No platforms connected
   - No team members
   - No analytics data

2. **Error States**
   - Network offline
   - Invalid credentials
   - Form validation errors
   - API errors

3. **Loading States**
   - Initial app load
   - Data fetching
   - Image loading
   - Infinite scroll loading

4. **Boundary Cases**
   - Very long content titles
   - Maximum character caption (2000)
   - Many platforms selected (5+)
   - Large media files

5. **Concurrent Actions**
   - Multiple tabs open
   - Rapid navigation
   - Quick form submissions
   - Simultaneous publishes

---

## Continuous Testing

### Pre-Commit Checks

```bash
# Add to .husky/pre-commit
npm run lint
npm run check:format
npm run test:critical
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - run: npm ci
      - run: npm run lint
      - run: npm run check:format
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

---

## Troubleshooting Tests

### Tests Failing Intermittently

**Cause**: Race conditions, timing issues

**Solution**: Add explicit waits

```typescript
// ❌ Bad: No wait
await page.click('button');
expect(page.locator('text="Success"')).toBeVisible();

// ✅ Good: Explicit wait
await page.click('button');
await expect(page.locator('text="Success"')).toBeVisible({ timeout: 5000 });
```

### Tests Fail Locally but Pass in CI

**Cause**: Different environment, timing, or data

**Solution**: 
- Ensure clean state before each test
- Don't rely on specific test data
- Use consistent viewport sizes

### Tests Are Slow

**Cause**: Too many waits, heavy operations

**Solution**:
- Run tests in parallel where possible
- Use test data fixtures
- Mock heavy operations
- Skip non-critical tests in development

---

## Test Maintenance

### When to Update Tests

- Feature changes require test updates
- Bug fixes should include regression tests
- Refactoring shouldn't break tests (if they test behavior, not implementation)
- New edge cases discovered should be added

### Test Documentation

Document complex test scenarios:

```typescript
/**
 * Tests the content publishing flow with scheduled publish time.
 * 
 * This test verifies that:
 * 1. User can schedule content for future publish
 * 2. Scheduled time is validated (must be future)
 * 3. Content status changes to "scheduled"
 * 4. Scheduled content appears in schedule view
 * 
 * Related issue: #123
 */
test("should schedule content for future publish", async () => {
  // Test implementation
});
```

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Expo Testing](https://docs.expo.dev/guides/testing/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Accessibility Testing Guide](https://reactnative.dev/docs/accessibility)

---

*This testing guide should be updated as testing practices evolve.*
