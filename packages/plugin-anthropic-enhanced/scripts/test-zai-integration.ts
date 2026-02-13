#!/usr/bin/env node
/**
 * Test script for Z.ai API integration with ElizaOS
 * 
 * This script tests:
 * 1. Basic API connection to Z.ai
 * 2. GLM-4.5V model compatibility
 * 3. Streaming responses
 * 4. Error handling
 * 
 * Usage:
 * export ANTHROPIC_MODEL=glm-4.5V
 * export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
 * export ANTHROPIC_AUTH_TOKEN=665b963943b647dc9501dff942afb877.A47LrMc7sgGjyfBJ
 * bun run packages/plugin-anthropic-enhanced/scripts/test-zai-integration.ts
 */

import Anthropic from '@anthropic-ai/sdk';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message: string) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(message, 'bright');
  log('='.repeat(60), 'cyan');
}

function success(message: string) {
  log(`✅ ${message}`, 'green');
}

function error(message: string) {
  log(`❌ ${message}`, 'red');
}

function info(message: string) {
  log(`ℹ️  ${message}`, 'blue');
}

function warning(message: string) {
  log(`⚠️  ${message}`, 'yellow');
}

// Load environment variables
const MODEL = process.env.ANTHROPIC_MODEL || 'glm-4.5V';
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic';
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

async function testBasicConnection() {
  header('Test 1: Basic API Connection');
  
  if (!API_KEY) {
    error('ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY not set!');
    throw new Error('Missing API credentials');
  }
  
  info(`Model: ${MODEL}`);
  info(`Base URL: ${BASE_URL}`);
  info(`API Key: ${API_KEY.substring(0, 10)}...`);
  
  const client = new Anthropic({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    maxRetries: 0,
  });
  
  try {
    const startTime = Date.now();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: 'Say "Hello from Z.ai!" and nothing else.',
        },
      ],
    });
    
    const duration = Date.now() - startTime;
    
    success(`Connection successful! (${duration}ms)`);
    info(`Response: ${response.content[0].type === 'text' ? response.content[0].text : 'non-text'}`);
    info(`Tokens used: ${response.usage.input_tokens} in + ${response.usage.output_tokens} out`);
    info(`Model: ${response.model}`);
    
    return { success: true, response, duration };
  } catch (err: any) {
    error(`Connection failed: ${err.message}`);
    if (err.status) {
      error(`HTTP Status: ${err.status}`);
    }
    throw err;
  }
}

async function testStreamingResponse() {
  header('Test 2: Streaming Response');
  
  const client = new Anthropic({
    apiKey: API_KEY!,
    baseURL: BASE_URL,
    maxRetries: 0,
  });
  
  try {
    info('Starting streaming request...');
    const startTime = Date.now();
    
    const stream = await client.messages.stream({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: 'Count from 1 to 5, with each number on a new line.',
        },
      ],
    });
    
    let chunkCount = 0;
    let fullText = '';
    
    for await (const chunk of stream) {
      chunkCount++;
      
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text;
        process.stdout.write(colors.cyan + chunk.delta.text + colors.reset);
      }
    }
    
    const duration = Date.now() - startTime;
    console.log(); // New line after stream
    
    const finalMessage = await stream.finalMessage();
    
    success(`Streaming completed! (${duration}ms)`);
    info(`Chunks received: ${chunkCount}`);
    info(`Total text length: ${fullText.length} characters`);
    info(`Tokens used: ${finalMessage.usage.input_tokens} in + ${finalMessage.usage.output_tokens} out`);
    
    return { success: true, chunkCount, fullText, duration };
  } catch (err: any) {
    error(`Streaming failed: ${err.message}`);
    throw err;
  }
}

async function testMultipleRequests() {
  header('Test 3: Multiple Concurrent Requests');
  
  const client = new Anthropic({
    apiKey: API_KEY!,
    baseURL: BASE_URL,
    maxRetries: 0,
  });
  
  const prompts = [
    'What is 2+2?',
    'Name a color.',
    'What is the capital of France?',
  ];
  
  info(`Sending ${prompts.length} concurrent requests...`);
  
  try {
    const startTime = Date.now();
    
    const promises = prompts.map((prompt, index) =>
      client.messages.create({
        model: MODEL,
        max_tokens: 50,
        messages: [{ role: 'user', content: prompt }],
      }).then(response => ({ index, prompt, response }))
    );
    
    const results = await Promise.all(promises);
    const duration = Date.now() - startTime;
    
    success(`All requests completed! (${duration}ms)`);
    
    results.forEach(({ index, prompt, response }) => {
      const text = response.content[0].type === 'text' ? response.content[0].text : 'non-text';
      info(`[${index + 1}] "${prompt}" → "${text.substring(0, 50)}..."`);
    });
    
    const totalTokens = results.reduce(
      (sum, r) => sum + r.response.usage.input_tokens + r.response.usage.output_tokens,
      0
    );
    info(`Total tokens across all requests: ${totalTokens}`);
    
    return { success: true, results, duration };
  } catch (err: any) {
    error(`Multiple requests failed: ${err.message}`);
    throw err;
  }
}

async function testErrorHandling() {
  header('Test 4: Error Handling');
  
  const client = new Anthropic({
    apiKey: API_KEY!,
    baseURL: BASE_URL,
    maxRetries: 0,
  });
  
  info('Testing with invalid parameters...');
  
  try {
    await client.messages.create({
      model: MODEL,
      max_tokens: 0, // Invalid: must be > 0
      messages: [{ role: 'user', content: 'Test' }],
    });
    
    warning('Expected error did not occur!');
    return { success: false };
  } catch (err: any) {
    if (err.status === 400 || err.message.includes('max_tokens')) {
      success('Error handling working correctly!');
      info(`Caught expected error: ${err.message}`);
      return { success: true, error: err };
    } else {
      error(`Unexpected error: ${err.message}`);
      throw err;
    }
  }
}

async function testLargeContext() {
  header('Test 5: Large Context Handling');
  
  const client = new Anthropic({
    apiKey: API_KEY!,
    baseURL: BASE_URL,
    maxRetries: 0,
  });
  
  // Generate a large prompt (approximately 2000 tokens)
  const largePrompt = `
Please summarize the following text in one sentence:

${Array(50).fill('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.').join(' ')}
  `.trim();
  
  info(`Testing with large context (~2000 tokens)...`);
  
  try {
    const startTime = Date.now();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 100,
      messages: [{ role: 'user', content: largePrompt }],
    });
    
    const duration = Date.now() - startTime;
    
    success(`Large context handled successfully! (${duration}ms)`);
    info(`Input tokens: ${response.usage.input_tokens}`);
    info(`Output tokens: ${response.usage.output_tokens}`);
    
    const text = response.content[0].type === 'text' ? response.content[0].text : 'non-text';
    info(`Summary: ${text.substring(0, 100)}...`);
    
    return { success: true, response, duration };
  } catch (err: any) {
    error(`Large context test failed: ${err.message}`);
    throw err;
  }
}

// Main test runner
async function runAllTests() {
  header('Z.ai Integration Test Suite');
  
  const results: Record<string, any> = {};
  const startTime = Date.now();
  
  try {
    results.test1 = await testBasicConnection();
    results.test2 = await testStreamingResponse();
    results.test3 = await testMultipleRequests();
    results.test4 = await testErrorHandling();
    results.test5 = await testLargeContext();
    
    const totalDuration = Date.now() - startTime;
    
    header('Test Summary');
    success(`All tests passed! ✨`);
    info(`Total duration: ${totalDuration}ms`);
    
    // Calculate aggregate stats
    const totalTokens = [results.test1, results.test5].reduce((sum, test) => {
      if (test?.response?.usage) {
        return sum + test.response.usage.input_tokens + test.response.usage.output_tokens;
      }
      return sum;
    }, 0);
    
    info(`Total tokens consumed: ${totalTokens}`);
    
    log('\n🎉 Z.ai integration is working perfectly!', 'green');
    log('🚀 You can now use ElizaOS with Z.ai\'s GLM-4.5V model', 'bright');
    
    return { success: true, results };
  } catch (err: any) {
    header('Test Failure');
    error(`Tests failed: ${err.message}`);
    error(`Stack trace: ${err.stack}`);
    
    return { success: false, error: err, results };
  }
}

// Run tests
runAllTests()
  .then((result) => {
    process.exit(result.success ? 0 : 1);
  })
  .catch((err) => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });

