## 2024-05-23 - Sequential AsyncStorage Anti-Pattern
**Learning:** Repository `save` methods (like `contentRepository`) were performing sequential `get`/`set` operations for maintaining indexes. For items with multiple indexes (e.g., status, multiple platforms), this resulted in 10+ bridge calls per save, significantly impacting performance.
**Action:** Always batch AsyncStorage operations using `multiGet` and `multiSet` when updating multiple keys/indexes. Use in-memory Sets to track keys to read/write.

## 2024-05-24 - Conflicting AsyncStorage Keys
**Learning:** `repositories/mediaRepository.ts` and `services/mediaLibrary.ts` were both using the same storage key (`@creator_studio_media_library`) but expecting different data structures (Array vs Object). This is a critical architecture risk and potential data corruption source.
**Action:** When implementing new repositories or services, strictly check `core/constants.ts` to ensure keys are unique or usage is consistent. Prefer a single source of truth for data access.
