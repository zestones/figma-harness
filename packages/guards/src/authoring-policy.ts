'use strict';

import { repositoryRoot as workspaceRoot } from '@figma-harness/harness/core/workspace.ts';

const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

/** The figma-harness workspace: the directory holding figma-harness.config.json. */
export const WORKSPACE_ROOT = workspaceRoot();
export const POLICY_FILE = path.join(WORKSPACE_ROOT, 'docs', 'ia', 'authoring-policy.json');
/* Repository-level files that govern the workspace when it is nested inside a
 * larger repository. A standalone workspace already contains them. */
const REPOSITORY_GUARD_PATHS = [
  'AGENTS.md',
  '.github/workflows',
];
export const REQUIRED_MODES = [
  'PAGE_AUTHORING',
  'DESIGN_SYSTEM_CHANGE',
  'DESIGN_EXPLORATION',
  'STRUCTURAL_MAINTENANCE',
  'BASELINE_ACCEPTANCE',
] as const;

export type AuthoringMode = typeof REQUIRED_MODES[number];

export interface ModePolicy {
  allowed: string[];
  requiresExplicitHumanApproval?: boolean;
}

export interface AuthoringPolicy {
  baselinePaths: string[];
  defaultMode: AuthoringMode;
  ignoredPaths: string[];
  modes: Record<AuthoringMode, ModePolicy>;
  version: number;
}

let cachedRepositoryRoot: string | null = null;

/** The git top level; the workspace itself when it is not inside a repository. */
export function repositoryRoot(): string {
  if (cachedRepositoryRoot === null) {
    let root = WORKSPACE_ROOT;
    try {
      root = childProcess.execFileSync(
        'git',
        ['rev-parse', '--show-toplevel'],
        { cwd: WORKSPACE_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim() || WORKSPACE_ROOT;
    } catch {
      root = WORKSPACE_ROOT;
    }
    cachedRepositoryRoot = fs.realpathSync(root) as string;
  }
  return cachedRepositoryRoot!;
}

/** The workspace location inside its repository, with a trailing slash, or ''. */
export function workspacePrefix(): string {
  const relative = path.relative(repositoryRoot(), fs.realpathSync(WORKSPACE_ROOT))
    .split(path.sep).join('/');
  return relative ? relative + '/' : '';
}

export function normalizePath(value: string): string {
  let normalized = value.replace(/\\/g, '/').replace(/^\.\//, '');
  const prefix = workspacePrefix();
  if (prefix && normalized.startsWith(prefix)) normalized = normalized.slice(prefix.length);
  return normalized.replace(/\/$/, '');
}

/* A pattern is an exact path or a prefix ending in "/**"; a "*" segment
   matches any single directory name. */
const segmentsMatch = function (candidate: readonly string[], pattern: readonly string[]): boolean {
  return candidate.length === pattern.length
    && pattern.every((segment, index) => segment === '*' || segment === candidate[index]);
};

export function pathMatches(filename: string, pattern: string): boolean {
  const candidate = normalizePath(filename).split('/');
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3).split('/');
    return candidate.length >= prefix.length && segmentsMatch(candidate.slice(0, prefix.length), prefix);
  }
  return segmentsMatch(candidate, normalizedPattern.split('/'));
}

export function loadPolicy(filename?: string): AuthoringPolicy {
  return JSON.parse(fs.readFileSync(filename || POLICY_FILE, 'utf8')) as AuthoringPolicy;
}

export function validatePolicy(policy: AuthoringPolicy): string[] {
  const issues: string[] = [];
  if (!policy || policy.version !== 1) issues.push('policy version must be 1');
  if (!policy || typeof policy.defaultMode !== 'string') issues.push('defaultMode is required');
  if (!policy || !policy.modes || typeof policy.modes !== 'object') {
    issues.push('modes object is required');
    return issues;
  }
  for (const mode of REQUIRED_MODES) {
    if (!policy.modes[mode]) issues.push('required mode is missing: ' + mode);
    else if (!Array.isArray(policy.modes[mode].allowed) || !policy.modes[mode].allowed.length) {
      issues.push(mode + '.allowed must be a non-empty array');
    }
  }
  if (!policy.modes[policy.defaultMode]) issues.push('defaultMode is not declared in modes');
  if (policy.defaultMode !== 'PAGE_AUTHORING') issues.push('PAGE_AUTHORING must remain the safe default');
  if (!Array.isArray(policy.baselinePaths) || policy.baselinePaths.length !== 2) {
    issues.push('the two signature baseline paths must be declared');
  }
  if (!Array.isArray(policy.ignoredPaths)) issues.push('ignoredPaths must be an array');
  if (
    policy.modes.BASELINE_ACCEPTANCE
    && policy.modes.BASELINE_ACCEPTANCE.requiresExplicitHumanApproval !== true
  ) {
    issues.push('BASELINE_ACCEPTANCE must require explicit human approval');
  }
  const patterns = [
    ...(policy.baselinePaths || []),
    ...(policy.ignoredPaths || []),
    ...Object.values(policy.modes as Record<string, { allowed?: string[] }>)
      .flatMap((definition) => definition.allowed || []),
  ];
  for (const pattern of patterns) {
    if (typeof pattern !== 'string' || !pattern || pattern.startsWith('/') || pattern.includes('..')) {
      issues.push('unsafe or invalid path pattern: ' + String(pattern));
    }
  }
  return issues;
}

export function validateChangedPaths(
  paths: readonly string[],
  mode?: string,
  policy?: AuthoringPolicy,
): string[] {
  const activePolicy = policy || loadPolicy();
  const selectedMode = mode || activePolicy.defaultMode;
  if (!REQUIRED_MODES.includes(selectedMode as AuthoringMode)) {
    return ['unknown authoring mode: ' + selectedMode];
  }
  const definition = activePolicy.modes[selectedMode as AuthoringMode];
  const issues: string[] = [];
  for (const raw of [...new Set(paths)]) {
    const filename = normalizePath(raw);
    if (!filename || (activePolicy.ignoredPaths || []).some((pattern) => pathMatches(filename, pattern))) continue;
    const baseline = (activePolicy.baselinePaths || []).some((pattern) => pathMatches(filename, pattern));
    if (baseline && selectedMode !== 'BASELINE_ACCEPTANCE') {
      issues.push(filename + ': baseline changes require BASELINE_ACCEPTANCE');
      continue;
    }
    if (!definition.allowed.some((pattern) => pathMatches(filename, pattern))) {
      issues.push(filename + ': outside ' + selectedMode + ' write scope');
    }
  }
  return issues.sort();
}

function parseNameStatus(buffer: string): string[] {
  const fields = buffer.split('\0');
  const paths: string[] = [];
  for (let index = 0; index < fields.length;) {
    const status = fields[index++];
    if (!status) break;
    const first = fields[index++];
    if (!first) continue;
    paths.push(first);
    if (status.startsWith('R') || status.startsWith('C')) {
      const second = fields[index++];
      if (second) paths.push(second);
    }
  }
  return paths;
}

export function changedPaths(base?: string): string[] {
  const comparison = base || 'HEAD';
  const root = repositoryRoot();
  const prefix = workspacePrefix();
  const pathspecs = prefix ? [...REPOSITORY_GUARD_PATHS, prefix.slice(0, -1)] : ['.'];
  const tracked = childProcess.execFileSync(
    'git',
    ['diff', '--name-status', '-z', comparison, '--', ...pathspecs],
    { cwd: root, encoding: 'utf8' },
  );
  const untracked = childProcess.execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard', '-z', '--', ...pathspecs],
    { cwd: root, encoding: 'utf8' },
  ).split('\0').filter(Boolean);
  return [...new Set(parseNameStatus(tracked).concat(untracked))].sort();
}

module.exports = {
  POLICY_FILE,
  REQUIRED_MODES,
  WORKSPACE_ROOT,
  changedPaths,
  loadPolicy,
  normalizePath,
  pathMatches,
  repositoryRoot,
  validateChangedPaths,
  validatePolicy,
  workspacePrefix,
};
