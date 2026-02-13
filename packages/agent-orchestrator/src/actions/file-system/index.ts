/**
 * File System Actions Module
 * Provides file operations for agents
 */

import { promises as fs } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { glob } from 'glob';

export interface FileContent {
  path: string;
  content: string;
  size: number;
  mtime: Date;
}

export interface SearchResult {
  path: string;
  line: number;
  content: string;
  match: string;
}

/**
 * Read file contents
 */
export async function readFile(filePath: string): Promise<FileContent> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stats = await fs.stat(filePath);
  
  return {
    path: filePath,
    content,
    size: stats.size,
    mtime: stats.mtime,
  };
}

/**
 * Write file contents
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(filePath, content, 'utf-8');
}

/**
 * List files in directory
 */
export async function listFiles(
  dirPath: string,
  options: { recursive?: boolean; pattern?: string } = {}
): Promise<string[]> {
  const { recursive = false, pattern = '*' } = options;
  
  const globPattern = recursive
    ? join(dirPath, '**', pattern)
    : join(dirPath, pattern);
  
  return await glob(globPattern, { nodir: true });
}

/**
 * Search for text in files
 */
export async function searchInFiles(
  dirPath: string,
  searchText: string,
  options: { filePattern?: string; caseSensitive?: boolean } = {}
): Promise<SearchResult[]> {
  const { filePattern = '**/*.{ts,tsx,js,jsx,json}', caseSensitive = false } = options;
  
  const files = await glob(join(dirPath, filePattern), { nodir: true });
  const results: SearchResult[] = [];
  
  const regex = new RegExp(
    searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    caseSensitive ? 'g' : 'gi'
  );
  
  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        const matches = line.match(regex);
        if (matches) {
          results.push({
            path: file,
            line: index + 1,
            content: line.trim(),
            match: matches[0],
          });
        }
      });
    } catch (err) {
      // Skip files that can't be read
      console.warn(`Cannot read file ${file}:`, err);
    }
  }
  
  return results;
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete file
 */
export async function deleteFile(filePath: string): Promise<void> {
  await fs.unlink(filePath);
}

/**
 * Copy file
 */
export async function copyFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const dir = dirname(destPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.copyFile(sourcePath, destPath);
}

/**
 * Move/rename file
 */
export async function moveFile(
  sourcePath: string,
  destPath: string
): Promise<void> {
  const dir = dirname(destPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.rename(sourcePath, destPath);
}

/**
 * Get file info
 */
export async function getFileInfo(filePath: string): Promise<{
  path: string;
  name: string;
  extension: string;
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
}> {
  const stats = await fs.stat(filePath);
  
  return {
    path: filePath,
    name: basename(filePath),
    extension: extname(filePath),
    size: stats.size,
    created: stats.birthtime,
    modified: stats.mtime,
    isDirectory: stats.isDirectory(),
  };
}

/**
 * Create directory
 */
export async function createDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

/**
 * Read directory
 */
export async function readDirectory(dirPath: string): Promise<string[]> {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries.map(entry => entry.name);
}

