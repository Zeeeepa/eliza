/**
 * Unit tests for RetryHandler
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetryHandler } from '../../client/retry-handler';
import { AnthropicErrorType } from '../../types';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler({
      maxAttempts: 3,
      initialDelay: 100,
      maxDelay: 5000,
      backoffMultiplier: 2,
    });
  });

  describe('execute', () => {
    it('should succeed on first attempt', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      
      const result = await retryHandler.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Timeout'))
        .mockResolvedValue('success');
      
      const result = await retryHandler.execute(fn);
      
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      const error = {
        message: 'Invalid API key',
        status: 401,
      };
      const fn = vi.fn().mockRejectedValue(error);
      
      await expect(retryHandler.execute(fn)).rejects.toThrow();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('Always fails'));
      
      await expect(retryHandler.execute(fn)).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      await retryHandler.execute(fn);
      const elapsed = Date.now() - startTime;
      
      // Should wait at least 100ms + 200ms = 300ms
      expect(elapsed).toBeGreaterThan(280);
      expect(fn).toHaveBeenCalledTimes(3);
    });
  });

  describe('isRetryable', () => {
    it('should identify rate limit errors as retryable', () => {
      const error = { status: 429, message: 'Too many requests' };
      expect(retryHandler.isRetryable(error)).toBe(true);
    });

    it('should identify 5xx errors as retryable', () => {
      const error = { status: 500, message: 'Internal server error' };
      expect(retryHandler.isRetryable(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error = new Error('Network timeout');
      expect(retryHandler.isRetryable(error)).toBe(true);
    });

    it('should identify auth errors as non-retryable', () => {
      const error = { status: 401, message: 'Unauthorized' };
      expect(retryHandler.isRetryable(error)).toBe(false);
    });

    it('should identify bad request errors as non-retryable', () => {
      const error = { status: 400, message: 'Bad request' };
      expect(retryHandler.isRetryable(error)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return initial delay for first attempt', () => {
      const delay = retryHandler.getRetryDelay(new Error('test'), 1);
      expect(delay).toBe(100);
    });

    it('should apply exponential backoff', () => {
      const delay1 = retryHandler.getRetryDelay(new Error('test'), 1);
      const delay2 = retryHandler.getRetryDelay(new Error('test'), 2);
      const delay3 = retryHandler.getRetryDelay(new Error('test'), 3);
      
      expect(delay2).toBe(delay1 * 2);
      expect(delay3).toBe(delay1 * 4);
    });

    it('should respect max delay', () => {
      const delay = retryHandler.getRetryDelay(new Error('test'), 10);
      expect(delay).toBeLessThanOrEqual(5000);
    });

    it('should honor retry-after header', () => {
      const error = {
        status: 429,
        headers: { 'retry-after': '30' },
      };
      const delay = retryHandler.getRetryDelay(error, 1);
      expect(delay).toBe(30000); // 30 seconds in ms
    });
  });
});

