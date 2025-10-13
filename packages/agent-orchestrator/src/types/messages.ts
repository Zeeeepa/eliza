/**
 * Message and communication type definitions
 */

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

