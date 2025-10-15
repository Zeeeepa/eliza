#!/usr/bin/env tsx
/**
 * Run Multi-Agent Orchestrator with Real Task
 * 
 * This script demonstrates the full multi-agent workflow:
 * 1. Project Manager breaks down the task
 * 2. Coder implements the solution
 * 3. Tester validates the implementation
 * 
 * Usage:
 * export ANTHROPIC_MODEL=glm-4.5V
 * export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 * export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * 
 * bun run tests/run-orchestrator-task.ts
 */

import { MultiAgentRuntime, AgentRole } from '../src/agents/multi-agent-runtime';
import { logger } from '@elizaos/core';

// Colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message: string) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.bright + colors.cyan);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  header('🚀 Multi-Agent Orchestrator - Real Task Execution');

  // Verify credentials
  log('📋 Checking Z.ai credentials...', colors.yellow);
  const model = process.env.ANTHROPIC_MODEL;
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;

  if (!model || !baseURL || !token) {
    log('❌ Missing credentials! Set:', colors.red);
    log('   ANTHROPIC_MODEL=glm-4.5V');
    log('   ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic');
    log('   ANTHROPIC_AUTH_TOKEN=your-token');
    process.exit(1);
  }

  log(`✅ Model: ${model}`, colors.green);
  log(`✅ Base URL: ${baseURL}`, colors.green);
  log(`✅ Token: ${token.slice(0, 8)}...`, colors.green);

  // Initialize runtime
  header('🏗️ Initializing Multi-Agent Runtime');
  const runtime = new MultiAgentRuntime();
  await runtime.initialize();

  const agents = runtime.getAllAgents();
  log(`✅ Initialized ${agents.size} agents:`, colors.green);
  for (const [role, agent] of agents) {
    log(`   • ${role}: ${agent.character.name}`, colors.blue);
  }

  // Define the task
  const task = {
    description: `Create a TypeScript program that:
1. Validates user email addresses
2. Checks password strength (min 8 chars, uppercase, lowercase, number)
3. Returns validation results with specific error messages
4. Includes comprehensive unit tests`,
    roomId: crypto.randomUUID(),
    userId: crypto.randomUUID()
  };

  header('📝 Task Description');
  log(task.description, colors.cyan);

  // Step 1: Project Manager analyzes and plans
  header('🎯 Step 1: Project Manager - Task Analysis');
  log('Asking Project Manager to break down the task...', colors.yellow);

  const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
  if (!pmAgent) {
    log('❌ Project Manager agent not found!', colors.red);
    process.exit(1);
  }

  const pmResponse = await runtime.sendMessage(
    AgentRole.PROJECT_MANAGER,
    `Analyze this task and create a structured implementation plan:\n\n${task.description}`,
    task.roomId,
    task.userId
  );

  log('📊 Project Manager Response:', colors.green);
  console.log(pmResponse);

  // Step 2: Coder implements
  header('💻 Step 2: Coder - Implementation');
  log('Asking Coder to implement the validation functions...', colors.yellow);

  const coderResponse = await runtime.sendMessage(
    AgentRole.CODER,
    `Implement the following requirements in TypeScript:

Requirements:
- Email validation function (validate email format)
- Password strength validation function
- Return detailed error messages
- Use TypeScript strict types
- Follow best practices

Please provide complete, production-ready code.`,
    task.roomId,
    task.userId
  );

  log('💻 Coder Response:', colors.green);
  console.log(coderResponse);

  // Step 3: Tester validates
  header('🧪 Step 3: Tester - Test Creation');
  log('Asking Tester to create comprehensive tests...', colors.yellow);

  const testerResponse = await runtime.sendMessage(
    AgentRole.TESTER,
    `Create comprehensive unit tests for the validation functions:

Functions to test:
1. validateEmail(email: string): { valid: boolean; error?: string }
2. validatePassword(password: string): { valid: boolean; errors: string[] }

Test cases needed:
- Valid email addresses
- Invalid email formats
- Valid passwords (strong)
- Weak passwords (various cases)
- Edge cases and boundary conditions

Use Vitest framework with descriptive test names.`,
    task.roomId,
    task.userId
  );

  log('🧪 Tester Response:', colors.green);
  console.log(testerResponse);

  // Summary
  header('📈 Execution Summary');
  log('✅ Project Manager: Task analyzed and broken down', colors.green);
  log('✅ Coder: Implementation provided', colors.green);
  log('✅ Tester: Tests created', colors.green);

  log('\n🎉 Multi-agent workflow completed successfully!', colors.bright + colors.green);

  // Cleanup
  await runtime.shutdown();
  log('\n🛑 Runtime shut down cleanly', colors.yellow);
}

// Run the orchestrator
main().catch((error) => {
  log('\n❌ Error running orchestrator:', colors.red);
  console.error(error);
  process.exit(1);
});

