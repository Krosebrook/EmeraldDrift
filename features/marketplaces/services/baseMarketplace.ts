import * as SecureStore from "expo-secure-store";
import { ok, err, AsyncResult, Result } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import type {
  MarketplaceType,
  MarketplaceCredentials,
  MarketplaceConnection,
  MarketplaceProduct,
  MarketplaceOrder,
  MarketplaceAnalytics,
  SyncResult,
} from "../types";

const CREDENTIALS_KEY_PREFIX = "marketplace_creds_";

export abstract class BaseMarketplaceService {
  abstract readonly marketplace: MarketplaceType;
  abstract readonly displayName: string;
  abstract readonly baseUrl: string;

  protected async getCredentials(): Promise<MarketplaceCredentials | null> {
    try {
      const stored = await SecureStore.getItemAsync(
        `${CREDENTIALS_KEY_PREFIX}${this.marketplace}`
      );
      if (!stored) return null;
      return JSON.parse(stored) as MarketplaceCredentials;
    } catch {
      return null;
    }
  }

  protected async setCredentials(credentials: MarketplaceCredentials): Promise<void> {
    await SecureStore.setItemAsync(
      `${CREDENTIALS_KEY_PREFIX}${this.marketplace}`,
      JSON.stringify(credentials)
    );
  }

  protected async clearCredentials(): Promise<void> {
    await SecureStore.deleteItemAsync(`${CREDENTIALS_KEY_PREFIX}${this.marketplace}`);
  }

  async isConnected(): Promise<boolean> {
    const creds = await this.getCredentials();
    return !!creds && !!(creds.apiKey || creds.accessToken);
  }

  async getConnection(): AsyncResult<MarketplaceConnection, AppError> {
    const creds = await this.getCredentials();
    
    if (!creds || (!creds.apiKey && !creds.accessToken)) {
      return ok({
        marketplace: this.marketplace,
        displayName: this.displayName,
        connected: false,
        status: "disconnected",
      });
    }

    if (creds.expiresAt && new Date(creds.expiresAt) < new Date()) {
      return ok({
        marketplace: this.marketplace,
        displayName: this.displayName,
        connected: false,
        status: "expired",
        errorMessage: "Access token has expired. Please reconnect.",
      });
    }

    return ok({
      marketplace: this.marketplace,
      displayName: this.displayName,
      connected: true,
      status: "active",
      shopId: creds.shopId,
    });
  }

  async connect(credentials: Partial<MarketplaceCredentials>): AsyncResult<MarketplaceConnection, AppError> {
    const fullCreds: MarketplaceCredentials = {
      marketplace: this.marketplace,
      ...credentials,
    };

    await this.setCredentials(fullCreds);

    const testResult = await this.testConnection();
    if (!testResult.success) {
      await this.clearCredentials();
      return err(testResult.error);
    }

    return this.getConnection();
  }

  async disconnect(): AsyncResult<void, AppError> {
    await this.clearCredentials();
    return ok(undefined);
  }

  protected mapApiError(error: unknown, context: string): AppError {
    if (error instanceof AppError) return error;

    const message = error instanceof Error ? error.message : String(error);
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("401") || lowerMsg.includes("unauthorized") || lowerMsg.includes("authentication")) {
      return new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: `${this.displayName} authentication failed. Please check your credentials.`,
      });
    }

    if (lowerMsg.includes("403") || lowerMsg.includes("forbidden")) {
      return new AppError({
        code: ErrorCode.FORBIDDEN,
        message: `Access denied. Please verify your ${this.displayName} permissions.`,
      });
    }

    if (lowerMsg.includes("429") || lowerMsg.includes("rate limit")) {
      return new AppError({
        code: ErrorCode.RATE_LIMITED,
        message: `${this.displayName} rate limit reached. Please try again later.`,
      });
    }

    if (lowerMsg.includes("404") || lowerMsg.includes("not found")) {
      return new AppError({
        code: ErrorCode.NOT_FOUND,
        message: `Resource not found on ${this.displayName}.`,
      });
    }

    return new AppError({
      code: ErrorCode.SERVER_ERROR,
      message: `${this.displayName} ${context} failed: ${message}`,
    });
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): AsyncResult<T, AppError> {
    const creds = await this.getCredentials();
    if (!creds) {
      return err(new AppError({
        code: ErrorCode.UNAUTHORIZED,
        message: `Not connected to ${this.displayName}. Please connect first.`,
      }));
    }

    try {
      const headers = await this.buildHeaders(creds);
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
      }

      const data = await response.json();
      return ok(data as T);
    } catch (error) {
      return err(this.mapApiError(error, "request"));
    }
  }

  protected abstract buildHeaders(credentials: MarketplaceCredentials): Promise<Record<string, string>>;

  abstract testConnection(): AsyncResult<boolean, AppError>;

  abstract getProducts(params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): AsyncResult<MarketplaceProduct[], AppError>;

  abstract getProduct(productId: string): AsyncResult<MarketplaceProduct, AppError>;

  abstract createProduct(product: Partial<MarketplaceProduct>): AsyncResult<MarketplaceProduct, AppError>;

  abstract updateProduct(
    productId: string,
    updates: Partial<MarketplaceProduct>
  ): AsyncResult<MarketplaceProduct, AppError>;

  abstract deleteProduct(productId: string): AsyncResult<void, AppError>;

  abstract getOrders(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    since?: string;
  }): AsyncResult<MarketplaceOrder[], AppError>;

  abstract getOrder(orderId: string): AsyncResult<MarketplaceOrder, AppError>;

  abstract updateOrderStatus(
    orderId: string,
    status: string
  ): AsyncResult<MarketplaceOrder, AppError>;

  abstract getAnalytics(params: {
    startDate: string;
    endDate: string;
  }): AsyncResult<MarketplaceAnalytics, AppError>;

  abstract syncProducts(): AsyncResult<SyncResult, AppError>;

  abstract syncOrders(): AsyncResult<SyncResult, AppError>;
}
