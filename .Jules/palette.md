## 2024-05-24 - Login Accessibility & Feedback
**Learning:** High-impact/low-effort wins exist in auth flows where standard components aren't used. Manual implementations of password toggles often miss basic a11y.
**Action:** When auditing forms, check if standard input components are used. If not, check for `accessibilityRole`, dynamic `accessibilityLabel` (state-dependent), and `hitSlop` on icon buttons. Also, adding `Haptics` to these small interactions significantly improves the "feel".

## 2024-05-25 - Media Grid Accessibility
**Learning:** Grid-based media galleries often rely purely on visual cues. Adding dynamic `accessibilityLabel` that includes file type, name, and status (e.g., "Video, MyVacation.mp4, favorited") transforms the experience for screen reader users from silence to full context.
**Action:** Always construct dynamic labels for complex data items instead of using static generic labels like "Media Item". Use `accessibilityState` for filter chips to clearly indicate selection.

## 2025-01-28 - Dashboard Interactivity & Accessibility
**Learning:** Dashboard summary cards (KPIs) are often visually interactive (ripples/opacity) but functionally inert, confusing users. Screen readers also miss the "trend" context without explicit labels.
**Action:** Always make summary cards navigable (e.g. to Analytics). Use `accessibilityRole="button"` and construct dynamic labels like "Followers: 1.2M, Trending up 5%". Add `Haptics.selectionAsync()` to reinforce the interaction.

## 2026-02-17 - Mapping Gestures to Accessibility Actions
**Learning:** Hidden gestures like "long press to delete" are completely inaccessible to many assistive technology users. React Native's `accessibilityActions` API allows mapping these gestures to standard actions menu.
**Action:** When using `onLongPress`, always provide an equivalent `accessibilityActions` entry (e.g., `name: 'delete'`) and handle it in `onAccessibilityAction` to ensure the functionality is discoverable and usable without the gesture.
