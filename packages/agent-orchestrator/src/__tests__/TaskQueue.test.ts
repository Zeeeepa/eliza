/**
 * TaskQueue Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { TaskQueue } from "../tasks/TaskQueue.js";
import { TaskPriority, TaskStatus } from "../types/task.js";
import type { Task } from "../types/task.js";

describe("TaskQueue", () => {
  let queue: TaskQueue;

  beforeEach(() => {
    queue = new TaskQueue();
  });

  const createMockTask = (
    id: string,
    priority: TaskPriority = TaskPriority.NORMAL,
    dependencies: string[] = []
  ): Task => ({
    id,
    type: "test",
    priority,
    dependencies,
    payload: { data: "test" },
    createdAt: new Date(),
    status: TaskStatus.PENDING,
    metadata: {}
  });

  describe("Enqueue/Dequeue", () => {
    it("should enqueue and dequeue a task", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);

      const dequeued = queue.dequeue();
      expect(dequeued?.id).toBe("task1");
    });

    it("should return null when dequeue from empty queue", () => {
      const dequeued = queue.dequeue();
      expect(dequeued).toBeNull();
    });

    it("should not enqueue duplicate tasks", () => {
      const task = createMockTask("task1");
      
      queue.enqueue(task);
      queue.enqueue(task); // Try to enqueue again

      expect(queue.size()).toBe(1);
    });
  });

  describe("Priority Handling", () => {
    it("should dequeue tasks by priority", () => {
      queue.enqueue(createMockTask("task1", TaskPriority.NORMAL));
      queue.enqueue(createMockTask("task2", TaskPriority.HIGH));
      queue.enqueue(createMockTask("task3", TaskPriority.LOW));
      queue.enqueue(createMockTask("task4", TaskPriority.CRITICAL));

      expect(queue.dequeue()?.id).toBe("task4"); // CRITICAL
      expect(queue.dequeue()?.id).toBe("task2"); // HIGH
      expect(queue.dequeue()?.id).toBe("task1"); // NORMAL
      expect(queue.dequeue()?.id).toBe("task3"); // LOW
    });

    it("should dequeue in FIFO order within same priority", () => {
      queue.enqueue(createMockTask("task1", TaskPriority.NORMAL));
      queue.enqueue(createMockTask("task2", TaskPriority.NORMAL));
      queue.enqueue(createMockTask("task3", TaskPriority.NORMAL));

      expect(queue.dequeue()?.id).toBe("task1");
      expect(queue.dequeue()?.id).toBe("task2");
      expect(queue.dequeue()?.id).toBe("task3");
    });
  });

  describe("Dependencies", () => {
    it("should not dequeue tasks with pending dependencies", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2", TaskPriority.NORMAL, ["task1"]);

      queue.enqueue(task1);
      queue.enqueue(task2);

      // Should dequeue task1 first
      const dequeued1 = queue.dequeue();
      expect(dequeued1?.id).toBe("task1");

      // task2 should not be dequeued yet (dependency not completed)
      const dequeued2 = queue.dequeue();
      expect(dequeued2).toBeNull();

      // Mark task1 as completed
      queue.completeTask("task1");

      // Now task2 can be dequeued
      const dequeued3 = queue.dequeue();
      expect(dequeued3?.id).toBe("task2");
    });

    it("should handle multiple dependencies", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2");
      const task3 = createMockTask("task3", TaskPriority.NORMAL, ["task1", "task2"]);

      queue.enqueue(task1);
      queue.enqueue(task2);
      queue.enqueue(task3);

      // Dequeue and complete task1
      queue.dequeue();
      queue.completeTask("task1");

      // task3 still can't be dequeued (task2 not completed)
      expect(queue.dequeue()?.id).toBe("task2");
      
      queue.completeTask("task2");

      // Now task3 can be dequeued
      expect(queue.dequeue()?.id).toBe("task3");
    });

    it("should detect circular dependencies", () => {
      const task1 = createMockTask("task1", TaskPriority.NORMAL, ["task2"]);
      const task2 = createMockTask("task2", TaskPriority.NORMAL, ["task1"]);

      expect(() => {
        queue.enqueue(task1);
        queue.enqueue(task2);
      }).toThrow();
    });
  });

  describe("Task Management", () => {
    it("should get task by id", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);

      const retrieved = queue.getTask("task1");
      expect(retrieved?.id).toBe("task1");
    });

    it("should return undefined for non-existent task", () => {
      const retrieved = queue.getTask("non-existent");
      expect(retrieved).toBeUndefined();
    });

    it("should remove task", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);

      const removed = queue.remove("task1");
      expect(removed).toBe(true);
      expect(queue.size()).toBe(0);
    });

    it("should return false when removing non-existent task", () => {
      const removed = queue.remove("non-existent");
      expect(removed).toBe(false);
    });

    it("should update task status", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);

      queue.updateStatus("task1", TaskStatus.IN_PROGRESS);

      const retrieved = queue.getTask("task1");
      expect(retrieved?.status).toBe(TaskStatus.IN_PROGRESS);
    });
  });

  describe("Task Completion", () => {
    it("should mark task as completed", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);
      queue.dequeue();

      queue.completeTask("task1");

      const retrieved = queue.getTask("task1");
      expect(retrieved?.status).toBe(TaskStatus.COMPLETED);
      expect(retrieved?.completedAt).toBeDefined();
    });

    it("should mark task as failed", () => {
      const task = createMockTask("task1");
      queue.enqueue(task);
      queue.dequeue();

      queue.failTask("task1", "Test error");

      const retrieved = queue.getTask("task1");
      expect(retrieved?.status).toBe(TaskStatus.FAILED);
      expect(retrieved?.error).toBe("Test error");
    });
  });

  describe("Queue State", () => {
    it("should return correct queue size", () => {
      queue.enqueue(createMockTask("task1"));
      queue.enqueue(createMockTask("task2"));
      queue.enqueue(createMockTask("task3"));

      expect(queue.size()).toBe(3);
    });

    it("should return correct queue state", () => {
      expect(queue.isEmpty()).toBe(true);

      queue.enqueue(createMockTask("task1"));
      expect(queue.isEmpty()).toBe(false);
    });

    it("should peek at next task without removing it", () => {
      queue.enqueue(createMockTask("task1", TaskPriority.LOW));
      queue.enqueue(createMockTask("task2", TaskPriority.HIGH));

      const peeked = queue.peek();
      expect(peeked?.id).toBe("task2"); // HIGH priority

      // Verify it wasn't removed
      expect(queue.size()).toBe(2);
    });
  });

  describe("Queue Queries", () => {
    it("should get tasks by status", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2");

      queue.enqueue(task1);
      queue.enqueue(task2);

      queue.dequeue();
      queue.completeTask("task1");

      const completed = queue.getTasksByStatus(TaskStatus.COMPLETED);
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe("task1");

      const pending = queue.getTasksByStatus(TaskStatus.PENDING);
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe("task2");
    });

    it("should get tasks by priority", () => {
      queue.enqueue(createMockTask("task1", TaskPriority.HIGH));
      queue.enqueue(createMockTask("task2", TaskPriority.LOW));
      queue.enqueue(createMockTask("task3", TaskPriority.HIGH));

      const highPriority = queue.getTasksByPriority(TaskPriority.HIGH);
      expect(highPriority).toHaveLength(2);
    });
  });

  describe("Statistics", () => {
    it("should return accurate stats", () => {
      queue.enqueue(createMockTask("task1", TaskPriority.HIGH));
      queue.enqueue(createMockTask("task2", TaskPriority.NORMAL));
      queue.enqueue(createMockTask("task3", TaskPriority.LOW));

      const task = queue.dequeue();
      queue.completeTask(task!.id);

      const stats = queue.getStats();

      expect(stats.total).toBe(3);
      expect(stats.pending).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.byPriority[TaskPriority.HIGH]).toBe(1);
      expect(stats.byPriority[TaskPriority.NORMAL]).toBe(1);
      expect(stats.byPriority[TaskPriority.LOW]).toBe(1);
    });
  });

  describe("Task Cleanup", () => {
    it("should clear all tasks", () => {
      queue.enqueue(createMockTask("task1"));
      queue.enqueue(createMockTask("task2"));
      queue.enqueue(createMockTask("task3"));

      expect(queue.size()).toBe(3);

      queue.clear();

      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    it("should clear completed tasks", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2");
      const task3 = createMockTask("task3");

      queue.enqueue(task1);
      queue.enqueue(task2);
      queue.enqueue(task3);

      // Complete some tasks
      queue.dequeue();
      queue.completeTask("task1");
      queue.dequeue();
      queue.completeTask("task2");

      queue.clearCompleted();

      expect(queue.size()).toBe(1);
      const remaining = queue.getTasksByStatus(TaskStatus.PENDING);
      expect(remaining[0].id).toBe("task3");
    });
  });

  describe("Complex Dependency Chains", () => {
    it("should handle linear dependency chain", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2", TaskPriority.NORMAL, ["task1"]);
      const task3 = createMockTask("task3", TaskPriority.NORMAL, ["task2"]);

      queue.enqueue(task1);
      queue.enqueue(task2);
      queue.enqueue(task3);

      // Execute in order
      const t1 = queue.dequeue();
      expect(t1?.id).toBe("task1");
      queue.completeTask("task1");

      const t2 = queue.dequeue();
      expect(t2?.id).toBe("task2");
      queue.completeTask("task2");

      const t3 = queue.dequeue();
      expect(t3?.id).toBe("task3");
    });

    it("should handle diamond dependency pattern", () => {
      const task1 = createMockTask("task1");
      const task2 = createMockTask("task2", TaskPriority.NORMAL, ["task1"]);
      const task3 = createMockTask("task3", TaskPriority.NORMAL, ["task1"]);
      const task4 = createMockTask("task4", TaskPriority.NORMAL, ["task2", "task3"]);

      queue.enqueue(task1);
      queue.enqueue(task2);
      queue.enqueue(task3);
      queue.enqueue(task4);

      // Execute task1
      queue.dequeue();
      queue.completeTask("task1");

      // Can execute task2 and task3 in any order
      const next1 = queue.dequeue();
      const next2 = queue.dequeue();
      expect(new Set([next1?.id, next2?.id])).toEqual(new Set(["task2", "task3"]));
      
      queue.completeTask(next1!.id);
      queue.completeTask(next2!.id);

      // Now task4 can execute
      const final = queue.dequeue();
      expect(final?.id).toBe("task4");
    });
  });

  describe("Timeout Handling", () => {
    it("should respect task timeout", async () => {
      const task = createMockTask("task1");
      task.timeout = 100; // 100ms

      queue.enqueue(task);
      queue.dequeue();

      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 150));

      // Task should be marked as failed
      const retrieved = queue.getTask("task1");
      expect(retrieved?.status).toBe(TaskStatus.FAILED);
      expect(retrieved?.error).toContain("timeout");
    });
  });
});

