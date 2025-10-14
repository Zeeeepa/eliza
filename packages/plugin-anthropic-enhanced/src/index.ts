/**
 * Enhanced Anthropic Plugin for ElizaOS
 * 
 * Provides comprehensive integration with Anthropic Claude API including:
 * - Rate limiting and request management
 * - Automatic retry with exponential backoff
 * - Cost tracking and usage analytics
 * - Streaming support
 * - Health monitoring
 */

export { AnthropicClient } from './client/anthropic-client';
export { RateLimiter } from './client/rate-limiter';
export { RetryHandler } from './client/retry-handler';
export { CostTrackerService } from './services/cost-tracker.service';

export type {
  AnthropicConfig,
  RateLimitConfig,
  RetryConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  TokenUsage,
  CostData,
  RateLimitStatus,
  AnthropicError,
  ClientStats,
  HealthCheck,
  ClaudeModel,
  ModelPricing,
} from './types';

export { CLAUDE_MODELS, AnthropicErrorType } from './types';

