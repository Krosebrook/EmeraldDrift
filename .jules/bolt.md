# Bolt's Journal

## 2024-05-23 - Component Definition in Render
**Learning:** Defining functional components inside another component's render body (e.g., `const Header = () => <View />`) causes them to be recreated on every render. When passed to `FlatList` props like `ListHeaderComponent`, this forces a full unmount/remount of that sub-tree, killing performance and losing state/focus.
**Action:** always define helper components outside the main component, or memoize them securely. Use `React.memo` for list items.
