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
