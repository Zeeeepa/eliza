/**
 * AgentRegistry - Manages registration and discovery of agents
 */

import type {
  AgentInterface,
  AgentType,
  AgentStatus,
  AgentCapability
} from "../types/agent.js";

/**
 * Agent registry entry with metadata
 */
export interface AgentRegistryEntry {
  agent: AgentInterface;
  registeredAt: Date;
  lastHeartbeat: Date;
  heartbeatInterval: number;
  isHealthy: boolean;
}

/**
 * AgentRegistry - Central registry for all agents in the system
 */
export class AgentRegistry {
  private agents: Map<string, AgentRegistryEntry>;
  private agentsByType: Map<AgentType, Set<string>>;
  private agentsByCapability: Map<AgentCapability, Set<string>>;
  private heartbeatTimeouts: Map<string, NodeJS.Timeout>;
  
  constructor() {
    this.agents = new Map();
    this.agentsByType = new Map();
    this.agentsByCapability = new Map();
    this.heartbeatTimeouts = new Map();
  }

  /**
   * Register a new agent
   */
  register(agent: AgentInterface): void {
    const now = new Date();
    
    // Create registry entry
    const entry: AgentRegistryEntry = {
      agent,
      registeredAt: now,
      lastHeartbeat: now,
      heartbeatInterval: 30000, // 30 seconds
      isHealthy: true
    };
    
    this.agents.set(agent.id, entry);
    
    // Index by type
    if (!this.agentsByType.has(agent.type)) {
      this.agentsByType.set(agent.type, new Set());
    }
    this.agentsByType.get(agent.type)!.add(agent.id);
    
    // Index by capabilities
    for (const capability of agent.capabilities) {
      if (!this.agentsByCapability.has(capability)) {
        this.agentsByCapability.set(capability, new Set());
      }
      this.agentsByCapability.get(capability)!.add(agent.id);
    }
    
    // Start heartbeat monitoring
    this.startHeartbeatMonitoring(agent.id);
  }

  /**
   * Unregister an agent
   */
  unregister(agentId: string): boolean {
    const entry = this.agents.get(agentId);
    if (!entry) {
      return false;
    }
    
    // Remove from type index
    this.agentsByType.get(entry.agent.type)?.delete(agentId);
    
    // Remove from capability index
    for (const capability of entry.agent.capabilities) {
      this.agentsByCapability.get(capability)?.delete(agentId);
    }
    
    // Stop heartbeat monitoring
    this.stopHeartbeatMonitoring(agentId);
    
    // Remove from registry
    this.agents.delete(agentId);
    
    return true;
  }

  /**
   * Get agent by ID
   */
  get(agentId: string): AgentInterface | undefined {
    return this.agents.get(agentId)?.agent;
  }

  /**
   * Get all registered agents
   */
  getAll(): AgentInterface[] {
    return Array.from(this.agents.values()).map(entry => entry.agent);
  }

  /**
   * Get agents by type
   */
  getByType(type: AgentType): AgentInterface[] {
    const agentIds = this.agentsByType.get(type);
    if (!agentIds) {
      return [];
    }
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id)?.agent)
      .filter((agent): agent is AgentInterface => agent !== undefined);
  }

  /**
   * Get agents by capability
   */
  getByCapability(capability: AgentCapability): AgentInterface[] {
    const agentIds = this.agentsByCapability.get(capability);
    if (!agentIds) {
      return [];
    }
    
    return Array.from(agentIds)
      .map(id => this.agents.get(id)?.agent)
      .filter((agent): agent is AgentInterface => agent !== undefined);
  }

  /**
   * Get agents by status
   */
  getByStatus(status: AgentStatus): AgentInterface[] {
    return Array.from(this.agents.values())
      .filter(entry => entry.agent.status === status)
      .map(entry => entry.agent);
  }

  /**
   * Find best agent for a task based on capabilities and load
   */
  findBestAgent(
    requiredCapabilities: AgentCapability[],
    preferredType?: AgentType
  ): AgentInterface | null {
    let candidates: AgentInterface[] = [];
    
    // Filter by type if specified
    if (preferredType) {
      candidates = this.getByType(preferredType);
    } else {
      candidates = this.getAll();
    }
    
    // Filter by capabilities
    candidates = candidates.filter(agent => 
      requiredCapabilities.every(cap => agent.capabilities.includes(cap))
    );
    
    // Filter by status (only IDLE or BUSY agents can take new tasks)
    candidates = candidates.filter(agent => 
      agent.status === AgentStatus.IDLE || agent.status === AgentStatus.BUSY
    );
    
    if (candidates.length === 0) {
      return null;
    }
    
    // Sort by load (prefer less loaded agents)
    candidates.sort((a, b) => {
      const loadA = (a.currentTasks?.length ?? 0) / a.config.maxConcurrentTasks;
      const loadB = (b.currentTasks?.length ?? 0) / b.config.maxConcurrentTasks;
      return loadA - loadB;
    });
    
    return candidates[0];
  }

  /**
   * Update agent heartbeat
   */
  heartbeat(agentId: string): boolean {
    const entry = this.agents.get(agentId);
    if (!entry) {
      return false;
    }
    
    entry.lastHeartbeat = new Date();
    entry.isHealthy = true;
    
    // Reset heartbeat timeout
    this.stopHeartbeatMonitoring(agentId);
    this.startHeartbeatMonitoring(agentId);
    
    return true;
  }

  /**
   * Update agent status
   */
  updateStatus(agentId: string, status: AgentStatus): boolean {
    const entry = this.agents.get(agentId);
    if (!entry) {
      return false;
    }
    
    entry.agent.status = status;
    return true;
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    total: number;
    byType: Record<AgentType, number>;
    byStatus: Record<AgentStatus, number>;
    healthy: number;
    unhealthy: number;
  } {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let healthy = 0;
    let unhealthy = 0;
    
    for (const entry of this.agents.values()) {
      // Count by type
      byType[entry.agent.type] = (byType[entry.agent.type] ?? 0) + 1;
      
      // Count by status
      byStatus[entry.agent.status] = (byStatus[entry.agent.status] ?? 0) + 1;
      
      // Count health
      if (entry.isHealthy) {
        healthy++;
      } else {
        unhealthy++;
      }
    }
    
    return {
      total: this.agents.size,
      byType: byType as Record<AgentType, number>,
      byStatus: byStatus as Record<AgentStatus, number>,
      healthy,
      unhealthy
    };
  }

  /**
   * Start monitoring heartbeat for an agent
   */
  private startHeartbeatMonitoring(agentId: string): void {
    const entry = this.agents.get(agentId);
    if (!entry) {
      return;
    }
    
    const timeout = setTimeout(() => {
      // Mark agent as unhealthy
      entry.isHealthy = false;
      console.warn(`Agent ${agentId} heartbeat timeout`);
    }, entry.heartbeatInterval * 2); // Allow 2x interval before marking unhealthy
    
    this.heartbeatTimeouts.set(agentId, timeout);
  }

  /**
   * Stop monitoring heartbeat for an agent
   */
  private stopHeartbeatMonitoring(agentId: string): void {
    const timeout = this.heartbeatTimeouts.get(agentId);
    if (timeout) {
      clearTimeout(timeout);
      this.heartbeatTimeouts.delete(agentId);
    }
  }

  /**
   * Shutdown the registry
   */
  shutdown(): void {
    // Clear all heartbeat timeouts
    for (const timeout of this.heartbeatTimeouts.values()) {
      clearTimeout(timeout);
    }
    
    this.heartbeatTimeouts.clear();
    this.agents.clear();
    this.agentsByType.clear();
    this.agentsByCapability.clear();
  }
}

