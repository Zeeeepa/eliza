/**
 * Agent-related type definitions for the multi-agent orchestrator
 */

import { Task, TaskResult } from "./task.js";

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

export enum AgentStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  BUSY = "busy",
  ERROR = "error",
  STOPPED = "stopped"
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
  SECURITY_ANALYSIS = "security_analysis",
  CODE_REVIEW = "code_review",
  PERFORMANCE_OPTIMIZATION = "performance_optimization"
}

/**
 * Core interface that all agents must implement
 */
export interface AgentInterface {
  /** Unique agent identifier */
  id: string;
  
  /** Human-readable agent name */
  name: string;
  
  /** Type of agent */
  type: AgentType;
  
  /** Capabilities this agent possesses */
  capabilities: AgentCapability[];
  
  /** Current agent status */
  status: AgentStatus;
  
  /**
   * Initialize the agent
   */
  initialize(): Promise<void>;
  
  /**
   * Execute a task
   * @param task The task to execute
   * @returns Result of task execution
   */
  execute(task: Task): Promise<TaskResult>;
  
  /**
   * Get the agent's name
   */
  getName(): string;
  
  /**
   * Get the agent's capabilities
   */
  getCapabilities(): AgentCapability[];
  
  /**
   * Shutdown the agent
   */
  shutdown?(): Promise<void>;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Agent identifier */
  id: string;
  
  /** Agent name */
  name: string;
  
  /** Agent type */
  type: AgentType;
  
  /** Agent capabilities */
  capabilities: AgentCapability[];
  
  /** Custom configuration options */
  options?: Record<string, any>;
  
  /** Character file path for personality/instructions */
  characterPath?: string;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  /** Version of the agent */
  version: string;
  
  /** Author/creator */
  author?: string;
  
  /** Description of agent's purpose */
  description?: string;
  
  /** Tags for categorization */
  tags?: string[];
  
  /** Dependencies on other agents */
  dependencies?: string[];
}

/**
 * Agent performance statistics
 */
export interface AgentStats {
  /** Total tasks executed */
  tasksExecuted: number;
  
  /** Successful task completions */
  tasksSucceeded: number;
  
  /** Failed tasks */
  tasksFailed: number;
  
  /** Average execution time (ms) */
  avgExecutionTime: number;
  
  /** Total time spent executing (ms) */
  totalExecutionTime: number;
  
  /** Uptime in milliseconds */
  uptime: number;
  
  /** Last activity timestamp */
  lastActivity: Date;
}

/**
 * Agent character definition (personality and instructions)
 */
export interface AgentCharacter {
  /** Agent name */
  name: string;
  
  /** Personality traits */
  personality: string[];
  
  /** System instructions */
  instructions: string;
  
  /** Example interactions */
  examples?: string[];
  
  /** Agent's bio/description */
  bio?: string;
  
  /** Model configuration */
  modelConfig?: {
    model: string;
    temperature?: number;
    maxTokens?: number;
  };
}

/**
 * Agent event
 */
export interface AgentEvent {
  /** Event type */
  type: AgentEventType;
  
  /** Agent ID that emitted the event */
  agentId: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event data */
  data: any;
  
  /** Optional error if event represents an error */
  error?: Error;
}

export enum AgentEventType {
  AGENT_STARTED = "agent_started",
  AGENT_STOPPED = "agent_stopped",
  AGENT_ERROR = "agent_error",
  TASK_ASSIGNED = "task_assigned",
  TASK_STARTED = "task_started",
  TASK_COMPLETED = "task_completed",
  TASK_FAILED = "task_failed",
  STATUS_CHANGED = "status_changed",
  MESSAGE_SENT = "message_sent",
  MESSAGE_RECEIVED = "message_received"
}

