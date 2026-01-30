## 2024-05-23 - Sequential AsyncStorage Anti-Pattern
**Learning:** Repository `save` methods (like `contentRepository`) were performing sequential `get`/`set` operations for maintaining indexes. For items with multiple indexes (e.g., status, multiple platforms), this resulted in 10+ bridge calls per save, significantly impacting performance.
**Action:** Always batch AsyncStorage operations using `multiGet` and `multiSet` when updating multiple keys/indexes. Use in-memory Sets to track keys to read/write.

## 2026-01-21 - Strict Scope for Performance Refactoring
**Learning:** When extracting components for performance (e.g., `React.memo`), temptations to fix apparent bugs (like using `fileName` instead of undefined `name`) can block reviews due to regression risks.
**Action:** Strictly preserve existing logic during performance refactoring. Fix bugs in separate PRs.
