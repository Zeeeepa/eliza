/**
 * Unit tests for CostTrackerService
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CostTrackerService } from '../../services/cost-tracker.service';

describe('CostTrackerService', () => {
  let costTracker: CostTrackerService;

  beforeEach(() => {
    costTracker = new CostTrackerService();
  });

  describe('calculateCost', () => {
    it('should calculate cost for Claude 3.5 Sonnet', () => {
      const cost = costTracker.calculateCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
      });

      // Input: 1000 tokens * $3/1M = $0.003
      // Output: 2000 tokens * $15/1M = $0.03
      // Total: $0.033
      expect(cost).toBeCloseTo(0.033, 6);
    });

    it('should calculate cost for Claude 3 Haiku', () => {
      const cost = costTracker.calculateCost('claude-3-haiku-20240307', {
        inputTokens: 10000,
        outputTokens: 5000,
        totalTokens: 15000,
      });

      // Input: 10000 tokens * $0.25/1M = $0.0025
      // Output: 5000 tokens * $1.25/1M = $0.00625
      // Total: $0.00875
      expect(cost).toBeCloseTo(0.00875, 6);
    });

    it('should return 0 for unknown model', () => {
      const cost = costTracker.calculateCost('unknown-model' as any, {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      expect(cost).toBe(0);
    });
  });

  describe('trackCost', () => {
    it('should track a single cost', () => {
      const costData = costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      expect(costData).toHaveProperty('modelName', 'claude-3-5-sonnet-20241022');
      expect(costData).toHaveProperty('usage');
      expect(costData).toHaveProperty('estimatedCost');
      expect(costData).toHaveProperty('timestamp');
      expect(costData.estimatedCost).toBeGreaterThan(0);
    });

    it('should accumulate total cost', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      costTracker.trackCost('claude-3-haiku-20240307', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      const totalCost = costTracker.getTotalCost();
      expect(totalCost).toBeGreaterThan(0);
    });
  });

  describe('getCostByModel', () => {
    it('should group costs by model', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 2000,
        outputTokens: 2000,
        totalTokens: 4000,
      });

      costTracker.trackCost('claude-3-haiku-20240307', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      const breakdown = costTracker.getCostByModel();
      
      expect(breakdown).toHaveProperty('claude-3-5-sonnet-20241022');
      expect(breakdown).toHaveProperty('claude-3-haiku-20240307');
      expect(breakdown['claude-3-5-sonnet-20241022']).toBeGreaterThan(
        breakdown['claude-3-haiku-20240307']
      );
    });
  });

  describe('getTokenStats', () => {
    it('should return zero stats for empty tracker', () => {
      const stats = costTracker.getTokenStats();
      
      expect(stats.totalInputTokens).toBe(0);
      expect(stats.totalOutputTokens).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.averageInputTokens).toBe(0);
      expect(stats.averageOutputTokens).toBe(0);
    });

    it('should calculate token statistics', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 2000,
        totalTokens: 3000,
      });

      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 2000,
        outputTokens: 3000,
        totalTokens: 5000,
      });

      const stats = costTracker.getTokenStats();
      
      expect(stats.totalInputTokens).toBe(3000);
      expect(stats.totalOutputTokens).toBe(5000);
      expect(stats.totalTokens).toBe(8000);
      expect(stats.averageInputTokens).toBe(1500);
      expect(stats.averageOutputTokens).toBe(2500);
    });
  });

  describe('getCostForPeriod', () => {
    it('should filter costs by date range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 86400000);
      const tomorrow = new Date(now.getTime() + 86400000);

      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      const cost = costTracker.getCostForPeriod(yesterday, tomorrow);
      expect(cost).toBeGreaterThan(0);

      const noCost = costTracker.getCostForPeriod(
        new Date('2020-01-01'),
        new Date('2020-01-02')
      );
      expect(noCost).toBe(0);
    });
  });

  describe('getAverageCostPerRequest', () => {
    it('should calculate average cost', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      costTracker.trackCost('claude-3-haiku-20240307', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      const average = costTracker.getAverageCostPerRequest();
      expect(average).toBeGreaterThan(0);
      expect(average).toBe(costTracker.getTotalCost() / 2);
    });
  });

  describe('reset', () => {
    it('should clear all tracked costs', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      expect(costTracker.getTotalCost()).toBeGreaterThan(0);

      costTracker.reset();

      expect(costTracker.getTotalCost()).toBe(0);
      expect(costTracker.getCostHistory()).toHaveLength(0);
    });
  });

  describe('exportData', () => {
    it('should export data as JSON', () => {
      costTracker.trackCost('claude-3-5-sonnet-20241022', {
        inputTokens: 1000,
        outputTokens: 1000,
        totalTokens: 2000,
      });

      const exported = costTracker.exportData();
      const data = JSON.parse(exported);

      expect(data).toHaveProperty('costs');
      expect(data).toHaveProperty('totalCost');
      expect(data).toHaveProperty('summary');
      expect(data.costs).toHaveLength(1);
      expect(data.summary).toHaveProperty('totalRequests', 1);
    });
  });
});

