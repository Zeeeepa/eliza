/**
 * Testing Actions Module
 * Provides test execution and generation capabilities
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile } from '../file-system';

const execAsync = promisify(exec);

export interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  duration: number;
  failures: Array<{
    test: string;
    error: string;
    stack?: string;
  }>;
}

/**
 * Run tests with specified test runner
 */
export async function runTests(options: {
  runner?: 'vitest' | 'jest' | 'mocha';
  testPath?: string;
  watch?: boolean;
  coverage?: boolean;
}): Promise<TestResult> {
  const { runner = 'vitest', testPath, watch = false, coverage = false } = options;
  
  let command = '';
  
  switch (runner) {
    case 'vitest':
      command = 'npx vitest run';
      if (watch) command = 'npx vitest';
      if (coverage) command += ' --coverage';
      if (testPath) command += ` ${testPath}`;
      break;
    
    case 'jest':
      command = 'npx jest';
      if (watch) command += ' --watch';
      if (coverage) command += ' --coverage';
      if (testPath) command += ` ${testPath}`;
      break;
    
    case 'mocha':
      command = 'npx mocha';
      if (watch) command += ' --watch';
      if (testPath) command += ` ${testPath}`;
      break;
  }
  
  try {
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
    });
    const duration = Date.now() - startTime;
    
    return parseTestOutput(stdout + stderr, duration);
  } catch (error: any) {
    const duration = Date.now() - Date.now();
    return parseTestOutput(error.stdout + error.stderr, duration);
  }
}

/**
 * Parse test output to extract results
 */
function parseTestOutput(output: string, duration: number): TestResult {
  const result: TestResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    duration,
    failures: [],
  };
  
  // Try to extract test counts from various formats
  const vitestMatch = output.match(/Test Files\s+(\d+)\s+passed.*?Tests\s+(\d+)\s+passed\s*\|\s*(\d+)\s+failed/);
  if (vitestMatch) {
    result.passed = parseInt(vitestMatch[2], 10);
    result.failed = parseInt(vitestMatch[3], 10);
    result.total = result.passed + result.failed;
  }
  
  const jestMatch = output.match(/Tests:\s+(\d+)\s+passed.*?(\d+)\s+failed/);
  if (jestMatch) {
    result.passed = parseInt(jestMatch[1], 10);
    result.failed = parseInt(jestMatch[2], 10);
    result.total = result.passed + result.failed;
  }
  
  // Extract failure details
  const failureRegex = /✖\s+(.+?)\n\s+(.+?)(?=\n\n|\n✖|$)/gs;
  let match;
  while ((match = failureRegex.exec(output)) !== null) {
    result.failures.push({
      test: match[1].trim(),
      error: match[2].trim(),
    });
  }
  
  return result;
}

/**
 * Generate test template for a function
 */
export function generateTestTemplate(options: {
  functionName: string;
  functionCode: string;
  framework?: 'vitest' | 'jest' | 'mocha';
}): string {
  const { functionName, functionCode, framework = 'vitest' } = options;
  
  const importStatement = framework === 'mocha'
    ? "import { expect } from 'chai';"
    : "import { describe, it, expect } from '@testing-library/jest';";
  
  return `${importStatement}
import { ${functionName} } from './index';

describe('${functionName}', () => {
  it('should work correctly with valid input', () => {
    // TODO: Add test implementation
    const result = ${functionName}(/* params */);
    expect(result).toBeDefined();
  });

  it('should handle edge cases', () => {
    // TODO: Add edge case tests
  });

  it('should throw error on invalid input', () => {
    // TODO: Add error handling tests
    expect(() => ${functionName}(/* invalid params */)).toThrow();
  });
});
`;
}

/**
 * Generate integration test template
 */
export function generateIntegrationTestTemplate(options: {
  moduleName: string;
  endpoints?: string[];
  framework?: 'vitest' | 'jest';
}): string {
  const { moduleName, endpoints = [], framework = 'vitest' } = options;
  
  const testImports = framework === 'vitest'
    ? "import { describe, it, expect, beforeAll, afterAll } from 'vitest';"
    : "import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';";
  
  const endpointTests = endpoints.map(endpoint => `
  it('should handle ${endpoint} endpoint', async () => {
    // TODO: Implement ${endpoint} test
    const response = await fetch('http://localhost:3000${endpoint}');
    expect(response.ok).toBe(true);
  });`).join('\n');
  
  return `${testImports}

describe('${moduleName} Integration Tests', () => {
  beforeAll(async () => {
    // TODO: Setup test environment
  });

  afterAll(async () => {
    // TODO: Cleanup test environment
  });
${endpointTests || '  // TODO: Add integration tests'}
});
`;
}

/**
 * Run linting checks
 */
export async function runLinter(options: {
  linter?: 'eslint' | 'prettier';
  fix?: boolean;
  paths?: string[];
}): Promise<{
  success: boolean;
  errors: Array<{
    file: string;
    line: number;
    message: string;
  }>;
}> {
  const { linter = 'eslint', fix = false, paths = ['.'] } = options;
  
  let command = '';
  
  if (linter === 'eslint') {
    command = `npx eslint ${paths.join(' ')}`;
    if (fix) command += ' --fix';
  } else if (linter === 'prettier') {
    command = `npx prettier ${paths.join(' ')} --check`;
    if (fix) command = `npx prettier ${paths.join(' ')} --write`;
  }
  
  try {
    await execAsync(command);
    return { success: true, errors: [] };
  } catch (error: any) {
    const errors = parseLinterOutput(error.stdout + error.stderr);
    return { success: false, errors };
  }
}

/**
 * Parse linter output
 */
function parseLinterOutput(output: string): Array<{
  file: string;
  line: number;
  message: string;
}> {
  const errors: Array<{ file: string; line: number; message: string }> = [];
  
  const lines = output.split('\n');
  let currentFile = '';
  
  lines.forEach(line => {
    const fileMatch = line.match(/^(.+\.(ts|js|tsx|jsx))$/);
    if (fileMatch) {
      currentFile = fileMatch[1];
    }
    
    const errorMatch = line.match(/^\s+(\d+):(\d+)\s+error\s+(.+)$/);
    if (errorMatch && currentFile) {
      errors.push({
        file: currentFile,
        line: parseInt(errorMatch[1], 10),
        message: errorMatch[3],
      });
    }
  });
  
  return errors;
}

/**
 * Check test coverage
 */
export async function checkCoverage(options: {
  threshold?: number;
  runner?: 'vitest' | 'jest';
}): Promise<{
  passed: boolean;
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}> {
  const { threshold = 80, runner = 'vitest' } = options;
  
  const command = runner === 'vitest'
    ? 'npx vitest run --coverage'
    : 'npx jest --coverage';
  
  try {
    const { stdout } = await execAsync(command);
    const coverage = parseCoverageOutput(stdout);
    
    const passed = 
      coverage.lines >= threshold &&
      coverage.functions >= threshold &&
      coverage.branches >= threshold &&
      coverage.statements >= threshold;
    
    return { passed, coverage };
  } catch (error: any) {
    const coverage = parseCoverageOutput(error.stdout);
    return { passed: false, coverage };
  }
}

/**
 * Parse coverage output
 */
function parseCoverageOutput(output: string): {
  lines: number;
  functions: number;
  branches: number;
  statements: number;
} {
  const coverage = {
    lines: 0,
    functions: 0,
    branches: 0,
    statements: 0,
  };
  
  const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)\s+\|\s+([\d.]+)/);
  if (coverageMatch) {
    coverage.statements = parseFloat(coverageMatch[1]);
    coverage.branches = parseFloat(coverageMatch[2]);
    coverage.functions = parseFloat(coverageMatch[3]);
    coverage.lines = parseFloat(coverageMatch[4]);
  }
  
  return coverage;
}

