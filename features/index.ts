export * from "./shared";

export { authRepository, authService, authReducer, initialAuthState } from "./auth";
export type { AuthRepository, AuthTokens, AuthState, AuthAction, AuthService } from "./auth";

export { contentRepository, contentService } from "./content";
export type { ContentRepository, ContentFilters, ContentService, CreateContentInput, UpdateContentInput, ContentStats } from "./content";

export { platformRepository, platformService } from "./platforms";
export type { PlatformRepository, PlatformService, PlatformInfo, PlatformStats, ConnectPlatformInput } from "./platforms";

export { analyticsRepository, analyticsService } from "./analytics";
export type { AnalyticsRepository, AnalyticsService, AnalyticsSummary, TimeRange } from "./analytics";

export { teamRepository, teamService } from "./team";
export type { TeamRepository, TeamRole, TeamService, InviteMemberInput, TeamStats } from "./team";

export { designRepository, designService, PLATFORM_TEMPLATES, PLATFORM_INFO, CATEGORY_INFO } from "./designs";
export type { 
  DesignRepository, 
  DesignService, 
  DesignStats,
  ProductDesign,
  DesignTemplate,
  DesignPlatform,
  ProductCategory,
  DesignStatus,
  GenerationSource,
  DesignDimensions,
  AIGenerationRequest,
  AIGenerationResult,
  PlatformConfig,
  UploadTarget,
  PublishResult,
  ProductVariant,
} from "./designs";

export { merchService, getErrorSuggestion, geminiService, preferencesService, MERCH_PRODUCTS, getProductById, getProductsByCategory, getPopularProducts, getAllCategories } from "./merch";
export type {
  MerchService,
  MerchProduct,
  MerchProductType,
  StylePreference,
  MerchGenerationRequest,
  MerchGenerationResult,
  MerchDesignState,
  TextOverlay,
  AIProvider,
  AspectRatio,
  ImageSize,
  GeminiModel,
  CacheStats,
  UsageMetrics,
} from "./merch";
export { STYLE_INFO, CATEGORY_INFO as MERCH_CATEGORY_INFO } from "./merch";

export { offlineStorage, syncQueue, syncService } from "./offline";
export type {
  NetworkStatus,
  SyncOperation,
  SyncOperationType,
  SyncStatus,
  OfflineState,
  ConflictResolution,
  SyncResult,
} from "./offline";

export { aiGeneratorRepository, aiGeneratorService, CONTENT_TYPES, TONES, AUDIENCES, WORD_COUNTS } from "./ai-generator";
export type {
  AIGeneratorRepository,
  AIGeneratorService,
  ContentType,
  ContentTone,
  TargetAudience,
  ContentTypeConfig,
  GenerationRequest,
  GeneratedContent,
  GenerationHistory,
  AIGeneratorState,
} from "./ai-generator";

export { promptRepository, promptService, PROMPT_CATEGORIES, VARIABLE_TYPES, DEFAULT_LLM_SETTINGS } from "./prompts";
export type {
  PromptRepository,
  PromptService,
  CreatePromptInput,
  PromptTemplate,
  PromptVariable,
  PromptCategory,
  VariableType,
  PromptExecutionResult,
  LLMSettings,
} from "./prompts";

export { agentRepository, agentService, AGENT_CAPABILITIES, DEFAULT_AGENT_CONFIG } from "./agents";
export type {
  AgentRepository,
  AgentService,
  CreateAgentInput,
  CreateWorkflowInput,
  Agent,
  AgentTask,
  AgentWorkflow,
  AgentConfig,
  AgentStatus,
  AgentCapability,
  WorkflowConnection,
  AgentOrchestrationResult,
} from "./agents";

export { 
  unifiedMarketplaceService,
  printifyService,
  shopifyService,
  etsyService,
  wooCommerceService,
  amazonService,
  tiktokShopService
} from "./marketplaces";
export type { 
  UnifiedMarketplaceService,
  MarketplaceType,
  MarketplaceConnection,
  MarketplaceProduct,
  MarketplaceOrder,
  MarketplaceAnalytics,
  SyncResult as MarketplaceSyncResult 
} from "./marketplaces";

export { orderListenerService } from "./orders";
export type {
  OrderEventType,
  OrderEvent,
  OrderEventHandler,
  OrderListenerService
} from "./orders/service";

export { inventoryManagerService } from "./inventory";
export type {
  InventoryItem,
  InventoryAlert,
  InventoryAdjustment,
  InventorySummary,
  InventoryManagerService
} from "./inventory/service";
