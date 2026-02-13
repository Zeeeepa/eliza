#!/usr/bin/env node
/**
 * Debug failing agent tests - Project Manager and Architecture Agent
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'glm-4.5V';
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic';
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('Missing API credentials!');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  maxRetries: 0,
});

// Test 1: Project Manager - Break Down Feature Request
console.log('\n========== TEST 1: Project Manager - Break Down Feature Request ==========\n');

const pmPrompt = `You are a Project Manager Agent in a multi-agent software development system.

Your responsibilities:
- Break down requirements into actionable tasks
- Estimate complexity and effort
- Identify dependencies between tasks
- Coordinate work across multiple agents
- Track progress and manage workflow

Respond with structured plans including:
- Task lists with priorities
- Dependencies
- Time estimates
- Agent assignments
- Risk assessment

MCP Tools Available:
- File system operations (read/write/search)
- Git operations (status, diff, log)
- Linear/GitHub project management
- Code analysis tools`;

const pmInput = `Feature Request: Add user authentication with JWT tokens to our Express API.

Requirements:
- Login endpoint
- JWT token generation
- Token validation middleware
- Password hashing
- Refresh tokens

Create a detailed implementation plan.`;

client.messages.create({
  model: MODEL,
  max_tokens: 2000,
  temperature: 0.7,
  system: pmPrompt,
  messages: [{ role: 'user', content: pmInput }],
}).then(response => {
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log('PROJECT MANAGER RESPONSE:');
  console.log('='.repeat(80));
  console.log(text);
  console.log('='.repeat(80));
  
  // Check validation
  const hasTask = text.toLowerCase().includes('task');
  const hasDependencies = text.toLowerCase().includes('dependencies') || text.toLowerCase().includes('dependency');
  const hasComplexity = text.toLowerCase().includes('complexity') || text.toLowerCase().includes('estimate');
  
  console.log('\nVALIDATION CHECKS:');
  console.log(`✓ Contains "task": ${hasTask}`);
  console.log(`✓ Contains "dependencies": ${hasDependencies}`);
  console.log(`✓ Contains "complexity" or "estimate": ${hasComplexity}`);
  console.log(`\nPASSED: ${hasTask && hasDependencies && hasComplexity}`);
  
  // Test 2: Architecture Agent
  console.log('\n\n========== TEST 2: Architecture Agent - System Architecture Design ==========\n');
  
  const archPrompt = `You are an Architecture Agent in a multi-agent software development system.

Your responsibilities:
- Design system architecture
- Choose appropriate patterns
- Define interfaces and contracts
- Plan database schema
- Consider scalability and performance

MCP Tools Available:
- Codebase analysis tools
- Diagram generation (Mermaid)
- Database schema design
- Architecture documentation

Respond with:
- Architecture diagrams (Mermaid format)
- Component descriptions
- Interface definitions
- Data flow diagrams
- Technology recommendations`;

  const archInput = `Design the architecture for a real-time chat application with:
- Multiple chat rooms
- User presence tracking
- Message history
- File uploads
- 1000+ concurrent users

Provide architecture diagram in Mermaid format and component descriptions.`;

  return client.messages.create({
    model: MODEL,
    max_tokens: 2000,
    temperature: 0.7,
    system: archPrompt,
    messages: [{ role: 'user', content: archInput }],
  });
}).then(response => {
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log('ARCHITECTURE AGENT RESPONSE:');
  console.log('='.repeat(80));
  console.log(text);
  console.log('='.repeat(80));
  
  // Check validation
  const hasMermaid = text.includes('```mermaid') || text.toLowerCase().includes('diagram');
  const hasWebSocket = text.toLowerCase().includes('websocket') || text.toLowerCase().includes('socket');
  
  console.log('\nVALIDATION CHECKS:');
  console.log(`✓ Contains "mermaid" or "diagram": ${hasMermaid}`);
  console.log(`✓ Contains "websocket" or "socket": ${hasWebSocket}`);
  console.log(`\nPASSED: ${hasMermaid && hasWebSocket}`);
  
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

