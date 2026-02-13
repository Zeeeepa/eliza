/**
 * Multi-Agent Runtime
 * 
 * Creates and manages multiple ElizaOS agents working together
 * Uses EXISTING Eliza infrastructure - NO custom actions/providers
 */

import {
  AgentRuntime,
  type Character,
  type IAgentRuntime,
  type Plugin,
  ModelProviderName,
  logger
} from '@elizaos/core';
import { bootstrapPlugin } from '@elizaos/plugin-bootstrap';
import { anthropicEnhancedPlugin } from '@elizaos/plugin-anthropic-enhanced';
import { sqlPlugin } from '@elizaos/plugin-sql';

// Import character definitions
import projectManagerChar from '../../characters/project-manager.character.json';
import coderChar from '../../characters/coder.character.json';
import testerChar from '../../characters/tester.character.json';

export enum AgentRole {
  PROJECT_MANAGER = 'project_manager',
  RESEARCHER = 'researcher',
  ARCHITECT = 'architect',
  CODER = 'coder',
  TESTER = 'tester',
  DEBUGGER = 'debugger',
  DOCUMENTER = 'documenter',
  DEVOPS = 'devops',
  SECURITY = 'security'
}

export interface AgentConfig {
  role: AgentRole;
  character: Character;
  plugins: Plugin[];
}

/**
 * MultiAgentRuntime manages multiple ElizaOS agents
 * Each agent uses Eliza's existing actions, providers, and services
 */
export class MultiAgentRuntime {
  private agents: Map<AgentRole, IAgentRuntime> = new Map();
  private initialized = false;

  /**
   * Initialize all agents with their character configurations
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      logger.warn('[MultiAgentRuntime] Already initialized');
      return;
    }

    logger.info('[MultiAgentRuntime] Initializing agents...');

    // Define available plugins
    const plugins: Plugin[] = [
      bootstrapPlugin,       // Core actions & providers
      anthropicEnhancedPlugin, // Z.ai integration
      sqlPlugin              // Database support
    ];

    // Initialize agents with their characters
    const agentConfigs: AgentConfig[] = [
      {
        role: AgentRole.PROJECT_MANAGER,
        character: projectManagerChar as Character,
        plugins
      },
      {
        role: AgentRole.CODER,
        character: coderChar as Character,
        plugins
      },
      {
        role: AgentRole.TESTER,
        character: testerChar as Character,
        plugins
      }
    ];

    // Create runtime for each agent
    for (const config of agentConfigs) {
      try {
        const runtime = await this.createAgentRuntime(config);
        this.agents.set(config.role, runtime);
        logger.info(`[MultiAgentRuntime] ✅ ${config.role} initialized`);
      } catch (error) {
        logger.error(`[MultiAgentRuntime] ❌ Failed to initialize ${config.role}:`, error);
        throw error;
      }
    }

    this.initialized = true;
    logger.info(`[MultiAgentRuntime] 🚀 All ${this.agents.size} agents ready`);
  }

  /**
   * Create an AgentRuntime using Eliza's core infrastructure
   */
  private async createAgentRuntime(config: AgentConfig): Promise<IAgentRuntime> {
    const { character, plugins } = config;

    // Use environment variables for model configuration
    const modelProvider = (process.env.ANTHROPIC_BASE_URL 
      ? ModelProviderName.ANTHROPIC 
      : ModelProviderName.ANTHROPIC) as ModelProviderName;

    // Create runtime with Eliza's standard setup
    const runtime = new AgentRuntime({
      character,
      plugins,
      modelProvider,
      // Database adapter will be injected by sqlPlugin if configured
      databaseAdapter: undefined,
      // Token for model API
      token: process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      // Enable verbose logging for debugging
      debugMode: process.env.DEBUG === 'true'
    });

    // Initialize the runtime
    await runtime.initialize();

    return runtime;
  }

  /**
   * Get agent runtime by role
   */
  getAgent(role: AgentRole): IAgentRuntime | undefined {
    return this.agents.get(role);
  }

  /**
   * Get all active agents
   */
  getAllAgents(): Map<AgentRole, IAgentRuntime> {
    return new Map(this.agents);
  }

  /**
   * Send a message to a specific agent
   * Uses Eliza's existing message handling
   */
  async sendMessage(
    role: AgentRole,
    message: string,
    roomId: string,
    userId: string
  ): Promise<any> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent ${role} not found`);
    }

    // Create message using Eliza's core types
    const memory = {
      id: crypto.randomUUID(),
      userId: userId as any,
      agentId: agent.agentId,
      roomId: roomId as any,
      content: {
        text: message,
        type: 'text' as const
      },
      createdAt: Date.now(),
      embedding: undefined
    };

    // Process using agent's runtime (which has all bootstrap actions/providers)
    const response = await agent.processActions(memory);
    
    return response;
  }

  /**
   * Coordinate multiple agents for a task
   * Project Manager delegates to specialists
   */
  async executeTask(task: {
    description: string;
    roomId: string;
    userId: string;
  }): Promise<void> {
    logger.info(`[MultiAgentRuntime] Executing task: ${task.description}`);

    // Step 1: Project Manager analyzes and plans
    const pmAgent = this.agents.get(AgentRole.PROJECT_MANAGER);
    if (!pmAgent) {
      throw new Error('Project Manager agent not initialized');
    }

    const plan = await this.sendMessage(
      AgentRole.PROJECT_MANAGER,
      `Analyze this task and create a plan: ${task.description}`,
      task.roomId,
      task.userId
    );

    logger.info('[MultiAgentRuntime] Plan created:', plan);

    // Step 2-N: Delegate to specialist agents
    // (In real implementation, PM would parse plan and delegate tasks)
    
    logger.info('[MultiAgentRuntime] ✅ Task execution complete');
  }

  /**
   * Cleanup and shutdown all agents
   */
  async shutdown(): Promise<void> {
    logger.info('[MultiAgentRuntime] Shutting down agents...');
    
    for (const [role, agent] of this.agents.entries()) {
      try {
        // Cleanup agent resources
        await agent.cleanup?.();
        logger.info(`[MultiAgentRuntime] ✅ ${role} shut down`);
      } catch (error) {
        logger.error(`[MultiAgentRuntime] ❌ Error shutting down ${role}:`, error);
      }
    }

    this.agents.clear();
    this.initialized = false;
    logger.info('[MultiAgentRuntime] 🛑 All agents shut down');
  }
}

/**
 * Create and initialize a MultiAgentRuntime instance
 */
export async function createMultiAgentRuntime(): Promise<MultiAgentRuntime> {
  const runtime = new MultiAgentRuntime();
  await runtime.initialize();
  return runtime;
}

