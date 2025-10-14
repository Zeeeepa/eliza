/**
 * MessageBus - Core communication infrastructure for agent-to-agent messaging
 */

import { EventEmitter } from "events";
import type {
  Message,
  MessageType,
  MessagePriority,
  QueuedMessage
} from "../types/messages.js";

/**
 * Message handler function type
 */
export type MessageHandler = (message: Message) => void | Promise<void>;

/**
 * Subscription object returned when subscribing to messages
 */
export interface Subscription {
  unsubscribe: () => void;
}

/**
 * Message bus configuration
 */
export interface MessageBusConfig {
  /** Maximum queue size per topic */
  maxQueueSize?: number;
  
  /** Message TTL in milliseconds */
  messageTTL?: number;
  
  /** Enable message persistence */
  enablePersistence?: boolean;
  
  /** Maximum retry attempts for failed messages */
  maxRetries?: number;
  
  /** Enable dead letter queue for failed messages */
  enableDeadLetterQueue?: boolean;
}

/**
 * MessageBus - Implements publish/subscribe pattern for inter-agent communication
 */
export class MessageBus extends EventEmitter {
  private subscribers: Map<string, Set<MessageHandler>>;
  private messageQueue: Map<string, QueuedMessage[]>;
  private deadLetterQueue: QueuedMessage[];
  private config: Required<MessageBusConfig>;
  private messageHistory: Map<string, Message>;

  constructor(config: MessageBusConfig = {}) {
    super();
    this.setMaxListeners(1000); // Support many agents
    
    this.subscribers = new Map();
    this.messageQueue = new Map();
    this.deadLetterQueue = [];
    this.messageHistory = new Map();
    
    this.config = {
      maxQueueSize: config.maxQueueSize ?? 10000,
      messageTTL: config.messageTTL ?? 300000, // 5 minutes
      enablePersistence: config.enablePersistence ?? false,
      maxRetries: config.maxRetries ?? 3,
      enableDeadLetterQueue: config.enableDeadLetterQueue ?? true
    };
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Publish a message to specified topic(s)
   */
  async publish(message: Message): Promise<void> {
    // Store in history
    this.messageHistory.set(message.id, message);
    
    // Get recipients
    const recipients = Array.isArray(message.to) ? message.to : [message.to];
    
    // Emit to general listeners
    this.emit("message", message);
    
    // Emit by message type
    this.emit(`type:${message.type}`, message);
    
    // Emit to specific recipients
    for (const recipient of recipients) {
      this.emit(`agent:${recipient}`, message);
      
      // Queue if no active subscribers
      if (!this.subscribers.has(`agent:${recipient}`)) {
        await this.queueMessage(recipient, message);
      }
    }
    
    // Handle priority messages
    if (message.priority >= MessagePriority.HIGH) {
      this.emit("priority", message);
    }
  }

  /**
   * Subscribe to messages for a specific agent
   */
  subscribeAgent(agentId: string, handler: MessageHandler): Subscription {
    return this.subscribe(`agent:${agentId}`, handler);
  }

  /**
   * Subscribe to messages by type
   */
  subscribeByType(type: MessageType, handler: MessageHandler): Subscription {
    return this.subscribe(`type:${type}`, handler);
  }

  /**
   * Subscribe to all messages
   */
  subscribeAll(handler: MessageHandler): Subscription {
    return this.subscribe("message", handler);
  }

  /**
   * Subscribe to priority messages
   */
  subscribePriority(handler: MessageHandler): Subscription {
    return this.subscribe("priority", handler);
  }

  /**
   * Generic subscribe method
   */
  private subscribe(topic: string, handler: MessageHandler): Subscription {
    // Add handler
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(handler);
    
    // Register with EventEmitter
    this.on(topic, handler);
    
    // Return subscription object
    return {
      unsubscribe: () => {
        this.subscribers.get(topic)?.delete(handler);
        this.off(topic, handler);
        
        // Cleanup empty topics
        if (this.subscribers.get(topic)?.size === 0) {
          this.subscribers.delete(topic);
        }
      }
    };
  }

  /**
   * Queue message for later delivery
   */
  private async queueMessage(agentId: string, message: Message): Promise<void> {
    const queueKey = `agent:${agentId}`;
    
    if (!this.messageQueue.has(queueKey)) {
      this.messageQueue.set(queueKey, []);
    }
    
    const queue = this.messageQueue.get(queueKey)!;
    
    // Check queue size
    if (queue.length >= this.config.maxQueueSize) {
      console.warn(`Message queue full for agent ${agentId}, dropping oldest message`);
      queue.shift();
    }
    
    // Add to queue
    queue.push({
      message,
      retryCount: 0,
      enqueuedAt: new Date()
    });
    
    // Sort by priority
    queue.sort((a, b) => b.message.priority - a.message.priority);
  }

  /**
   * Get queued messages for an agent
   */
  getQueuedMessages(agentId: string): QueuedMessage[] {
    const queueKey = `agent:${agentId}`;
    return this.messageQueue.get(queueKey) ?? [];
  }

  /**
   * Flush queued messages for an agent
   */
  async flushQueue(agentId: string): Promise<number> {
    const queueKey = `agent:${agentId}`;
    const queue = this.messageQueue.get(queueKey);
    
    if (!queue || queue.length === 0) {
      return 0;
    }
    
    let flushed = 0;
    const messages = [...queue];
    
    for (const queuedMsg of messages) {
      try {
        await this.publish(queuedMsg.message);
        flushed++;
      } catch (error) {
        console.error(`Failed to flush message ${queuedMsg.message.id}:`, error);
        
        // Increment retry count
        queuedMsg.retryCount++;
        queuedMsg.lastAttempt = new Date();
        
        // Move to dead letter queue if max retries exceeded
        if (queuedMsg.retryCount >= this.config.maxRetries) {
          if (this.config.enableDeadLetterQueue) {
            this.deadLetterQueue.push(queuedMsg);
          }
        }
      }
    }
    
    // Clear successfully flushed messages
    this.messageQueue.set(queueKey, queue.filter(
      msg => msg.retryCount < this.config.maxRetries
    ));
    
    return flushed;
  }

  /**
   * Get message by ID from history
   */
  getMessage(messageId: string): Message | undefined {
    return this.messageHistory.get(messageId);
  }

  /**
   * Get dead letter queue messages
   */
  getDeadLetterQueue(): QueuedMessage[] {
    return [...this.deadLetterQueue];
  }

  /**
   * Clear dead letter queue
   */
  clearDeadLetterQueue(): void {
    this.deadLetterQueue = [];
  }

  /**
   * Get statistics about the message bus
   */
  getStats(): {
    totalQueued: number;
    queuesByAgent: Record<string, number>;
    deadLetterCount: number;
    subscriberCount: number;
    historySize: number;
  } {
    const queuesByAgent: Record<string, number> = {};
    let totalQueued = 0;
    
    for (const [key, queue] of this.messageQueue.entries()) {
      const agentId = key.replace('agent:', '');
      queuesByAgent[agentId] = queue.length;
      totalQueued += queue.length;
    }
    
    return {
      totalQueued,
      queuesByAgent,
      deadLetterCount: this.deadLetterQueue.length,
      subscriberCount: this.subscribers.size,
      historySize: this.messageHistory.size
    };
  }

  /**
   * Start cleanup timer for expired messages
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Run every minute
  }

  /**
   * Cleanup expired messages
   */
  private cleanup(): void {
    const now = Date.now();
    
    // Clean message history
    for (const [id, message] of this.messageHistory.entries()) {
      const age = now - message.timestamp.getTime();
      if (age > this.config.messageTTL) {
        this.messageHistory.delete(id);
      }
    }
    
    // Clean message queues
    for (const [key, queue] of this.messageQueue.entries()) {
      const filtered = queue.filter(queuedMsg => {
        const age = now - queuedMsg.enqueuedAt.getTime();
        return age <= this.config.messageTTL;
      });
      
      if (filtered.length === 0) {
        this.messageQueue.delete(key);
      } else {
        this.messageQueue.set(key, filtered);
      }
    }
    
    // Clean dead letter queue
    this.deadLetterQueue = this.deadLetterQueue.filter(queuedMsg => {
      const age = now - queuedMsg.enqueuedAt.getTime();
      return age <= this.config.messageTTL * 2; // Keep dead letters longer
    });
  }

  /**
   * Shutdown the message bus
   */
  async shutdown(): Promise<void> {
    // Unsubscribe all
    this.removeAllListeners();
    this.subscribers.clear();
    
    // Clear queues
    this.messageQueue.clear();
    this.messageHistory.clear();
  }
}

