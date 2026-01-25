## 2024-05-23 - Sequential AsyncStorage Anti-Pattern
**Learning:** Repository `save` methods (like `contentRepository`) were performing sequential `get`/`set` operations for maintaining indexes. For items with multiple indexes (e.g., status, multiple platforms), this resulted in 10+ bridge calls per save, significantly impacting performance.
**Action:** Always batch AsyncStorage operations using `multiGet` and `multiSet` when updating multiple keys/indexes. Use in-memory Sets to track keys to read/write.

## 2024-05-24 - Parallel vs Batch AsyncStorage
**Learning:** `Promise.all` with multiple `persistence.get` (or `AsyncStorage.getItem`) calls still results in multiple bridge crossings. This is often N+1 in disguise.
**Action:** Use `persistence.multiGet` (and `multiSet`) to batch these into a single bridge call, even for unrelated keys (like aggregating stats).
