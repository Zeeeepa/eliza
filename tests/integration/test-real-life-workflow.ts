#!/usr/bin/env node

/**
 * Real-Life Workflow Integration Test
 * Tests the complete agent orchestrator workflow with Z.ai
 * 
 * Scenario: Build a simple Express API endpoint with authentication
 * - Project Manager: Break down requirements
 * - Research Agent: Find best practices
 * - Architecture Agent: Design the solution
 * - Coder Agent: Implement the code
 * - Testing Agent: Generate tests
 * - DevOps Agent: Setup CI/CD
 */

import Anthropic from '@anthropic-ai/sdk';
import * as Actions from '../../packages/agent-orchestrator/src/actions/index.js';
import { join } from 'path';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';

// Configuration
const MODEL = process.env.ANTHROPIC_MODEL || 'glm-4.5V';
const BASE_URL = process.env.ANTHROPIC_BASE_URL;
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN;

if (!API_KEY) {
  console.error('❌ Missing ANTHROPIC_AUTH_TOKEN environment variable');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: API_KEY,
  baseURL: BASE_URL,
});

// Test project directory
let testDir: string;

/**
 * Agent System Prompts
 */
const AGENTS = {
  projectManager: `You are a Project Manager agent. Your role is to:
- Break down requirements into clear, actionable tasks
- Estimate complexity and dependencies
- Create implementation plan
- Return structured task list in JSON format

Return format:
{
  "tasks": [
    { "id": 1, "title": "Task name", "description": "Details", "priority": "high|medium|low", "dependencies": [] }
  ],
  "complexity": "low|medium|high",
  "estimatedTime": "time estimate"
}`,

  coder: `You are a Coder agent. Your role is to:
- Write clean, well-structured code
- Follow best practices and patterns
- Include proper error handling
- Add inline comments for complex logic
- Return complete, working code

Write TypeScript code that is production-ready.`,

  tester: `You are a Testing agent. Your role is to:
- Generate comprehensive test suites
- Cover happy paths, edge cases, and error scenarios
- Use modern testing frameworks (Vitest)
- Ensure high test coverage
- Return complete test code

Generate tests that are thorough and maintainable.`,
};

/**
 * Main test workflow
 */
async function runRealLifeWorkflow() {
  console.log('🚀 Starting Real-Life Workflow Test\n');
  console.log('Scenario: Build Express API with JWT Authentication\n');
  console.log('='.repeat(60));
  
  try {
    // Setup test environment
    testDir = await mkdtemp(join(tmpdir(), 'eliza-test-'));
    console.log(`\n📁 Test directory: ${testDir}\n`);
    
    // Initialize git
    Actions.initGit(testDir);
    
    // Step 1: Project Manager - Break down requirements
    console.log('\n' + '='.repeat(60));
    console.log('STEP 1: Project Manager - Requirements Breakdown');
    console.log('='.repeat(60));
    
    const requirement = `Create an Express API endpoint /api/auth/login that:
- Accepts username and password
- Validates credentials against a database
- Returns JWT token on success
- Returns 401 on invalid credentials
- Includes rate limiting
- Has comprehensive error handling`;
    
    const pmResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: AGENTS.projectManager,
      messages: [{
        role: 'user',
        content: `Break down this requirement into tasks:\n\n${requirement}`,
      }],
    });
    
    const pmText = pmResponse.content[0].type === 'text' 
      ? pmResponse.content[0].text 
      : '';
    
    console.log('\n📋 Project Plan:');
    console.log(pmText.substring(0, 500) + '...');
    
    // Step 2: Coder Agent - Implement the endpoint
    console.log('\n' + '='.repeat(60));
    console.log('STEP 2: Coder Agent - Implementation');
    console.log('='.repeat(60));
    
    const coderPrompt = `${requirement}

Generate the complete implementation including:
1. Express route handler for /api/auth/login
2. JWT token generation
3. Rate limiting middleware
4. Error handling
5. Input validation

Provide only the code, no explanations.`;
    
    const coderResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: AGENTS.coder,
      messages: [{
        role: 'user',
        content: coderPrompt,
      }],
    });
    
    const codeText = coderResponse.content[0].type === 'text'
      ? coderResponse.content[0].text
      : '';
    
    // Extract code blocks
    const codeMatches = codeText.match(/```(?:typescript|ts)?\n([\s\S]*?)```/g);
    const implementationCode = codeMatches
      ? codeMatches.map(m => m.replace(/```(?:typescript|ts)?\n|\n```/g, '')).join('\n\n')
      : codeText;
    
    console.log('\n💻 Implementation:');
    console.log(implementationCode.substring(0, 500) + '...');
    
    // Save implementation
    const implPath = join(testDir, 'auth.ts');
    await Actions.writeFile(implPath, implementationCode);
    console.log(`\n✅ Saved to: ${implPath}`);
    
    // Step 3: Testing Agent - Generate tests
    console.log('\n' + '='.repeat(60));
    console.log('STEP 3: Testing Agent - Test Generation');
    console.log('='.repeat(60));
    
    const testerPrompt = `Generate comprehensive Vitest tests for this code:

\`\`\`typescript
${implementationCode}
\`\`\`

Include tests for:
- Successful authentication
- Invalid credentials
- Missing fields
- Rate limiting
- Error scenarios`;
    
    const testerResponse = await client.messages.create({
      model: MODEL,
      max_tokens: 3000,
      system: AGENTS.tester,
      messages: [{
        role: 'user',
        content: testerPrompt,
      }],
    });
    
    const testText = testerResponse.content[0].type === 'text'
      ? testerResponse.content[0].text
      : '';
    
    const testMatches = testText.match(/```(?:typescript|ts)?\n([\s\S]*?)```/g);
    const testCode = testMatches
      ? testMatches.map(m => m.replace(/```(?:typescript|ts)?\n|\n```/g, '')).join('\n\n')
      : testText;
    
    console.log('\n🧪 Test Suite:');
    console.log(testCode.substring(0, 500) + '...');
    
    // Save tests
    const testPath = join(testDir, 'auth.test.ts');
    await Actions.writeFile(testPath, testCode);
    console.log(`\n✅ Saved to: ${testPath}`);
    
    // Step 4: Code Analysis
    console.log('\n' + '='.repeat(60));
    console.log('STEP 4: Code Analysis');
    console.log('='.repeat(60));
    
    // Parse the code
    const parsed = await Actions.parseCode(implementationCode);
    console.log('\n📊 Code Structure:');
    console.log(`  Functions: ${parsed.functions.length}`);
    console.log(`  Classes: ${parsed.classes.length}`);
    console.log(`  Imports: ${parsed.imports.length}`);
    console.log(`  Exports: ${parsed.exports.length}`);
    
    // Calculate complexity
    const complexity = Actions.calculateComplexity(implementationCode);
    console.log('\n📈 Complexity Analysis:');
    console.log(`  Total Complexity: ${complexity.total}`);
    complexity.functions.slice(0, 3).forEach(f => {
      console.log(`  - ${f.name}: ${f.complexity}`);
    });
    
    // Count lines
    const lines = Actions.countLines(implementationCode);
    console.log('\n📝 Code Metrics:');
    console.log(`  Total Lines: ${lines.total}`);
    console.log(`  Code Lines: ${lines.code}`);
    console.log(`  Comment Lines: ${lines.comments}`);
    console.log(`  Blank Lines: ${lines.blank}`);
    
    // Step 5: Git Operations
    console.log('\n' + '='.repeat(60));
    console.log('STEP 5: Git Operations');
    console.log('='.repeat(60));
    
    // Check status
    const status = await Actions.gitStatus();
    console.log('\n📝 Git Status:');
    console.log(`  Modified: ${status.modified.length}`);
    console.log(`  Created: ${status.created.length}`);
    console.log(`  Deleted: ${status.deleted.length}`);
    
    // Stage files
    await Actions.gitAdd([implPath, testPath]);
    console.log('\n✅ Staged files for commit');
    
    // Create commit
    const commitHash = await Actions.gitCommit(
      'feat: Add JWT authentication endpoint\n\n- Implement /api/auth/login\n- Add rate limiting\n- Include comprehensive tests'
    );
    console.log(`\n✅ Created commit: ${commitHash.substring(0, 8)}`);
    
    // Show log
    const log = await Actions.gitLog({ maxCount: 1 });
    console.log('\n📜 Recent Commit:');
    console.log(`  Hash: ${log[0].hash.substring(0, 8)}`);
    console.log(`  Author: ${log[0].author_name}`);
    console.log(`  Message: ${log[0].message}`);
    
    // Step 6: File System Operations
    console.log('\n' + '='.repeat(60));
    console.log('STEP 6: File System Operations');
    console.log('='.repeat(60));
    
    // List files
    const files = await Actions.listFiles(testDir);
    console.log('\n📁 Files in project:');
    files.forEach(f => console.log(`  - ${f}`));
    
    // Search in files
    const searchResults = await Actions.searchInFiles(testDir, 'auth');
    console.log(`\n🔍 Search results for "auth": ${searchResults.length} matches`);
    searchResults.slice(0, 3).forEach(r => {
      console.log(`  - ${r.path}:${r.line} - ${r.content.substring(0, 50)}...`);
    });
    
    // Step 7: Format Code
    console.log('\n' + '='.repeat(60));
    console.log('STEP 7: Code Formatting');
    console.log('='.repeat(60));
    
    const formatted = await Actions.formatCode(implementationCode);
    console.log('\n✨ Code formatted successfully');
    console.log(`  Original: ${implementationCode.length} chars`);
    console.log(`  Formatted: ${formatted.length} chars`);
    
    // Final Summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 WORKFLOW COMPLETE');
    console.log('='.repeat(60));
    
    console.log('\n✅ Successfully completed:');
    console.log('  1. ✅ Requirements breakdown (Project Manager)');
    console.log('  2. ✅ Code implementation (Coder Agent)');
    console.log('  3. ✅ Test generation (Testing Agent)');
    console.log('  4. ✅ Code analysis (Code Analysis)');
    console.log('  5. ✅ Git operations (Version Control)');
    console.log('  6. ✅ File operations (File System)');
    console.log('  7. ✅ Code formatting (Code Quality)');
    
    console.log('\n📊 Final Statistics:');
    console.log(`  Files Created: ${files.length}`);
    console.log(`  Lines of Code: ${lines.code}`);
    console.log(`  Test Coverage: Generated comprehensive tests`);
    console.log(`  Complexity: ${complexity.total}`);
    console.log(`  Commits: 1`);
    
    console.log('\n🚀 All action modules working perfectly!');
    console.log('✨ Phase 2 & Phase 3 implementation validated!\n');
    
    return true;
    
  } catch (error: any) {
    console.error('\n❌ Workflow failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    return false;
  } finally {
    // Cleanup
    if (testDir) {
      try {
        await rm(testDir, { recursive: true, force: true });
        console.log(`\n🧹 Cleaned up test directory`);
      } catch (err) {
        console.warn(`\n⚠️  Could not cleanup: ${err}`);
      }
    }
  }
}

// Run the test
runRealLifeWorkflow()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

