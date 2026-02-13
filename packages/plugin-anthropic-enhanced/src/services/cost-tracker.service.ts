/**
 * Cost tracking service for Anthropic API usage
 */

import type { CostData, TokenUsage, ClaudeModel } from '../types';
import { CLAUDE_MODELS } from '../types';

export class CostTrackerService {
  private costs: CostData[] = [];
  private totalCost = 0;

  /**
   * Calculate cost for a model usage
   */
  calculateCost(modelName: ClaudeModel, usage: TokenUsage): number {
    const pricing = CLAUDE_MODELS[modelName];
    
    if (!pricing) {
      console.warn(`Unknown model: ${modelName}. Cost calculation skipped.`);
      return 0;
    }

    // Calculate cost (prices are per 1M tokens)
    const inputCost = (usage.inputTokens / 1_000_000) * pricing.inputTokenPrice;
    const outputCost = (usage.outputTokens / 1_000_000) * pricing.outputTokenPrice;
    
    return inputCost + outputCost;
  }

  /**
   * Track a new API call cost
   */
  trackCost(modelName: ClaudeModel, usage: TokenUsage): CostData {
    const estimatedCost = this.calculateCost(modelName, usage);
    
    const costData: CostData = {
      modelName,
      usage,
      estimatedCost,
      timestamp: new Date(),
    };

    this.costs.push(costData);
    this.totalCost += estimatedCost;

    return costData;
  }

  /**
   * Get total cost
   */
  getTotalCost(): number {
    return this.totalCost;
  }

  /**
   * Get cost history
   */
  getCostHistory(): CostData[] {
    return [...this.costs];
  }

  /**
   * Get cost breakdown by model
   */
  getCostByModel(): Record<string, number> {
    const breakdown: Record<string, number> = {};

    for (const cost of this.costs) {
      if (!breakdown[cost.modelName]) {
        breakdown[cost.modelName] = 0;
      }
      breakdown[cost.modelName] += cost.estimatedCost;
    }

    return breakdown;
  }

  /**
   * Get cost for a specific time period
   */
  getCostForPeriod(startDate: Date, endDate: Date): number {
    return this.costs
      .filter(cost => 
        cost.timestamp >= startDate && 
        cost.timestamp <= endDate
      )
      .reduce((sum, cost) => sum + cost.estimatedCost, 0);
  }

  /**
   * Get average cost per request
   */
  getAverageCostPerRequest(): number {
    if (this.costs.length === 0) return 0;
    return this.totalCost / this.costs.length;
  }

  /**
   * Get token usage statistics
   */
  getTokenStats(): {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalTokens: number;
    averageInputTokens: number;
    averageOutputTokens: number;
  } {
    if (this.costs.length === 0) {
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
      };
    }

    const totalInputTokens = this.costs.reduce((sum, c) => sum + c.usage.inputTokens, 0);
    const totalOutputTokens = this.costs.reduce((sum, c) => sum + c.usage.outputTokens, 0);

    return {
      totalInputTokens,
      totalOutputTokens,
      totalTokens: totalInputTokens + totalOutputTokens,
      averageInputTokens: totalInputTokens / this.costs.length,
      averageOutputTokens: totalOutputTokens / this.costs.length,
    };
  }

  /**
   * Get daily cost report
   */
  getDailyCostReport(): Record<string, number> {
    const dailyCosts: Record<string, number> = {};

    for (const cost of this.costs) {
      const dateKey = cost.timestamp.toISOString().split('T')[0];
      if (!dailyCosts[dateKey]) {
        dailyCosts[dateKey] = 0;
      }
      dailyCosts[dateKey] += cost.estimatedCost;
    }

    return dailyCosts;
  }

  /**
   * Estimate cost for a future request
   */
  estimateCostForRequest(
    modelName: ClaudeModel,
    estimatedInputTokens: number,
    estimatedOutputTokens: number
  ): number {
    return this.calculateCost(modelName, {
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
    });
  }

  /**
   * Reset cost tracking
   */
  reset(): void {
    this.costs = [];
    this.totalCost = 0;
  }

  /**
   * Export cost data as JSON
   */
  exportData(): string {
    return JSON.stringify({
      costs: this.costs,
      totalCost: this.totalCost,
      summary: {
        totalRequests: this.costs.length,
        costByModel: this.getCostByModel(),
        tokenStats: this.getTokenStats(),
        averageCostPerRequest: this.getAverageCostPerRequest(),
      },
    }, null, 2);
  }
}

