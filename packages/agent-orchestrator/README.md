# @elizaos/agent-orchestrator

Multi-agent orchestration system for automated software development with ElizaOS.

## Features

### Core Components

- **MessageBus**: Event-driven communication with priority routing and dead letter queue
- **AgentRegistry**: Agent discovery, health monitoring, and load balancing
- **TaskQueue**: Priority-based task scheduling with dependency resolution
- **WorkflowEngine**: 8-phase workflow execution with checkpoints and rollback
- **StateManager**: Transactional state management with snapshots
- **RepositoryAnalyzer**: Code analysis and metrics
- **PRDParser**: Product requirements document parsing

### Workflow Phases

1. **Planning** - Analyze requirements and create execution plan
2. **Research** - Gather information and dependencies
3. **Design** - Create architecture and design documents
4. **Implementation** - Write code and implement features
5. **Testing** - Run tests and validate functionality
6. **Review** - Code review and quality assurance
7. **Deployment** - Deploy changes to production
8. **Monitoring** - Monitor performance and errors

## Installation

```bash
npm install @elizaos/agent-orchestrator
```

## Quick Start

```typescript
import { MultiAgentOrchestrator } from "@elizaos/agent-orchestrator";

// Initialize orchestrator
const orchestrator = new MultiAgentOrchestrator();
await orchestrator.initialize();

// Register agents
const registry = orchestrator.getAgentRegistry();
await registry.registerAgent({
  id: "planner-001",
  name: "Planning Agent",
  type: "planner",
  capabilities: ["planning", "requirements-analysis"],
  status: "idle",
  metadata: {}
});

// Create workflow
const workflowEngine = orchestrator.getWorkflowEngine();
const workflowId = await workflowEngine.createWorkflow(
  "Build Feature X",
  "Implement new feature according to PRD",
  { prdUrl: "https://..." }
);

// Add tasks
workflowEngine.addTask(
  workflowId,
  "planning",
  "planner",
  "Analyze requirements"
);

// Start workflow
await workflowEngine.startWorkflow(workflowId);
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         MultiAgentOrchestrator              │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐      ┌──────────────┐   │
│  │  MessageBus  │◄────►│AgentRegistry │   │
│  └──────────────┘      └──────────────┘   │
│         ▲                      ▲           │
│         │                      │           │
│  ┌──────▼──────┐      ┌────────▼──────┐   │
│  │  TaskQueue  │◄────►│StateManager   │   │
│  └─────────────┘      └───────────────┘   │
│         ▲                      ▲           │
│         │                      │           │
│  ┌──────▼──────────────────────▼──────┐   │
│  │       WorkflowEngine                │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────┐  ┌─────────────┐    │
│  │RepositoryAnalyzer│  │  PRDParser  │    │
│  └──────────────────┘  └─────────────┘    │
└─────────────────────────────────────────────┘
```

## API Reference

### MessageBus

```typescript
// Publish message
messageBus.publish({
  id: "msg-001",
  type: "task",
  priority: "high",
  timestamp: new Date(),
  payload: { /* ... */ }
});

// Subscribe to messages
messageBus.subscribe("task", (message) => {
  console.log("Received:", message);
});
```

### AgentRegistry

```typescript
// Register agent
await registry.registerAgent({
  id: "agent-001",
  name: "Code Generator",
  type: "generator",
  capabilities: ["code-generation", "refactoring"],
  status: "idle"
});

// Find agents by capability
const agents = registry.findAgentsByCapability("code-generation");

// Update agent status
registry.updateAgentStatus("agent-001", "busy");
```

### TaskQueue

```typescript
// Enqueue task
await taskQueue.enqueueTask({
  id: "task-001",
  type: "code-generation",
  priority: 8,
  payload: { /* ... */ },
  dependencies: ["task-000"]
});

// Dequeue task
const task = await taskQueue.dequeueTask();

// Complete task
await taskQueue.completeTask("task-001", { result: "success" });
```

### WorkflowEngine

```typescript
// Create workflow
const workflowId = await engine.createWorkflow(
  "Feature Implementation",
  "Build feature X"
);

// Add tasks
engine.addTask(
  workflowId,
  WorkflowPhase.PLANNING,
  "planner",
  "Create plan",
  { prd: "..." }
);

// Start workflow
await engine.startWorkflow(workflowId);

// Monitor progress
engine.on("phase:completed", ({ workflowId, phase }) => {
  console.log(`Phase ${phase} completed`);
});
```

### StateManager

```typescript
// Initialize state
stateManager.initializeState(workflowId, {
  step: 0,
  data: {}
});

// Update state
stateManager.updateState(workflowId, {
  step: 1,
  result: "completed"
});

// Create snapshot
const snapshotId = stateManager.createSnapshot(workflowId);

// Restore snapshot
stateManager.restoreSnapshot(workflowId, snapshotId);
```

## Events

The orchestrator emits various events for monitoring:

```typescript
// Workflow events
workflowEngine.on("workflow:created", (workflow) => {});
workflowEngine.on("workflow:started", (workflow) => {});
workflowEngine.on("workflow:completed", (workflow) => {});
workflowEngine.on("workflow:failed", ({ workflow, error }) => {});

// Phase events
workflowEngine.on("phase:started", ({ workflowId, phase }) => {});
workflowEngine.on("phase:completed", ({ workflowId, phase }) => {});

// Task events
workflowEngine.on("task:started", ({ workflowId, task }) => {});
workflowEngine.on("task:completed", ({ workflowId, task }) => {});
workflowEngine.on("task:failed", ({ workflowId, task, error }) => {});

// State events
stateManager.on("state:updated", ({ workflowId, updates }) => {});
stateManager.on("snapshot:created", (snapshot) => {});
```

## Configuration

```typescript
const orchestrator = new MultiAgentOrchestrator();

// Configure workflow engine
const engine = new WorkflowEngine(
  messageBus,
  agentRegistry,
  taskQueue,
  {
    maxRetries: 3,
    retryDelay: 5000,
    timeout: 300000,
    checkpointInterval: 60000,
    enableRollback: true
  }
);
```

## Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Examples

See the `examples/` directory for complete examples:

- `simple-workflow.ts` - Basic workflow creation
- `multi-phase.ts` - Multi-phase execution
- `error-handling.ts` - Error recovery and rollback
- `state-management.ts` - State snapshots and rollback

## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) for details.

## License

MIT © ElizaOS Contributors

