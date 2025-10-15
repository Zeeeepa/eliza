#!/usr/bin/env node

/**
 * Agent Orchestrator MCP Server
 * Exposes all action modules as MCP tools for AI clients
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import * as Actions from '../src/actions/index.js';

// Initialize server
const server = new Server(
  {
    name: 'agent-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // File System Tools
      {
        name: 'read_file',
        description: 'Read contents of a file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to read',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'write_file',
        description: 'Write content to a file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Path to the file to write',
            },
            content: {
              type: 'string',
              description: 'Content to write to the file',
            },
          },
          required: ['filePath', 'content'],
        },
      },
      {
        name: 'list_files',
        description: 'List files in a directory',
        inputSchema: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: 'Path to the directory',
            },
            recursive: {
              type: 'boolean',
              description: 'Whether to list recursively',
              default: false,
            },
            pattern: {
              type: 'string',
              description: 'File pattern to match (e.g., *.ts)',
              default: '*',
            },
          },
          required: ['dirPath'],
        },
      },
      {
        name: 'search_in_files',
        description: 'Search for text in files',
        inputSchema: {
          type: 'object',
          properties: {
            dirPath: {
              type: 'string',
              description: 'Directory to search in',
            },
            searchText: {
              type: 'string',
              description: 'Text to search for',
            },
            filePattern: {
              type: 'string',
              description: 'File pattern (default: **/*.{ts,tsx,js,jsx,json})',
            },
            caseSensitive: {
              type: 'boolean',
              description: 'Whether search is case sensitive',
              default: false,
            },
          },
          required: ['dirPath', 'searchText'],
        },
      },
      
      // Git Tools
      {
        name: 'git_status',
        description: 'Get git repository status',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'git_diff',
        description: 'Get git diff',
        inputSchema: {
          type: 'object',
          properties: {
            cached: {
              type: 'boolean',
              description: 'Show staged changes',
              default: false,
            },
            file: {
              type: 'string',
              description: 'Specific file to diff',
            },
          },
        },
      },
      {
        name: 'git_commit',
        description: 'Create a git commit',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Commit message',
            },
            all: {
              type: 'boolean',
              description: 'Stage all changes',
              default: false,
            },
          },
          required: ['message'],
        },
      },
      {
        name: 'git_log',
        description: 'Get git commit history',
        inputSchema: {
          type: 'object',
          properties: {
            maxCount: {
              type: 'number',
              description: 'Maximum number of commits',
              default: 10,
            },
            file: {
              type: 'string',
              description: 'Specific file to get history for',
            },
          },
        },
      },
      
      // Code Analysis Tools
      {
        name: 'parse_code',
        description: 'Parse TypeScript/JavaScript code and extract structure',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to parse',
            },
            language: {
              type: 'string',
              enum: ['typescript', 'javascript'],
              description: 'Code language',
              default: 'typescript',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'lint_code',
        description: 'Lint code with ESLint',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to lint',
            },
            filePath: {
              type: 'string',
              description: 'File path for context',
              default: 'temp.ts',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'format_code',
        description: 'Format code with Prettier',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to format',
            },
            parser: {
              type: 'string',
              enum: ['typescript', 'babel', 'json'],
              description: 'Parser to use',
              default: 'typescript',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'calculate_complexity',
        description: 'Calculate cyclomatic complexity of code',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'Code to analyze',
            },
          },
          required: ['code'],
        },
      },
      
      // Testing Tools
      {
        name: 'run_tests',
        description: 'Run test suite',
        inputSchema: {
          type: 'object',
          properties: {
            runner: {
              type: 'string',
              enum: ['vitest', 'jest', 'mocha'],
              description: 'Test runner to use',
              default: 'vitest',
            },
            testPath: {
              type: 'string',
              description: 'Specific test file or directory',
            },
            coverage: {
              type: 'boolean',
              description: 'Generate coverage report',
              default: false,
            },
          },
        },
      },
      {
        name: 'generate_test',
        description: 'Generate test template for a function',
        inputSchema: {
          type: 'object',
          properties: {
            functionName: {
              type: 'string',
              description: 'Name of function to test',
            },
            functionCode: {
              type: 'string',
              description: 'Function code',
            },
            framework: {
              type: 'string',
              enum: ['vitest', 'jest', 'mocha'],
              description: 'Testing framework',
              default: 'vitest',
            },
          },
          required: ['functionName', 'functionCode'],
        },
      },
      
      // Build Tools
      {
        name: 'build_project',
        description: 'Build the project',
        inputSchema: {
          type: 'object',
          properties: {
            tool: {
              type: 'string',
              enum: ['tsc', 'esbuild', 'vite', 'webpack', 'npm', 'pnpm', 'bun'],
              description: 'Build tool to use',
              default: 'tsc',
            },
            production: {
              type: 'boolean',
              description: 'Build for production',
              default: false,
            },
          },
        },
      },
      {
        name: 'type_check',
        description: 'Run TypeScript type checking',
        inputSchema: {
          type: 'object',
          properties: {
            strict: {
              type: 'boolean',
              description: 'Enable strict mode',
              default: false,
            },
          },
        },
      },
      {
        name: 'install_dependencies',
        description: 'Install project dependencies',
        inputSchema: {
          type: 'object',
          properties: {
            packageManager: {
              type: 'string',
              enum: ['npm', 'pnpm', 'yarn', 'bun'],
              description: 'Package manager to use',
              default: 'npm',
            },
            production: {
              type: 'boolean',
              description: 'Install production dependencies only',
              default: false,
            },
          },
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: any;

    switch (name) {
      // File System Actions
      case 'read_file':
        result = await Actions.readFile(args.filePath as string);
        break;

      case 'write_file':
        await Actions.writeFile(args.filePath as string, args.content as string);
        result = { success: true, message: 'File written successfully' };
        break;

      case 'list_files':
        result = await Actions.listFiles(args.dirPath as string, {
          recursive: args.recursive as boolean,
          pattern: args.pattern as string,
        });
        break;

      case 'search_in_files':
        result = await Actions.searchInFiles(
          args.dirPath as string,
          args.searchText as string,
          {
            filePattern: args.filePattern as string,
            caseSensitive: args.caseSensitive as boolean,
          }
        );
        break;

      // Git Actions
      case 'git_status':
        result = await Actions.gitStatus();
        break;

      case 'git_diff':
        result = await Actions.gitDiff({
          cached: args.cached as boolean,
          file: args.file as string,
        });
        break;

      case 'git_commit':
        result = await Actions.gitCommit(args.message as string, {
          all: args.all as boolean,
        });
        break;

      case 'git_log':
        result = await Actions.gitLog({
          maxCount: args.maxCount as number,
          file: args.file as string,
        });
        break;

      // Code Analysis Actions
      case 'parse_code':
        result = await Actions.parseCode(
          args.code as string,
          args.language as 'typescript' | 'javascript'
        );
        break;

      case 'lint_code':
        result = await Actions.lintCode(args.code as string, args.filePath as string);
        break;

      case 'format_code':
        result = await Actions.formatCode(args.code as string, {
          parser: args.parser as 'typescript' | 'babel' | 'json',
        });
        break;

      case 'calculate_complexity':
        result = Actions.calculateComplexity(args.code as string);
        break;

      // Testing Actions
      case 'run_tests':
        result = await Actions.runTests({
          runner: args.runner as 'vitest' | 'jest' | 'mocha',
          testPath: args.testPath as string,
          coverage: args.coverage as boolean,
        });
        break;

      case 'generate_test':
        result = Actions.generateTestTemplate({
          functionName: args.functionName as string,
          functionCode: args.functionCode as string,
          framework: args.framework as 'vitest' | 'jest' | 'mocha',
        });
        break;

      // Build Actions
      case 'build_project':
        result = await Actions.buildProject({
          tool: args.tool as any,
          production: args.production as boolean,
        });
        break;

      case 'type_check':
        result = await Actions.typeCheck({
          strict: args.strict as boolean,
        });
        break;

      case 'install_dependencies':
        result = await Actions.installDependencies({
          packageManager: args.packageManager as any,
          production: args.production as boolean,
        });
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Agent Orchestrator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

