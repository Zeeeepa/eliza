# Implementation Roadmap - Multi-Agent Orchestrator

This document provides a detailed 34-step implementation guide for the ElizaOS Multi-Agent Orchestrator system.

## Overview

The implementation is organized into 6 phases:
1. **Foundation** (Steps 1-6): Core infrastructure
2. **Agent Implementation** (Steps 7-25): All 9 agents with tests
3. **Repository Management** (Steps 26-28): Git and file operations
4. **Orchestration** (Steps 29-32): Workflow engine and state management
5. **Integration** (Steps 33-34): API server and WebSocket

---

## Phase 1: Foundation (Steps 1-6)

### Step 1: Initialize Package Structure ✅
**Status**: Completed

**Files Created**:
- `package.json` - Workspace dependencies configured
- `tsconfig.json` - TypeScript configuration
- Directory structure created

**Dependencies**:
- @elizaos/core
- @elizaos/plugin-github
- @elizaos/plugin-node
- @elizaos/plugin-bootstrap
- express, ws, cors, uuid, zod

**Verification**:
```bash
cd packages/agent-orchestrator
bun install
bun run build
```

---

### Step 2: Define Core Domain Types
**Status**: Next

**Objective**: Create comprehensive TypeScript interfaces for all domain entities.

**Files to Create**:
- `src/types/index.ts` - Main type exports
- `src/types/task.ts` - Task-related types
- `src/types/agent.ts` - Agent interfaces
- `src/types/workflow.ts` - Workflow state types

**Key Types**:

```typescript
// Task Types
export interface Task {
  id: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  dependencies: string[];
  data: Record<string, any>;
  assignedAgent?: string;
  result?: TaskResult;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskResult {
  success: boolean;
  data?: any;
  errors?: string[];
  artifacts?: Artifact[];
  metrics?: TaskMetrics;
}

// Agent Types
export interface AgentInterface {
  id: string;
  name: string;
  type: AgentType;
  capabilities: AgentCapability[];
  status: AgentStatus;
  
  initialize(): Promise<void>;
  execute(task: Task): Promise<TaskResult>;
  getName(): string;
  getCapabilities(): AgentCapability[];
}

// Workflow Types
export interface WorkflowState {
  id: string;
  status: WorkflowStatus;
  tasks: Map<string, Task>;
  agents: Map<string, AgentInterface>;
  repository: RepositoryConfig;
  prd: PRDRequirement[];
  currentPhase: string;
  progress: number;
  startedAt: Date;
  updatedAt: Date;
}

// PRD Types
export interface PRDRequirement {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  acceptanceCriteria: string[];
  category: string;
  dependencies: string[];
}

// Repository Types
export interface RepositoryConfig {
  url: string;
  branch: string;
  path: string;
  credentials?: {
    token?: string;
    username?: string;
    password?: string;
  };
}
```

**Enums**:
```typescript
export enum TaskType {
  RESEARCH = "research",
  DESIGN = "design",
  CODE = "code",
  TEST = "test",
  DEBUG = "debug",
  DOCUMENT = "document",
  REVIEW = "review",
  DEPLOY = "deploy",
  MONITOR = "monitor"
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  BLOCKED = "blocked",
  CANCELLED = "cancelled"
}

export enum AgentType {
  PROJECT_MANAGER = "project_manager",
  RESEARCHER = "researcher",
  ARCHITECT = "architect",
  CODER = "coder",
  TESTER = "tester",
  DEBUGGER = "debugger",
  DOCUMENTER = "documenter",
  DEVOPS = "devops",
  SECURITY = "security"
}

export enum AgentCapability {
  PLANNING = "planning",
  RESEARCH = "research",
  ARCHITECTURE = "architecture",
  CODING = "coding",
  TESTING = "testing",
  DEBUGGING = "debugging",
  DOCUMENTATION = "documentation",
  DEPLOYMENT = "deployment",
  SECURITY_ANALYSIS = "security_analysis"
}

export enum WorkflowStatus {
  INITIALIZING = "initializing",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}
```

**Acceptance Criteria**:
- [ ] All domain types defined with proper TypeScript types
- [ ] Comprehensive JSDoc comments
- [ ] Exported from index.ts
- [ ] Type-safe and strictly typed
- [ ] No `any` types except in specific data fields

---

### Step 3: Define Communication Message Types
**Status**: Pending

**Objective**: Create message and event type definitions for agent communication.

**Files to Create**:
- `src/types/messages.ts` - Message types
- `src/types/events.ts` - Event types

**Key Types**:

```typescript
// Message Types
export interface Message {
  id: string;
  from: string;
  to: string | string[];
  type: MessageType;
  payload: any;
  priority: MessagePriority;
  timestamp: Date;
  correlationId?: string;
}

export enum MessageType {
  REQUEST = "request",
  RESPONSE = "response",
  BROADCAST = "broadcast",
  NOTIFICATION = "notification",
  COMMAND = "command",
  QUERY = "query"
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

// Specific Message Types
export interface RequestMessage extends Message {
  type: MessageType.REQUEST;
  payload: {
    action: string;
    params: Record<string, any>;
  };
}

export interface ResponseMessage extends Message {
  type: MessageType.RESPONSE;
  payload: {
    success: boolean;
    data?: any;
    error?: string;
  };
}

export interface BroadcastMessage extends Message {
  type: MessageType.BROADCAST;
  to: string[];
}

// Event Types
export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  timestamp: Date;
  data: any;
}

export enum AgentEventType {
  AGENT_STARTED = "agent_started",
  AGENT_STOPPED = "agent_stopped",
  TASK_ASSIGNED = "task_assigned",
  TASK_STARTED = "task_started",
  TASK_COMPLETED = "task_completed",
  TASK_FAILED = "task_failed",
  ERROR_OCCURRED = "error_occurred",
  STATUS_CHANGED = "status_changed"
}
```

**Acceptance Criteria**:
- [ ] Message types properly defined
- [ ] Event types comprehensive
- [ ] Type guards for message type checking
- [ ] Serialization/deserialization helpers

---

### Step 4: Implement Message Bus Core
**Status**: Pending

**Objective**: Build event-driven message bus using EventTarget.

**Files to Create**:
- `src/communication/message-bus.ts`
- `src/communication/index.ts`

**Implementation**:

```typescript
import { Message, MessageType, MessagePriority } from "../types/messages.js";

export class MessageBus extends EventTarget {
  private messageQueue: Map<string, Message[]> = new Map();
  private subscribers: Map<string, Set<string>> = new Map();
  private deadLetterQueue: Message[] = [];
  private maxRetries = 3;

  constructor() {
    super();
  }

  /**
   * Send a message to specific recipient(s)
   */
  async send(message: Message): Promise<void> {
    try {
      this.validateMessage(message);
      
      const recipients = Array.isArray(message.to) 
        ? message.to 
        : [message.to];

      for (const recipient of recipients) {
        if (!this.messageQueue.has(recipient)) {
          this.messageQueue.set(recipient, []);
        }
        
        const queue = this.messageQueue.get(recipient)!;
        queue.push(message);
        queue.sort((a, b) => b.priority - a.priority);
        
        // Emit custom event
        this.dispatchEvent(new CustomEvent('message:sent', {
          detail: { message, recipient }
        }));
      }
      
      await this.processQueue();
    } catch (error) {
      this.handleError(error as Error, message);
    }
  }

  /**
   * Broadcast message to all subscribers
   */
  async broadcast(message: Message): Promise<void> {
    const allRecipients = Array.from(this.subscribers.keys());
    message.to = allRecipients;
    await this.send(message);
  }

  /**
   * Subscribe to messages
   */
  subscribe(agentId: string, messageTypes: MessageType[] = []): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, new Set());
    }
    
    const subscriptions = this.subscribers.get(agentId)!;
    if (messageTypes.length === 0) {
      subscriptions.add('*');
    } else {
      messageTypes.forEach(type => subscriptions.add(type));
    }
    
    this.dispatchEvent(new CustomEvent('agent:subscribed', {
      detail: { agentId, messageTypes }
    }));
  }

  /**
   * Unsubscribe from messages
   */
  unsubscribe(agentId: string): void {
    this.subscribers.delete(agentId);
    this.messageQueue.delete(agentId);
    
    this.dispatchEvent(new CustomEvent('agent:unsubscribed', {
      detail: { agentId }
    }));
  }

  /**
   * Get next message for agent
   */
  async receive(agentId: string): Promise<Message | null> {
    const queue = this.messageQueue.get(agentId);
    if (!queue || queue.length === 0) {
      return null;
    }
    
    const message = queue.shift()!;
    
    this.dispatchEvent(new CustomEvent('message:received', {
      detail: { message, agentId }
    }));
    
    return message;
  }

  private validateMessage(message: Message): void {
    if (!message.id || !message.from || !message.to) {
      throw new Error('Invalid message: missing required fields');
    }
  }

  private async processQueue(): Promise<void> {
    // Process messages in priority order
    for (const [agentId, queue] of this.messageQueue.entries()) {
      if (queue.length > 0) {
        this.dispatchEvent(new CustomEvent('queue:processing', {
          detail: { agentId, queueSize: queue.length }
        }));
      }
    }
  }

  private handleError(error: Error, message: Message): void {
    console.error('Message bus error:', error);
    this.deadLetterQueue.push(message);
    
    this.dispatchEvent(new CustomEvent('message:failed', {
      detail: { error: error.message, message }
    }));
  }

  getQueueSize(agentId: string): number {
    return this.messageQueue.get(agentId)?.length || 0;
  }

  getDeadLetterQueue(): Message[] {
    return [...this.deadLetterQueue];
  }
}
```

**Key Features**:
- EventTarget-based (not EventEmitter)
- Priority-based message queue
- Dead letter queue for failed messages
- CustomEvent for all events
- Type-safe message handling

**Acceptance Criteria**:
- [ ] Message routing works correctly
- [ ] Priority-based delivery
- [ ] Event emission for monitoring
- [ ] Error handling with DLQ
- [ ] No EventEmitter usage

---

### Step 5: Implement Agent Registry and Message Queue
**Status**: Pending

**Objective**: Create agent discovery system and priority-based message queue.

**Files to Create**:
- `src/communication/agent-registry.ts`
- `src/communication/message-queue.ts`

**Agent Registry**:

```typescript
import { AgentInterface, AgentCapability, AgentStatus } from "../types/agent.js";

export class AgentRegistry {
  private agents: Map<string, AgentInterface> = new Map();
  private capabilities: Map<AgentCapability, Set<string>> = new Map();
  private status: Map<string, AgentStatus> = new Map();

  register(agent: AgentInterface): void {
    this.agents.set(agent.id, agent);
    this.status.set(agent.id, agent.status);
    
    // Index by capabilities
    for (const capability of agent.capabilities) {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, new Set());
      }
      this.capabilities.get(capability)!.add(agent.id);
    }
  }

  unregister(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;
    
    // Remove from capability index
    for (const capability of agent.capabilities) {
      this.capabilities.get(capability)?.delete(agentId);
    }
    
    this.agents.delete(agentId);
    this.status.delete(agentId);
  }

  getAgent(agentId: string): AgentInterface | undefined {
    return this.agents.get(agentId);
  }

  getAllAgents(): AgentInterface[] {
    return Array.from(this.agents.values());
  }

  findByCapability(capability: AgentCapability): AgentInterface[] {
    const agentIds = this.capabilities.get(capability);
    if (!agentIds) return [];
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id))
      .filter((agent): agent is AgentInterface => agent !== undefined);
  }

  updateStatus(agentId: string, status: AgentStatus): void {
    this.status.set(agentId, status);
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.status = status;
    }
  }

  getActiveAgents(): AgentInterface[] {
    return this.getAllAgents().filter(
      agent => agent.status === AgentStatus.READY || 
               agent.status === AgentStatus.BUSY
    );
  }
}
```

**Message Queue**:

```typescript
import { Message, MessagePriority } from "../types/messages.js";

interface QueuedMessage {
  message: Message;
  retryCount: number;
  enqueuedAt: Date;
}

export class MessageQueue {
  private queue: QueuedMessage[] = [];
  private maxRetries = 3;
  private persistencePath?: string;

  constructor(persistencePath?: string) {
    this.persistencePath = persistencePath;
    if (persistencePath) {
      this.loadFromDisk();
    }
  }

  enqueue(message: Message): void {
    const queuedMessage: QueuedMessage = {
      message,
      retryCount: 0,
      enqueuedAt: new Date()
    };
    
    this.queue.push(queuedMessage);
    this.sortByPriority();
    
    if (this.persistencePath) {
      this.saveToDisk();
    }
  }

  dequeue(): Message | null {
    const queuedMessage = this.queue.shift();
    if (!queuedMessage) return null;
    
    if (this.persistencePath) {
      this.saveToDisk();
    }
    
    return queuedMessage.message;
  }

  peek(): Message | null {
    const queuedMessage = this.queue[0];
    return queuedMessage ? queuedMessage.message : null;
  }

  size(): number {
    return this.queue.length;
  }

  retry(message: Message): boolean {
    const queuedMessage = this.queue.find(qm => qm.message.id === message.id);
    
    if (!queuedMessage) {
      // Re-enqueue if not in queue
      this.enqueue(message);
      return true;
    }
    
    if (queuedMessage.retryCount >= this.maxRetries) {
      return false;
    }
    
    queuedMessage.retryCount++;
    return true;
  }

  private sortByPriority(): void {
    this.queue.sort((a, b) => {
      // First by priority (higher first)
      const priorityDiff = b.message.priority - a.message.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by enqueue time (older first)
      return a.enqueuedAt.getTime() - b.enqueuedAt.getTime();
    });
  }

  private async saveToDisk(): Promise<void> {
    if (!this.persistencePath) return;
    
    try {
      const data = JSON.stringify(this.queue, null, 2);
      await Bun.write(this.persistencePath, data);
    } catch (error) {
      console.error('Failed to persist queue:', error);
    }
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.persistencePath) return;
    
    try {
      const file = Bun.file(this.persistencePath);
      const exists = await file.exists();
      
      if (exists) {
        const data = await file.text();
        this.queue = JSON.parse(data);
        this.sortByPriority();
      }
    } catch (error) {
      console.error('Failed to load queue from disk:', error);
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Agent registration and discovery works
- [ ] Capability-based agent lookup
- [ ] Priority-based message queuing
- [ ] Queue persistence for reliability
- [ ] Retry logic implemented

---

### Step 6: Create Communication Tests
**Status**: Pending

**Objective**: Write comprehensive unit tests using bun:test.

**Files to Create**:
- `tests/communication/message-bus.test.ts`
- `tests/communication/agent-registry.test.ts`
- `tests/communication/message-queue.test.ts`

**Example Test**:

```typescript
import { describe, test, expect, beforeEach } from "bun:test";
import { MessageBus } from "../../src/communication/message-bus.js";
import { Message, MessageType, MessagePriority } from "../../src/types/messages.js";

describe("MessageBus", () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus();
  });

  test("should send message to recipient", async () => {
    const message: Message = {
      id: "msg-1",
      from: "agent-1",
      to: "agent-2",
      type: MessageType.REQUEST,
      payload: { action: "test" },
      priority: MessagePriority.NORMAL,
      timestamp: new Date()
    };

    await messageBus.send(message);
    const received = await messageBus.receive("agent-2");
    
    expect(received).toBeTruthy();
    expect(received?.id).toBe("msg-1");
  });

  test("should prioritize high-priority messages", async () => {
    const lowPriority: Message = {
      id: "msg-1",
      from: "agent-1",
      to: "agent-2",
      type: MessageType.REQUEST,
      payload: {},
      priority: MessagePriority.LOW,
      timestamp: new Date()
    };

    const highPriority: Message = {
      id: "msg-2",
      from: "agent-1",
      to: "agent-2",
      type: MessageType.REQUEST,
      payload: {},
      priority: MessagePriority.HIGH,
      timestamp: new Date()
    };

    await messageBus.send(lowPriority);
    await messageBus.send(highPriority);
    
    const first = await messageBus.receive("agent-2");
    expect(first?.id).toBe("msg-2"); // High priority first
  });

  test("should broadcast to all subscribers", async () => {
    messageBus.subscribe("agent-1");
    messageBus.subscribe("agent-2");
    messageBus.subscribe("agent-3");

    const broadcast: Message = {
      id: "broadcast-1",
      from: "system",
      to: [],
      type: MessageType.BROADCAST,
      payload: { announcement: "test" },
      priority: MessagePriority.NORMAL,
      timestamp: new Date()
    };

    await messageBus.broadcast(broadcast);
    
    expect(messageBus.getQueueSize("agent-1")).toBeGreaterThan(0);
    expect(messageBus.getQueueSize("agent-2")).toBeGreaterThan(0);
    expect(messageBus.getQueueSize("agent-3")).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria**:
- [ ] All message bus features tested
- [ ] Agent registry operations tested
- [ ] Message queue behavior tested
- [ ] Edge cases covered
- [ ] 80%+ code coverage

---

## Phase 2: Agent Implementation (Steps 7-25)

### Step 7: Create Base Agent Class
**Status**: Pending

**Objective**: Implement abstract base class for all agents.

**Files to Create**:
- `src/agents/base-agent.ts`
- `src/agents/index.ts`

**Implementation Pattern**:

```typescript
import { AgentInterface, AgentStatus, AgentCapability } from "../types/agent.js";
import { Task, TaskResult } from "../types/task.js";
import { Message } from "../types/messages.js";
import { MessageBus } from "../communication/message-bus.js";

export abstract class BaseAgent implements AgentInterface {
  public readonly id: string;
  public readonly name: string;
  public readonly type: AgentType;
  public readonly capabilities: AgentCapability[];
  public status: AgentStatus = AgentStatus.INITIALIZING;
  
  protected currentTask?: Task;
  protected messageBus?: MessageBus;
  protected config: Record<string, any>;

  constructor(id: string, name: string, type: AgentType, capabilities: AgentCapability[]) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.capabilities = capabilities;
    this.config = {};
  }

  async initialize(): Promise<void> {
    this.status = AgentStatus.READY;
    await this.onStart();
  }

  async execute(task: Task): Promise<TaskResult> {
    this.currentTask = task;
    this.status = AgentStatus.BUSY;
    
    try {
      const result = await this.executeTask(task);
      this.status = AgentStatus.READY;
      return result;
    } catch (error) {
      await this.onError(error as Error);
      this.status = AgentStatus.ERROR;
      return {
        success: false,
        errors: [(error as Error).message]
      };
    } finally {
      this.currentTask = undefined;
    }
  }

  getName(): string {
    return this.name;
  }

  getCapabilities(): AgentCapability[] {
    return this.capabilities;
  }

  setMessageBus(messageBus: MessageBus): void {
    this.messageBus = messageBus;
  }

  protected async sendMessage(message: Message): Promise<void> {
    if (!this.messageBus) {
      throw new Error('Message bus not initialized');
    }
    await this.messageBus.send(message);
  }

  protected async receiveMessage(): Promise<Message | null> {
    if (!this.messageBus) {
      throw new Error('Message bus not initialized');
    }
    return await this.messageBus.receive(this.id);
  }

  // Lifecycle hooks
  protected async onStart(): Promise<void> {
    console.log(`Agent ${this.name} started`);
  }

  protected async onStop(): Promise<void> {
    console.log(`Agent ${this.name} stopped`);
  }

  protected async onError(error: Error): Promise<void> {
    console.error(`Agent ${this.name} error:`, error);
  }

  // Abstract method to be implemented by subclasses
  protected abstract executeTask(task: Task): Promise<TaskResult>;
}
```

**Acceptance Criteria**:
- [ ] Base class provides common functionality
- [ ] Lifecycle hooks implemented
- [ ] Message bus integration
- [ ] Error handling
- [ ] Abstract executeTask method

---

### Steps 8-25: Individual Agent Implementation

Each agent follows this pattern:
1. **Implementation Step**: Create agent class and character.json
2. **Test Step**: Write comprehensive unit tests

**Agent Implementation Order**:
1. Project Manager (Steps 8-9)
2. Research (Steps 10-11)
3. Architecture (Steps 12-13)
4. Coder (Steps 14-15)
5. Testing (Steps 16-17)
6. Debug (Steps 18-19)
7. Documentation (Steps 20-21)
8. DevOps (Steps 22-23)
9. Security (Steps 24-25)

Each agent implementation includes:
- Agent class extending BaseAgent
- Character.json with personality and instructions
- Specific methods for agent capabilities
- Integration with message bus
- Error handling
- Unit tests with 80%+ coverage

*Detailed implementation for each agent will be added as they are implemented.*

---

## Phase 3: Repository Management (Steps 26-28)

### Step 26: Implement Repository Manager
**Status**: Pending

**Objective**: Create repository management system for Git operations.

**Files to Create**:
- `src/repository/repository-manager.ts`
- `src/repository/index.ts`

**Key Features**:
- Git operations using Bun.spawn (not child_process)
- Support for GitHub, GitLab, Bitbucket
- Credential management
- Branch operations
- Safety checks

**Implementation**:

```typescript
import { RepositoryConfig } from "../types/workflow.js";

export class RepositoryManager {
  private config: RepositoryConfig;
  private workingDir: string;

  constructor(config: RepositoryConfig) {
    this.config = config;
    this.workingDir = config.path;
  }

  async clone(): Promise<void> {
    const proc = Bun.spawn([
      "git", "clone",
      "--depth", "1",
      "--branch", this.config.branch,
      this.config.url,
      this.workingDir
    ]);
    
    await proc.exited;
    
    if (proc.exitCode !== 0) {
      throw new Error(`Git clone failed with code ${proc.exitCode}`);
    }
  }

  async createBranch(branchName: string): Promise<void> {
    await this.execGit(["checkout", "-b", branchName]);
  }

  async commit(message: string): Promise<void> {
    await this.execGit(["add", "."]);
    await this.execGit(["commit", "-m", message]);
  }

  async push(branch?: string): Promise<void> {
    const branchName = branch || this.config.branch;
    await this.execGit(["push", "origin", branchName]);
  }

  async pull(): Promise<void> {
    await this.execGit(["pull", "origin", this.config.branch]);
  }

  private async execGit(args: string[]): Promise<string> {
    const proc = Bun.spawn(["git", ...args], {
      cwd: this.workingDir,
      stdout: "pipe",
      stderr: "pipe"
    });
    
    const output = await new Response(proc.stdout).text();
    await proc.exited;
    
    if (proc.exitCode !== 0) {
      const error = await new Response(proc.stderr).text();
      throw new Error(`Git command failed: ${error}`);
    }
    
    return output;
  }
}
```

---

## Phase 4: Orchestration (Steps 29-32)

### Step 29: Implement Workflow Engine Core
**Status**: Pending

**Objective**: Create main orchestration engine.

**Files to Create**:
- `src/orchestrator/workflow-engine.ts`
- `src/orchestrator/index.ts`

**Key Features**:
- Workflow lifecycle management
- Task scheduling
- Agent assignment
- Progress tracking
- Error recovery

---

### Step 30: Implement State Management
**Status**: Pending

**Files to Create**:
- `src/state/state-manager.ts`

**Key Features**:
- JSON-based persistence
- State recovery
- Atomic operations
- History tracking

---

### Step 31: Implement PRD Parser and Task Scheduler
**Status**: Pending

**Files to Create**:
- `src/workflows/prd-parser.ts`
- `src/workflows/task-scheduler.ts`

**Key Features**:
- Parse markdown PRDs
- Extract requirements
- Dependency resolution
- Priority scheduling

---

### Step 32: Test Workflow Components
**Status**: Pending

**Test Coverage**:
- Workflow engine operations
- State persistence
- PRD parsing
- Task scheduling

---

## Phase 5: Integration (Steps 33-34)

### Step 33: Implement API Server
**Status**: Pending

**Files to Create**:
- `src/server/api-server.ts`
- `src/server/routes.ts`

**Endpoints**:
- POST /api/workflows/start
- GET /api/workflows/:id
- POST /api/workflows/:id/requirements
- GET /api/repositories
- POST /api/repositories
- GET /api/agents

---

### Step 34: Implement WebSocket Server
**Status**: Pending

**Files to Create**:
- `src/server/websocket-server.ts`

**Features**:
- Real-time updates
- Client management
- Event broadcasting
- Heartbeat monitoring

---

## Progress Tracking

| Phase | Steps | Completed | Status |
|-------|-------|-----------|--------|
| Foundation | 1-6 | 1 | 🟡 In Progress |
| Agents | 7-25 | 0 | ⚪ Pending |
| Repository | 26-28 | 0 | ⚪ Pending |
| Orchestration | 29-32 | 0 | ⚪ Pending |
| Integration | 33-34 | 0 | ⚪ Pending |

**Overall Progress**: 1/34 steps (2.9%)

---

## Next Steps

1. ✅ Step 1 Complete - Package structure created
2. ⏭️ **Step 2 Next** - Define core domain types
3. Continue through foundation phase
4. Begin agent implementation once foundation is complete

---

## Notes

- All implementations must follow ElizaOS conventions
- Use Bun.spawn instead of child_process
- Use EventTarget instead of EventEmitter
- All tests use bun:test framework
- Strict TypeScript with no `any` types except where necessary
- Comprehensive error handling required
- All async operations must be properly awaited

