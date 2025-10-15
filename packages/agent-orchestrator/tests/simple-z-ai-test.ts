#!/usr/bin/env tsx
/**
 * Simple Z.ai API Test
 * 
 * Direct test of Z.ai GLM-4.5V without Eliza dependencies
 * 
 * Usage:
 * export ANTHROPIC_MODEL=glm-4.5V
 * export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 * export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * 
 * npx tsx tests/simple-z-ai-test.ts
 */

import Anthropic from '@anthropic-ai/sdk';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testProjectManager(client: Anthropic) {
  log('\n📊 Testing Project Manager Agent...', colors.cyan);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 4000,
    temperature: 0.3,
    system: `You are a Project Manager AI agent. Your role is to:
- Break down requirements into structured tasks
- Estimate complexity and time
- Identify dependencies
- Create actionable plans

Be concise and structured in your responses.`,
    messages: [{
      role: 'user',
      content: `Create a plan to build a TypeScript email/password validator with tests.

Requirements:
1. Email validation function
2. Password strength checker
3. Unit tests with Vitest

Break this down into tasks with estimates.`
    }]
  });

  log('✅ Project Manager Response:', colors.green);
  console.log(response.content[0].text);
  
  return response;
}

async function testCoder(client: Anthropic) {
  log('\n💻 Testing Coder Agent...', colors.cyan);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 4000,
    temperature: 0.2,
    system: `You are a Coder AI agent. Your role is to:
- Write clean, production-ready TypeScript code
- Follow best practices
- Add proper types and error handling
- Write maintainable code

Provide complete, working code.`,
    messages: [{
      role: 'user',
      content: `Write a TypeScript function to validate email addresses.

Requirements:
- Function signature: validateEmail(email: string): { valid: boolean; error?: string }
- Check proper email format
- Return specific error messages
- Use strict TypeScript types`
    }]
  });

  log('✅ Coder Response:', colors.green);
  console.log(response.content[0].text);
  
  return response;
}

async function testTester(client: Anthropic) {
  log('\n🧪 Testing Tester Agent...', colors.cyan);
  
  const response = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'glm-4.5V',
    max_tokens: 4000,
    temperature: 0.1,
    system: `You are a Tester AI agent. Your role is to:
- Write comprehensive unit tests
- Test edge cases and error conditions
- Use Vitest framework
- Ensure high code coverage

Provide complete, runnable tests.`,
    messages: [{
      role: 'user',
      content: `Write Vitest tests for this function:

\`\`\`typescript
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email) return { valid: false, error: 'Email is required' };
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}
\`\`\`

Test cases:
- Valid emails
- Invalid formats
- Edge cases (empty, null, special chars)`
    }]
  });

  log('✅ Tester Response:', colors.green);
  console.log(response.content[0].text);
  
  return response;
}

async function main() {
  console.log('\n' + '='.repeat(60));
  log('🚀 Z.ai Multi-Agent Orchestrator Test', colors.cyan);
  console.log('='.repeat(60));

  // Check credentials
  const model = process.env.ANTHROPIC_MODEL;
  const baseURL = process.env.ANTHROPIC_BASE_URL;
  const token = process.env.ANTHROPIC_AUTH_TOKEN;

  if (!model || !baseURL || !token) {
    log('\n❌ Missing credentials! Set:', colors.red);
    log('   export ANTHROPIC_MODEL=glm-4.5V');
    log('   export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic');
    log('   export ANTHROPIC_AUTH_TOKEN=your-token\n');
    process.exit(1);
  }

  log(`\n✅ Configuration:`, colors.green);
  log(`   Model: ${model}`);
  log(`   Base URL: ${baseURL}`);
  log(`   Token: ${token.slice(0, 12)}...`);

  // Initialize client
  const client = new Anthropic({
    apiKey: token,
    baseURL: baseURL,
  });

  try {
    // Test each agent
    const startTime = Date.now();
    
    await testProjectManager(client);
    await testCoder(client);
    await testTester(client);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Summary
    console.log('\n' + '='.repeat(60));
    log('📈 Test Summary', colors.cyan);
    console.log('='.repeat(60));
    log(`✅ All 3 agents tested successfully`, colors.green);
    log(`⏱️  Total time: ${duration}s`);
    log(`🎉 Multi-agent workflow validated!`, colors.green);
    console.log('');

  } catch (error: any) {
    log('\n❌ Test failed:', colors.red);
    console.error(error.message || error);
    process.exit(1);
  }
}

main();

