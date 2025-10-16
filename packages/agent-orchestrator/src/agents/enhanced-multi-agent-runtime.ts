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
  type ActionResult,
  type HandlerCallback,
  ModelProviderName,
  logger,
  type Memory,
  type State,
  type Evaluator,
  type Provider
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

        // Convert MCP tools to Eliza actions with PROPER handler pattern
        for (const mcpTool of tools) {
          const action: Action = {
            name: `mcp_${mcpConfig.name}_${mcpTool.name}`,
            similes: [mcpTool.name, `use ${mcpTool.name}`, `call ${mcpTool.name}`],
            description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
            examples: [
              [
                {
                  user: '{{user1}}',
                  content: {
                    text: `Use ${mcpTool.name} to help me`
                  }
                },
                {
                  user: '{{agentName}}',
                  content: {
                    text: 'I will use the tool to help you',
                    action: `mcp_${mcpConfig.name}_${mcpTool.name}`
                  }
                }
              ]
            ],
            validate: async (runtime, message) => {
              // Check if message content mentions this tool
              const text = message.content?.text?.toLowerCase() || '';
              return text.includes(mcpTool.name.toLowerCase());
            },
            // CORRECT HANDLER PATTERN - Returns ActionResult and uses callback
            handler: async (
              runtime: IAgentRuntime,
              message: Memory,
              state?: State,
              options?: any,
              callback?: HandlerCallback
            ): Promise<ActionResult> => {
              try {
                logger.info(`[MCP] Executing tool: ${mcpTool.name}`);

                // 1. Parse arguments from message content
                const args = this.parseToolArguments(message, mcpTool.inputSchema);
                
                // 2. Call MCP tool
                const result = await client.callTool({
                  name: mcpTool.name,
                  arguments: args
                });

                // 3. Format result text
                const resultText = this.formatMCPResult(result);
                
                // 4. Send result to user via callback
                if (callback) {
                  await callback({
                    text: resultText,
                    action: action.name,
                    source: 'mcp'
                  });
                }
                
                // 5. Return ActionResult for chaining
                return {
                  success: true,
                  text: resultText,
                  values: result.content || {},
                  data: { 
                    toolName: mcpTool.name, 
                    result: result,
                    mcpServer: mcpConfig.name
                  }
                };
              } catch (error: any) {
                const errorMsg = `Error executing MCP tool ${mcpTool.name}: ${error.message}`;
                logger.error(`[MCP Tool Error]`, error);
                
                // Send error to user
                if (callback) {
                  await callback({ 
                    text: errorMsg, 
                    error: true 
                  });
                }
                
                // Return failure ActionResult
                return { 
                  success: false, 
                  error: errorMsg,
                  text: errorMsg
                };
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
   * Parse tool arguments from message content
   */
  private parseToolArguments(message: Memory, inputSchema: any): any {
    try {
      // Try to parse structured arguments from message content
      const content = message.content;
      
      if (typeof content === 'object' && content !== null) {
        // If content has an args or arguments field, use that
        if ('args' in content) return content.args;
        if ('arguments' in content) return content.arguments;
        
        // If content has tool parameters, extract them
        if (inputSchema?.properties) {
          const args: any = {};
          for (const prop of Object.keys(inputSchema.properties)) {
            if (prop in content) {
              args[prop] = content[prop];
            }
          }
          if (Object.keys(args).length > 0) return args;
        }
      }
      
      // Fallback: try to parse text as JSON or use as string
      const text = content?.text || String(content);
      try {
        return JSON.parse(text);
      } catch {
        // If not JSON, return as object with text field
        return { input: text };
      }
    } catch (error) {
      logger.warn(`[MCP] Failed to parse tool arguments:`, error);
      return {};
    }
  }

  /**
   * Format MCP result for display
   */
  private formatMCPResult(result: any): string {
    try {
      if (!result) return 'Tool executed successfully (no result)';
      
      // If result has content array, format each content item
      if (Array.isArray(result.content)) {
        return result.content.map((item: any) => {
          if (item.type === 'text') return item.text;
          if (item.type === 'image') return `[Image: ${item.data}]`;
          if (item.type === 'resource') return `[Resource: ${item.uri}]`;
          return JSON.stringify(item);
        }).join('\n');
      }
      
      // If result has text field, use it
      if (result.text) return result.text;
      
      // If result has data, stringify it
      if (result.data) return JSON.stringify(result.data, null, 2);
      
      // Fallback to stringifying entire result
      return JSON.stringify(result, null, 2);
    } catch (error) {
      logger.warn(`[MCP] Failed to format result:`, error);
      return String(result);
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
   * Send a message to a specific agent using PROPER Eliza's message flow
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

    logger.info(`[EnhancedMultiAgentRuntime] ${role} processing: "${message}"`);

    // 1. Create user message memory
    const userMemory: Memory = {
      id: crypto.randomUUID(),
      userId: userId as any,
      agentId: agent.agentId,
      roomId: roomId as any,
      content: {
        text: message,
        type: 'text' as const,
        source: 'user'
      },
      createdAt: Date.now(),
      embedding: undefined
    };

    // 2. Store user message in memory
    await agent.createMemory(userMemory);

    // 3. Get recent conversation history for context
    const recentMessages = await agent.getMemories({
      roomId: roomId as any,
      count: 10,
      unique: false
    });

    // 4. Compose state with PROPER flags
    const state: State = await agent.composeState(userMemory, {
      composerNames: [
        'RECENT_MESSAGES',
        'ACTION_STATE', 
        'FACTS',
        'KNOWLEDGE'
      ]
    });

    // 5. Create response memories array
    const responses: Memory[] = [];
    
    // 6. Create callback to capture agent responses
    const callback: HandlerCallback = async (response) => {
      const responseMemory: Memory = {
        id: crypto.randomUUID(),
        userId: agent.agentId,
        agentId: agent.agentId,
        roomId: roomId as any,
        content: {
          text: response.text || '',
          type: 'text' as const,
          source: 'agent',
          action: response.action,
          ...response
        },
        createdAt: Date.now(),
        embedding: undefined
      };

      // Store response in memory
      await agent.createMemory(responseMemory);
      responses.push(responseMemory);

      logger.debug(`[${role}] Response: ${response.text?.substring(0, 100)}...`);
    };

    try {
      // 7. Process actions through Eliza's pipeline
      await agent.processActions(userMemory, [userMemory], state, callback);

      // 8. Run evaluators for post-interaction learning
      await this.runEvaluators(agent, userMemory, responses, state);

      logger.info(`[EnhancedMultiAgentRuntime] ${role} generated ${responses.length} responses`);

      return responses;
    } catch (error: any) {
      logger.error(`[EnhancedMultiAgentRuntime] Error in ${role}:`, error);
      
      // Create error response
      const errorMemory: Memory = {
        id: crypto.randomUUID(),
        userId: agent.agentId,
        agentId: agent.agentId,
        roomId: roomId as any,
        content: {
          text: `Error: ${error.message}`,
          type: 'text' as const,
          source: 'agent',
          error: true
        },
        createdAt: Date.now(),
        embedding: undefined
      };
      
      await agent.createMemory(errorMemory);
      return [errorMemory];
    }
  }

  /**
   * Run evaluators after interaction (for agent learning & reflection)
   */
  private async runEvaluators(
    runtime: IAgentRuntime,
    message: Memory,
    responses: Memory[],
    state: State
  ): Promise<void> {
    if (!runtime.evaluators || runtime.evaluators.length === 0) {
      return; // No evaluators configured
    }

    logger.debug(`[EnhancedMultiAgentRuntime] Running ${runtime.evaluators.length} evaluators`);

    for (const evaluator of runtime.evaluators) {
      try {
        // Check if evaluator should run
        if (evaluator.validate) {
          const shouldRun = await evaluator.validate(runtime, message, state);
          if (!shouldRun) {
            logger.debug(`[Evaluator] Skipping ${evaluator.name} - validation failed`);
            continue;
          }
        }

        // Execute evaluator handler
        await evaluator.handler(runtime, message, state, {
          responses
        });

        logger.debug(`[Evaluator] ${evaluator.name} completed`);
      } catch (error: any) {
        logger.error(`[Evaluator] Error in ${evaluator.name}:`, error);
        // Don't throw - evaluator failures shouldn't break the flow
      }
    }
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
