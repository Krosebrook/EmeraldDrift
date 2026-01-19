import { ok, err, AsyncResult, isOk } from "@/core/result";
import { AppError, ErrorCode } from "@/core/errors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { unifiedMarketplaceService } from "@/features/marketplaces/service";
import { orderListenerService } from "@/features/orders/service";
import type { MarketplaceType, MarketplaceOrder, MarketplaceProduct } from "@/features/marketplaces/types";

const PREDICTIONS_STORAGE_KEY = "@pod_predictions";
const HISTORICAL_DATA_KEY = "@pod_historical_data";

export interface SalesPrediction {
  id: string;
  productId: string;
  productTitle: string;
  marketplace: MarketplaceType;
  predictedUnits: number;
  predictedRevenue: number;
  confidence: number;
  period: "day" | "week" | "month";
  startDate: string;
  endDate: string;
  factors: PredictionFactor[];
  createdAt: string;
}

export interface PredictionFactor {
  name: string;
  impact: number;
  description: string;
}

export interface TrendData {
  date: string;
  value: number;
}

export interface ProductTrend {
  productId: string;
  productTitle: string;
  marketplace: MarketplaceType;
  trend: "rising" | "stable" | "declining";
  percentageChange: number;
  historicalData: TrendData[];
  forecastData: TrendData[];
}

export interface InventoryForecast {
  productId: string;
  productTitle: string;
  marketplace: MarketplaceType;
  currentStock: number;
  predictedDailySales: number;
  daysUntilStockout: number;
  reorderPoint: number;
  suggestedReorderQuantity: number;
  urgency: "critical" | "warning" | "normal";
}

export interface SeasonalityPattern {
  period: "daily" | "weekly" | "monthly" | "yearly";
  patterns: Array<{
    label: string;
    multiplier: number;
  }>;
}

export interface PredictionEngineService {
  generateSalesPredictions(options?: {
    marketplaces?: MarketplaceType[];
    period?: "day" | "week" | "month";
    productIds?: string[];
  }): AsyncResult<SalesPrediction[], AppError>;
  
  getProductTrends(options?: {
    marketplaces?: MarketplaceType[];
    limit?: number;
  }): AsyncResult<ProductTrend[], AppError>;
  
  getInventoryForecasts(options?: {
    marketplaces?: MarketplaceType[];
    urgencyFilter?: "critical" | "warning" | "normal";
  }): AsyncResult<InventoryForecast[], AppError>;
  
  getSeasonalityPatterns(): AsyncResult<SeasonalityPattern[], AppError>;
  
  getRevenueForecast(params: {
    startDate: string;
    endDate: string;
    marketplaces?: MarketplaceType[];
  }): AsyncResult<{
    predictedRevenue: number;
    confidence: number;
    breakdown: Array<{
      date: string;
      predicted: number;
      lower: number;
      upper: number;
    }>;
  }, AppError>;
  
  refreshPredictions(): AsyncResult<void, AppError>;
}

class PredictionEngineServiceImpl implements PredictionEngineService {
  private historicalData: Map<string, Array<{ date: string; units: number; revenue: number }>> = new Map();

  async generateSalesPredictions(options?: {
    marketplaces?: MarketplaceType[];
    period?: "day" | "week" | "month";
    productIds?: string[];
  }): AsyncResult<SalesPrediction[], AppError> {
    const period = options?.period || "week";
    
    const ordersResult = await unifiedMarketplaceService.getAllOrders({
      marketplaces: options?.marketplaces,
      limit: 500,
      since: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!isOk(ordersResult)) return err(ordersResult.error);

    const productSales = this.aggregateProductSales(ordersResult.data);
    
    const predictions: SalesPrediction[] = [];

    for (const [key, sales] of productSales.entries()) {
      const [marketplace, productId] = key.split(":");
      
      if (options?.productIds && !options.productIds.includes(productId)) continue;

      const prediction = this.calculatePrediction(
        productId,
        sales.title,
        marketplace as MarketplaceType,
        sales.history,
        period
      );

      predictions.push(prediction);
    }

    predictions.sort((a, b) => b.predictedRevenue - a.predictedRevenue);

    await this.persistPredictions(predictions);

    return ok(predictions);
  }

  async getProductTrends(options?: {
    marketplaces?: MarketplaceType[];
    limit?: number;
  }): AsyncResult<ProductTrend[], AppError> {
    const ordersResult = await unifiedMarketplaceService.getAllOrders({
      marketplaces: options?.marketplaces,
      limit: 1000,
      since: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (!isOk(ordersResult)) return err(ordersResult.error);

    const productSales = this.aggregateProductSales(ordersResult.data);
    const trends: ProductTrend[] = [];

    for (const [key, sales] of productSales.entries()) {
      const [marketplace, productId] = key.split(":");
      const trend = this.calculateTrend(
        productId,
        sales.title,
        marketplace as MarketplaceType,
        sales.history
      );
      trends.push(trend);
    }

    trends.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));

    return ok(trends.slice(0, options?.limit || 20));
  }

  async getInventoryForecasts(options?: {
    marketplaces?: MarketplaceType[];
    urgencyFilter?: "critical" | "warning" | "normal";
  }): AsyncResult<InventoryForecast[], AppError> {
    const [productsResult, ordersResult] = await Promise.all([
      unifiedMarketplaceService.getAllProducts({ marketplaces: options?.marketplaces }),
      unifiedMarketplaceService.getAllOrders({
        marketplaces: options?.marketplaces,
        limit: 500,
        since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    ]);

    if (!isOk(productsResult)) return err(productsResult.error);
    if (!isOk(ordersResult)) return err(ordersResult.error);

    const productSales = this.aggregateProductSales(ordersResult.data);
    const forecasts: InventoryForecast[] = [];

    for (const product of productsResult.data) {
      const key = `${product.marketplace}:${product.id}`;
      const sales = productSales.get(key);
      
      const dailySales = sales 
        ? sales.history.reduce((sum, h) => sum + h.units, 0) / 30
        : 0.1;

      const currentStock = product.quantity || 0;
      const daysUntilStockout = dailySales > 0 ? Math.floor(currentStock / dailySales) : 999;
      const reorderPoint = Math.ceil(dailySales * 14);
      const suggestedReorderQuantity = Math.ceil(dailySales * 30);

      let urgency: "critical" | "warning" | "normal" = "normal";
      if (daysUntilStockout <= 7) urgency = "critical";
      else if (daysUntilStockout <= 14) urgency = "warning";

      if (options?.urgencyFilter && urgency !== options.urgencyFilter) continue;

      forecasts.push({
        productId: product.id,
        productTitle: product.title,
        marketplace: product.marketplace,
        currentStock,
        predictedDailySales: dailySales,
        daysUntilStockout,
        reorderPoint,
        suggestedReorderQuantity,
        urgency,
      });
    }

    forecasts.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout);

    return ok(forecasts);
  }

  async getSeasonalityPatterns(): AsyncResult<SeasonalityPattern[], AppError> {
    return ok([
      {
        period: "weekly",
        patterns: [
          { label: "Monday", multiplier: 0.85 },
          { label: "Tuesday", multiplier: 0.90 },
          { label: "Wednesday", multiplier: 0.95 },
          { label: "Thursday", multiplier: 1.00 },
          { label: "Friday", multiplier: 1.15 },
          { label: "Saturday", multiplier: 1.20 },
          { label: "Sunday", multiplier: 0.95 },
        ],
      },
      {
        period: "monthly",
        patterns: [
          { label: "Week 1", multiplier: 1.10 },
          { label: "Week 2", multiplier: 0.95 },
          { label: "Week 3", multiplier: 0.90 },
          { label: "Week 4", multiplier: 1.05 },
        ],
      },
      {
        period: "yearly",
        patterns: [
          { label: "January", multiplier: 0.80 },
          { label: "February", multiplier: 0.85 },
          { label: "March", multiplier: 0.90 },
          { label: "April", multiplier: 0.95 },
          { label: "May", multiplier: 1.00 },
          { label: "June", multiplier: 0.95 },
          { label: "July", multiplier: 0.90 },
          { label: "August", multiplier: 0.95 },
          { label: "September", multiplier: 1.00 },
          { label: "October", multiplier: 1.05 },
          { label: "November", multiplier: 1.30 },
          { label: "December", multiplier: 1.40 },
        ],
      },
    ]);
  }

  async getRevenueForecast(params: {
    startDate: string;
    endDate: string;
    marketplaces?: MarketplaceType[];
  }): AsyncResult<{
    predictedRevenue: number;
    confidence: number;
    breakdown: Array<{
      date: string;
      predicted: number;
      lower: number;
      upper: number;
    }>;
  }, AppError> {
    const analyticsResult = await unifiedMarketplaceService.getAggregatedAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date().toISOString(),
      marketplaces: params.marketplaces,
    });

    if (!isOk(analyticsResult)) return err(analyticsResult.error);

    const dailyRevenue = analyticsResult.data.totalRevenue / 30;
    const startDate = new Date(params.startDate);
    const endDate = new Date(params.endDate);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));

    const breakdown: Array<{
      date: string;
      predicted: number;
      lower: number;
      upper: number;
    }> = [];

    let totalPredicted = 0;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      
      const weeklyMultipliers = [0.95, 0.85, 0.90, 0.95, 1.00, 1.15, 1.20];
      const multiplier = weeklyMultipliers[dayOfWeek];
      
      const predicted = dailyRevenue * multiplier;
      const variance = predicted * 0.2;

      totalPredicted += predicted;

      breakdown.push({
        date: date.toISOString().split("T")[0],
        predicted: Math.round(predicted * 100) / 100,
        lower: Math.round((predicted - variance) * 100) / 100,
        upper: Math.round((predicted + variance) * 100) / 100,
      });
    }

    const confidence = Math.max(0.5, Math.min(0.9, 0.85 - (days * 0.005)));

    return ok({
      predictedRevenue: Math.round(totalPredicted * 100) / 100,
      confidence,
      breakdown,
    });
  }

  async refreshPredictions(): AsyncResult<void, AppError> {
    await this.generateSalesPredictions();
    return ok(undefined);
  }

  private aggregateProductSales(orders: MarketplaceOrder[]): Map<string, {
    title: string;
    history: Array<{ date: string; units: number; revenue: number }>;
  }> {
    const productSales = new Map<string, {
      title: string;
      dailyData: Map<string, { units: number; revenue: number }>;
    }>();

    for (const order of orders) {
      const orderDate = order.createdAt.split("T")[0];
      
      for (const item of order.items) {
        const key = `${order.marketplace}:${item.productId}`;
        
        if (!productSales.has(key)) {
          productSales.set(key, {
            title: item.title,
            dailyData: new Map(),
          });
        }

        const product = productSales.get(key)!;
        const existing = product.dailyData.get(orderDate) || { units: 0, revenue: 0 };
        existing.units += item.quantity;
        existing.revenue += item.total;
        product.dailyData.set(orderDate, existing);
      }
    }

    const result = new Map<string, {
      title: string;
      history: Array<{ date: string; units: number; revenue: number }>;
    }>();

    for (const [key, data] of productSales.entries()) {
      const history = Array.from(data.dailyData.entries())
        .map(([date, values]) => ({ date, ...values }))
        .sort((a, b) => a.date.localeCompare(b.date));

      result.set(key, {
        title: data.title,
        history,
      });
    }

    return result;
  }

  private calculatePrediction(
    productId: string,
    title: string,
    marketplace: MarketplaceType,
    history: Array<{ date: string; units: number; revenue: number }>,
    period: "day" | "week" | "month"
  ): SalesPrediction {
    const recentHistory = history.slice(-30);
    
    const totalUnits = recentHistory.reduce((sum, h) => sum + h.units, 0);
    const totalRevenue = recentHistory.reduce((sum, h) => sum + h.revenue, 0);
    const daysWithData = recentHistory.length || 1;
    
    const dailyUnits = totalUnits / daysWithData;
    const dailyRevenue = totalRevenue / daysWithData;

    const periodMultiplier = period === "day" ? 1 : period === "week" ? 7 : 30;
    
    const trendFactor = this.calculateTrendFactor(recentHistory);
    const seasonalFactor = this.getSeasonalFactor();

    const adjustedUnits = dailyUnits * periodMultiplier * trendFactor * seasonalFactor;
    const adjustedRevenue = dailyRevenue * periodMultiplier * trendFactor * seasonalFactor;

    const confidence = Math.min(0.9, 0.5 + (daysWithData * 0.01));

    const now = new Date();
    const endDate = new Date(now);
    if (period === "day") endDate.setDate(endDate.getDate() + 1);
    else if (period === "week") endDate.setDate(endDate.getDate() + 7);
    else endDate.setMonth(endDate.getMonth() + 1);

    return {
      id: `pred_${productId}_${Date.now()}`,
      productId,
      productTitle: title,
      marketplace,
      predictedUnits: Math.round(adjustedUnits),
      predictedRevenue: Math.round(adjustedRevenue * 100) / 100,
      confidence,
      period,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      factors: [
        {
          name: "Historical Trend",
          impact: trendFactor > 1 ? (trendFactor - 1) * 100 : (1 - trendFactor) * -100,
          description: trendFactor > 1 ? "Sales trending upward" : "Sales trending downward",
        },
        {
          name: "Seasonality",
          impact: seasonalFactor > 1 ? (seasonalFactor - 1) * 100 : (1 - seasonalFactor) * -100,
          description: "Seasonal adjustment based on time of year",
        },
      ],
      createdAt: new Date().toISOString(),
    };
  }

  private calculateTrend(
    productId: string,
    title: string,
    marketplace: MarketplaceType,
    history: Array<{ date: string; units: number; revenue: number }>
  ): ProductTrend {
    const historicalData: TrendData[] = history.map((h) => ({
      date: h.date,
      value: h.revenue,
    }));

    const trendFactor = this.calculateTrendFactor(history);
    const percentageChange = (trendFactor - 1) * 100;

    let trend: "rising" | "stable" | "declining" = "stable";
    if (percentageChange > 10) trend = "rising";
    else if (percentageChange < -10) trend = "declining";

    const lastValue = history[history.length - 1]?.revenue || 0;
    const forecastData: TrendData[] = [];
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      forecastData.push({
        date: date.toISOString().split("T")[0],
        value: lastValue * Math.pow(trendFactor, i / 7),
      });
    }

    return {
      productId,
      productTitle: title,
      marketplace,
      trend,
      percentageChange,
      historicalData,
      forecastData,
    };
  }

  private calculateTrendFactor(history: Array<{ units: number; revenue: number }>): number {
    if (history.length < 7) return 1;

    const recentWeek = history.slice(-7);
    const previousWeek = history.slice(-14, -7);

    if (previousWeek.length === 0) return 1;

    const recentAvg = recentWeek.reduce((sum, h) => sum + h.units, 0) / recentWeek.length;
    const previousAvg = previousWeek.reduce((sum, h) => sum + h.units, 0) / previousWeek.length;

    if (previousAvg === 0) return 1;

    return Math.min(2, Math.max(0.5, recentAvg / previousAvg));
  }

  private getSeasonalFactor(): number {
    const month = new Date().getMonth();
    const monthlyFactors = [0.80, 0.85, 0.90, 0.95, 1.00, 0.95, 0.90, 0.95, 1.00, 1.05, 1.30, 1.40];
    return monthlyFactors[month];
  }

  private async persistPredictions(predictions: SalesPrediction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PREDICTIONS_STORAGE_KEY, JSON.stringify(predictions));
    } catch (error) {
      console.error("Failed to persist predictions:", error);
    }
  }
}

export const predictionEngineService = new PredictionEngineServiceImpl();
