/**
 * Rate limiter for Anthropic API calls
 * Implements token bucket algorithm with request and token limits
 */

import type { RateLimitConfig, RateLimitStatus } from '../types';

export class RateLimiter {
  private requestTokens: number;
  private minuteTokens: number;
  private dailyTokens: number;
  private lastRequestReset: Date;
  private lastMinuteReset: Date;
  private lastDayReset: Date;

  constructor(private config: RateLimitConfig) {
    this.requestTokens = config.requestsPerMinute;
    this.minuteTokens = config.tokensPerMinute;
    this.dailyTokens = config.tokensPerDay;
    
    const now = new Date();
    this.lastRequestReset = now;
    this.lastMinuteReset = now;
    this.lastDayReset = now;
  }

  /**
   * Check if a request can be made with the given token count
   */
  async canMakeRequest(estimatedTokens: number): Promise<boolean> {
    this.refillBuckets();
    
    return (
      this.requestTokens > 0 &&
      this.minuteTokens >= estimatedTokens &&
      this.dailyTokens >= estimatedTokens
    );
  }

  /**
   * Wait until a request can be made
   */
  async waitForCapacity(estimatedTokens: number): Promise<void> {
    while (!(await this.canMakeRequest(estimatedTokens))) {
      const waitTime = this.calculateWaitTime(estimatedTokens);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Consume tokens for a request
   */
  consumeTokens(tokenCount: number): void {
    this.refillBuckets();
    this.requestTokens--;
    this.minuteTokens -= tokenCount;
    this.dailyTokens -= tokenCount;
  }

  /**
   * Get current rate limit status
   */
  getStatus(): RateLimitStatus {
    this.refillBuckets();
    
    return {
      requestsRemaining: this.requestTokens,
      tokensRemaining: this.minuteTokens,
      dailyTokensRemaining: this.dailyTokens,
      resetTime: this.getNextResetTime(),
    };
  }

  /**
   * Refill token buckets based on elapsed time
   */
  private refillBuckets(): void {
    const now = new Date();
    
    // Refill request tokens every minute
    if (now.getTime() - this.lastRequestReset.getTime() >= 60000) {
      this.requestTokens = this.config.requestsPerMinute;
      this.lastRequestReset = now;
    }
    
    // Refill minute tokens every minute
    if (now.getTime() - this.lastMinuteReset.getTime() >= 60000) {
      this.minuteTokens = this.config.tokensPerMinute;
      this.lastMinuteReset = now;
    }
    
    // Refill daily tokens every day
    if (now.getTime() - this.lastDayReset.getTime() >= 86400000) {
      this.dailyTokens = this.config.tokensPerDay;
      this.lastDayReset = now;
    }
  }

  /**
   * Calculate how long to wait before the next request
   */
  private calculateWaitTime(estimatedTokens: number): number {
    const now = new Date();
    const waitTimes: number[] = [];
    
    // Wait for request bucket
    if (this.requestTokens <= 0) {
      const timeSinceLastReset = now.getTime() - this.lastRequestReset.getTime();
      waitTimes.push(60000 - timeSinceLastReset);
    }
    
    // Wait for minute token bucket
    if (this.minuteTokens < estimatedTokens) {
      const timeSinceLastReset = now.getTime() - this.lastMinuteReset.getTime();
      waitTimes.push(60000 - timeSinceLastReset);
    }
    
    // Wait for daily token bucket
    if (this.dailyTokens < estimatedTokens) {
      const timeSinceLastReset = now.getTime() - this.lastDayReset.getTime();
      waitTimes.push(86400000 - timeSinceLastReset);
    }
    
    return Math.max(...waitTimes, 100); // Minimum 100ms wait
  }

  /**
   * Get the next time when tokens will be refilled
   */
  private getNextResetTime(): Date {
    const now = new Date();
    const minuteReset = new Date(this.lastMinuteReset.getTime() + 60000);
    const dayReset = new Date(this.lastDayReset.getTime() + 86400000);
    
    // Return the soonest reset time
    return minuteReset < dayReset ? minuteReset : dayReset;
  }

  /**
   * Reset all rate limits (useful for testing)
   */
  reset(): void {
    const now = new Date();
    this.requestTokens = this.config.requestsPerMinute;
    this.minuteTokens = this.config.tokensPerMinute;
    this.dailyTokens = this.config.tokensPerDay;
    this.lastRequestReset = now;
    this.lastMinuteReset = now;
    this.lastDayReset = now;
  }
}

