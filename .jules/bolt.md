## 2024-05-23 - Sequential AsyncStorage Anti-Pattern
**Learning:** Repository `save` methods (like `contentRepository`) were performing sequential `get`/`set` operations for maintaining indexes. For items with multiple indexes (e.g., status, multiple platforms), this resulted in 10+ bridge calls per save, significantly impacting performance.
**Action:** Always batch AsyncStorage operations using `multiGet` and `multiSet` when updating multiple keys/indexes. Use in-memory Sets to track keys to read/write.
