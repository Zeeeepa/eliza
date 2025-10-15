/**
 * Git Operations Actions Module
 * Provides git operations for agents
 */

import { simpleGit, SimpleGit, StatusResult, DiffResult } from 'simple-git';

let git: SimpleGit;

/**
 * Initialize git client
 */
export function initGit(repoPath: string = process.cwd()): void {
  git = simpleGit(repoPath);
}

/**
 * Get git status
 */
export async function gitStatus(): Promise<StatusResult> {
  if (!git) initGit();
  return await git.status();
}

/**
 * Get git diff
 */
export async function gitDiff(options: {
  cached?: boolean;
  file?: string;
} = {}): Promise<string> {
  if (!git) initGit();
  
  const args: string[] = [];
  if (options.cached) args.push('--cached');
  if (options.file) args.push(options.file);
  
  return await git.diff(args);
}

/**
 * Get git log
 */
export async function gitLog(options: {
  maxCount?: number;
  file?: string;
} = {}): Promise<Array<{
  hash: string;
  date: string;
  message: string;
  author_name: string;
  author_email: string;
}>> {
  if (!git) initGit();
  
  const logOptions: any = {
    maxCount: options.maxCount || 10,
  };
  
  if (options.file) {
    logOptions.file = options.file;
  }
  
  const log = await git.log(logOptions);
  
  return log.all.map(commit => ({
    hash: commit.hash,
    date: commit.date,
    message: commit.message,
    author_name: commit.author_name,
    author_email: commit.author_email,
  }));
}

/**
 * Stage files
 */
export async function gitAdd(files: string | string[]): Promise<void> {
  if (!git) initGit();
  await git.add(files);
}

/**
 * Commit changes
 */
export async function gitCommit(
  message: string,
  options: { all?: boolean } = {}
): Promise<string> {
  if (!git) initGit();
  
  const commitOptions: string[] = ['-m', message];
  if (options.all) commitOptions.push('-a');
  
  const result = await git.commit(message, options.all ? ['-a'] : []);
  return result.commit;
}

/**
 * Create new branch
 */
export async function gitCreateBranch(
  branchName: string,
  checkout: boolean = true
): Promise<void> {
  if (!git) initGit();
  
  if (checkout) {
    await git.checkoutLocalBranch(branchName);
  } else {
    await git.branch([branchName]);
  }
}

/**
 * Checkout branch
 */
export async function gitCheckout(branchName: string): Promise<void> {
  if (!git) initGit();
  await git.checkout(branchName);
}

/**
 * List branches
 */
export async function gitListBranches(): Promise<{
  current: string;
  all: string[];
}> {
  if (!git) initGit();
  const branches = await git.branch();
  
  return {
    current: branches.current,
    all: branches.all,
  };
}

/**
 * Pull changes
 */
export async function gitPull(
  remote: string = 'origin',
  branch?: string
): Promise<void> {
  if (!git) initGit();
  await git.pull(remote, branch);
}

/**
 * Push changes
 */
export async function gitPush(
  remote: string = 'origin',
  branch?: string
): Promise<void> {
  if (!git) initGit();
  await git.push(remote, branch);
}

/**
 * Get current branch
 */
export async function gitCurrentBranch(): Promise<string> {
  if (!git) initGit();
  const branches = await git.branch();
  return branches.current;
}

/**
 * Get remote URL
 */
export async function gitRemoteUrl(remote: string = 'origin'): Promise<string> {
  if (!git) initGit();
  const remotes = await git.getRemotes(true);
  const remoteObj = remotes.find(r => r.name === remote);
  return remoteObj?.refs?.fetch || '';
}

/**
 * Check if repo has uncommitted changes
 */
export async function gitHasChanges(): Promise<boolean> {
  if (!git) initGit();
  const status = await git.status();
  return !status.isClean();
}

/**
 * Get list of changed files
 */
export async function gitChangedFiles(): Promise<{
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: string[];
}> {
  if (!git) initGit();
  const status = await git.status();
  
  return {
    modified: status.modified,
    added: status.created,
    deleted: status.deleted,
    renamed: status.renamed.map(r => r.to),
  };
}

/**
 * Stash changes
 */
export async function gitStash(message?: string): Promise<void> {
  if (!git) initGit();
  const args = ['push'];
  if (message) args.push('-m', message);
  await git.stash(args);
}

/**
 * Apply stash
 */
export async function gitStashPop(): Promise<void> {
  if (!git) initGit();
  await git.stash(['pop']);
}

/**
 * Show file at specific commit
 */
export async function gitShowFile(
  commitHash: string,
  filePath: string
): Promise<string> {
  if (!git) initGit();
  return await git.show([`${commitHash}:${filePath}`]);
}

