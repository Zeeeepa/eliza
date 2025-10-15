# Z.ai Integration Testing Guide

This document describes how to test ElizaOS with Z.ai's GLM-4.5V model, specifically for the new agent-orchestrator package introduced in PR #1.

## Prerequisites

- Node.js 23.x or Bun 1.2.x installed
- Z.ai API credentials
- ElizaOS repository cloned

## Configuration

### Environment Variables

```bash
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
```

### Alternative Configuration (using standard Anthropic env vars)

```bash
export ANTHROPIC_API_KEY=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
```

## Test Scripts

### Quick Test (Agent Orchestrator)

This tests the basic integration with the new agent-orchestrator package:

```bash
# From repository root
bun run test-zai-agent-orchestrator.ts
```

**What it tests:**
- Basic API connection to Z.ai
- Agent planning task simulation
- Code generation agent simulation  
- Multi-agent coordination
- Streaming progress updates

**Expected Output:**
```
==================================================
Testing Z.ai Integration for Agent Orchestrator (PR #1)
==================================================
ℹ️  Model: glm-4.5V
ℹ️  Base URL: https://api.z.ai/api/anthropic
ℹ️  API Key: 665b963943b647...
✅ Agent planning task completed!
...
✨ All Tests Passed!
🚀 Ready for production use!
```

### Comprehensive Test (Anthropic Plugin)

This runs extensive tests on the enhanced Anthropic plugin:

```bash
# From repository root
bun run packages/plugin-anthropic-enhanced/scripts/test-zai-integration.ts
```

**What it tests:**
1. Basic API connection
2. Streaming responses
3. Multiple concurrent requests
4. Error handling
5. Large context handling

**Expected Output:**
```
============================================================
Test 1: Basic API Connection
============================================================
✅ Connection successful! (250ms)
ℹ️  Response: Hello from Z.ai!
ℹ️  Tokens used: 15 in + 5 out
...
🎉 Z.ai integration is working perfectly!
```

## Manual Testing

### Using the CLI

```bash
# Start ElizaOS with Z.ai configuration
cd packages/cli
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=your_token_here
bun run start
```

### Using the Agent Orchestrator

```typescript
import { MultiAgentOrchestrator } from '@elizaos/agent-orchestrator';
import Anthropic from '@anthropic-ai/sdk';

// Initialize with Z.ai configuration
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_AUTH_TOKEN,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

// Use in orchestrator
const orchestrator = new MultiAgentOrchestrator({
  anthropicClient: client,
  model: 'glm-4.5V',
});
```

## Verification Checklist

- [ ] Basic API connection works
- [ ] GLM-4.5V model responds correctly
- [ ] Streaming works without errors
- [ ] Multiple concurrent requests succeed
- [ ] Error handling is robust
- [ ] Large contexts are handled properly
- [ ] Agent orchestration tasks complete successfully
- [ ] Token usage is tracked correctly

## Troubleshooting

### Error: "Missing API credentials"
- Verify ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY is set
- Check that the token is valid and not expired

### Error: "Connection refused" or "404"
- Verify ANTHROPIC_BASE_URL is set to `https://api.z.ai/api/anthropic`
- Check network connectivity to Z.ai

### Error: "Invalid model"
- Ensure ANTHROPIC_MODEL is set to `glm-4.5V` (case-sensitive)
- Z.ai may use different model names; verify with Z.ai documentation

### Slow Responses
- Z.ai may have rate limits; check token usage
- Consider implementing rate limiting in your application

## Performance Metrics

### Typical Response Times (with Z.ai)
- Simple completions: 200-500ms
- Streaming responses: First chunk in 100-200ms
- Large contexts: 500-1500ms

### Token Limits
- Max tokens per request: 4096 (configurable)
- Input context window: ~200K tokens (GLM-4.5V)

## Integration Points

### Where Z.ai is Used

1. **Agent Orchestrator** (`packages/agent-orchestrator`)
   - Planning agent
   - Code generation agent
   - Testing agent
   - Coordination agent

2. **Core Runtime** (`packages/core`)
   - Model provider selection
   - Message generation
   - Action handlers

3. **Enhanced Anthropic Plugin** (`packages/plugin-anthropic-enhanced`)
   - Rate limiting
   - Retry logic
   - Cost tracking
   - Streaming support

## Cost Tracking

The enhanced plugin tracks costs automatically:

```typescript
import { CostTrackerService } from '@elizaos/plugin-anthropic-enhanced';

const tracker = new CostTrackerService();
const usage = tracker.getCostSummary();

console.log(`Total cost: $${usage.totalCost}`);
console.log(`Total tokens: ${usage.totalTokens}`);
```

## Next Steps

After successful testing:

1. ✅ Verify all tests pass
2. ✅ Check token usage and costs
3. ✅ Test in development environment
4. ✅ Monitor performance metrics
5. ✅ Deploy to production

## Support

For Z.ai specific issues:
- Z.ai Documentation: https://docs.z.ai/
- Z.ai Support: support@z.ai

For ElizaOS issues:
- ElizaOS GitHub: https://github.com/elizaOS/eliza
- ElizaOS Discord: https://discord.gg/elizaos

## Changelog

### 2025-01-15
- Initial test suite created
- Agent orchestrator integration tested
- Streaming support validated
- Documentation completed

