# POD Generator & E-Commerce Hub

## Overview

This is a comprehensive Print-on-Demand (POD) generator and e-commerce management platform built with Expo React Native. It serves as a complete POD hub with AI-powered content generation, product mockup creation, and multi-platform marketplace integrations. The platform functions as a Listener (monitoring orders/inventory), Manager (handling listings/fulfillment), and Prediction Engine (analytics/forecasting). Key capabilities include:

### Core POD Features
-   **Merch Studio (PoDGen)**: AI-powered product mockup generator using Google Gemini for Print-on-Demand merchandise visualization.
-   **AI Content Generator**: Real AI integration (OpenAI/Gemini) with 8 content types, 6 tones, 6 target audiences.
-   **Product Design Tools**: Create and manage product designs for POD fulfillment.

### Marketplace Integrations (7 Platforms)
-   **Printify**: Full API integration for POD product creation, publishing, and order management.
-   **Shopify**: Complete product/order sync with fulfillment support.
-   **Amazon**: SP-API integration for order retrieval and marketplace participation.
-   **Amazon KDP**: Support for Kindle Direct Publishing products.
-   **Etsy**: Full listing management with receipt/order handling.
-   **TikTok Shop**: Product and order management with fulfillment API.
-   **WooCommerce**: REST API integration for self-hosted stores.

### Platform Capabilities
-   **Order Listener**: Real-time order monitoring with webhook support, polling, and event handlers.
-   **Inventory Manager**: Stock tracking, reorder alerts, reservation system, and multi-marketplace sync.
-   **Prediction Engine**: Sales forecasting, trend analysis, inventory forecasts, and seasonality patterns.
-   **Unified Analytics**: Cross-platform revenue, orders, and product performance metrics.

## B2B SaaS Target User Segments

### Primary Personas

#### 1. Independent POD Sellers (Solo Entrepreneurs)
-   **Profile**: Individual creators running POD businesses on 1-3 platforms
-   **Pain Points**: Manual order tracking, inconsistent product listings across platforms, no sales forecasting
-   **Value Proposition**: Unified dashboard to manage all marketplaces, AI-generated content saves hours per week
-   **Monthly Revenue**: $1K-$10K
-   **Technical Comfort**: Low to moderate
-   **Key Features Used**: AI Content Generator, Order Listener, Basic Analytics

#### 2. Growing E-commerce Brands (Small Teams)
-   **Profile**: 2-5 person teams scaling from hobbyist to professional POD operations
-   **Pain Points**: Inventory sync issues, missed reorder points, no demand forecasting
-   **Value Proposition**: Prediction Engine prevents stockouts, automated alerts reduce manual monitoring
-   **Monthly Revenue**: $10K-$50K
-   **Technical Comfort**: Moderate
-   **Key Features Used**: Inventory Manager, Prediction Engine, Multi-marketplace sync, Merch Studio

#### 3. Established POD Agencies (Professional Operations)
-   **Profile**: Agencies managing POD fulfillment for multiple clients or brands
-   **Pain Points**: Cross-platform reporting, client-specific analytics, bulk product management
-   **Value Proposition**: Unified analytics across all 7 platforms, white-label potential, team collaboration
-   **Monthly Revenue**: $50K-$500K+
-   **Technical Comfort**: High
-   **Key Features Used**: Full platform capabilities, API integrations, Advanced Analytics, Agent Orchestrator

#### 4. Content Creators Monetizing Merchandise
-   **Profile**: YouTubers, influencers, artists selling branded merchandise
-   **Pain Points**: Design-to-product workflow friction, no time for marketplace management
-   **Value Proposition**: AI mockup generation from designs, hands-off order fulfillment via Printify
-   **Monthly Revenue**: Variable ($500-$25K)
-   **Technical Comfort**: Low
-   **Key Features Used**: Merch Studio, Printify integration, AI Content Generator

### Secondary Personas

#### 5. Amazon KDP Authors
-   **Profile**: Self-published authors expanding into low-content books and merchandise
-   **Pain Points**: Separate tools for KDP vs other POD, no unified book/merch analytics
-   **Value Proposition**: Single platform for KDP + POD merchandise management
-   **Key Features Used**: Amazon KDP integration, Content Generator, Sales Predictions

#### 6. Dropshipping Entrepreneurs
-   **Profile**: E-commerce operators using POD as part of broader dropshipping model
-   **Pain Points**: Supplier coordination, inventory visibility, order routing
-   **Value Proposition**: Centralized order management with real-time inventory across suppliers
-   **Key Features Used**: Order Listener, Inventory Manager, WooCommerce/Shopify sync

### User Journey Stages

1.  **Discovery**: Landing page with clear value proposition for each persona
2.  **Onboarding**: Guided marketplace connection flow, first AI-generated content
3.  **Activation**: First order synced, first product created via Merch Studio
4.  **Retention**: Daily dashboard usage, prediction-based reorder alerts
5.  **Expansion**: Adding additional marketplaces, team member invites
6.  **Advocacy**: Referrals, case study participation

### Pricing Tier Alignment

-   **Free/Starter**: Solo sellers, 1-2 marketplace connections, basic analytics
-   **Growth**: Small teams, all 7 marketplaces, Prediction Engine, team seats
-   **Enterprise**: Agencies, API access, white-label, priority support

## User Preferences

-   Clean code architecture at maximum depth
-   SparkLabs Mobile Design Guidelines compliance
-   Production-ready implementation
-   Type safety throughout codebase
-   Separation of concerns with clear module boundaries
-   Comprehensive documentation

## System Architecture

The project employs a feature-first domain module structure, emphasizing clear separation of concerns.

### Module Structure

```
├── server/             # Express backend for Replit Auth
├── features/           # Feature-first domain modules (e.g., auth, content, analytics, merch, ai-generator, prompts, agents)
│   ├── marketplaces/   # Unified marketplace integration layer
│   │   ├── services/   # Platform-specific services (Printify, Shopify, Etsy, WooCommerce, Amazon, TikTok Shop)
│   │   └── types/      # Shared marketplace types (products, orders, analytics)
│   ├── orders/         # Order Listener service with real-time monitoring
│   ├── inventory/      # Inventory Manager with alerts and reservations
│   └── predictions/    # Prediction Engine for forecasting
├── core/               # Core infrastructure (errors, result, validation, featureFlags, cache, edgeCases)
├── __tests__/          # Test utilities and smoke test suites
├── context/            # React contexts (Auth, Team)
├── hooks/              # React hooks (e.g., useTheme, useResponsive, useAuth)
├── services/           # External integrations (AI, notifications, userStats)
├── navigation/         # Navigation configuration
├── components/         # Reusable UI components
├── screens/            # Screen components
└── constants/          # Design system (colors, spacing, typography)
```

### Key Patterns

-   **Repository Pattern**: Typed data access.
-   **Reducer State**: `useReducer` with typed actions.
-   **Result Type**: Explicit error handling.
-   **Race Prevention**: Request token pattern for async operations.
-   **Ref Intervals**: Stable autosave without interval resets.
-   **Feature Flags**: Runtime configuration for AI provider switching (simulated/OpenAI/Gemini).
-   **Smart Caching**: Hybrid cache with background refresh, 5-minute TTL, LRU eviction.
-   **Graceful Degradation**: Service failure tracking with exponential backoff retry.

### UI/UX Decisions

-   **Responsive Design**: Utilizes `useResponsive` hook with breakpoints for mobile, tablet, and desktop.
-   **Design System**: Adheres to SparkLabs Mobile Design Guidelines with defined colors, spacing (8pt grid), and typography (Display, Title1-3, Body, Caption).
-   **Component Usage**: Standardized components like `ThemedText`, `ThemedView`, `Button`, and `Card` for consistent UI.

### Technical Implementations

-   **Error Handling**: Implemented with `Result` type for async operations and `FeatureErrorBoundary` for isolated error handling.
-   **Validation**: Comprehensive content and input validation with 20+ validators, sanitization utilities, and field-level errors.
-   **Type-Safe Navigation**: Defined `ParamList` types for secure navigation.
-   **Offline Mode**: Includes network status detection, offline storage, sync queue manager, and conflict resolution, with an auto-sync mechanism.
-   **PWA Configuration**: Supports PWA with web manifest, mobile-first meta tags, and standalone display mode.
-   **Edge Case Handling**: Debounce, throttle, memoize, retry with exponential backoff, safe JSON parsing, deep merge utilities.
-   **Lazy Loading**: Suspense-based component loading for AI features with preloading capabilities.
-   **Test Infrastructure**: Custom smoke test runner, test helpers, comprehensive assertion utilities.

### Feature Specifications

-   **AI Content Generator**: Supports 8 content types, 6 tones, 6 target audiences, and configurable word counts.
-   **Prompt Studio**: Template management with variable support, 6 categories, and LLM settings configuration.
-   **Agent Orchestrator**: Multi-agent creation with 6 capabilities and workflow creation with agent chaining.

### Marketplace Integration Architecture

-   **BaseMarketplaceService**: Abstract base class defining standard interface for all marketplace integrations.
-   **Unified Marketplace Service**: Aggregates all marketplace services for cross-platform operations.
-   **Credential Storage**: Secure API key/OAuth token storage using expo-secure-store.
-   **Supported Operations**: Products CRUD, Orders retrieval, Analytics aggregation, Inventory sync.

### Order & Inventory Systems

-   **Order Listener**: Polling-based order monitoring (60s intervals) with webhook event processing.
-   **Order Events**: Created, updated, fulfilled, shipped, delivered, cancelled, refunded.
-   **Inventory Manager**: Stock levels, reservations, reorder points, and automated alerts.
-   **Alert Types**: Low stock, out of stock, overstock, reorder needed.

### Prediction Engine

-   **Sales Predictions**: Product-level forecasts with confidence scores and impact factors.
-   **Trend Analysis**: Rising/stable/declining trend detection with percentage changes.
-   **Inventory Forecasts**: Days until stockout, reorder suggestions, urgency levels.
-   **Seasonality Patterns**: Weekly, monthly, and yearly multipliers for accurate predictions.

## External Dependencies

-   **Replit Auth**: For user authentication via `@replit/repl-auth`.
-   **Google Gemini**: Used for AI-powered product mockup generation in Merch Studio.
-   **Expo React Native**: Core framework for mobile application development.
-   **React Navigation**: For managing application navigation.
-   **@react-native-community/netinfo**: For network status detection in offline mode.
-   **expo-secure-store**: For secure authentication storage and API credential management.
-   **express-session**: For session management in the Express backend.