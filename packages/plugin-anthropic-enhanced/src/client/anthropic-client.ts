/**
 * Enhanced Anthropic API client with rate limiting, retry logic, and monitoring
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AnthropicConfig,
  CompletionRequest,
  CompletionResponse,
  StreamChunk,
  ClientStats,
  HealthCheck,
  TokenUsage,
} from '../types';
import { RateLimiter } from './rate-limiter';
import { RetryHandler } from './retry-handler';

export class AnthropicClient {
  private client: Anthropic;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  private stats: ClientStats;
  private startTime: Date;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      maxRetries: 0, // We handle retries ourselves
      timeout: config.timeout || 60000,
    });

    this.rateLimiter = new RateLimiter({
      requestsPerMinute: 50,
      tokensPerMinute: 40000,
      tokensPerDay: 5000000,
    });

    this.retryHandler = new RetryHandler({
      maxAttempts: config.maxRetries || 3,
      initialDelay: 1000,
      maxDelay: 60000,
      backoffMultiplier: 2,
    });

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      uptime: 0,
    };

    this.startTime = new Date();
  }

  /**
   * Create a completion with retry and rate limiting
   */
  async createCompletion(request: CompletionRequest): Promise<CompletionResponse> {
    const startTime = Date.now();
    const estimatedTokens = this.estimateTokens(request.prompt);

    // Wait for rate limit capacity
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    try {
      const response = await this.retryHandler.execute(async () => {
        return await this.client.messages.create({
          model: request.model || 'claude-3-5-sonnet-20241022',
          max_tokens: request.maxTokens || 4096,
          temperature: request.temperature,
          top_p: request.topP,
          top_k: request.topK,
          stop_sequences: request.stopSequences,
          messages: [
            {
              role: 'user',
              content: request.prompt,
            },
          ],
          metadata: request.metadata as any,
        });
      }, 'createCompletion');

      // Update stats
      const latency = Date.now() - startTime;
      this.updateStats(true, latency, response.usage);
      
      // Consume rate limit tokens
      this.rateLimiter.consumeTokens(response.usage.input_tokens + response.usage.output_tokens);

      return this.formatResponse(response);
    } catch (error) {
      this.updateStats(false, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Create a streaming completion
   */
  async *createStreamingCompletion(
    request: CompletionRequest
  ): AsyncGenerator<StreamChunk, void, unknown> {
    const estimatedTokens = this.estimateTokens(request.prompt);
    await this.rateLimiter.waitForCapacity(estimatedTokens);

    const stream = await this.retryHandler.execute(async () => {
      return await this.client.messages.stream({
        model: request.model || 'claude-3-5-sonnet-20241022',
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature,
        top_p: request.topP,
        top_k: request.topK,
        stop_sequences: request.stopSequences,
        messages: [
          {
            role: 'user',
            content: request.prompt,
          },
        ],
      });
    }, 'createStreamingCompletion');

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    try {
      for await (const event of stream) {
        if (event.type === 'message_start') {
          totalInputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            yield {
              type: 'content_block_delta',
              content: event.delta.text,
            };
          }
        } else if (event.type === 'message_delta') {
          totalOutputTokens = event.usage.output_tokens;
        }
      }

      // Update stats after stream completes
      const totalTokens = totalInputTokens + totalOutputTokens;
      this.rateLimiter.consumeTokens(totalTokens);
      this.updateStats(true, 0, {
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
      });
    } catch (error) {
      this.updateStats(false, 0);
      throw error;
    }
  }

  /**
   * Health check - verify API connectivity
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.createCompletion({
        prompt: 'Say "healthy" if you can read this.',
        maxTokens: 10,
      });

      return {
        healthy: true,
        latency: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        error: (error as Error).message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get client statistics
   */
  getStats(): ClientStats {
    return {
      ...this.stats,
      uptime: Date.now() - this.startTime.getTime(),
      averageLatency: this.stats.totalRequests > 0 
        ? this.stats.averageLatency / this.stats.totalRequests 
        : 0,
    };
  }

  /**
   * Get rate limiter status
   */
  getRateLimitStatus() {
    return this.rateLimiter.getStatus();
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalTokensUsed: 0,
      totalCost: 0,
      averageLatency: 0,
      uptime: 0,
    };
    this.startTime = new Date();
  }

  /**
   * Format Anthropic response to our standard format
   */
  private formatResponse(response: Anthropic.Messages.Message): CompletionResponse {
    const content = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as any).text)
      .join('');

    return {
      id: response.id,
      content,
      model: response.model,
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens,
      },
    };
  }

  /**
   * Estimate tokens for rate limiting (rough approximation)
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Update client statistics
   */
  private updateStats(
    success: boolean,
    latency: number,
    usage?: { input_tokens: number; output_tokens: number }
  ): void {
    this.stats.totalRequests++;
    
    if (success) {
      this.stats.successfulRequests++;
      this.stats.averageLatency += latency;
      
      if (usage) {
        const totalTokens = usage.input_tokens + usage.output_tokens;
        this.stats.totalTokensUsed += totalTokens;
      }
    } else {
      this.stats.failedRequests++;
    }
  }
}

