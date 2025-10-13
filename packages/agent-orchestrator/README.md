# ElizaOS Multi-Agent Orchestrator

> **Status**: 🚧 Under Active Development (v0.1.0)

A comprehensive multi-agent orchestration system for automated software development workflows.

## 🎯 Overview

The ElizaOS Multi-Agent Orchestrator enables autonomous software development through coordinated multi-agent workflows. It manages 9 specialized agents that work together to transform Product Requirement Documents (PRDs) into fully implemented, tested, and deployed software.

## ✨ Features

- **🤖 9 Specialized Agents**: Project Manager, Research, Architecture, Coder, Testing, Debug, Documentation, DevOps, and Security
- **📡 Event-Driven Communication**: Priority-based message bus for inter-agent communication
- **🔄 Workflow Orchestration**: Automated task scheduling with dependency resolution
- **📦 Repository Management**: Git operations and file management
- **🌐 Web Interface**: Real-time monitoring and control dashboard
- **🔔 Notifications**: Completion alerts and progress updates
- **💾 State Persistence**: Workflow recovery and history tracking

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         Web UI (Real-time Dashboard)        │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│     API Server + WebSocket (Express/WS)     │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         Workflow Orchestration Engine        │
│  ┌─────────────────────────────────────┐    │
│  │    Task Scheduler + State Manager   │    │
│  └─────────────────────────────────────┘    │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│         Message Bus (Event-Driven)          │
│      Agent Registry + Priority Queue        │
└─────┬─────┬─────┬─────┬─────┬─────┬─────┬──┘
      │     │     │     │     │     │     │
┌─────▼─┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ┌─▼───┐ ...
│  PM   │ │ Res │ │ Arch│ │Code │ │Test │
│ Agent │ │Agent│ │Agent│ │Agent│ │Agent│
└───────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

## 🚀 Quick Start

### Prerequisites

- Bun >= 1.0.0
- Git
- Node.js >= 18 (for compatibility)

### Installation

```bash
# Install dependencies
cd packages/agent-orchestrator
bun install

# Build the package
bun run build

# Run tests
bun test
```

### Development

```bash
# Watch mode for development
bun run dev

# Start server in development mode
bun run start:dev

# Run tests in watch mode
bun test --watch
```

## 📚 Documentation

- [Implementation Roadmap](./docs/IMPLEMENTATION_ROADMAP.md) - Detailed 34-step implementation guide
- [Architecture Guide](./docs/ARCHITECTURE.md) - System architecture and design decisions (Coming soon)
- [Agent Development](./docs/AGENTS.md) - Guide for creating custom agents (Coming soon)
- [API Reference](./docs/API.md) - REST API and WebSocket documentation (Coming soon)

## 🧩 Core Components

### Agents

1. **Project Manager Agent** - Workflow coordination and task decomposition
2. **Research Agent** - Technical research and documentation gathering
3. **Architecture Agent** - System design and technology selection
4. **Coder Agent** - Code implementation and refactoring
5. **Testing Agent** - Test generation and execution
6. **Debug Agent** - Error analysis and bug fixing
7. **Documentation Agent** - Technical writing and documentation
8. **DevOps Agent** - CI/CD and deployment configuration
9. **Security Agent** - Security review and vulnerability scanning

### Communication System

- **Message Bus**: Event-driven communication with priority queuing
- **Agent Registry**: Agent discovery and capability matching
- **Message Queue**: Persistent priority-based message delivery

### Orchestration

- **Workflow Engine**: Task scheduling and execution management
- **State Manager**: Workflow state persistence and recovery
- **PRD Parser**: Requirement extraction and task generation
- **Task Scheduler**: Dependency resolution and parallel execution

### Repository Management

- **Repository Manager**: Git operations (clone, branch, commit, push)
- **File Manager**: Safe file operations with validation
- **Change Tracker**: Diff generation and conflict detection

## 🔧 Configuration

Create a `.env` file in the package root:

```env
# Repository Configuration
REPOSITORY_URL=https://github.com/your-org/your-repo
REPOSITORY_BRANCH=main
REPOSITORY_PATH=./workspace

# GitHub Token (optional, for private repos)
GITHUB_TOKEN=your_github_token

# Server Configuration
API_PORT=3000
WS_PORT=3001

# Agent Configuration
AGENT_TIMEOUT=300000
MAX_RETRIES=3

# State Persistence
STATE_PATH=./state/workflow.json
```

## 🎮 Usage

### Starting a Workflow

```typescript
import { WorkflowEngine } from "@elizaos/agent-orchestrator";

const engine = new WorkflowEngine({
  repository: {
    url: "https://github.com/your-org/your-repo",
    branch: "main",
    path: "./workspace"
  },
  prd: {
    path: "./examples/sample-prd.md"
  }
});

await engine.initialize();
const workflowId = await engine.startWorkflow();

console.log(`Workflow started: ${workflowId}`);
```

### Adding Requirements Dynamically

```typescript
await engine.addRequirement(workflowId, {
  title: "Add user authentication",
  description: "Implement JWT-based authentication",
  priority: "high",
  acceptanceCriteria: [
    "Users can register and login",
    "JWT tokens are issued on login",
    "Protected routes verify tokens"
  ]
});
```

### Monitoring Progress

```typescript
// Via WebSocket
const ws = new WebSocket('ws://localhost:3001');

ws.on('message', (data) => {
  const event = JSON.parse(data);
  console.log('Event:', event.type, event.data);
});

// Via API
const status = await fetch(`http://localhost:3000/api/workflows/${workflowId}`);
const workflow = await status.json();

console.log(`Progress: ${workflow.progress}%`);
console.log(`Status: ${workflow.status}`);
```

## 🧪 Testing

```bash
# Run all tests
bun test

# Run specific test suite
bun test tests/communication/

# Run with coverage
bun test --coverage

# Watch mode
bun test --watch
```

## 📦 Project Structure

```
packages/agent-orchestrator/
├── src/
│   ├── agents/              # All agent implementations
│   │   ├── base-agent.ts    # Abstract base class
│   │   ├── project-manager/
│   │   ├── research/
│   │   ├── architecture/
│   │   ├── coder/
│   │   ├── testing/
│   │   ├── debug/
│   │   ├── documentation/
│   │   ├── devops/
│   │   └── security/
│   ├── communication/       # Message bus & registry
│   ├── repository/          # Git operations
│   ├── orchestrator/        # Workflow engine
│   ├── workflows/           # PRD parser & scheduler
│   ├── state/              # State management
│   ├── server/             # API & WebSocket servers
│   ├── notifications/       # Alert system
│   └── types/              # TypeScript definitions
├── ui/                     # Web interface
├── tests/                  # Test suites
├── docs/                   # Documentation
└── examples/               # Example PRDs

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Make your changes
4. Write/update tests
5. Run tests (`bun test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feat/amazing-feature`)
8. Open a Pull Request

## 📋 Roadmap

See [IMPLEMENTATION_ROADMAP.md](./docs/IMPLEMENTATION_ROADMAP.md) for the detailed development plan.

### Current Phase: Foundation (Steps 1-6)

- [x] Step 1: Package structure and configuration
- [ ] Step 2: Core domain types
- [ ] Step 3: Communication message types
- [ ] Step 4: Message bus implementation
- [ ] Step 5: Agent registry and message queue
- [ ] Step 6: Communication tests

### Upcoming Phases

- Phase 2: Agent Implementation (Steps 7-25)
- Phase 3: Repository Management (Steps 26-28)
- Phase 4: Orchestration (Steps 29-32)
- Phase 5: Integration (Steps 33-34)

## 📄 License

MIT License - see [LICENSE](../../LICENSE) for details.

## 🙏 Acknowledgments

Built on the [ElizaOS](https://github.com/elizaos/eliza) framework.

## 📞 Support

- 📧 Email: support@elizaos.com
- 💬 Discord: [Join our community](https://discord.gg/elizaos)
- 🐛 Issues: [GitHub Issues](https://github.com/elizaos/eliza/issues)

---

**Note**: This package is under active development. APIs may change before v1.0.0 release.

