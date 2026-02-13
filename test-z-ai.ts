#!/usr/bin/env bun
/**
 * Test Z.ai Integration with Enhanced Multi-Agent Runtime
 * 
 * Tests that the enhanced runtime properly configures:
 * - MODEL_PROVIDER = 'anthropic'  
 * - ANTHROPIC_BASE_URL = Z.ai endpoint
 * - ANTHROPIC_MODEL = glm-4.5V
 * - ANTHROPIC_API_KEY = Z.ai token
 */

import { EnhancedMultiAgentRuntime } from './packages/agent-orchestrator/src/agents/enhanced-multi-agent-runtime';
import type { Character } from '@elizaos/core';

// Verify environment variables are set
const requiredEnvVars = {
  ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN
};

console.log('\n🔍 Checking Environment Variables:\n');
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`❌ ${key} is not set!`);
    process.exit(1);
  }
  console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
}

console.log('\n📦 Creating Enhanced Multi-Agent Runtime...\n');

// Create test character
const testCharacter: Character = {
  name: 'Z.ai Test Agent',
  bio: ['I am a test agent using Z.ai (glm-4.5V) via Anthropic API.'],
  plugins: [],
  settings: {}
};

async function testZaiIntegration() {
  try {
    // Initialize runtime
    const runtime = new EnhancedMultiAgentRuntime();
    
    console.log('✅ Runtime created successfully\n');
    
    // Create an agent with Z.ai configuration
    console.log('🤖 Creating agent with Z.ai configuration...\n');
    
    const agent = await runtime.createAgent({
      role: 'test_agent',
      character: testCharacter,
      token: process.env.ANTHROPIC_AUTH_TOKEN,
      modelProvider: 'anthropic',
      plugins: []
    });
    
    console.log('✅ Agent created successfully\n');
    
    // Verify agent configuration
    console.log('🔍 Agent Configuration:\n');
    console.log(`  Agent ID: ${agent.agentId}`);
    console.log(`  Character Name: ${agent.character.name}`);
    
    // Check settings
    const settings = agent.character.settings as Record<string, any>;
    console.log(`\n📋 Character Settings:\n`);
    console.log(`  MODEL_PROVIDER: ${settings.MODEL_PROVIDER}`);
    console.log(`  ANTHROPIC_BASE_URL: ${settings.ANTHROPIC_BASE_URL}`);
    console.log(`  ANTHROPIC_MODEL: ${settings.ANTHROPIC_MODEL}`);
    console.log(`  ANTHROPIC_API_KEY: ${settings.ANTHROPIC_API_KEY?.substring(0, 20)}...`);
    
    // Verify correct values
    console.log(`\n✅ Verification:\n`);
    const checks = [
      { name: 'MODEL_PROVIDER', expected: 'anthropic', actual: settings.MODEL_PROVIDER },
      { name: 'ANTHROPIC_BASE_URL', expected: process.env.ANTHROPIC_BASE_URL, actual: settings.ANTHROPIC_BASE_URL },
      { name: 'ANTHROPIC_MODEL', expected: process.env.ANTHROPIC_MODEL, actual: settings.ANTHROPIC_MODEL },
      { name: 'ANTHROPIC_API_KEY', expected: true, actual: !!settings.ANTHROPIC_API_KEY }
    ];
    
    let allPassed = true;
    for (const check of checks) {
      if (check.name === 'ANTHROPIC_API_KEY') {
        if (check.actual) {
          console.log(`  ✅ ${check.name}: Set`);
        } else {
          console.log(`  ❌ ${check.name}: Missing`);
          allPassed = false;
        }
      } else {
        if (check.expected === check.actual) {
          console.log(`  ✅ ${check.name}: ${check.actual}`);
        } else {
          console.log(`  ❌ ${check.name}: Expected '${check.expected}', got '${check.actual}'`);
          allPassed = false;
        }
      }
    }
    
    if (allPassed) {
      console.log(`\n🎉 SUCCESS! All Z.ai settings configured correctly!\n`);
      console.log(`The agent is ready to use Z.ai (glm-4.5V) via Anthropic API.\n`);
    } else {
      console.log(`\n❌ FAILED! Some settings are incorrect.\n`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

// Run test
testZaiIntegration();

