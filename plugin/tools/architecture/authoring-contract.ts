'use strict';

const fs = require('fs');
const path = require('path');
const { errorMessage } = require('../core/errors.ts');
const {
  WORKSPACE_ROOT,
  loadPolicy,
  repositoryRoot,
  validatePolicy,
} = require('./authoring-policy.ts');

const PLUGIN_ROOT = path.join(WORKSPACE_ROOT, 'plugin');

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
  'docs/briefs/README.md',
  'plugin/.oxlintrc.json',
  'plugin/manifest.json',
  'plugin/package.json',
  'plugin/tsconfig.json',
  'plugin/ui.html',
  'plugin/src/kit/public.ts',
  'plugin/src/kit/foundations/motion.ts',
  'plugin/src/fixtures/public.ts',
  'plugin/src/designs/catalog.ts',
  'plugin/src/plugin/entry.ts',
  'plugin/src/plugin/harness-api.ts',
  'plugin/tools/architecture/tooling-hygiene.ts',
  'plugin/tools/architecture/check-flow-contract.ts',
  'plugin/tools/runtime/harness/rules/flow-contract.ts',
];

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

export function validateAuthoringContract(): string[] {
  const issues: string[] = [];
  for (const relative of REQUIRED_FILES) {
    if (!fs.existsSync(path.join(WORKSPACE_ROOT, relative))) issues.push('required file is missing: ' + relative);
  }

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
    for (const mode of ['PAGE_AUTHORING', 'DESIGN_EXPLORATION']) {
      const allowed = (policy.modes[mode] && policy.modes[mode].allowed) || [];
      if (!allowed.includes('plugin/src/designs/catalog.ts')) {
        issues.push(mode + ' must allow the TypeScript design catalog');
      }
    }
  } catch (error) {
    issues.push('authoring policy cannot be read: ' + errorMessage(error));
  }

  const packageFile = path.join(PLUGIN_ROOT, 'package.json');
  if (fs.existsSync(packageFile)) {
    const scripts = (JSON.parse(read(packageFile)) as {
      scripts?: Record<string, string>;
    }).scripts || {};
    for (const name of [
      'build', 'build:check', 'guard', 'guard:architecture', 'guard:authoring',
      'guard:flows', 'guard:hygiene', 'guard:scope', 'lint', 'render:fonts:check', 'smoke:figma:preflight',
      'test', 'typecheck', 'verify',
    ]) {
      if (!scripts[name]) issues.push('package script is missing: ' + name);
    }
    if (!scripts['guard'] || !scripts['guard'].includes('npm run guard:flows')) {
      issues.push('guard must execute: npm run guard:flows');
    }
    for (const command of [
      'npm run guard', 'npm run build:check', 'npm run lint', 'npm run typecheck',
      'npm run render:fonts:check', 'npm test', 'npm run audit', 'npm run design:check',
      'npm run design:components:check',
    ]) {
      if (!scripts['verify'] || !scripts['verify'].includes(command)) {
        issues.push('verify must execute: ' + command);
      }
    }
    if (scripts['verify'] && scripts['verify'].includes('tools/color/experiments/')) {
      issues.push('verify must not execute exploratory colour tools');
    }
  }

  const entryFile = path.join(PLUGIN_ROOT, 'src', 'plugin', 'entry.ts');
  if (fs.existsSync(entryFile) && !read(entryFile).includes("export { HARNESS_API } from './harness-api.ts'")) {
    issues.push('plugin entry must export the explicit HARNESS_API');
  }

  const harnessFile = path.join(PLUGIN_ROOT, 'tools', 'runtime', 'harness.ts');
  if (!fs.existsSync(harnessFile) || !read(harnessFile).includes('.HARNESS_API')) {
    issues.push('offline harness must consume the bundle HARNESS_API');
  }

  if (!workflowSources(repository).some((source) => source.includes('npm run verify'))) {
    issues.push('a GitHub Actions workflow must execute npm run verify');
  }

  return issues.sort();
}

module.exports = {
  AUTHORING_MARKER,
  REQUIRED_FILES,
  ROUTER_MARKER,
  validateAuthoringContract,
};
