/**
 * Central Actions Export
 * All action modules available for agents
 */

// File System Actions
export * as FileSystem from './file-system';

// Git Operations
export * as Git from './git';

// Code Analysis
export * as CodeAnalysis from './code-analysis';

// Testing
export * as Testing from './testing';

// Build
export * as Build from './build';

// Re-export for convenience
export {
  readFile,
  writeFile,
  listFiles,
  searchInFiles,
  fileExists,
  deleteFile,
  copyFile,
  moveFile,
  getFileInfo,
  createDirectory,
  readDirectory,
} from './file-system';

export {
  initGit,
  gitStatus,
  gitDiff,
  gitLog,
  gitAdd,
  gitCommit,
  gitCreateBranch,
  gitCheckout,
  gitListBranches,
  gitPull,
  gitPush,
  gitCurrentBranch,
  gitRemoteUrl,
  gitHasChanges,
  gitChangedFiles,
  gitStash,
  gitStashPop,
  gitShowFile,
} from './git';

export {
  parseCode,
  lintCode,
  formatCode,
  calculateComplexity,
  findDependencies,
  countLines,
  extractTodos,
} from './code-analysis';

export {
  runTests,
  generateTestTemplate,
  generateIntegrationTestTemplate,
  runLinter,
  checkCoverage,
} from './testing';

export {
  buildProject,
  compileTypeScript,
  installDependencies,
  cleanBuild,
  typeCheck,
  bundleForProduction,
  watchAndBuild,
} from './build';

// Action types
export type { FileContent, SearchResult } from './file-system';
export type { ParsedCode } from './code-analysis';
export type { TestResult } from './testing';
export type { BuildResult } from './build';

