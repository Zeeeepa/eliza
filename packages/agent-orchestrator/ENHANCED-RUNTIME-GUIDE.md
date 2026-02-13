# Enhanced Multi-Agent Runtime Guide

## Overview

The **Enhanced Multi-Agent Runtime** provides a complete implementation of multi-agent orchestration using Eliza's actual runtime system, with full support for:

- ✅ **Real Eliza AgentRuntime integration**
- ✅ **MCP server connections per agent**
- ✅ **Dynamic plugin management**
- ✅ **Custom tool registration**
- ✅ **Flexible agent creation**

## Key Differences from Basic Runtime

| Feature | Basic Runtime | Enhanced Runtime |
|---------|--------------|------------------|
| Eliza Integration | ❌ Raw API calls | ✅ Full AgentRuntime |
| MCP Servers | ❌ None | ✅ Per-agent MCP |
| Plugin Management | ❌ Hardcoded | ✅ Dynamic addition |
| Custom Tools | ❌ Not supported | ✅ Runtime registration |
| Agent Creation | ❌ Fixed 3 agents | ✅ Unlimited custom agents |

---

## Installation

```bash
npm install @elizaos/core @elizaos/plugin-bootstrap
```

---

## Quick Start

### 1. Create Runtime

```typescript
import { EnhancedMultiAgentRuntime, AgentRole } from '@elizaos/agent-orchestrator';

const runtime = new EnhancedMultiAgentRuntime();
```

### 2. Define Agent Character

```typescript
import type { Character } from '@elizaos/core';

const projectManagerChar: Character = {
  name: 'Alex',
  username: 'project_manager',
  clients: [],
  modelProvider: 'anthropic',
  settings: {
    secrets: {},
    voice: { model: 'en_US-female-medium' }
  },
  system: `You are an expert Project Manager AI agent...`,
  bio: ['Expert project manager with 10+ years experience'],
  lore: [],
  knowledge: ['Project management', 'Agile', 'Scrum'],
  messageExamples: [],
  postExamples: [],
  topics: ['planning', 'estimation'],
  style: {
    all: ['Be clear and concise'],
    chat: [],
    post: []
  },
  adjectives: ['organized', 'analytical']
};
```

### 3. Create Agent

```typescript
import { bootstrapPlugin } from '@elizaos/plugin-bootstrap';

const agent = await runtime.createAgent({
  role: AgentRole.PROJECT_MANAGER,
  character: projectManagerChar,
  plugins: [bootstrapPlugin]
});
```

### 4. Send Messages

```typescript
const responses = await runtime.sendMessage(
  AgentRole.PROJECT_MANAGER,
  'Create a plan to build a REST API',
  'room-123',
  'user-456'
);
```

---

## Advanced Features

### Adding MCP Servers

```typescript
await runtime.addMCPServer('project_manager', {
  name: 'filesystem',
  serverPath: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/dir'],
  env: {
    CUSTOM_VAR: 'value'
  }
});
```

### Adding Custom Tools

```typescript
import type { Action } from '@elizaos/core';

const customTool: Action = {
  name: 'SEARCH_WEB',
  similes: ['search', 'google'],
  description: 'Search the web',
  examples: [],
  validate: async () => true,
  handler: async (runtime, message, state) => {
    // Tool implementation
    console.log('Searching:', message.content.text);
    return true;
  }
};

await runtime.addTool(AgentRole.PROJECT_MANAGER, customTool);
```

### Adding Plugins Dynamically

```typescript
import { sqlPlugin } from '@elizaos/plugin-sql';

await runtime.addPlugin(AgentRole.CODER, sqlPlugin);
```

### Creating Custom Agents

```typescript
const customAgent = await runtime.createAgent({
  role: 'security_auditor',
  character: securityAuditorChar,
  plugins: [bootstrapPlugin, sqlPlugin],
  mcpServers: [{
    name: 'security-scanner',
    serverPath: './mcp-servers/security.js'
  }],
  tools: [customSecurityTool]
});
```

---

## Multi-Agent Task Execution

```typescript
const results = await runtime.executeTask({
  description: 'Build a user authentication system',
  roomId: 'room-123',
  userId: 'user-456',
  agents: [
    AgentRole.PROJECT_MANAGER,
    AgentRole.ARCHITECT,
    AgentRole.CODER,
    AgentRole.TESTER
  ]
});

// Process results
for (const [agentRole, memories] of results.entries()) {
  console.log(`${agentRole} responded with ${memories.length} messages`);
}
```

---

## Agent Management

### List All Agents

```typescript
const agents = runtime.listAgentRoles();
console.log('Active agents:', agents);
```

### Get Specific Agent

```typescript
const pmAgent = runtime.getAgent(AgentRole.PROJECT_MANAGER);
if (pmAgent) {
  console.log('Agent ID:', pmAgent.agentId);
}
```

### Remove Agent

```typescript
await runtime.removeAgent('security_auditor');
```

---

## MCP Server Integration

### Example: Filesystem MCP

```typescript
await runtime.addMCPServer('coder', {
  name: 'filesystem',
  serverPath: 'npx',
  args: [
    '-y',
    '@modelcontextprotocol/server-filesystem',
    '/project/src'
  ]
});
```

### Example: Database MCP

```typescript
await runtime.addMCPServer('coder', {
  name: 'postgres',
  serverPath: './mcp-servers/postgres-server.js',
  env: {
    DATABASE_URL: process.env.DATABASE_URL
  }
});
```

### How MCP Tools Work

1. Runtime connects to MCP server
2. Lists available tools from server
3. Converts each MCP tool to Eliza Action
4. Registers actions with agent runtime
5. Agent can now use MCP tools via natural language

---

## Configuration Examples

### Z.ai Configuration

```typescript
import { ModelProviderName } from '@elizaos/core';

const agent = await runtime.createAgent({
  role: AgentRole.CODER,
  character: coderChar,
  plugins: [bootstrapPlugin],
  modelProvider: ModelProviderName.ANTHROPIC,
  token: process.env.ANTHROPIC_AUTH_TOKEN
});
```

Set environment variables:
```bash
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=your-token
```

### OpenAI Configuration

```typescript
const agent = await runtime.createAgent({
  role: AgentRole.CODER,
  character: coderChar,
  plugins: [bootstrapPlugin],
  modelProvider: ModelProviderName.OPENAI,
  token: process.env.OPENAI_API_KEY
});
```

---

## Plugin System

### Available Plugins

- `@elizaos/plugin-bootstrap` - Core actions & providers
- `@elizaos/plugin-sql` - Database operations
- `@elizaos/plugin-anthropic-enhanced` - Enhanced Anthropic features
- `@elizaos/plugin-image-generation` - Image generation
- And more...

### Plugin Structure

Plugins provide:
- **Actions**: Tools the agent can execute
- **Providers**: Data sources and context
- **Evaluators**: Decision-making logic

### Example: Creating a Custom Plugin

```typescript
import type { Plugin, Action } from '@elizaos/core';

const myCustomAction: Action = {
  name: 'CUSTOM_ACTION',
  similes: ['do_custom'],
  description: 'My custom action',
  examples: [],
  validate: async () => true,
  handler: async (runtime, message, state) => {
    // Implementation
    return true;
  }
};

const myPlugin: Plugin = {
  name: 'my-custom-plugin',
  description: 'My custom plugin',
  actions: [myCustomAction],
  providers: [],
  evaluators: []
};

// Add to agent
await runtime.addPlugin(AgentRole.CODER, myPlugin);
```

---

## Error Handling

```typescript
try {
  const agent = await runtime.createAgent(config);
  const response = await runtime.sendMessage(...);
} catch (error) {
  if (error.message.includes('not found')) {
    // Agent doesn't exist
  } else if (error.message.includes('MCP')) {
    // MCP server error
  } else {
    // Other error
  }
}
```

---

## Testing

Run the comprehensive test:

```bash
# Set credentials
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=your-token

# Run test
npx tsx packages/agent-orchestrator/tests/test-enhanced-runtime.ts
```

Test coverage includes:
- ✅ Agent creation with plugins
- ✅ Custom tool registration
- ✅ Message handling
- ✅ Multi-agent coordination
- ✅ Dynamic agent creation
- ✅ Agent removal

---

## Best Practices

### 1. Character Design

- Write clear, detailed system prompts
- Define specific knowledge domains
- Include example behaviors
- Set appropriate communication style

### 2. Plugin Selection

- Use `bootstrapPlugin` for core functionality
- Add specialized plugins per agent role
- Avoid plugin conflicts

### 3. MCP Server Usage

- One MCP server per domain (files, DB, etc.)
- Configure proper permissions
- Handle connection errors gracefully

### 4. Tool Design

- Make tools focused and specific
- Provide clear descriptions
- Include similes for discovery
- Validate inputs properly

### 5. Error Handling

- Always wrap agent calls in try-catch
- Check agent existence before messaging
- Handle MCP connection failures
- Log errors with context

---

## Architecture

```
EnhancedMultiAgentRuntime
├── Agent 1 (Project Manager)
│   ├── Eliza AgentRuntime
│   ├── Plugins: [bootstrap, sql]
│   ├── MCP Servers: [filesystem]
│   └── Custom Tools: [searchWeb]
├── Agent 2 (Coder)
│   ├── Eliza AgentRuntime
│   ├── Plugins: [bootstrap, image-gen]
│   ├── MCP Servers: [postgres, redis]
│   └── Custom Tools: [lintCode]
└── Agent N (Custom)
    ├── Eliza AgentRuntime
    ├── Plugins: [...]
    ├── MCP Servers: [...]
    └── Custom Tools: [...]
```

---

## Comparison: Before vs After

### Before (Simple Runtime)

```typescript
// Just raw API calls
const response = await anthropicClient.messages.create({
  model: 'glm-4.5V',
  system: 'You are a PM...',
  messages: [{ role: 'user', content: 'task' }]
});
```

**Limitations:**
- ❌ No Eliza integration
- ❌ No MCP support
- ❌ No plugin system
- ❌ No tool registration
- ❌ Just prompt engineering

### After (Enhanced Runtime)

```typescript
// Full Eliza runtime with tools & MCP
const runtime = new EnhancedMultiAgentRuntime();

const agent = await runtime.createAgent({
  role: 'project_manager',
  character: pmChar,
  plugins: [bootstrapPlugin, sqlPlugin],
  mcpServers: [filesystemMCP],
  tools: [customSearchTool]
});

const response = await runtime.sendMessage(
  'project_manager',
  'task',
  roomId,
  userId
);
```

**Benefits:**
- ✅ Full Eliza AgentRuntime
- ✅ MCP server integration
- ✅ Dynamic plugin system
- ✅ Custom tool support
- ✅ Real agent orchestration

---

## Troubleshooting

### Agent not responding

```typescript
// Check if agent exists
const agent = runtime.getAgent('my_agent');
if (!agent) {
  console.error('Agent not found!');
}

// Check if initialized
console.log('Agent ID:', agent.agentId);
```

### MCP server connection fails

```typescript
// Check MCP server path
// Check args and env variables
// Test MCP server independently first
```

### Plugin conflicts

```typescript
// Avoid adding same plugin twice
// Check plugin compatibility
// Review plugin documentation
```

---

## Next Steps

1. Review the [test file](./tests/test-enhanced-runtime.ts) for examples
2. Create your own custom agents and tools
3. Integrate MCP servers for your use case
4. Build multi-agent workflows
5. Contribute improvements!

---

## Contributing

Found a bug or have a feature request? Open an issue or PR!

## License

MIT

