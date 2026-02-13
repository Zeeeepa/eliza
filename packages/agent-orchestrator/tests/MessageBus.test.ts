/**
 * MessageBus Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MessageBus } from "../communication/MessageBus.js";
import { MessageType, MessagePriority } from "../types/messages.js";
import type { Message } from "../types/messages.js";

describe("MessageBus", () => {
  let messageBus: MessageBus;

  beforeEach(() => {
    messageBus = new MessageBus({
      maxQueueSize: 100,
      messageTTL: 60000,
      maxRetries: 3,
      enableDeadLetterQueue: true
    });
  });

  afterEach(async () => {
    await messageBus.shutdown();
  });

  describe("Publish/Subscribe", () => {
    it("should publish and receive messages", async () => {
      const messages: Message[] = [];
      
      messageBus.subscribeAgent("agent1", (msg) => {
        messages.push(msg);
      });

      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "agent1",
        payload: { data: "test" },
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      await messageBus.publish(message);

      expect(messages).toHaveLength(1);
      expect(messages[0].id).toBe("msg1");
    });

    it("should support multiple subscribers", async () => {
      const messages1: Message[] = [];
      const messages2: Message[] = [];
      
      messageBus.subscribeAgent("agent1", (msg) => messages1.push(msg));
      messageBus.subscribeAgent("agent1", (msg) => messages2.push(msg));

      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "agent1",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      await messageBus.publish(message);

      expect(messages1).toHaveLength(1);
      expect(messages2).toHaveLength(1);
    });

    it("should unsubscribe correctly", async () => {
      const messages: Message[] = [];
      
      const subscription = messageBus.subscribeAgent("agent1", (msg) => {
        messages.push(msg);
      });

      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "agent1",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      await messageBus.publish(message);
      expect(messages).toHaveLength(1);

      subscription.unsubscribe();
      
      await messageBus.publish({ ...message, id: "msg2" });
      expect(messages).toHaveLength(1); // Still 1, didn't receive msg2
    });
  });

  describe("Message Types", () => {
    it("should route by message type", async () => {
      const requests: Message[] = [];
      const responses: Message[] = [];
      
      messageBus.subscribeByType(MessageType.REQUEST, (msg) => requests.push(msg));
      messageBus.subscribeByType(MessageType.RESPONSE, (msg) => responses.push(msg));

      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "agent1",
        to: "agent2",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      await messageBus.publish({
        id: "msg2",
        type: MessageType.RESPONSE,
        from: "agent2",
        to: "agent1",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      expect(requests).toHaveLength(1);
      expect(responses).toHaveLength(1);
    });
  });

  describe("Priority Handling", () => {
    it("should emit priority messages separately", async () => {
      const priorityMessages: Message[] = [];
      
      messageBus.subscribePriority((msg) => priorityMessages.push(msg));

      // Send normal priority
      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "agent1",
        to: "agent2",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      // Send high priority
      await messageBus.publish({
        id: "msg2",
        type: MessageType.REQUEST,
        from: "agent1",
        to: "agent2",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.HIGH
      });

      expect(priorityMessages).toHaveLength(1);
      expect(priorityMessages[0].id).toBe("msg2");
    });
  });

  describe("Message Queueing", () => {
    it("should queue messages for offline agents", async () => {
      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "offline-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      await messageBus.publish(message);

      const queued = messageBus.getQueuedMessages("offline-agent");
      expect(queued).toHaveLength(1);
      expect(queued[0].message.id).toBe("msg1");
    });

    it("should sort queued messages by priority", async () => {
      // Send low priority first
      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "offline-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.LOW
      });

      // Send high priority second
      await messageBus.publish({
        id: "msg2",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "offline-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.HIGH
      });

      const queued = messageBus.getQueuedMessages("offline-agent");
      expect(queued[0].message.id).toBe("msg2"); // High priority first
    });

    it("should flush queue when agent subscribes", async () => {
      // Queue some messages
      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "offline-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      const queued = messageBus.getQueuedMessages("offline-agent");
      expect(queued).toHaveLength(1);

      // Agent comes online
      const received: Message[] = [];
      messageBus.subscribeAgent("offline-agent", (msg) => received.push(msg));

      // Flush queue
      await messageBus.flushQueue("offline-agent");

      expect(received).toHaveLength(1);
    });
  });

  describe("Message History", () => {
    it("should store message history", async () => {
      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "agent1",
        to: "agent2",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      await messageBus.publish(message);

      const retrieved = messageBus.getMessage("msg1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("msg1");
    });

    it("should return undefined for non-existent messages", () => {
      const retrieved = messageBus.getMessage("non-existent");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("Dead Letter Queue", () => {
    it("should move failed messages to dead letter queue", async () => {
      // Create a failing subscriber
      messageBus.subscribeAgent("failing-agent", async () => {
        throw new Error("Simulated failure");
      });

      const message: Message = {
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "failing-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      };

      // This won't throw but will be queued
      await messageBus.publish(message);
      
      // Simulate retries
      for (let i = 0; i < 3; i++) {
        await messageBus.flushQueue("failing-agent").catch(() => {});
      }

      const dlq = messageBus.getDeadLetterQueue();
      expect(dlq.length).toBeGreaterThan(0);
    });

    it("should clear dead letter queue", async () => {
      // Add a message to DLQ by simulating failures
      messageBus.subscribeAgent("failing-agent", async () => {
        throw new Error("Simulated failure");
      });

      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "failing-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      for (let i = 0; i < 3; i++) {
        await messageBus.flushQueue("failing-agent").catch(() => {});
      }

      messageBus.clearDeadLetterQueue();
      
      const dlq = messageBus.getDeadLetterQueue();
      expect(dlq).toHaveLength(0);
    });
  });

  describe("Statistics", () => {
    it("should return accurate stats", async () => {
      // Subscribe an agent
      messageBus.subscribeAgent("agent1", () => {});
      
      // Queue some messages
      await messageBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "orchestrator",
        to: "offline-agent",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      const stats = messageBus.getStats();
      
      expect(stats.subscriberCount).toBeGreaterThan(0);
      expect(stats.totalQueued).toBe(1);
      expect(stats.historySize).toBeGreaterThan(0);
    });
  });

  describe("Cleanup", () => {
    it("should cleanup expired messages", async () => {
      // Create bus with very short TTL
      const shortTTLBus = new MessageBus({
        messageTTL: 100 // 100ms
      });

      await shortTTLBus.publish({
        id: "msg1",
        type: MessageType.REQUEST,
        from: "agent1",
        to: "agent2",
        payload: {},
        timestamp: new Date(),
        priority: MessagePriority.NORMAL
      });

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cleanup manually
      (shortTTLBus as any).cleanup();

      const message = shortTTLBus.getMessage("msg1");
      expect(message).toBeUndefined();

      await shortTTLBus.shutdown();
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle concurrent publishes", async () => {
      const messages: Message[] = [];
      
      messageBus.subscribeAll((msg) => messages.push(msg));

      // Publish 100 messages concurrently
      const promises = Array.from({ length: 100 }, (_, i) =>
        messageBus.publish({
          id: `msg${i}`,
          type: MessageType.REQUEST,
          from: "orchestrator",
          to: "agent1",
          payload: { index: i },
          timestamp: new Date(),
          priority: MessagePriority.NORMAL
        })
      );

      await Promise.all(promises);

      expect(messages).toHaveLength(100);
    });
  });
});

