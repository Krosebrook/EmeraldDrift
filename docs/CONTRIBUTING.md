# Contributing to Creator Studio Lite

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Start development server: `npm run dev`
4. Scan QR code with Expo Go app

## Development Workflow

### Adding a New Feature

1. **Create types** in `types/index.ts`
2. **Create repository** if data persistence is needed
3. **Update state** if global state management is needed
4. **Create screen/component** with proper typing
5. **Add navigation** route and options
6. **Update documentation** in replit.md

### Creating a New Screen

```typescript
// screens/NewScreen.tsx
import React from "react";
import { View } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/shared/hooks";
import { Spacing } from "@/core/theme";

export function NewScreen() {
  const theme = useTheme();
  
  return (
    <ScreenScrollView>
      <ThemedText type="title1">New Screen</ThemedText>
    </ScreenScrollView>
  );
}
```

### Creating a New Repository

```typescript
// repositories/newRepository.ts
import { persistence } from "@/core/persistence";
import { STORAGE_KEYS } from "@/core/constants";
import type { NewType } from "@/types";

const repository = persistence.createRepository<NewType>(STORAGE_KEYS.NEW_KEY);

export const newRepository = {
  async getAll(): Promise<NewType[]> {
    return repository.getAll();
  },
  
  async save(item: NewType): Promise<void> {
    await repository.save(item);
  },
  
  // Add more methods as needed
};
```

### Updating State

1. Define action types in the state file
2. Add case to reducer
3. Add action method to context value
4. Export any new selectors

## Code Quality

### Before Committing

1. Run linter: `npm run lint`
2. Fix TypeScript errors
3. Test on mobile device via Expo Go
4. Update replit.md if architecture changed

### Pull Request Checklist

- [ ] Types added/updated in `types/index.ts`
- [ ] Repository methods are properly typed
- [ ] State actions follow reducer pattern
- [ ] Components use design system tokens
- [ ] Responsive design considered
- [ ] Documentation updated

## File Organization

### Where to Put Things

| Type | Location | Example |
|------|----------|---------|
| Types | `types/index.ts` | `ContentItem`, `User` |
| Constants | `core/constants.ts` | `STORAGE_KEYS`, `LIMITS` |
| Theme values | `core/theme.ts` | `Spacing`, `Colors` |
| Data access | `repositories/` | `contentRepository` |
| State management | `state/` | `AuthState`, `TeamState` |
| Shared hooks | `shared/hooks/` | `useResponsive` |
| UI components | `components/` | `Button`, `Card` |
| Screens | `screens/` | `DashboardScreen` |
| Navigation | `navigation/` | Route configs |

## Design System Usage

### Colors
Always use theme tokens, never hardcode colors:
```typescript
const theme = useTheme();
<View style={{ backgroundColor: theme.primary }} />
```

### Spacing
Use Spacing constants from core/theme:
```typescript
import { Spacing } from "@/core/theme";
<View style={{ padding: Spacing.md, marginTop: Spacing.lg }} />
```

### Typography
Use ThemedText with type prop:
```typescript
<ThemedText type="title1">Heading</ThemedText>
<ThemedText type="body">Body text</ThemedText>
<ThemedText type="caption" secondary>Caption</ThemedText>
```

### Responsive Design
Use useResponsive hook for adaptive layouts:
```typescript
const { isMobile, cardWidth, contentWidth } = useResponsive();
<View style={{ width: cardWidth, maxWidth: contentWidth }} />
```

## Common Patterns

### Async Data Loading
```typescript
const [data, setData] = useState<DataType[]>([]);
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  loadData();
}, []);

const loadData = async () => {
  try {
    const result = await repository.getAll();
    setData(result);
  } catch (error) {
    console.error("Failed to load data:", error);
  } finally {
    setIsLoading(false);
  }
};
```

### Form Handling
```typescript
const [formData, setFormData] = useState({ field1: "", field2: "" });

const updateField = (field: string, value: string) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};

const handleSubmit = async () => {
  await repository.save(formData);
};
```

### Autosave Pattern
```typescript
const formDataRef = useRef(formData);

useEffect(() => {
  formDataRef.current = formData;
}, [formData]);

useEffect(() => {
  const interval = setInterval(() => {
    const data = formDataRef.current;
    if (data.hasContent) {
      saveData(data);
    }
  }, 30000);
  
  return () => clearInterval(interval);
}, []); // Empty deps - never resets
```
