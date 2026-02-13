/**
 * Retry handler with exponential backoff for Anthropic API calls
 */

import type { RetryConfig, AnthropicError, AnthropicErrorType } from '../types';
import { AnthropicErrorType as ErrorType } from '../types';

export class RetryHandler {
  constructor(private config: RetryConfig) {}

  /**
   * Execute a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: Error | undefined;
    let delay = this.config.initialDelay;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        const anthropicError = this.classifyError(error);

        // Don't retry non-retryable errors
        if (!anthropicError.retryable) {
          throw anthropicError;
        }

        // Don't retry on last attempt
        if (attempt === this.config.maxAttempts) {
          throw anthropicError;
        }

        // Calculate delay with exponential backoff
        const waitTime = anthropicError.retryAfter 
          ? anthropicError.retryAfter * 1000 
          : Math.min(delay, this.config.maxDelay);

        console.warn(
          `Attempt ${attempt}/${this.config.maxAttempts} failed${context ? ` (${context})` : ''}: ${anthropicError.message}. Retrying in ${waitTime}ms...`
        );

        await this.sleep(waitTime);
        delay *= this.config.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * Classify and enhance error information
   */
  private classifyError(error: unknown): AnthropicError {
    const originalError = error as any;
    
    // Check if it's already an AnthropicError
    if (originalError.type && originalError.retryable !== undefined) {
      return originalError;
    }

    let type: AnthropicErrorType = ErrorType.UNKNOWN;
    let retryable = false;
    let retryAfter: number | undefined;
    let statusCode: number | undefined = originalError.status;

    // Classify based on status code
    if (statusCode) {
      if (statusCode === 429) {
        type = ErrorType.RATE_LIMIT;
        retryable = true;
        retryAfter = originalError.headers?.['retry-after'] 
          ? parseInt(originalError.headers['retry-after']) 
          : 60;
      } else if (statusCode === 401) {
        type = ErrorType.AUTHENTICATION;
        retryable = false;
      } else if (statusCode === 403) {
        type = ErrorType.PERMISSION;
        retryable = false;
      } else if (statusCode === 404) {
        type = ErrorType.NOT_FOUND;
        retryable = false;
      } else if (statusCode === 400) {
        type = ErrorType.INVALID_REQUEST;
        retryable = false;
      } else if (statusCode === 529) {
        type = ErrorType.OVERLOADED;
        retryable = true;
      } else if (statusCode >= 500) {
        type = ErrorType.API_ERROR;
        retryable = true;
      }
    }

    // Classify based on error type/message
    const errorMessage = originalError.message?.toLowerCase() || '';
    if (errorMessage.includes('timeout')) {
      type = ErrorType.TIMEOUT;
      retryable = true;
    } else if (errorMessage.includes('network')) {
      type = ErrorType.NETWORK_ERROR;
      retryable = true;
    }

    const enhancedError = new Error(
      originalError.message || 'Unknown error occurred'
    ) as AnthropicError;

    enhancedError.type = type;
    enhancedError.statusCode = statusCode;
    enhancedError.retryable = retryable;
    enhancedError.retryAfter = retryAfter;
    enhancedError.originalError = originalError;

    return enhancedError;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if an error is retryable
   */
  isRetryable(error: unknown): boolean {
    const anthropicError = this.classifyError(error);
    return anthropicError.retryable;
  }

  /**
   * Get retry delay for an error
   */
  getRetryDelay(error: unknown, attempt: number): number {
    const anthropicError = this.classifyError(error);
    
    if (anthropicError.retryAfter) {
      return anthropicError.retryAfter * 1000;
    }

    const delay = this.config.initialDelay * Math.pow(this.config.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.config.maxDelay);
  }
}

