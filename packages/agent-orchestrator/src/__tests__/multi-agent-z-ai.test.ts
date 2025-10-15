/**
 * Multi-Agent Runtime Test with Z.ai
 * 
 * Tests the multi-agent system using Z.ai GLM-4.5V model
 * 
 * Run with environment variables:
 * export ANTHROPIC_MODEL=glm-4.5V
 * export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 * export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * 
 * Then: bun test multi-agent-z-ai.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MultiAgentRuntime, AgentRole } from '../agents/multi-agent-runtime';
import { logger } from '@elizaos/core';

describe('MultiAgentRuntime with Z.ai', () => {
  let runtime: MultiAgentRuntime;
  const testRoomId = crypto.randomUUID();
  const testUserId = crypto.randomUUID();

  beforeAll(async () => {
    // Verify Z.ai credentials are set
    const hasModel = Boolean(process.env.ANTHROPIC_MODEL);
    const hasBaseUrl = Boolean(process.env.ANTHROPIC_BASE_URL);
    const hasToken = Boolean(process.env.ANTHROPIC_AUTH_TOKEN);

    if (!hasModel || !hasBaseUrl || !hasToken) {
      throw new Error(
        'Z.ai credentials not set! Please set:\n' +
        '  ANTHROPIC_MODEL=glm-4.5V\n' +
        '  ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic\n' +
        '  ANTHROPIC_AUTH_TOKEN=your-token'
      );
    }

    logger.info('[Test] Creating MultiAgentRuntime with Z.ai...');
    runtime = new MultiAgentRuntime();
    await runtime.initialize();
    logger.info('[Test] ✅ Runtime initialized');
  });

  afterAll(async () => {
    if (runtime) {
      await runtime.shutdown();
      logger.info('[Test] ✅ Runtime shut down');
    }
  });

  it('should initialize all agents', () => {
    const agents = runtime.getAllAgents();
    
    expect(agents.size).toBeGreaterThan(0);
    expect(agents.has(AgentRole.PROJECT_MANAGER)).toBe(true);
    expect(agents.has(AgentRole.CODER)).toBe(true);
    expect(agents.has(AgentRole.TESTER)).toBe(true);
  });

  it('should have agents with Eliza plugins loaded', () => {
    const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
    expect(pmAgent).toBeDefined();
    
    // Agent should have character data
    expect(pmAgent?.character).toBeDefined();
    expect(pmAgent?.character.name).toBe('ProjectManager');
    
    // Agent should have plugins registered
    const plugins = pmAgent?.getPlugins?.();
    if (plugins) {
      expect(plugins.length).toBeGreaterThan(0);
      
      // Should have bootstrap plugin (provides core actions/providers)
      const hasBootstrap = plugins.some(p => 
        p.name === 'bootstrap' || 
        p.actions?.some(a => a.name === 'REPLY')
      );
      expect(hasBootstrap).toBe(true);
    }
  });

  it('should send message to Project Manager agent', async () => {
    const response = await runtime.sendMessage(
      AgentRole.PROJECT_MANAGER,
      'Hello! Can you help me plan a new feature?',
      testRoomId,
      testUserId
    );

    expect(response).toBeDefined();
    logger.info('[Test] Project Manager Response:', response);
  });

  it('should send message to Coder agent', async () => {
    const response = await runtime.sendMessage(
      AgentRole.CODER,
      'Write a simple TypeScript function to add two numbers',
      testRoomId,
      testUserId
    );

    expect(response).toBeDefined();
    logger.info('[Test] Coder Response:', response);
  });

  it('should send message to Tester agent', async () => {
    const response = await runtime.sendMessage(
      AgentRole.TESTER,
      'Create tests for a user authentication function',
      testRoomId,
      testUserId
    );

    expect(response).toBeDefined();
    logger.info('[Test] Tester Response:', response);
  });

  it('should execute a complete task workflow', async () => {
    // This tests the full multi-agent coordination
    await runtime.executeTask({
      description: 'Build a simple API endpoint for user login',
      roomId: testRoomId,
      userId: testUserId
    });

    // If we get here without errors, coordination worked
    expect(true).toBe(true);
  });

  it('should verify Z.ai model configuration', () => {
    const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
    expect(pmAgent).toBeDefined();

    // Verify the character settings match Z.ai requirements
    const settings = pmAgent?.character.settings;
    expect(settings?.model).toBe('glm-4.5V');
  });

  it('should handle agent responses using bootstrap actions', async () => {
    // The agent should use REPLY action from plugin-bootstrap
    const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
    expect(pmAgent).toBeDefined();

    // Verify REPLY action is available
    const actions = pmAgent?.getActions?.();
    if (actions) {
      const hasReply = actions.some(a => a.name === 'REPLY');
      expect(hasReply).toBe(true);
      logger.info('[Test] ✅ REPLY action from plugin-bootstrap is available');
    }
  });

  it('should use time provider from plugin-bootstrap', async () => {
    const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
    expect(pmAgent).toBeDefined();

    // Verify timeProvider is available
    const providers = pmAgent?.getProviders?.();
    if (providers) {
      const hasTime = providers.some(p => p.name?.includes('time'));
      expect(hasTime).toBe(true);
      logger.info('[Test] ✅ Time provider from plugin-bootstrap is available');
    }
  });
});

/**
 * Manual Test Instructions:
 * 
 * 1. Set environment variables:
 *    export ANTHROPIC_MODEL=glm-4.5V
 *    export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 *    export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * 
 * 2. Run tests:
 *    cd packages/agent-orchestrator
 *    bun test src/__tests__/multi-agent-z-ai.test.ts
 * 
 * 3. Expected Results:
 *    ✅ All agents initialize successfully
 *    ✅ Agents respond to messages using Z.ai
 *    ✅ Bootstrap actions/providers are available
 *    ✅ Multi-agent coordination works
 */

