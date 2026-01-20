# Palette's Journal

## 2024-05-24 - Login Accessibility & Feedback
**Learning:** High-impact/low-effort wins exist in auth flows where standard components aren't used. Manual implementations of password toggles often miss basic a11y.
**Action:** When auditing forms, check if standard input components are used. If not, check for `accessibilityRole`, dynamic `accessibilityLabel` (state-dependent), and `hitSlop` on icon buttons. Also, adding `Haptics` to these small interactions significantly improves the "feel".
