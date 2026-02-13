/**
 * Unit tests for RateLimiter
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '../../client/rate-limiter';

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter({
      requestsPerMinute: 10,
      tokensPerMinute: 1000,
      tokensPerDay: 100000,
    });
  });

  describe('canMakeRequest', () => {
    it('should allow requests within limits', async () => {
      const canMake = await rateLimiter.canMakeRequest(100);
      expect(canMake).toBe(true);
    });

    it('should deny requests exceeding token limit', async () => {
      const canMake = await rateLimiter.canMakeRequest(2000);
      expect(canMake).toBe(false);
    });

    it('should track multiple requests', async () => {
      for (let i = 0; i < 10; i++) {
        rateLimiter.consumeTokens(50);
      }
      
      const canMake = await rateLimiter.canMakeRequest(100);
      expect(canMake).toBe(true);
    });
  });

  describe('consumeTokens', () => {
    it('should consume tokens correctly', () => {
      const initialStatus = rateLimiter.getStatus();
      
      rateLimiter.consumeTokens(100);
      
      const afterStatus = rateLimiter.getStatus();
      expect(afterStatus.tokensRemaining).toBe(initialStatus.tokensRemaining - 100);
      expect(afterStatus.requestsRemaining).toBe(initialStatus.requestsRemaining - 1);
    });

    it('should consume daily tokens', () => {
      const initialStatus = rateLimiter.getStatus();
      
      rateLimiter.consumeTokens(500);
      
      const afterStatus = rateLimiter.getStatus();
      expect(afterStatus.dailyTokensRemaining).toBe(
        initialStatus.dailyTokensRemaining - 500
      );
    });
  });

  describe('getStatus', () => {
    it('should return current rate limit status', () => {
      const status = rateLimiter.getStatus();
      
      expect(status).toHaveProperty('requestsRemaining');
      expect(status).toHaveProperty('tokensRemaining');
      expect(status).toHaveProperty('dailyTokensRemaining');
      expect(status).toHaveProperty('resetTime');
      expect(status.resetTime).toBeInstanceOf(Date);
    });

    it('should reflect consumed tokens', () => {
      rateLimiter.consumeTokens(200);
      
      const status = rateLimiter.getStatus();
      expect(status.tokensRemaining).toBe(800);
      expect(status.requestsRemaining).toBe(9);
    });
  });

  describe('waitForCapacity', () => {
    it('should resolve immediately when capacity available', async () => {
      const startTime = Date.now();
      await rateLimiter.waitForCapacity(100);
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeLessThan(100); // Should be nearly instant
    });

    it('should wait when capacity not available', async () => {
      // Consume all tokens
      rateLimiter.consumeTokens(1000);
      
      const startTime = Date.now();
      
      // This should wait, but we'll add a timeout for the test
      const waitPromise = rateLimiter.waitForCapacity(100);
      const timeoutPromise = new Promise(resolve => 
        setTimeout(() => resolve('timeout'), 200)
      );
      
      const result = await Promise.race([waitPromise, timeoutPromise]);
      const elapsed = Date.now() - startTime;
      
      expect(result).toBe('timeout');
      expect(elapsed).toBeGreaterThan(150);
    }, 10000);
  });

  describe('reset', () => {
    it('should reset all limits', () => {
      rateLimiter.consumeTokens(500);
      rateLimiter.consumeTokens(500);
      
      rateLimiter.reset();
      
      const status = rateLimiter.getStatus();
      expect(status.requestsRemaining).toBe(10);
      expect(status.tokensRemaining).toBe(1000);
      expect(status.dailyTokensRemaining).toBe(100000);
    });
  });
});

