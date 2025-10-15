/**
 * Enhanced Multi-Agent Runtime
 * 
 * REAL implementation using:
 * - Eliza's AgentRuntime system
 * - MCP server integration
 * - Dynamic plugin management
 * - Custom agent creation
 * - Tool registration
 */

import {
  AgentRuntime,
  type Character,
  type IAgentRuntime,
  type Plugin,
  type Action,
  ModelProviderName,
  logger,
  type Memory,
  type State
} from '@elizaos/core';
import { bootstrapPlugin } from '@elizaos/plugin-bootstrap';
import { sqlPlugin } from '@elizaos/plugin-sql';

export enum AgentRole {
  PROJECT_MANAGER = 'project_manager',
  RESEARCHER = 'researcher',
  ARCHITECT = 'architect',
  CODER = 'coder',
  TESTER = 'tester',
  DEBUGGER = 'debugger',
  DOCUMENTER = 'documenter',
  DEVOPS = 'devops',
  SECURITY = 'security',
  CUSTOM = 'custom'
}

export interface MCPServerConfig {
  name: string;
  serverPath: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentConfig {
  role: AgentRole | string;
  character: Character;
  plugins?: Plugin[];
  mcpServers?: MCPServerConfig[];
  tools?: Action[];
  modelProvider?: ModelProviderName;
  token?: string;
}

/**
 * Enhanced MultiAgentRuntime with full Eliza integration
 */
export class EnhancedMultiAgentRuntime {
  private agents: Map<string, IAgentRuntime> = new Map();
  private agentConfigs: Map<string, AgentConfig> = new Map();
  private mcpClients: Map<string, any> = new Map();
  private initialized = false;

  constructor() {
    logger.info('[EnhancedMultiAgentRuntime] Initializing...');
  }

  /**
   * Create a custom agent with full configuration
   */
  async createAgent(config: AgentConfig): Promise<IAgentRuntime> {
    const roleKey = typeof config.role === 'string' ? config.role : config.role.toString();
    
    if (this.agents.has(roleKey)) {
      logger.warn(`[EnhancedMultiAgentRuntime] Agent ${roleKey} already exists`);
      return this.agents.get(roleKey)!;
    }

    logger.info(`[EnhancedMultiAgentRuntime] Creating agent: ${roleKey}`);

    // Default plugins if none provided
    const plugins = config.plugins || [bootstrapPlugin];

    // Model provider configuration
    const modelProvider = config.modelProvider || 
      (process.env.ANTHROPIC_BASE_URL ? ModelProviderName.ANTHROPIC : ModelProviderName.ANTHROPIC);

    // Create runtime with Eliza's standard setup
    const runtime = new AgentRuntime({
      character: config.character,
      plugins,
      modelProvider,
      databaseAdapter: undefined, // Will be injected by sqlPlugin if configured
      token: config.token || process.env.ANTHROPIC_AUTH_TOKEN || process.env.ANTHROPIC_API_KEY,
      debugMode: process.env.DEBUG === 'true'
    });

    // Register custom tools/actions if provided
    if (config.tools && config.tools.length > 0) {
      for (const tool of config.tools) {
        await this.registerToolForRuntime(runtime, tool);
      }
      logger.info(`[EnhancedMultiAgentRuntime] Registered ${config.tools.length} custom tools for ${roleKey}`);
    }

    // Initialize MCP servers if configured
    if (config.mcpServers && config.mcpServers.length > 0) {
      await this.initializeMCPServers(roleKey, config.mcpServers, runtime);
    }

    // Initialize the runtime
    await runtime.initialize();

    // Store agent and config
    this.agents.set(roleKey, runtime);
    this.agentConfigs.set(roleKey, config);

    logger.info(`[EnhancedMultiAgentRuntime] ✅ Agent ${roleKey} created successfully`);
    return runtime;
  }

  /**
   * Add a plugin to an existing agent
   */
  async addPlugin(agentRole: string, plugin: Plugin): Promise<void> {
    const agent = this.agents.get(agentRole);
    if (!agent) {
      throw new Error(`Agent ${agentRole} not found`);
    }

    logger.info(`[EnhancedMultiAgentRuntime] Adding plugin to ${agentRole}`);

    // Register plugin's actions
    if (plugin.actions) {
      for (const action of plugin.actions) {
        await this.registerToolForRuntime(agent, action);
      }
    }

    // Register plugin's providers
    if (plugin.providers) {
      for (const provider of plugin.providers) {
        agent.registerMemoryManager(provider);
      }
    }

    logger.info(`[EnhancedMultiAgentRuntime] ✅ Plugin added to ${agentRole}`);
  }

  /**
   * Add MCP server to an agent
   */
  async addMCPServer(
    agentRole: string,
    mcpConfig: MCPServerConfig
  ): Promise<void> {
    const agent = this.agents.get(agentRole);
    if (!agent) {
      throw new Error(`Agent ${agentRole} not found`);
    }

    logger.info(`[EnhancedMultiAgentRuntime] Adding MCP server ${mcpConfig.name} to ${agentRole}`);

    await this.initializeMCPServers(agentRole, [mcpConfig], agent);

    logger.info(`[EnhancedMultiAgentRuntime] ✅ MCP server ${mcpConfig.name} added to ${agentRole}`);
  }

  /**
   * Register a custom tool/action to an agent
   */
  async addTool(agentRole: string, tool: Action): Promise<void> {
    const agent = this.agents.get(agentRole);
    if (!agent) {
      throw new Error(`Agent ${agentRole} not found`);
    }

    logger.info(`[EnhancedMultiAgentRuntime] Adding tool ${tool.name} to ${agentRole}`);

    await this.registerToolForRuntime(agent, tool);

    logger.info(`[EnhancedMultiAgentRuntime] ✅ Tool ${tool.name} added to ${agentRole}`);
  }

  /**
   * Initialize MCP servers for an agent
   */
  private async initializeMCPServers(
    agentRole: string,
    mcpServers: MCPServerConfig[],
    runtime: IAgentRuntime
  ): Promise<void> {
    logger.info(`[EnhancedMultiAgentRuntime] Initializing ${mcpServers.length} MCP servers for ${agentRole}`);

    for (const mcpConfig of mcpServers) {
      try {
        // Dynamic import of MCP client
        const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
        const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client/stdio.js');

        // Create transport
        const transport = new StdioClientTransport({
          command: mcpConfig.serverPath,
          args: mcpConfig.args || [],
          env: { ...process.env, ...mcpConfig.env }
        });

        // Create and connect client
        const client = new Client({
          name: `eliza-agent-${agentRole}`,
          version: '1.0.0'
        }, {
          capabilities: {
            tools: {},
            prompts: {},
            resources: {}
          }
        });

        await client.connect(transport);

        // List available tools from MCP server
        const { tools } = await client.listTools();
        logger.info(`[EnhancedMultiAgentRuntime] MCP server ${mcpConfig.name} provides ${tools.length} tools`);

        // Convert MCP tools to Eliza actions
        for (const mcpTool of tools) {
          const action: Action = {
            name: `mcp_${mcpConfig.name}_${mcpTool.name}`,
            similes: [mcpTool.name],
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            examples: [],
            validate: async () => true,
            handler: async (runtime, message, state) => {
              try {
                // Call MCP tool
                const result = await client.callTool({
                  name: mcpTool.name,
                  arguments: message.content
                });

                return true;
              } catch (error) {
                logger.error(`[MCP Tool Error] ${mcpTool.name}:`, error);
                return false;
              }
            }
          };

          await this.registerToolForRuntime(runtime, action);
        }

        // Store client for cleanup
        const clientKey = `${agentRole}_${mcpConfig.name}`;
        this.mcpClients.set(clientKey, client);

        logger.info(`[EnhancedMultiAgentRuntime] ✅ MCP server ${mcpConfig.name} initialized for ${agentRole}`);
      } catch (error) {
        logger.error(`[EnhancedMultiAgentRuntime] ❌ Failed to initialize MCP server ${mcpConfig.name}:`, error);
        throw error;
      }
    }
  }

  /**
   * Register a tool/action to a runtime
   */
  private async registerToolForRuntime(runtime: IAgentRuntime, action: Action): Promise<void> {
    // Register action with runtime
    (runtime as any).actions = (runtime as any).actions || [];
    (runtime as any).actions.push(action);

    logger.debug(`[EnhancedMultiAgentRuntime] Registered action: ${action.name}`);
  }

  /**
   * Get agent runtime by role
   */
  getAgent(role: string): IAgentRuntime | undefined {
    return this.agents.get(role);
  }

  /**
   * Get all active agents
   */
  getAllAgents(): Map<string, IAgentRuntime> {
    return new Map(this.agents);
  }

  /**
   * List all agent roles
   */
  listAgentRoles(): string[] {
    return Array.from(this.agents.keys());
  }

  /**
   * Send a message to a specific agent using Eliza's message system
   */
  async sendMessage(
    role: string,
    message: string,
    roomId: string,
    userId: string
  ): Promise<Memory[]> {
    const agent = this.agents.get(role);
    if (!agent) {
      throw new Error(`Agent ${role} not found`);
    }

    // Create message using Eliza's Memory type
    const memory: Memory = {
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

    // Create empty state
    const state: State = await agent.composeState(memory);

    // Process message through agent's action pipeline
    const response = await agent.processActions(memory, [memory], state);

    return response || [];
  }

  /**
   * Execute a task with multiple agents
   */
  async executeTask(task: {
    description: string;
    roomId: string;
    userId: string;
    agents?: string[];
  }): Promise<Map<string, Memory[]>> {
    logger.info(`[EnhancedMultiAgentRuntime] Executing task: ${task.description}`);

    const results = new Map<string, Memory[]>();
    const agentsToUse = task.agents || this.listAgentRoles();

    for (const agentRole of agentsToUse) {
      try {
        const response = await this.sendMessage(
          agentRole,
          task.description,
          task.roomId,
          task.userId
        );
        results.set(agentRole, response);
        logger.info(`[EnhancedMultiAgentRuntime] ✅ ${agentRole} completed task`);
      } catch (error) {
        logger.error(`[EnhancedMultiAgentRuntime] ❌ ${agentRole} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Remove an agent
   */
  async removeAgent(role: string): Promise<void> {
    const agent = this.agents.get(role);
    if (!agent) {
      logger.warn(`[EnhancedMultiAgentRuntime] Agent ${role} not found`);
      return;
    }

    // Cleanup MCP clients for this agent
    for (const [key, client] of this.mcpClients.entries()) {
      if (key.startsWith(`${role}_`)) {
        try {
          await client.close();
          this.mcpClients.delete(key);
        } catch (error) {
          logger.error(`[EnhancedMultiAgentRuntime] Error closing MCP client:`, error);
        }
      }
    }

    // Cleanup agent
    await agent.cleanup?.();
    this.agents.delete(role);
    this.agentConfigs.delete(role);

    logger.info(`[EnhancedMultiAgentRuntime] ✅ Agent ${role} removed`);
  }

  /**
   * Cleanup and shutdown all agents
   */
  async shutdown(): Promise<void> {
    logger.info('[EnhancedMultiAgentRuntime] Shutting down...');

    // Close all MCP clients
    for (const [key, client] of this.mcpClients.entries()) {
      try {
        await client.close();
        logger.debug(`[EnhancedMultiAgentRuntime] Closed MCP client: ${key}`);
      } catch (error) {
        logger.error(`[EnhancedMultiAgentRuntime] Error closing MCP client ${key}:`, error);
      }
    }
    this.mcpClients.clear();

    // Shutdown all agents
    for (const [role, agent] of this.agents.entries()) {
      try {
        await agent.cleanup?.();
        logger.info(`[EnhancedMultiAgentRuntime] ✅ ${role} shut down`);
      } catch (error) {
        logger.error(`[EnhancedMultiAgentRuntime] ❌ Error shutting down ${role}:`, error);
      }
    }

    this.agents.clear();
    this.agentConfigs.clear();
    this.initialized = false;

    logger.info('[EnhancedMultiAgentRuntime] 🛑 Shutdown complete');
  }
}

/**
 * Create an EnhancedMultiAgentRuntime instance
 */
export function createEnhancedMultiAgentRuntime(): EnhancedMultiAgentRuntime {
  return new EnhancedMultiAgentRuntime();
}

