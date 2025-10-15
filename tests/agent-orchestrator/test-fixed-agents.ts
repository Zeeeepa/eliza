#!/usr/bin/env node
/**
 * Quick test for fixed Project Manager and Architecture Agent
 */

import Anthropic from '@anthropic-ai/sdk';

const MODEL = process.env.ANTHROPIC_MODEL || 'glm-4.5V';
const BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://api.z.ai/api/anthropic';
const API_KEY = process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  console.error('❌ Missing API credentials!');
  process.exit(1);
}

const client = new Anthropic({
  apiKey: API_KEY,
  baseURL: BASE_URL,
  maxRetries: 0,
});

// Enhanced prompts with explicit requirements
const PM_PROMPT = `You are a Project Manager Agent in a multi-agent software development system.

Your responsibilities:
- Break down requirements into actionable tasks
- Estimate complexity and effort
- Identify dependencies between tasks
- Coordinate work across multiple agents
- Track progress and manage workflow

**REQUIRED**: Your response MUST include:
1. A clear task breakdown (use words: "task", "phase", or "step")
2. Dependency information (use words: "dependencies", "depends on", or "requires")
3. Effort estimates (use words: "complexity", "estimate", "time", or "effort")

Respond with structured plans including:
- Task lists with priorities and numbers
- Dependencies between tasks (clearly labeled)
- Time estimates or complexity ratings (low/medium/high)
- Agent assignments
- Risk assessment
- Mermaid diagrams for dependencies when helpful

Format your response with clear headers and structured sections.`;

const ARCH_PROMPT = `You are an Architecture Agent in a multi-agent software development system.

Your responsibilities:
- Design system architecture
- Choose appropriate patterns
- Define interfaces and contracts
- Plan database schema
- Consider scalability and performance

**REQUIRED**: For real-time/chat applications, your response MUST include:
1. Architecture diagrams in Mermaid format (start with \`\`\`mermaid)
2. Specific mention of real-time technologies (WebSocket, Socket.io, pub/sub, etc.)
3. Component descriptions with clear responsibilities

Respond with:
- Architecture diagrams (Mermaid format - REQUIRED for system design questions)
- Component descriptions with detailed responsibilities
- Interface definitions (TypeScript/OpenAPI format)
- Data flow diagrams or sequence diagrams
- Technology recommendations with justification

Always use Mermaid syntax for diagrams.
Format with clear headers and sections.`;

async function testProjectManager() {
  console.log('\n🧪 Testing Project Manager Agent...\n');
  
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.7,
    system: PM_PROMPT,
    messages: [{
      role: 'user',
      content: `Feature Request: Add user authentication with JWT tokens to our Express API.

Requirements:
- Login endpoint
- JWT token generation
- Token validation middleware
- Password hashing
- Refresh tokens

Create a detailed implementation plan.`,
    }],
  });
  
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const lower = text.toLowerCase();
  
  const hasTask = lower.includes('task') || lower.includes('phase') || lower.includes('step');
  const hasDeps = lower.includes('dependencies') || lower.includes('dependency') || lower.includes('depends');
  const hasEstimate = lower.includes('complexity') || lower.includes('estimate') || lower.includes('time') || lower.includes('effort');
  
  const passed = hasTask && hasDeps && hasEstimate;
  
  console.log('✅ Task breakdown:', hasTask ? 'FOUND' : 'MISSING');
  console.log('✅ Dependencies:', hasDeps ? 'FOUND' : 'MISSING');
  console.log('✅ Estimates:', hasEstimate ? 'FOUND' : 'MISSING');
  console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'} (${response.usage.input_tokens}+${response.usage.output_tokens} tokens)`);
  
  if (!passed) {
    console.log('\n📄 Response preview:');
    console.log(text.substring(0, 500));
  }
  
  return passed;
}

async function testArchitectureAgent() {
  console.log('\n🧪 Testing Architecture Agent...\n');
  
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    temperature: 0.7,
    system: ARCH_PROMPT,
    messages: [{
      role: 'user',
      content: `Design the architecture for a real-time chat application with:
- Multiple chat rooms
- User presence tracking
- Message history
- File uploads
- 1000+ concurrent users

Provide architecture diagram in Mermaid format and component descriptions.`,
    }],
  });
  
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const lower = text.toLowerCase();
  
  const hasDiagram = text.includes('```mermaid') || lower.includes('diagram') || lower.includes('architecture');
  const hasRealtime = lower.includes('websocket') || lower.includes('socket') || lower.includes('real-time') || lower.includes('realtime');
  
  const passed = hasDiagram && hasRealtime;
  
  console.log('✅ Architecture diagram:', hasDiagram ? 'FOUND' : 'MISSING');
  console.log('✅ Real-time tech:', hasRealtime ? 'FOUND' : 'MISSING');
  console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'} (${response.usage.input_tokens}+${response.usage.output_tokens} tokens)`);
  
  if (!passed) {
    console.log('\n📄 Response preview:');
    console.log(text.substring(0, 500));
  }
  
  return passed;
}

async function main() {
  console.log('🚀 Testing Fixed Agents with Enhanced Prompts\n');
  console.log(`Model: ${MODEL}`);
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const pmPassed = await testProjectManager();
  
  // Wait 1 second between tests
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const archPassed = await testArchitectureAgent();
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Final Results');
  console.log('='.repeat(60));
  console.log(`Project Manager: ${pmPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Architecture Agent: ${archPassed ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (pmPassed && archPassed) {
    console.log('\n🎉 Both agents now pass all validations!');
    console.log('✅ Ready to commit and push the fixes');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests still failing - review the output above');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

