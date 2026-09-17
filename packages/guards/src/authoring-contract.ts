'use strict';

import {
  appDesignSystem,
  readConfig,
  workspacePackages,
  type WorkspacePackage,
} from '@figma-harness/harness/core/workspace.ts';

const fs = require('fs');
const path = require('path');
const { errorMessage } = require('@figma-harness/harness/core/errors.ts');
const {
  WORKSPACE_ROOT,
  loadPolicy,
  pathMatches,
  repositoryRoot,
  validatePolicy,
} = require('./authoring-policy.ts');

/** Marker proving that AGENTS.md is the workspace authoring entry point. */
export const AUTHORING_MARKER = 'FIGMA_HARNESS_AUTHORING_CONTRACT_V1';
/** Marker a parent repository's AGENTS.md carries when it routes to a nested workspace. */
export const ROUTER_MARKER = 'FIGMA_HARNESS_AGENT_ROUTER_V1';

export const REQUIRED_FILES = [
  'AGENTS.md',
  'docs/ia/README.md',
  'docs/ia/AUTHORING_CONTRACT.md',
  'docs/ia/ARCHITECTURE_BOUNDARIES.md',
  'docs/ia/PAGE_WORKFLOW.md',
  'docs/ia/DESIGN_SYSTEM_WORKFLOW.md',
  'docs/ia/ACCEPTANCE_GATES.md',
  'docs/ia/authoring-policy.json',
  'docs/ia/templates/PAGE_BRIEF.md',
  'docs/ia/templates/DESIGN_SYSTEM_CHANGE.md',
  '.oxlintrc.json',
  'figma-harness.config.json',
  'package.json',
  'pnpm-workspace.yaml',
  'tsconfig.json',
  'packages/contract/src/index.ts',
  'packages/engine/src/index.ts',
  'packages/guards/src/check-flow-contract.ts',
  'packages/guards/src/tooling-hygiene.ts',
  'packages/harness/src/runtime/harness.ts',
  'packages/harness/src/runtime/rules/flow-contract.ts',
];

/* Files every design system, app and the plugin must provide. */
const ROLE_FILES: Readonly<Record<string, readonly string[]>> = Object.freeze({
  app: ['src/index.ts', 'src/screens.ts', 'src/fixtures/index.ts', 'src/lab/index.ts', 'docs/briefs/README.md'],
  'design-system': ['src/index.ts', 'src/system.ts', 'design-system.json', 'README.md'],
  plugin: ['manifest.json', 'ui.html', 'src/entry.ts', 'src/composition.ts', 'src/harness-api.ts'],
});

const ACTIVE_INSTRUCTION_FILES = [
  'AGENTS.md',
  'CLAUDE.md',
  'docs/ia/README.md',
  'docs/ia/AUTHORING_CONTRACT.md',
  'docs/ia/ARCHITECTURE_BOUNDARIES.md',
  'docs/ia/PAGE_WORKFLOW.md',
  'docs/ia/DESIGN_SYSTEM_WORKFLOW.md',
  'docs/ia/ACCEPTANCE_GATES.md',
];

function read(filename: string): string {
  return fs.readFileSync(filename, 'utf8');
}

function workflowSources(repository: string): string[] {
  const directory = path.join(repository, '.github', 'workflows');
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name: string) => /\.ya?ml$/.test(name))
    .sort()
    .map((name: string) => read(path.join(directory, name)));
}

function workspaceIssues(issues: string[]): WorkspacePackage[] {
  let packages: WorkspacePackage[] = [];
  try {
    packages = workspacePackages(WORKSPACE_ROOT);
  } catch (error) {
    issues.push(errorMessage(error));
    return packages;
  }
  for (const entry of packages) {
    for (const relative of ROLE_FILES[entry.role] || []) {
      if (!fs.existsSync(path.join(entry.dir, relative))) {
        issues.push(entry.role + ' ' + entry.name + ' is missing ' + relative);
      }
    }
  }
  try {
    const config = readConfig(WORKSPACE_ROOT);
    const byPath = new Map(packages.map((entry) => [entry.relative, entry]));
    const plugin = byPath.get(config.plugin);
    const app = byPath.get(config.app);
    if (!plugin || plugin.role !== 'plugin') issues.push('figma-harness.config.json must name the plugin package');
    if (!app || app.role !== 'app') issues.push('figma-harness.config.json must name an app package');
    for (const dependency of Object.keys(plugin?.manifest.dependencies || {})) {
      const target = packages.find((entry) => entry.name === dependency);
      if (target && (target.role === 'app' || target.role === 'design-system')) {
        issues.push('the plugin must reach ' + dependency + ' through the active composition, not a dependency');
      }
    }
  } catch (error) {
    issues.push(errorMessage(error));
  }
  for (const app of packages.filter((entry) => entry.role === 'app')) {
    try {
      // Templates are copied, so only the app template may use the design system template.
      if (appDesignSystem(app, WORKSPACE_ROOT).template && !app.template) {
        issues.push(app.name + ' is built with the design system template; build it with a design system of its own');
      }
    } catch (error) {
      issues.push(errorMessage(error));
    }
  }
  // The app template runs on every design system through this vocabulary.
  for (const designSystem of packages.filter((entry) => entry.role === 'design-system')) {
    const facade = path.join(designSystem.dir, 'src', 'index.ts');
    if (fs.existsSync(facade) && !/^export\s*\{[^}]*\bstarter\b[^}]*\}\s*from\s*'[^']+';$/m.test(read(facade))) {
      issues.push(designSystem.name + ' must export the starter vocabulary from src/index.ts');
    }
  }
  return packages;
}

export function validateAuthoringContract(): string[] {
  const issues: string[] = [];
  for (const relative of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(WORKSPACE_ROOT, relative))) issues.push('required file is missing: ' + relative);
  }
  const packages = workspaceIssues(issues);

  const repository = repositoryRoot();
  if (repository !== fs.realpathSync(WORKSPACE_ROOT)) {
    const repositoryAgents = path.join(repository, 'AGENTS.md');
    if (!fs.existsSync(repositoryAgents)) issues.push('repository AGENTS.md router is missing');
    else if (!read(repositoryAgents).includes(ROUTER_MARKER)) {
      issues.push('repository AGENTS.md is missing the ' + ROUTER_MARKER + ' router marker');
    }
  }

  const scopedAgents = path.join(WORKSPACE_ROOT, 'AGENTS.md');
  if (fs.existsSync(scopedAgents)) {
    const source = read(scopedAgents);
    if (!source.includes(AUTHORING_MARKER)) {
      issues.push('AGENTS.md is missing the ' + AUTHORING_MARKER + ' marker');
    }
    if (!source.includes('docs/ia/README.md')) issues.push('AGENTS.md does not route to docs/ia/README.md');
    if (!source.includes('PAGE_AUTHORING')) issues.push('AGENTS.md does not declare the safe default mode');
  }

  for (const relative of ACTIVE_INSTRUCTION_FILES) {
    const filename = path.join(WORKSPACE_ROOT, relative);
    if (!fs.existsSync(filename)) continue;
    const source = read(filename).replace(/code\.js/g, '').replace(/Node\.js/g, '');
    const legacyPaths = source.match(/(?:[\w.-]+\/)*[\w.-]+\.js\b/g) || [];
    for (const legacyPath of [...new Set(legacyPaths)]) {
      issues.push(relative + ': stale JavaScript source path: ' + legacyPath);
    }
  }

  try {
    const policy = loadPolicy();
    issues.push(...validatePolicy(policy));
    const allows = (mode: string, filename: string): boolean =>
      ((policy.modes[mode] && policy.modes[mode].allowed) || []).some((pattern: string) => pathMatches(filename, pattern));
    // Templates are copied, never authored in place.
    for (const app of packages.filter((entry) => entry.role === 'app' && !entry.template)) {
      if (!allows('PAGE_AUTHORING', app.relative + '/src/screens.ts')) {
        issues.push('PAGE_AUTHORING must allow the screen registry of ' + app.name);
      }
      if (!allows('DESIGN_EXPLORATION', app.relative + '/src/lab/index.ts')) {
        issues.push('DESIGN_EXPLORATION must allow the Design lab registry of ' + app.name);
      }
      if (allows('PAGE_AUTHORING', app.relative + '/src/index.ts')) {
        issues.push('PAGE_AUTHORING must not change the app definition of ' + app.name);
      }
    }
  } catch (error) {
    issues.push('authoring policy cannot be read: ' + errorMessage(error));
  }

  const packageFile = path.join(WORKSPACE_ROOT, 'package.json');
  if (fs.existsSync(packageFile)) {
    const scripts = (JSON.parse(read(packageFile)) as {
      scripts?: Record<string, string>;
    }).scripts || {};
    for (const name of [
      'build', 'build:check', 'check:generated', 'create:app', 'create:design-system', 'each',
      'guard', 'guard:architecture', 'guard:authoring', 'guard:flows', 'guard:hygiene', 'guard:scope',
      'lint', 'render:fonts:check', 'smoke:figma:preflight', 'test', 'typecheck', 'use', 'verify',
    ]) {
      if (!scripts[name]) issues.push('package script is missing: ' + name);
    }
    if (!scripts['guard'] || !scripts['guard'].includes('pnpm run guard:flows')) {
      issues.push('guard must execute: pnpm run guard:flows');
    }
    // Checks that read a composition run once per app, and for the app template on every design system.
    for (const command of [
      'pnpm run guard', 'pnpm run build:check', 'pnpm run check:generated', 'pnpm run lint', 'pnpm run typecheck',
      'pnpm test', 'pnpm run each render:fonts:check', 'pnpm run each audit ', 'pnpm run each audit:contrast',
      'pnpm run each audit:a11y', 'pnpm run each audit:theme', 'pnpm run each design:check',
      'pnpm run each design:components:check',
    ]) {
      if (!scripts['verify'] || !scripts['verify'].includes(command)) {
        issues.push('verify must execute: ' + command);
      }
    }
    if (scripts['verify'] && scripts['verify'].includes('/experiments/')) {
      issues.push('verify must not execute exploratory colour tools');
    }
  }

  const plugin = packages.find((entry) => entry.role === 'plugin');
  const entryFile = plugin ? path.join(plugin.dir, 'src', 'entry.ts') : '';
  if (entryFile && fs.existsSync(entryFile) && !read(entryFile).includes("export { HARNESS_API } from './harness-api.ts'")) {
    issues.push('plugin entry must export the explicit HARNESS_API');
  }

  const harnessFile = path.join(WORKSPACE_ROOT, 'packages', 'harness', 'src', 'runtime', 'harness.ts');
  if (!fs.existsSync(harnessFile) || !read(harnessFile).includes('.HARNESS_API')) {
    issues.push('offline harness must consume the bundle HARNESS_API');
  }

  if (!workflowSources(repository).some((source) => /pnpm (run )?verify\b/.test(source))) {
    issues.push('a GitHub Actions workflow must execute pnpm verify');
  }

  return issues.sort();
}

module.exports = {
  AUTHORING_MARKER,
  REQUIRED_FILES,
  ROUTER_MARKER,
  validateAuthoringContract,
};
