# Phase 2 & Phase 3 Implementation

**Complete Action Modules + MCP Server Integration**

Last Updated: 2025-10-15

---

## Overview

This document covers the complete Phase 2 and Phase 3 implementation of the Agent Orchestrator, including:

✅ **Phase 2**: Internal action modules for agents
✅ **Phase 3**: Unified MCP server exposing all tools
✅ **Real-Life Testing**: End-to-end workflow validation

---

## 📦 What's Included

### Phase 2: Action Modules

Five comprehensive action modules that agents can use directly:

1. **File System** (`src/actions/file-system/`)
   - Read, write, list, search files
   - File operations (copy, move, delete)
   - Directory management

2. **Git Operations** (`src/actions/git/`)
   - Status, diff, log
   - Commit, branch, checkout
   - Push, pull, stash

3. **Code Analysis** (`src/actions/code-analysis/`)
   - Parse TypeScript/JavaScript
   - Lint with ESLint
   - Format with Prettier
   - Calculate complexity
   - Find dependencies
   - Extract TODOs

4. **Testing** (`src/actions/testing/`)
   - Run tests (Vitest/Jest/Mocha)
   - Generate test templates
   - Check coverage
   - Run linters

5. **Build** (`src/actions/build/`)
   - Build projects (tsc/esbuild/vite/webpack)
   - Compile TypeScript
   - Install dependencies
   - Type checking
   - Bundle for production

### Phase 3: MCP Server

A unified Model Context Protocol server that exposes all action modules as MCP tools:

- **Location**: `mcp/server.ts`
- **Tools**: 20+ MCP tools available
- **Protocol**: Stdio transport
- **Integration**: Works with Claude Desktop and other MCP clients

---

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
cd packages/agent-orchestrator
npm install

# or
bun install
```

### Using Action Modules Directly (Phase 2)

```typescript
import * as Actions from '@elizaos/agent-orchestrator/actions';

// File operations
const content = await Actions.readFile('src/index.ts');
await Actions.writeFile('output.ts', 'export {}');

// Git operations
const status = await Actions.gitStatus();
await Actions.gitCommit('feat: Add new feature');

// Code analysis
const parsed = await Actions.parseCode(content);
const formatted = await Actions.formatCode(content);

// Testing
const results = await Actions.runTests({ runner: 'vitest' });

// Build
const build = await Actions.buildProject({ tool: 'esbuild' });
```

### Using MCP Server (Phase 3)

#### 1. Build the MCP Server

```bash
cd packages/agent-orchestrator
npm run build
# This compiles mcp/server.ts to mcp/server.js
```

#### 2. Configure Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "agent-orchestrator": {
      "command": "node",
      "args": [
        "/absolute/path/to/eliza/packages/agent-orchestrator/mcp/server.js"
      ]
    }
  }
}
```

#### 3. Restart Claude Desktop

Claude will now have access to all 20+ agent orchestrator tools!

---

## 📖 API Documentation

### File System Actions

#### `readFile(filePath: string): Promise<FileContent>`

Read file contents with metadata.

```typescript
const file = await Actions.readFile('package.json');
console.log(file.content);
console.log(file.size);
console.log(file.mtime);
```

#### `writeFile(filePath: string, content: string): Promise<void>`

Write content to file (creates directories if needed).

```typescript
await Actions.writeFile('src/new-file.ts', 'export const x = 1;');
```

#### `listFiles(dirPath: string, options?): Promise<string[]>`

List files in directory with optional patterns.

```typescript
const files = await Actions.listFiles('src', {
  recursive: true,
  pattern: '*.ts',
});
```

#### `searchInFiles(dirPath: string, searchText: string, options?): Promise<SearchResult[]>`

Search for text across files.

```typescript
const results = await Actions.searchInFiles('.', 'TODO', {
  filePattern: '**/*.ts',
  caseSensitive: false,
});
```

### Git Operations

#### `gitStatus(): Promise<StatusResult>`

Get repository status.

```typescript
const status = await Actions.gitStatus();
console.log(status.modified);
console.log(status.created);
```

#### `gitCommit(message: string, options?): Promise<string>`

Create a commit.

```typescript
const hash = await Actions.gitCommit('feat: Add feature', { all: true });
```

#### `gitDiff(options?): Promise<string>`

Get diff of changes.

```typescript
const diff = await Actions.gitDiff({ cached: true });
```

### Code Analysis

#### `parseCode(code: string, language?): Promise<ParsedCode>`

Parse and extract code structure.

```typescript
const parsed = await Actions.parseCode(code, 'typescript');
console.log(parsed.functions);
console.log(parsed.classes);
console.log(parsed.imports);
```

#### `lintCode(code: string, filePath?): Promise<LintResult[]>`

Lint code with ESLint.

```typescript
const issues = await Actions.lintCode(code);
issues.forEach(issue => {
  console.log(`${issue.line}: ${issue.message}`);
});
```

#### `formatCode(code: string, options?): Promise<string>`

Format code with Prettier.

```typescript
const formatted = await Actions.formatCode(code, {
  parser: 'typescript',
  singleQuote: true,
});
```

#### `calculateComplexity(code: string): ComplexityResult`

Calculate cyclomatic complexity.

```typescript
const complexity = Actions.calculateComplexity(code);
console.log(`Total: ${complexity.total}`);
```

### Testing

#### `runTests(options?): Promise<TestResult>`

Run test suite.

```typescript
const results = await Actions.runTests({
  runner: 'vitest',
  testPath: 'src/**/*.test.ts',
  coverage: true,
});
```

#### `generateTestTemplate(options): string`

Generate test template for a function.

```typescript
const testCode = Actions.generateTestTemplate({
  functionName: 'processData',
  functionCode: '...',
  framework: 'vitest',
});
```

### Build

#### `buildProject(options?): Promise<BuildResult>`

Build the project.

```typescript
const result = await Actions.buildProject({
  tool: 'esbuild',
  production: true,
});
```

#### `typeCheck(options?): Promise<BuildResult>`

Run TypeScript type checking.

```typescript
const result = await Actions.typeCheck({ strict: true });
```

#### `installDependencies(options?): Promise<BuildResult>`

Install project dependencies.

```typescript
const result = await Actions.installDependencies({
  packageManager: 'bun',
  production: false,
});
```

---

## 🧪 Testing

### Run Real-Life Workflow Test

This comprehensive test validates all action modules with real Z.ai agents:

```bash
export ANTHROPIC_MODEL=glm-4.5V
export ANTHROPIC_BASE_URL=https://api.z.ai/api/anthropic
export ANTHROPIC_AUTH_TOKEN=your_token

npx tsx tests/integration/test-real-life-workflow.ts
```

**What it tests:**
1. ✅ Project Manager breaks down requirements
2. ✅ Coder Agent implements code
3. ✅ Testing Agent generates tests
4. ✅ Code Analysis parses and analyzes code
5. ✅ Git Operations commit changes
6. ✅ File System manages files
7. ✅ Code Formatting applies Prettier

**Expected Output:**
```
🚀 Starting Real-Life Workflow Test

Scenario: Build Express API with JWT Authentication

============================================================
STEP 1: Project Manager - Requirements Breakdown
============================================================

📋 Project Plan:
{
  "tasks": [
    { "id": 1, "title": "Setup Express route", ... }
  ]
}

============================================================
STEP 2: Coder Agent - Implementation
============================================================

💻 Implementation:
import express from 'express';
import jwt from 'jsonwebtoken';
...

============================================================
🎉 WORKFLOW COMPLETE
============================================================

✅ Successfully completed:
  1. ✅ Requirements breakdown (Project Manager)
  2. ✅ Code implementation (Coder Agent)
  3. ✅ Test generation (Testing Agent)
  4. ✅ Code analysis (Code Analysis)
  5. ✅ Git operations (Version Control)
  6. ✅ File operations (File System)
  7. ✅ Code formatting (Code Quality)

🚀 All action modules working perfectly!
✨ Phase 2 & Phase 3 implementation validated!
```

### Unit Tests for Actions

```bash
# Test file system actions
npm test src/actions/file-system

# Test git operations
npm test src/actions/git

# Test code analysis
npm test src/actions/code-analysis

# Test all actions
npm test
```

---

## 🔧 MCP Tools Reference

When using the MCP server, these tools are available:

### File System Tools
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_files` - List directory contents
- `search_in_files` - Search text in files

### Git Tools
- `git_status` - Get repository status
- `git_diff` - Get diff of changes
- `git_commit` - Create commit
- `git_log` - View commit history

### Code Analysis Tools
- `parse_code` - Parse and extract code structure
- `lint_code` - Lint with ESLint
- `format_code` - Format with Prettier
- `calculate_complexity` - Calculate cyclomatic complexity

### Testing Tools
- `run_tests` - Execute test suite
- `generate_test` - Generate test template

### Build Tools
- `build_project` - Build project
- `type_check` - Run TypeScript type checking
- `install_dependencies` - Install packages

---

## 📝 Example Use Cases

### Use Case 1: Add Feature with Full Workflow

```typescript
import * as Actions from '@elizaos/agent-orchestrator/actions';

async function addFeature(requirement: string) {
  // 1. Create feature branch
  await Actions.gitCreateBranch('feature/new-endpoint');
  
  // 2. Generate implementation (using AI agent)
  const code = await generateCodeWithAI(requirement);
  
  // 3. Write code
  await Actions.writeFile('src/api.ts', code);
  
  // 4. Format code
  const formatted = await Actions.formatCode(code);
  await Actions.writeFile('src/api.ts', formatted);
  
  // 5. Generate tests
  const testCode = Actions.generateTestTemplate({
    functionName: 'handler',
    functionCode: code,
    framework: 'vitest',
  });
  await Actions.writeFile('src/api.test.ts', testCode);
  
  // 6. Run tests
  const testResults = await Actions.runTests({ runner: 'vitest' });
  if (!testResults.passed) {
    throw new Error('Tests failed');
  }
  
  // 7. Commit changes
  await Actions.gitAdd(['src/api.ts', 'src/api.test.ts']);
  await Actions.gitCommit('feat: Add new API endpoint');
  
  // 8. Push
  await Actions.gitPush();
}
```

### Use Case 2: Code Quality Check

```typescript
async function checkCodeQuality(filePath: string) {
  const file = await Actions.readFile(filePath);
  
  // Parse code
  const parsed = await Actions.parseCode(file.content);
  console.log(`Functions: ${parsed.functions.length}`);
  
  // Check complexity
  const complexity = Actions.calculateComplexity(file.content);
  if (complexity.total > 50) {
    console.warn('High complexity detected!');
  }
  
  // Lint
  const lintIssues = await Actions.lintCode(file.content, filePath);
  if (lintIssues.length > 0) {
    console.warn(`${lintIssues.length} lint issues found`);
  }
  
  // Count lines
  const lines = Actions.countLines(file.content);
  console.log(`LOC: ${lines.code}`);
  
  return {
    complexity: complexity.total,
    lintIssues: lintIssues.length,
    loc: lines.code,
  };
}
```

### Use Case 3: Automated Refactoring

```typescript
async function refactorCode(filePath: string) {
  // Read original
  const original = await Actions.readFile(filePath);
  
  // Parse and analyze
  const parsed = await Actions.parseCode(original.content);
  const complexity = Actions.calculateComplexity(original.content);
  
  // If complexity is high, refactor with AI
  if (complexity.total > 40) {
    const refactored = await refactorWithAI(original.content);
    
    // Format
    const formatted = await Actions.formatCode(refactored);
    
    // Write back
    await Actions.writeFile(filePath, formatted);
    
    // Verify improvement
    const newComplexity = Actions.calculateComplexity(formatted);
    console.log(`Complexity reduced: ${complexity.total} → ${newComplexity.total}`);
    
    // Commit
    await Actions.gitAdd(filePath);
    await Actions.gitCommit(`refactor: Reduce complexity in ${filePath}`);
  }
}
```

---

## 🏗️ Architecture

```
packages/agent-orchestrator/
├── src/
│   ├── actions/
│   │   ├── file-system/     # File operations
│   │   ├── git/             # Git operations
│   │   ├── code-analysis/   # Code parsing & analysis
│   │   ├── testing/         # Test execution & generation
│   │   ├── build/           # Build & compile
│   │   └── index.ts         # Central export
│   ├── agents/              # Agent implementations
│   ├── types/               # Type definitions
│   └── orchestration/       # Workflow coordination
├── mcp/
│   ├── server.ts            # MCP server implementation
│   └── claude_desktop_config.json  # MCP configuration
└── tests/
    └── integration/         # End-to-end tests
```

---

## 🔄 Workflow Integration

### How Agents Use Actions

```typescript
class CoderAgent {
  async implementFeature(spec: string) {
    // 1. Read existing code
    const existingCode = await Actions.readFile('src/api.ts');
    
    // 2. Parse structure
    const parsed = await Actions.parseCode(existingCode.content);
    
    // 3. Generate new code with AI
    const newCode = await this.generateCode(spec, parsed);
    
    // 4. Format
    const formatted = await Actions.formatCode(newCode);
    
    // 5. Write back
    await Actions.writeFile('src/api.ts', formatted);
    
    // 6. Verify
    const complexity = Actions.calculateComplexity(formatted);
    
    return { success: true, complexity: complexity.total };
  }
}
```

### MCP Integration Flow

```
User Request (Claude Desktop)
        ↓
MCP Protocol (stdio)
        ↓
Agent Orchestrator MCP Server
        ↓
Action Modules (Phase 2)
        ↓
File System / Git / Code Analysis / etc.
        ↓
Result returned via MCP
        ↓
User sees result in Claude Desktop
```

---

## 🐛 Troubleshooting

### Action Module Issues

**Problem**: Import errors

```typescript
// ❌ Wrong
import { readFile } from 'agent-orchestrator/actions/file-system';

// ✅ Correct
import { readFile } from '@elizaos/agent-orchestrator/actions';
```

**Problem**: Git operations fail

```typescript
// Initialize git first!
import { initGit } from '@elizaos/agent-orchestrator/actions';
initGit(process.cwd());
```

### MCP Server Issues

**Problem**: Claude Desktop doesn't see tools

1. Check MCP server is built: `npm run build`
2. Verify config path is absolute
3. Restart Claude Desktop
4. Check logs: `~/Library/Logs/Claude/mcp*.log`

**Problem**: Tool calls fail

- Ensure working directory has necessary permissions
- Check environment variables are set
- Verify dependencies are installed

---

## 📚 Additional Resources

- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)
- [Claude Desktop MCP Guide](https://docs.anthropic.com/claude/docs/mcp)
- [ElizaOS Core Documentation](../../packages/core/README.md)
- [Agent Types Reference](../src/types/README.md)

---

## 🎯 Next Steps

After Phase 2 & 3:

**Phase 4: Orchestration Engine**
- [ ] Workflow coordinator
- [ ] State persistence
- [ ] Error recovery
- [ ] Progress tracking

**Phase 5: Production Ready**
- [ ] Performance optimization
- [ ] Comprehensive error handling
- [ ] Monitoring & logging
- [ ] Production deployment

---

## 🤝 Contributing

Contributions welcome! Please:

1. Add tests for new actions
2. Update type definitions
3. Document MCP tool schemas
4. Test with real workflow

---

**Status**: ✅ Phase 2 Complete | ✅ Phase 3 Complete | 🧪 Fully Tested

**Last Updated**: 2025-10-15

**Maintainer**: @Zeeeepa

