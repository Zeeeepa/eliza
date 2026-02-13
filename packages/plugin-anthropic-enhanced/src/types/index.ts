/**
 * Type definitions for Enhanced Anthropic Plugin
 */

import type Anthropic from '@anthropic-ai/sdk';

/**
 * Anthropic API configuration
 */
export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
  maxRetries?: number;
  timeout?: number;
  defaultModel?: string;
}

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  tokensPerDay: number;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

/**
 * Completion request parameters
 */
export interface CompletionRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  stream?: boolean;
  stopSequences?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Completion response
 */
export interface CompletionResponse {
  id: string;
  content: string;
  model: string;
  stopReason: string | null;
  usage: TokenUsage;
  metadata?: Record<string, unknown>;
}

/**
 * Streaming chunk data
 */
export interface StreamChunk {
  type: 'content_block_delta' | 'message_start' | 'message_delta' | 'message_stop';
  content?: string;
  usage?: Partial<TokenUsage>;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

/**
 * Cost tracking data
 */
export interface CostData {
  modelName: string;
  usage: TokenUsage;
  estimatedCost: number;
  timestamp: Date;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  requestsRemaining: number;
  tokensRemaining: number;
  dailyTokensRemaining: number;
  resetTime: Date;
}

/**
 * Error types
 */
export enum AnthropicErrorType {
  RATE_LIMIT = 'rate_limit_error',
  INVALID_REQUEST = 'invalid_request_error',
  AUTHENTICATION = 'authentication_error',
  PERMISSION = 'permission_error',
  NOT_FOUND = 'not_found_error',
  OVERLOADED = 'overloaded_error',
  API_ERROR = 'api_error',
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout_error',
  UNKNOWN = 'unknown_error',
}

/**
 * Enhanced error information
 */
export interface AnthropicError extends Error {
  type: AnthropicErrorType;
  statusCode?: number;
  retryable: boolean;
  retryAfter?: number;
  originalError?: unknown;
}

/**
 * Model pricing information (USD per 1M tokens)
 */
export interface ModelPricing {
  inputTokenPrice: number;  // Cost per 1M input tokens
  outputTokenPrice: number; // Cost per 1M output tokens
}

/**
 * Available Claude models with pricing
 */
export const CLAUDE_MODELS = {
  'claude-3-5-sonnet-20241022': {
    inputTokenPrice: 3.0,
    outputTokenPrice: 15.0,
  },
  'claude-3-5-haiku-20241022': {
    inputTokenPrice: 1.0,
    outputTokenPrice: 5.0,
  },
  'claude-3-opus-20240229': {
    inputTokenPrice: 15.0,
    outputTokenPrice: 75.0,
  },
  'claude-3-sonnet-20240229': {
    inputTokenPrice: 3.0,
    outputTokenPrice: 15.0,
  },
  'claude-3-haiku-20240307': {
    inputTokenPrice: 0.25,
    outputTokenPrice: 1.25,
  },
} as const satisfies Record<string, ModelPricing>;

export type ClaudeModel = keyof typeof CLAUDE_MODELS;

/**
 * Client statistics
 */
export interface ClientStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokensUsed: number;
  totalCost: number;
  averageLatency: number;
  uptime: number;
}

/**
 * Health check result
 */
export interface HealthCheck {
  healthy: boolean;
  latency?: number;
  error?: string;
  timestamp: Date;
}

/**
 * Re-export Anthropic SDK types for convenience
 */
export type {
  Message,
  MessageParam,
  ContentBlock,
  TextBlock,
  MessageCreateParams,
  MessageStreamEvent,
} from '@anthropic-ai/sdk/resources/messages';

