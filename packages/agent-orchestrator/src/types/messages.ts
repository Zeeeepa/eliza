/**
 * Message and communication type definitions
 */

export enum MessageType {
  REQUEST = "request",
  RESPONSE = "response",
  BROADCAST = "broadcast",
  NOTIFICATION = "notification",
  COMMAND = "command",
  QUERY = "query",
  TASK_ASSIGNMENT = "task_assignment",
  TASK_UPDATE = "task_update",
  TASK_COMPLETE = "task_complete",
  TASK_FAILED = "task_failed",
  AGENT_STATUS = "agent_status",
  AGENT_READY = "agent_ready",
  WORKFLOW_UPDATE = "workflow_update",
  HEARTBEAT = "heartbeat",
  ERROR = "error"
}

export enum MessagePriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * Base message interface
 */
export interface Message {
  /** Unique message identifier */
  id: string;
  
  /** Sender agent ID */
  from: string;
  
  /** Recipient agent ID(s) */
  to: string | string[];
  
  /** Message type */
  type: MessageType;
  
  /** Message payload */
  payload: any;
  
  /** Message priority */
  priority: MessagePriority;
  
  /** Message timestamp */
  timestamp: Date;
  
  /** Correlation ID for request/response matching */
  correlationId?: string;
  
  /** Optional metadata */
  metadata?: Record<string, any>;
}

/**
 * Request message
 */
export interface RequestMessage extends Message {
  type: MessageType.REQUEST;
  payload: {
    action: string;
    params: Record<string, any>;
  };
}

/**
 * Response message
 */
export interface ResponseMessage extends Message {
  type: MessageType.RESPONSE;
  payload: {
    success: boolean;
    data?: any;
    error?: string;
  };
  correlationId: string; // Required for responses
}

/**
 * Broadcast message (sent to all agents)
 */
export interface BroadcastMessage extends Message {
  type: MessageType.BROADCAST;
  to: string[]; // All registered agents
  payload: {
    event: string;
    data: any;
  };
}

/**
 * Notification message
 */
export interface NotificationMessage extends Message {
  type: MessageType.NOTIFICATION;
  payload: {
    level: NotificationLevel;
    title: string;
    message: string;
    data?: any;
  };
}

export enum NotificationLevel {
  INFO = "info",
  WARNING = "warning",
  ERROR = "error",
  SUCCESS = "success"
}

/**
 * Command message
 */
export interface CommandMessage extends Message {
  type: MessageType.COMMAND;
  payload: {
    command: string;
    args: any[];
  };
}

/**
 * Query message
 */
export interface QueryMessage extends Message {
  type: MessageType.QUERY;
  payload: {
    query: string;
    params?: Record<string, any>;
  };
}

/**
 * Message with queue metadata
 */
export interface QueuedMessage {
  message: Message;
  retryCount: number;
  enqueuedAt: Date;
  lastAttempt?: Date;
}

/**
 * Type guard for RequestMessage
 */
export function isRequestMessage(message: Message): message is RequestMessage {
  return message.type === MessageType.REQUEST;
}

/**
 * Type guard for ResponseMessage
 */
export function isResponseMessage(message: Message): message is ResponseMessage {
  return message.type === MessageType.RESPONSE;
}

/**
 * Type guard for BroadcastMessage
 */
export function isBroadcastMessage(message: Message): message is BroadcastMessage {
  return message.type === MessageType.BROADCAST;
}

/**
 * Type guard for NotificationMessage
 */
export function isNotificationMessage(message: Message): message is NotificationMessage {
  return message.type === MessageType.NOTIFICATION;
}

/**
 * Task assignment message
 */
export interface TaskAssignmentMessage extends Message {
  type: MessageType.TASK_ASSIGNMENT;
  payload: {
    taskId: string;
    taskType: string;
    taskData: any;
    dependencies?: string[];
    deadline?: Date;
  };
}

/**
 * Task update message
 */
export interface TaskUpdateMessage extends Message {
  type: MessageType.TASK_UPDATE;
  payload: {
    taskId: string;
    status: string;
    progress?: number;
    data?: any;
    estimatedCompletion?: Date;
  };
}

/**
 * Task completion message
 */
export interface TaskCompleteMessage extends Message {
  type: MessageType.TASK_COMPLETE;
  payload: {
    taskId: string;
    result: any;
    success: boolean;
    artifacts?: Array<{
      id: string;
      path: string;
      type: string;
    }>;
    metrics?: Record<string, number>;
  };
}

/**
 * Task failed message
 */
export interface TaskFailedMessage extends Message {
  type: MessageType.TASK_FAILED;
  payload: {
    taskId: string;
    error: string;
    errorCode?: string;
    retryable: boolean;
    stackTrace?: string;
  };
}

/**
 * Agent status message
 */
export interface AgentStatusMessage extends Message {
  type: MessageType.AGENT_STATUS | MessageType.AGENT_READY;
  payload: {
    agentId: string;
    status: string;
    capabilities?: string[];
    load?: number;
    activeTasks?: number;
    maxTasks?: number;
    health?: {
      cpu: number;
      memory: number;
      uptime: number;
    };
  };
}

/**
 * Workflow update message
 */
export interface WorkflowUpdateMessage extends Message {
  type: MessageType.WORKFLOW_UPDATE;
  payload: {
    workflowId: string;
    status: string;
    progress?: number;
    currentPhase?: string;
    completedTasks?: number;
    totalTasks?: number;
    data?: any;
  };
}

/**
 * Heartbeat message for agent health monitoring
 */
export interface HeartbeatMessage extends Message {
  type: MessageType.HEARTBEAT;
  payload: {
    agentId: string;
    timestamp: Date;
    status: string;
    metrics?: {
      cpu: number;
      memory: number;
      activeTasks: number;
    };
  };
}

/**
 * Error message
 */
export interface ErrorMessage extends Message {
  type: MessageType.ERROR;
  payload: {
    error: string;
    errorCode?: string;
    context?: Record<string, any>;
    recoverable: boolean;
  };
}

/**
 * Type guard for TaskAssignmentMessage
 */
export function isTaskAssignmentMessage(message: Message): message is TaskAssignmentMessage {
  return message.type === MessageType.TASK_ASSIGNMENT;
}

/**
 * Type guard for TaskUpdateMessage
 */
export function isTaskUpdateMessage(message: Message): message is TaskUpdateMessage {
  return message.type === MessageType.TASK_UPDATE;
}

/**
 * Type guard for TaskCompleteMessage
 */
export function isTaskCompleteMessage(message: Message): message is TaskCompleteMessage {
  return message.type === MessageType.TASK_COMPLETE;
}

/**
 * Type guard for TaskFailedMessage
 */
export function isTaskFailedMessage(message: Message): message is TaskFailedMessage {
  return message.type === MessageType.TASK_FAILED;
}

/**
 * Type guard for AgentStatusMessage
 */
export function isAgentStatusMessage(message: Message): message is AgentStatusMessage {
  return message.type === MessageType.AGENT_STATUS || message.type === MessageType.AGENT_READY;
}

/**
 * Type guard for WorkflowUpdateMessage
 */
export function isWorkflowUpdateMessage(message: Message): message is WorkflowUpdateMessage {
  return message.type === MessageType.WORKFLOW_UPDATE;
}

/**
 * Type guard for HeartbeatMessage
 */
export function isHeartbeatMessage(message: Message): message is HeartbeatMessage {
  return message.type === MessageType.HEARTBEAT;
}

/**
 * Type guard for ErrorMessage
 */
export function isErrorMessage(message: Message): message is ErrorMessage {
  return message.type === MessageType.ERROR;
}
