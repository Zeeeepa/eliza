// Core exports
export { MessageBus } from "./communication/MessageBus.js";
export { AgentRegistry } from "./agents/AgentRegistry.js";
export { TaskQueue } from "./tasks/TaskQueue.js";
export { WorkflowEngine, WorkflowPhase, WorkflowStatus } from "./workflow/WorkflowEngine.js";
export { StateManager } from "./workflow/StateManager.js";
export { RepositoryAnalyzer } from "./repository/RepositoryAnalyzer.js";
export { PRDParser } from "./prd/PRDParser.js";

// Type exports
export type {
  Message,
  TaskMessage,
  StatusUpdate,
  ResultMessage,
  ErrorMessage,
  AgentMessage,
  SystemMessage,
  QueryMessage,
  ResponseMessage,
  MessagePriority
} from "./types/messages.js";

export type {
  AgentInfo,
  AgentStatus,
  AgentCapability,
  HealthStatus
} from "./types/agent.js";

export type {
  Task,
  TaskStatus,
  TaskPriority
} from "./types/task.js";

export type {
  WorkflowState,
  WorkflowTask,
  WorkflowCheckpoint,
  WorkflowConfig
} from "./workflow/WorkflowEngine.js";

export type {
  StateSnapshot,
  StateTransition,
  StateValidationRule
} from "./workflow/StateManager.js";

export type {
  PRDDocument,
  PRDRequirement,
  PRDSection
} from "./prd/PRDParser.js";

export type {
  RepositoryStructure,
  FileInfo,
  CodeMetrics,
  DependencyGraph
} from "./repository/RepositoryAnalyzer.js";

/**
 * Multi-Agent Orchestrator
 * 
 * A comprehensive system for orchestrating multiple AI agents to work together
 * on complex software development tasks.
 */
export class MultiAgentOrchestrator {
  private messageBus: MessageBus;
  private agentRegistry: AgentRegistry;
  private taskQueue: TaskQueue;
  private workflowEngine: WorkflowEngine;
  private stateManager: StateManager;
  private repositoryAnalyzer: RepositoryAnalyzer;
  private prdParser: PRDParser;

  constructor() {
    // Initialize core components
    this.messageBus = new MessageBus();
    this.agentRegistry = new AgentRegistry();
    this.taskQueue = new TaskQueue();
    this.stateManager = new StateManager();
    this.repositoryAnalyzer = new RepositoryAnalyzer();
    this.prdParser = new PRDParser();

    // Initialize workflow engine with dependencies
    this.workflowEngine = new WorkflowEngine(
      this.messageBus,
      this.agentRegistry,
      this.taskQueue
    );
  }

  /**
   * Get message bus instance
   */
  getMessageBus(): MessageBus {
    return this.messageBus;
  }

  /**
   * Get agent registry instance
   */
  getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }

  /**
   * Get task queue instance
   */
  getTaskQueue(): TaskQueue {
    return this.taskQueue;
  }

  /**
   * Get workflow engine instance
   */
  getWorkflowEngine(): WorkflowEngine {
    return this.workflowEngine;
  }

  /**
   * Get state manager instance
   */
  getStateManager(): StateManager {
    return this.stateManager;
  }

  /**
   * Get repository analyzer instance
   */
  getRepositoryAnalyzer(): RepositoryAnalyzer {
    return this.repositoryAnalyzer;
  }

  /**
   * Get PRD parser instance
   */
  getPRDParser(): PRDParser {
    return this.prdParser;
  }

  /**
   * Initialize orchestrator
   */
  async initialize(): Promise<void> {
    // Setup event listeners and connections
    this.setupEventListeners();
  }

  /**
   * Setup event listeners between components
   */
  private setupEventListeners(): void {
    // Listen to workflow events
    this.workflowEngine.on("workflow:created", (workflow) => {
      this.stateManager.initializeState(workflow.id, workflow.context);
    });

    this.workflowEngine.on("task:completed", ({ workflowId, task }) => {
      if (task.output) {
        this.stateManager.updateState(workflowId, {
          [`task_${task.id}`]: task.output
        }, "task_completion");
      }
    });

    // Listen to state changes
    this.stateManager.on("state:updated", ({ workflowId, updates }) => {
      this.messageBus.publish({
        id: `state_update_${Date.now()}`,
        type: "status",
        priority: "normal",
        timestamp: new Date(),
        payload: { workflowId, updates }
      });
    });
  }

  /**
   * Shutdown orchestrator
   */
  async shutdown(): Promise<void> {
    // Cleanup resources
    this.messageBus.removeAllListeners();
    this.agentRegistry.removeAllListeners();
    this.taskQueue.removeAllListeners();
    this.workflowEngine.removeAllListeners();
    this.stateManager.removeAllListeners();
  }
}

// Export default instance
export default MultiAgentOrchestrator;

