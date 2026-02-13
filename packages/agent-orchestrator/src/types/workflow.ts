/**
 * Workflow-related type definitions for the multi-agent orchestrator
 */

import { Task } from "./task.js";
import { AgentInterface } from "./agent.js";

export enum WorkflowStatus {
  INITIALIZING = "initializing",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

/**
 * Main workflow state
 */
export interface WorkflowState {
  /** Unique workflow identifier */
  id: string;
  
  /** Current workflow status */
  status: WorkflowStatus;
  
  /** All tasks in the workflow */
  tasks: Map<string, Task>;
  
  /** Active agents */
  agents: Map<string, AgentInterface>;
  
  /** Repository configuration */
  repository: RepositoryConfig;
  
  /** Product requirements */
  prd: PRDRequirement[];
  
  /** Current phase of development */
  currentPhase: string;
  
  /** Overall progress percentage (0-100) */
  progress: number;
  
  /** Workflow started timestamp */
  startedAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Completed timestamp (if finished) */
  completedAt?: Date;
  
  /** Error message (if failed) */
  error?: string;
}

/**
 * Repository configuration
 */
export interface RepositoryConfig {
  /** Repository URL */
  url: string;
  
  /** Branch to work on */
  branch: string;
  
  /** Local path */
  path: string;
  
  /** Authentication credentials */
  credentials?: {
    token?: string;
    username?: string;
    password?: string;
  };
  
  /** Provider (github, gitlab, bitbucket) */
  provider?: string;
}

/**
 * Product Requirement Document (PRD) requirement
 */
export interface PRDRequirement {
  /** Unique requirement ID */
  id: string;
  
  /** Requirement title */
  title: string;
  
  /** Detailed description */
  description: string;
  
  /** Priority level */
  priority: "low" | "medium" | "high" | "critical";
  
  /** Acceptance criteria */
  acceptanceCriteria: string[];
  
  /** Category/type of requirement */
  category: string;
  
  /** Dependencies on other requirements */
  dependencies: string[];
  
  /** Status of requirement */
  status?: RequirementStatus;
  
  /** Tasks generated from this requirement */
  generatedTasks?: string[];
}

export enum RequirementStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked"
}

/**
 * Workflow configuration
 */
export interface WorkflowConfig {
  /** Repository configuration */
  repository: RepositoryConfig;
  
  /** Path to PRD file or PRD content */
  prd: {
    path?: string;
    content?: string;
    requirements?: PRDRequirement[];
  };
  
  /** Agent configurations */
  agents?: {
    [agentType: string]: Record<string, any>;
  };
  
  /** Workflow options */
  options?: {
    /** Enable parallel execution */
    parallel?: boolean;
    
    /** Maximum concurrent tasks */
    maxConcurrency?: number;
    
    /** Enable automatic retries */
    autoRetry?: boolean;
    
    /** Maximum retry attempts */
    maxRetries?: number;
    
    /** Timeout for tasks (ms) */
    taskTimeout?: number;
  };
}

/**
 * Workflow execution context
 */
export interface WorkflowContext {
  /** Workflow ID */
  workflowId: string;
  
  /** Current task being executed */
  currentTask?: Task;
  
  /** Shared data between agents */
  sharedData: Map<string, any>;
  
  /** Execution history */
  history: WorkflowEvent[];
  
  /** Environment variables */
  env: Record<string, string>;
}

/**
 * Workflow event
 */
export interface WorkflowEvent {
  /** Event type */
  type: WorkflowEventType;
  
  /** Workflow ID */
  workflowId: string;
  
  /** Event timestamp */
  timestamp: Date;
  
  /** Event data */
  data: any;
  
  /** Related agent ID */
  agentId?: string;
  
  /** Related task ID */
  taskId?: string;
}

export enum WorkflowEventType {
  WORKFLOW_STARTED = "workflow_started",
  WORKFLOW_PAUSED = "workflow_paused",
  WORKFLOW_RESUMED = "workflow_resumed",
  WORKFLOW_COMPLETED = "workflow_completed",
  WORKFLOW_FAILED = "workflow_failed",
  WORKFLOW_CANCELLED = "workflow_cancelled",
  TASK_CREATED = "task_created",
  TASK_ASSIGNED = "task_assigned",
  TASK_COMPLETED = "task_completed",
  TASK_FAILED = "task_failed",
  REQUIREMENT_ADDED = "requirement_added",
  PHASE_CHANGED = "phase_changed",
  PROGRESS_UPDATED = "progress_updated"
}

