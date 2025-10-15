/**
 * Code Analysis Actions Module
 * Provides code parsing, linting, and analysis
 */

import { parse as babelParse } from '@babel/parser';
import { Project, SourceFile, SyntaxKind } from 'ts-morph';
import { ESLint } from 'eslint';
import * as prettier from 'prettier';

export interface ParsedCode {
  functions: Array<{
    name: string;
    params: string[];
    line: number;
  }>;
  classes: Array<{
    name: string;
    methods: string[];
    line: number;
  }>;
  imports: Array<{
    source: string;
    specifiers: string[];
    line: number;
  }>;
  exports: Array<{
    name: string;
    type: 'default' | 'named';
    line: number;
  }>;
}

/**
 * Parse TypeScript/JavaScript code
 */
export async function parseCode(
  code: string,
  language: 'typescript' | 'javascript' = 'typescript'
): Promise<ParsedCode> {
  const project = new Project({
    useInMemoryFileSystem: true,
    compilerOptions: {
      target: 99, // Latest
      module: 99, // ESNext
    },
  });
  
  const sourceFile = project.createSourceFile(
    `temp.${language === 'typescript' ? 'ts' : 'js'}`,
    code
  );
  
  const result: ParsedCode = {
    functions: [],
    classes: [],
    imports: [],
    exports: [],
  };
  
  // Extract functions
  sourceFile.getFunctions().forEach(func => {
    result.functions.push({
      name: func.getName() || '<anonymous>',
      params: func.getParameters().map(p => p.getName()),
      line: func.getStartLineNumber(),
    });
  });
  
  // Extract classes
  sourceFile.getClasses().forEach(cls => {
    result.classes.push({
      name: cls.getName() || '<anonymous>',
      methods: cls.getMethods().map(m => m.getName()),
      line: cls.getStartLineNumber(),
    });
  });
  
  // Extract imports
  sourceFile.getImportDeclarations().forEach(imp => {
    result.imports.push({
      source: imp.getModuleSpecifierValue(),
      specifiers: imp.getNamedImports().map(n => n.getName()),
      line: imp.getStartLineNumber(),
    });
  });
  
  // Extract exports
  sourceFile.getExportDeclarations().forEach(exp => {
    const moduleSpecifier = exp.getModuleSpecifier();
    if (moduleSpecifier) {
      result.exports.push({
        name: moduleSpecifier.getLiteralText(),
        type: 'named',
        line: exp.getStartLineNumber(),
      });
    }
  });
  
  // Check for default exports
  const defaultExport = sourceFile.getDefaultExportSymbol();
  if (defaultExport) {
    result.exports.push({
      name: 'default',
      type: 'default',
      line: 1,
    });
  }
  
  return result;
}

/**
 * Lint code with ESLint
 */
export async function lintCode(
  code: string,
  filePath: string = 'temp.ts'
): Promise<Array<{
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
  ruleId: string | null;
}>> {
  const eslint = new ESLint({
    useEslintrc: false,
    overrideConfig: {
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint'],
      extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
      ],
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'warn',
      },
    },
  });
  
  const results = await eslint.lintText(code, { filePath });
  
  if (results.length === 0) return [];
  
  return results[0].messages.map(msg => ({
    line: msg.line,
    column: msg.column,
    severity: msg.severity === 2 ? 'error' : 'warning',
    message: msg.message,
    ruleId: msg.ruleId,
  }));
}

/**
 * Format code with Prettier
 */
export async function formatCode(
  code: string,
  options: {
    parser?: 'typescript' | 'babel' | 'json';
    printWidth?: number;
    tabWidth?: number;
    useTabs?: boolean;
    semi?: boolean;
    singleQuote?: boolean;
  } = {}
): Promise<string> {
  const {
    parser = 'typescript',
    printWidth = 80,
    tabWidth = 2,
    useTabs = false,
    semi = true,
    singleQuote = true,
  } = options;
  
  return await prettier.format(code, {
    parser,
    printWidth,
    tabWidth,
    useTabs,
    semi,
    singleQuote,
  });
}

/**
 * Calculate code complexity (cyclomatic complexity)
 */
export function calculateComplexity(code: string): {
  total: number;
  functions: Array<{ name: string; complexity: number }>;
} {
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  
  const sourceFile = project.createSourceFile('temp.ts', code);
  
  const functionComplexities: Array<{ name: string; complexity: number }> = [];
  let totalComplexity = 0;
  
  sourceFile.getFunctions().forEach(func => {
    const complexity = calculateFunctionComplexity(func.getText());
    functionComplexities.push({
      name: func.getName() || '<anonymous>',
      complexity,
    });
    totalComplexity += complexity;
  });
  
  return {
    total: totalComplexity,
    functions: functionComplexities,
  };
}

/**
 * Calculate complexity for a single function
 */
function calculateFunctionComplexity(code: string): number {
  let complexity = 1; // Base complexity
  
  // Count decision points
  const patterns = [
    /\bif\b/g,
    /\belse\s+if\b/g,
    /\bfor\b/g,
    /\bwhile\b/g,
    /\bcase\b/g,
    /\bcatch\b/g,
    /\b\?\s*:/g, // Ternary operator
    /&&/g,
    /\|\|/g,
  ];
  
  patterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) complexity += matches.length;
  });
  
  return complexity;
}

/**
 * Find dependencies in code
 */
export function findDependencies(code: string): {
  internal: string[];
  external: string[];
} {
  const project = new Project({
    useInMemoryFileSystem: true,
  });
  
  const sourceFile = project.createSourceFile('temp.ts', code);
  
  const internal: string[] = [];
  const external: string[] = [];
  
  sourceFile.getImportDeclarations().forEach(imp => {
    const moduleSpecifier = imp.getModuleSpecifierValue();
    
    if (moduleSpecifier.startsWith('.') || moduleSpecifier.startsWith('/')) {
      internal.push(moduleSpecifier);
    } else {
      external.push(moduleSpecifier);
    }
  });
  
  return {
    internal: [...new Set(internal)],
    external: [...new Set(external)],
  };
}

/**
 * Count lines of code
 */
export function countLines(code: string): {
  total: number;
  code: number;
  comments: number;
  blank: number;
} {
  const lines = code.split('\n');
  
  let codeLines = 0;
  let commentLines = 0;
  let blankLines = 0;
  let inMultilineComment = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed === '') {
      blankLines++;
    } else if (trimmed.startsWith('//')) {
      commentLines++;
    } else if (trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      commentLines++;
      inMultilineComment = true;
    } else if (trimmed.endsWith('*/')) {
      commentLines++;
      inMultilineComment = false;
    } else if (inMultilineComment) {
      commentLines++;
    } else {
      codeLines++;
    }
  });
  
  return {
    total: lines.length,
    code: codeLines,
    comments: commentLines,
    blank: blankLines,
  };
}

/**
 * Extract TODO comments
 */
export function extractTodos(code: string): Array<{
  line: number;
  text: string;
  type: 'TODO' | 'FIXME' | 'NOTE';
}> {
  const lines = code.split('\n');
  const todos: Array<{ line: number; text: string; type: 'TODO' | 'FIXME' | 'NOTE' }> = [];
  
  lines.forEach((line, index) => {
    const todoMatch = line.match(/\/\/\s*(TODO|FIXME|NOTE):\s*(.+)/i);
    if (todoMatch) {
      todos.push({
        line: index + 1,
        text: todoMatch[2].trim(),
        type: todoMatch[1].toUpperCase() as 'TODO' | 'FIXME' | 'NOTE',
      });
    }
  });
  
  return todos;
}

