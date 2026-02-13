# @elizaos/plugin-anthropic-enhanced

Enhanced Anthropic Claude API integration for ElizaOS with comprehensive testing, streaming, rate limiting, and cost tracking.

## Features

✅ **Advanced Rate Limiting** - Token bucket algorithm with request and token limits  
✅ **Automatic Retry Logic** - Exponential backoff with intelligent error handling  
✅ **Cost Tracking** - Real-time usage analytics and cost estimation  
✅ **Streaming Support** - Efficient streaming completions  
✅ **Health Monitoring** - API connectivity checks and statistics  
✅ **Comprehensive Testing** - 95%+ test coverage  
✅ **TypeScript First** - Full type safety  

## Installation

```bash
npm install @elizaos/plugin-anthropic-enhanced
# or
pnpm add @elizaos/plugin-anthropic-enhanced
# or
yarn add @elizaos/plugin-anthropic-enhanced
```

## Quick Start

```typescript
import { AnthropicClient } from '@elizaos/plugin-anthropic-enhanced';

// Initialize client
const client = new AnthropicClient({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  maxRetries: 3,
  timeout: 60000,
});

// Create a completion
const response = await client.createCompletion({
  prompt: 'Explain quantum computing in simple terms',
  model: 'claude-3-5-sonnet-20241022',
  maxTokens: 1024,
  temperature: 0.7,
});

console.log(response.content);
console.log(`Tokens used: ${response.usage.totalTokens}`);
```

## Streaming Support

```typescript
// Stream completions
for await (const chunk of client.createStreamingCompletion({
  prompt: 'Write a story about AI',
  maxTokens: 2048,
})) {
  if (chunk.content) {
    process.stdout.write(chunk.content);
  }
}
```

## Rate Limiting

The client automatically handles rate limiting based on Anthropic's limits:

- **50 requests per minute**
- **40,000 tokens per minute**
- **5,000,000 tokens per day**

```typescript
// Check rate limit status
const status = client.getRateLimitStatus();
console.log(`Requests remaining: ${status.requestsRemaining}`);
console.log(`Tokens remaining: ${status.tokensRemaining}`);
console.log(`Resets at: ${status.resetTime}`);
```

## Cost Tracking

Track your API usage costs in real-time:

```typescript
import { CostTrackerService } from '@elizaos/plugin-anthropic-enhanced';

const costTracker = new CostTrackerService();

// Track a request
const costData = costTracker.trackCost('claude-3-5-sonnet-20241022', {
  inputTokens: 1000,
  outputTokens: 2000,
  totalTokens: 3000,
});

console.log(`Estimated cost: $${costData.estimatedCost.toFixed(6)}`);

// Get total cost
console.log(`Total cost: $${costTracker.getTotalCost().toFixed(2)}`);

// Get cost breakdown by model
console.log(costTracker.getCostByModel());

// Export detailed report
const report = costTracker.exportData();
console.log(report);
```

## Error Handling

The client automatically retries failed requests with exponential backoff:

```typescript
try {
  const response = await client.createCompletion({
    prompt: 'Hello, Claude!',
  });
} catch (error) {
  if (error.type === 'rate_limit_error') {
    console.log(`Rate limited. Retry after: ${error.retryAfter}s`);
  } else if (error.type === 'authentication_error') {
    console.log('Invalid API key');
  } else {
    console.log('Request failed:', error.message);
  }
}
```

## Health Monitoring

```typescript
// Perform health check
const health = await client.healthCheck();
if (health.healthy) {
  console.log(`API is healthy. Latency: ${health.latency}ms`);
} else {
  console.log(`API is unhealthy: ${health.error}`);
}

// Get client statistics
const stats = client.getStats();
console.log(`Total requests: ${stats.totalRequests}`);
console.log(`Success rate: ${(stats.successfulRequests / stats.totalRequests * 100).toFixed(2)}%`);
console.log(`Average latency: ${stats.averageLatency}ms`);
console.log(`Total tokens used: ${stats.totalTokensUsed}`);
console.log(`Uptime: ${stats.uptime}ms`);
```

## Supported Models

| Model | Input Price ($/1M tokens) | Output Price ($/1M tokens) |
|-------|---------------------------|----------------------------|
| claude-3-5-sonnet-20241022 | $3.00 | $15.00 |
| claude-3-5-haiku-20241022 | $1.00 | $5.00 |
| claude-3-opus-20240229 | $15.00 | $75.00 |
| claude-3-sonnet-20240229 | $3.00 | $15.00 |
| claude-3-haiku-20240307 | $0.25 | $1.25 |

## API Reference

### AnthropicClient

#### Constructor Options

```typescript
interface AnthropicConfig {
  apiKey: string;              // Required: Anthropic API key
  baseURL?: string;            // Optional: Custom API endpoint
  maxRetries?: number;         // Optional: Max retry attempts (default: 3)
  timeout?: number;            // Optional: Request timeout in ms (default: 60000)
  defaultModel?: string;       // Optional: Default model to use
}
```

#### Methods

- `createCompletion(request: CompletionRequest): Promise<CompletionResponse>`
- `createStreamingCompletion(request: CompletionRequest): AsyncGenerator<StreamChunk>`
- `healthCheck(): Promise<HealthCheck>`
- `getStats(): ClientStats`
- `getRateLimitStatus(): RateLimitStatus`
- `resetStats(): void`

### CostTrackerService

#### Methods

- `calculateCost(modelName: ClaudeModel, usage: TokenUsage): number`
- `trackCost(modelName: ClaudeModel, usage: TokenUsage): CostData`
- `getTotalCost(): number`
- `getCostByModel(): Record<string, number>`
- `getCostForPeriod(startDate: Date, endDate: Date): number`
- `getTokenStats(): TokenStats`
- `getDailyCostReport(): Record<string, number>`
- `exportData(): string`
- `reset(): void`

## Testing

The plugin includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Watch mode
npm run test:watch
```

## Code Quality

The project uses Biome for code quality analysis:

```bash
# Run Biome checks
npx @biomejs/biome check src/

# Format code
npx @biomejs/biome format --write src/

# Lint code
npx @biomejs/biome lint src/
```

## TypeScript

```bash
# Type checking
npm run typecheck

# Build
npm run build
```

## Contributing

Contributions are welcome! Please ensure:

1. All tests pass (`npm test`)
2. Code is properly formatted (`npx @biomejs/biome format`)
3. No linting errors (`npx @biomejs/biome lint`)
4. Type checking passes (`npm run typecheck`)
5. Test coverage remains above 90%

## License

MIT

## Support

For issues and questions:
- GitHub Issues: [elizaos/eliza](https://github.com/elizaos/eliza/issues)
- Documentation: [ElizaOS Docs](https://elizaos.github.io/eliza/)
- Discord: [Join our community](https://discord.gg/elizaos)

## Changelog

### 1.0.0 (2025-01-14)

- Initial release
- Advanced rate limiting
- Automatic retry with exponential backoff
- Cost tracking and analytics
- Streaming support
- Health monitoring
- Comprehensive test coverage

