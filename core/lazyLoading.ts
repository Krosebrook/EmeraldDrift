import { lazy, ComponentType } from "react";
import { featureFlags } from "./featureFlags";

interface LazyLoadConfig {
  minLoadTime?: number;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
}

export function createLazyComponent<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
  config?: LazyLoadConfig
): React.LazyExoticComponent<T> {
  const LazyComponent = lazy(async () => {
    const flags = featureFlags.getSync();
    
    if (!flags.lazyLoadScreens) {
      return importFn();
    }

    config?.onLoadStart?.();
    
    const startTime = Date.now();
    const module = await importFn();
    
    const elapsed = Date.now() - startTime;
    const minTime = config?.minLoadTime ?? 0;
    
    if (elapsed < minTime) {
      await new Promise((resolve) => setTimeout(resolve, minTime - elapsed));
    }
    
    config?.onLoadEnd?.();
    return module;
  });

  return LazyComponent;
}

export function preloadComponent(
  importFn: () => Promise<{ default: ComponentType<unknown> }>
): void {
  importFn().catch((error) => {
    console.warn("Failed to preload component:", error);
  });
}

export function preloadAIFeatures(): void {
  const flags = featureFlags.getSync();
  if (!flags.lazyLoadScreens) return;

  setTimeout(() => {
    import("@/screens/AIGeneratorScreen").catch(() => {});
    import("@/screens/PromptStudioScreen").catch(() => {});
    import("@/screens/AgentOrchestratorScreen").catch(() => {});
  }, 2000);
}
