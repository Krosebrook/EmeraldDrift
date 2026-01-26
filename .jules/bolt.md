## 2024-05-23 - Sequential AsyncStorage Anti-Pattern
**Learning:** Repository `save` methods (like `contentRepository`) were performing sequential `get`/`set` operations for maintaining indexes. For items with multiple indexes (e.g., status, multiple platforms), this resulted in 10+ bridge calls per save, significantly impacting performance.
**Action:** Always batch AsyncStorage operations using `multiGet` and `multiSet` when updating multiple keys/indexes. Use in-memory Sets to track keys to read/write.

## 2024-05-24 - Service Layer Caching
**Learning:** High-frequency service methods (like `userStatsService.getStats`) accessed `AsyncStorage` directly on every call, creating bridge traffic bottlenecks during rapid UI updates or repeated checks.
**Action:** Implement in-memory caching for read-heavy service data. Ensure cached objects are returned as copies (deep clone or spread) to prevent shared mutable state bugs.
