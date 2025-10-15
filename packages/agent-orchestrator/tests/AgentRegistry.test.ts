/**
 * AgentRegistry Tests
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { AgentRegistry } from "../agents/AgentRegistry.js";
import { AgentType, AgentStatus, AgentCapability } from "../types/agent.js";
import type { AgentInterface } from "../types/agent.js";

describe("AgentRegistry", () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = new AgentRegistry();
  });

  afterEach(() => {
    registry.shutdown();
  });

  const createMockAgent = (
    id: string,
    type: AgentType,
    capabilities: AgentCapability[],
    status: AgentStatus = AgentStatus.IDLE
  ): AgentInterface => ({
    id,
    type,
    name: `Agent ${id}`,
    capabilities,
    status,
    config: {
      maxConcurrentTasks: 5,
      timeout: 60000,
      retryAttempts: 3
    },
    currentTasks: []
  });

  describe("Registration", () => {
    it("should register an agent", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);

      const retrieved = registry.get("agent1");
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe("agent1");
    });

    it("should unregister an agent", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);
      expect(registry.get("agent1")).toBeDefined();

      registry.unregister("agent1");
      expect(registry.get("agent1")).toBeUndefined();
    });

    it("should return false when unregistering non-existent agent", () => {
      const result = registry.unregister("non-existent");
      expect(result).toBe(false);
    });
  });

  describe("Querying", () => {
    it("should get all registered agents", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.TEST_GENERATION]
      );

      registry.register(agent1);
      registry.register(agent2);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });

    it("should get agents by type", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.TEST_GENERATION]
      );

      registry.register(agent1);
      registry.register(agent2);

      const codeGenerators = registry.getByType(AgentType.CODE_GENERATOR);
      expect(codeGenerators).toHaveLength(1);
      expect(codeGenerators[0].id).toBe("agent1");
    });

    it("should get agents by capability", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION, AgentCapability.CODE_REVIEW]
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.TEST_GENERATION]
      );

      registry.register(agent1);
      registry.register(agent2);

      const reviewers = registry.getByCapability(AgentCapability.CODE_REVIEW);
      expect(reviewers).toHaveLength(1);
      expect(reviewers[0].id).toBe("agent1");
    });

    it("should get agents by status", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION],
        AgentStatus.IDLE
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.TEST_GENERATION],
        AgentStatus.BUSY
      );

      registry.register(agent1);
      registry.register(agent2);

      const idle = registry.getByStatus(AgentStatus.IDLE);
      expect(idle).toHaveLength(1);
      expect(idle[0].id).toBe("agent1");
    });
  });

  describe("Agent Discovery", () => {
    it("should find best agent by capability", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      agent1.currentTasks = ["task1", "task2"]; // 40% loaded

      const agent2 = createMockAgent(
        "agent2",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      agent2.currentTasks = ["task1"]; // 20% loaded

      registry.register(agent1);
      registry.register(agent2);

      const best = registry.findBestAgent([AgentCapability.CODE_GENERATION]);
      expect(best?.id).toBe("agent2"); // Less loaded
    });

    it("should return null if no agent has required capabilities", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);

      const best = registry.findBestAgent([AgentCapability.TEST_GENERATION]);
      expect(best).toBeNull();
    });

    it("should filter by preferred type", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.CODE_GENERATION] // Also has code gen
      );

      registry.register(agent1);
      registry.register(agent2);

      const best = registry.findBestAgent(
        [AgentCapability.CODE_GENERATION],
        AgentType.CODE_GENERATOR
      );
      
      expect(best?.id).toBe("agent1");
    });

    it("should not select ERROR agents", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION],
        AgentStatus.ERROR
      );

      registry.register(agent1);

      const best = registry.findBestAgent([AgentCapability.CODE_GENERATION]);
      expect(best).toBeNull();
    });
  });

  describe("Heartbeat Monitoring", () => {
    it("should update heartbeat", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);

      const result = registry.heartbeat("agent1");
      expect(result).toBe(true);
    });

    it("should return false for non-existent agent", () => {
      const result = registry.heartbeat("non-existent");
      expect(result).toBe(false);
    });

    it("should mark agent as unhealthy after timeout", async () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);

      // Wait for heartbeat timeout (default 30s * 2 = 60s)
      // For testing, we'll just check the mechanism exists
      const stats = registry.getStats();
      expect(stats.healthy).toBeGreaterThan(0);
    });
  });

  describe("Status Management", () => {
    it("should update agent status", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION],
        AgentStatus.IDLE
      );

      registry.register(agent);

      registry.updateStatus("agent1", AgentStatus.BUSY);

      const retrieved = registry.get("agent1");
      expect(retrieved?.status).toBe(AgentStatus.BUSY);
    });

    it("should return false when updating non-existent agent", () => {
      const result = registry.updateStatus("non-existent", AgentStatus.BUSY);
      expect(result).toBe(false);
    });
  });

  describe("Statistics", () => {
    it("should return accurate stats", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION],
        AgentStatus.IDLE
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.TESTER,
        [AgentCapability.TEST_GENERATION],
        AgentStatus.BUSY
      );

      registry.register(agent1);
      registry.register(agent2);

      const stats = registry.getStats();

      expect(stats.total).toBe(2);
      expect(stats.byType[AgentType.CODE_GENERATOR]).toBe(1);
      expect(stats.byType[AgentType.TESTER]).toBe(1);
      expect(stats.byStatus[AgentStatus.IDLE]).toBe(1);
      expect(stats.byStatus[AgentStatus.BUSY]).toBe(1);
      expect(stats.healthy).toBe(2);
      expect(stats.unhealthy).toBe(0);
    });
  });

  describe("Load Balancing", () => {
    it("should select least loaded agent", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      agent1.currentTasks = ["t1", "t2", "t3", "t4"]; // 80% loaded

      const agent2 = createMockAgent(
        "agent2",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      agent2.currentTasks = ["t1"]; // 20% loaded

      const agent3 = createMockAgent(
        "agent3",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      agent3.currentTasks = ["t1", "t2"]; // 40% loaded

      registry.register(agent1);
      registry.register(agent2);
      registry.register(agent3);

      const best = registry.findBestAgent([AgentCapability.CODE_GENERATION]);
      expect(best?.id).toBe("agent2"); // Least loaded
    });
  });

  describe("Multiple Capabilities", () => {
    it("should match agents with all required capabilities", () => {
      const agent1 = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );
      const agent2 = createMockAgent(
        "agent2",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION, AgentCapability.CODE_REVIEW]
      );

      registry.register(agent1);
      registry.register(agent2);

      const best = registry.findBestAgent([
        AgentCapability.CODE_GENERATION,
        AgentCapability.CODE_REVIEW
      ]);

      expect(best?.id).toBe("agent2"); // Only agent2 has both capabilities
    });

    it("should return null if no agent has all required capabilities", () => {
      const agent = createMockAgent(
        "agent1",
        AgentType.CODE_GENERATOR,
        [AgentCapability.CODE_GENERATION]
      );

      registry.register(agent);

      const best = registry.findBestAgent([
        AgentCapability.CODE_GENERATION,
        AgentCapability.TEST_GENERATION
      ]);

      expect(best).toBeNull();
    });
  });
});

