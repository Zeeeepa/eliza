/**
 * Build Actions Module
 * Provides build, compile, and bundle operations
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as esbuild from 'esbuild';
import * as typescript from 'typescript';

const execAsync = promisify(exec);

export interface BuildResult {
  success: boolean;
  duration: number;
  errors: string[];
  warnings: string[];
  outputFiles?: string[];
}

/**
 * Build project with specified build tool
 */
export async function buildProject(options: {
  tool?: 'tsc' | 'esbuild' | 'vite' | 'webpack' | 'npm' | 'pnpm' | 'bun';
  configPath?: string;
  production?: boolean;
  watch?: boolean;
}): Promise<BuildResult> {
  const { tool = 'tsc', configPath, production = false, watch = false } = options;
  
  let command = '';
  
  switch (tool) {
    case 'tsc':
      command = 'npx tsc';
      if (configPath) command += ` -p ${configPath}`;
      if (watch) command += ' --watch';
      break;
    
    case 'esbuild':
      // Will use programmatic API below
      return await buildWithEsbuild({ production, watch });
    
    case 'vite':
      command = 'npx vite build';
      if (watch) command = 'npx vite dev';
      break;
    
    case 'webpack':
      command = 'npx webpack';
      if (production) command += ' --mode production';
      else command += ' --mode development';
      if (watch) command += ' --watch';
      break;
    
    case 'npm':
      command = 'npm run build';
      break;
    
    case 'pnpm':
      command = 'pnpm build';
      break;
    
    case 'bun':
      command = 'bun run build';
      break;
  }
  
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      duration,
      errors: extractErrors(stderr),
      warnings: extractWarnings(stdout + stderr),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      errors: extractErrors(error.stderr + error.stdout),
      warnings: extractWarnings(error.stdout),
    };
  }
}

/**
 * Build with esbuild (programmatic API)
 */
async function buildWithEsbuild(options: {
  production?: boolean;
  watch?: boolean;
}): Promise<BuildResult> {
  const { production = false, watch = false } = options;
  
  const startTime = Date.now();
  
  try {
    const result = await esbuild.build({
      entryPoints: ['src/index.ts'],
      bundle: true,
      outdir: 'dist',
      platform: 'node',
      target: 'node20',
      format: 'esm',
      minify: production,
      sourcemap: !production,
      watch: watch ? {
        onRebuild(error, result) {
          if (error) console.error('Watch build failed:', error);
          else console.log('Watch build succeeded');
        },
      } : false,
      logLevel: 'info',
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      duration,
      errors: result.errors.map(e => e.text),
      warnings: result.warnings.map(w => w.text),
      outputFiles: result.outputFiles?.map(f => f.path),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Compile TypeScript code
 */
export function compileTypeScript(
  code: string,
  options?: typescript.CompilerOptions
): {
  success: boolean;
  output: string;
  errors: string[];
} {
  const defaultOptions: typescript.CompilerOptions = {
    target: typescript.ScriptTarget.ES2022,
    module: typescript.ModuleKind.ESNext,
    strict: true,
    esModuleInterop: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    ...options,
  };
  
  const result = typescript.transpileModule(code, {
    compilerOptions: defaultOptions,
  });
  
  return {
    success: result.diagnostics?.length === 0,
    output: result.outputText,
    errors: result.diagnostics?.map(d => 
      typescript.flattenDiagnosticMessageText(d.messageText, '\n')
    ) || [],
  };
}

/**
 * Run package manager install
 */
export async function installDependencies(options: {
  packageManager?: 'npm' | 'pnpm' | 'yarn' | 'bun';
  production?: boolean;
}): Promise<BuildResult> {
  const { packageManager = 'npm', production = false } = options;
  
  let command = '';
  
  switch (packageManager) {
    case 'npm':
      command = production ? 'npm ci --production' : 'npm install';
      break;
    case 'pnpm':
      command = production ? 'pnpm install --prod' : 'pnpm install';
      break;
    case 'yarn':
      command = production ? 'yarn install --production' : 'yarn install';
      break;
    case 'bun':
      command = production ? 'bun install --production' : 'bun install';
      break;
  }
  
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      maxBuffer: 50 * 1024 * 1024, // 50MB for large installs
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      duration,
      errors: [],
      warnings: extractWarnings(stdout + stderr),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Clean build artifacts
 */
export async function cleanBuild(options: {
  directories?: string[];
}): Promise<void> {
  const { directories = ['dist', 'build', '.next', 'out'] } = options;
  
  const command = `rm -rf ${directories.join(' ')}`;
  await execAsync(command);
}

/**
 * Run type checking
 */
export async function typeCheck(options: {
  configPath?: string;
  strict?: boolean;
}): Promise<BuildResult> {
  const { configPath, strict = false } = options;
  
  let command = 'npx tsc --noEmit';
  if (configPath) command += ` -p ${configPath}`;
  if (strict) command += ' --strict';
  
  const startTime = Date.now();
  
  try {
    const { stdout, stderr } = await execAsync(command);
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      duration,
      errors: [],
      warnings: extractWarnings(stdout + stderr),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      errors: extractErrors(error.stdout + error.stderr),
      warnings: [],
    };
  }
}

/**
 * Bundle for production
 */
export async function bundleForProduction(options: {
  entryPoint: string;
  outDir: string;
  minify?: boolean;
  sourcemap?: boolean;
}): Promise<BuildResult> {
  const { entryPoint, outDir, minify = true, sourcemap = true } = options;
  
  const startTime = Date.now();
  
  try {
    const result = await esbuild.build({
      entryPoints: [entryPoint],
      bundle: true,
      outdir: outDir,
      platform: 'node',
      target: 'node20',
      format: 'esm',
      minify,
      sourcemap,
      treeShaking: true,
      splitting: true,
      metafile: true,
    });
    
    const duration = Date.now() - startTime;
    
    return {
      success: true,
      duration,
      errors: result.errors.map(e => e.text),
      warnings: result.warnings.map(w => w.text),
      outputFiles: result.outputFiles?.map(f => f.path),
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    return {
      success: false,
      duration,
      errors: [error.message],
      warnings: [],
    };
  }
}

/**
 * Extract errors from build output
 */
function extractErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');
  
  lines.forEach(line => {
    if (
      line.includes('error TS') ||
      line.includes('ERROR') ||
      line.includes('Error:') ||
      line.includes('✖')
    ) {
      errors.push(line.trim());
    }
  });
  
  return errors;
}

/**
 * Extract warnings from build output
 */
function extractWarnings(output: string): string[] {
  const warnings: string[] = [];
  const lines = output.split('\n');
  
  lines.forEach(line => {
    if (
      line.includes('warning TS') ||
      line.includes('WARNING') ||
      line.includes('Warning:') ||
      line.includes('⚠')
    ) {
      warnings.push(line.trim());
    }
  });
  
  return warnings;
}

/**
 * Watch for file changes and rebuild
 */
export async function watchAndBuild(options: {
  tool?: 'tsc' | 'esbuild' | 'vite';
  onRebuild?: (result: BuildResult) => void;
}): Promise<void> {
  const { tool = 'tsc', onRebuild } = options;
  
  if (tool === 'esbuild') {
    await buildWithEsbuild({ watch: true });
  } else {
    await buildProject({ tool, watch: true });
  }
}

