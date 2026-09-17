'use strict';

import type { SourceGraphViolation } from '../src/boundaries.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const fs: typeof import('node:fs') = require('node:fs');
const os: typeof import('node:os') = require('node:os');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');

const {
  classifySource,
  findCycles,
  isBoundaryAllowed,
  validateSourceGraph,
} = require('../src/boundaries.ts') as typeof import('../src/boundaries.ts');
const { validateAuthoringContract } = require('../src/authoring-contract.ts') as typeof import('../src/authoring-contract.ts');
const { validateToolingHygiene } = require('../src/tooling-hygiene.ts') as typeof import('../src/tooling-hygiene.ts');
const {
  loadPolicy,
  pathMatches,
  validateChangedPaths,
  validatePolicy,
} = require('../src/authoring-policy.ts') as typeof import('../src/authoring-policy.ts');

/* A throwaway workspace with the same conventions as this repository. */
const miniWorkspace = function (files: Record<string, string>): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-harness-guards-'));
  const all: Record<string, string> = {
    'figma-harness.config.json': JSON.stringify({ plugin: 'plugin', app: 'apps/demo', renders: 'renders' }),
    'pnpm-workspace.yaml': 'packages:\n  - packages/*\n  - design-systems/*\n  - apps/*\n  - plugin\n',
    'package.json': JSON.stringify({ name: 'mini', scripts: {} }),
    ...files,
  };
  for (const [relative, content] of Object.entries(all)) {
    const filename = path.join(root, relative);
    fs.mkdirSync(path.dirname(filename), { recursive: true });
    fs.writeFileSync(filename, content);
  }
  return root;
};

const manifest = function (name: string, role: string, extra: Record<string, unknown> = {}): string {
  return JSON.stringify({ name, figmaHarness: { role }, ...extra });
};

test('the checked-in source graph respects every authoring boundary', () => {
  const report = validateSourceGraph();
  assert.equal(report.violations.length, 0, JSON.stringify(report.violations, null, 2));
  assert.ok(report.files >= 70);
});

test('every tool is reachable and non-trivial function bodies are unique', () => {
  const report = validateToolingHygiene();
  assert.equal(report.violations.length, 0, JSON.stringify(report.violations, null, 2));
  assert.ok(report.toolFiles >= 60);
  assert.ok(report.cloneCandidates > 100);
});

test('apps use the design system\'s facade and cannot reach its internals or the engine', () => {
  assert.equal(classifySource('design-system', 'components/button.ts'), 'component');
  assert.equal(classifySource('design-system', 'index.ts'), 'facade');
  assert.equal(classifySource('design-system', 'system.ts'), 'system');
  assert.equal(classifySource('app', 'fixtures/index.ts'), 'fixture-facade');
  assert.equal(classifySource('app', 'pages/overview.ts'), 'design');
  assert.equal(classifySource('design-system', 'misc/helper.ts'), null);
  assert.equal(isBoundaryAllowed('design', 'facade', true), true);
  assert.equal(isBoundaryAllowed('design', 'fixture-facade', false), true);
  assert.equal(isBoundaryAllowed('design', 'fixture', false), false);
  assert.equal(isBoundaryAllowed('design', 'component', true), false);
  assert.equal(isBoundaryAllowed('design', 'engine', true), false);
  assert.equal(isBoundaryAllowed('design', 'system', true), false);
  assert.equal(isBoundaryAllowed('engine', 'design', true), false);
  assert.equal(isBoundaryAllowed('sheet', 'component', false), false);
  assert.equal(isBoundaryAllowed('plugin', 'system', true), true);
  assert.equal(isBoundaryAllowed('plugin', 'app-entry', true), true);
  assert.equal(isBoundaryAllowed('plugin', 'design', true), false);
});

test('tool reachability recognizes bounded Node entry points and reports missing targets', () => {
  const root = miniWorkspace({
    'packages/tools/package.json': manifest('@mini/tools', 'tooling'),
    'packages/tools/src/runner.ts': 'export const ready = true;\n',
  });
  try {
    for (const command of [
      'tsx packages/tools/src/runner.ts',
      'node --max-old-space-size=128 --import tsx packages/tools/src/runner.ts',
      'node --import=tsx packages/tools/src/runner.ts',
    ]) {
      fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'mini', scripts: { check: command } }));
      assert.deepEqual(validateToolingHygiene({ root }).violations, [], command);
    }
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ name: 'mini', scripts: {
      check: 'node --import tsx packages/tools/src/missing.ts',
    } }));
    const report = validateToolingHygiene({ root });
    assert.ok(report.violations.some(issue => issue.message.includes('missing tool packages/tools/src/missing.ts')));
    assert.ok(report.violations.some(issue => issue.file === 'packages/tools/src/runner.ts'
      && issue.message.includes('unreachable')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('tooling may not import product source; tests may', () => {
  const root = miniWorkspace({
    'package.json': JSON.stringify({ name: 'mini', scripts: { check: 'tsx packages/tools/src/runner.ts' } }),
    'packages/tools/package.json': manifest('@mini/tools', 'tooling'),
    'packages/tools/src/runner.ts': "import { engine } from '../../engine/src/index.ts';\nexport { engine };\n",
    'packages/engine/package.json': manifest('@mini/engine', 'engine', { exports: { '.': './src/index.ts' } }),
    'packages/engine/src/index.ts': 'export const engine = true;\n',
    'packages/engine/tests/engine.test.ts': "import { engine } from '../src/index.ts';\nexport { engine };\n",
  });
  try {
    const violations = validateToolingHygiene({ root }).violations;
    assert.deepEqual(violations.map((issue) => issue.file), ['packages/tools/src/runner.ts']);
    assert.match(violations[0].message, /never by importing packages\/engine\/src\/index\.ts/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a function body may repeat across apps or across design systems, nowhere else', () => {
  const body = [
    'export function describe(value: string): string {',
    '  const words = value.split(" ").filter(Boolean);',
    '  const titled = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1));',
    '  return titled.join(" ") + " (" + words.length + " words, " + value.length + " characters)";',
    '}',
    '',
  ].join('\n');
  const root = miniWorkspace({
    'design-systems/kit/package.json': manifest('@mini/kit', 'design-system'),
    'design-systems/kit/src/index.ts': body,
    'design-systems/copy/package.json': manifest('@mini/copy', 'design-system'),
    'design-systems/copy/src/index.ts': body,
  });
  const clones = (): string[] => validateToolingHygiene({ root }).violations
    .filter((issue) => issue.message.includes('clone'))
    .map((issue) => issue.message);
  try {
    assert.deepEqual(validateToolingHygiene({ root }).violations, []);
    // Twice in one package.
    fs.writeFileSync(path.join(root, 'design-systems/kit/src/again.ts'), body.replace('describe', 'describeAgain'));
    assert.equal(clones().length, 1);
    assert.match(clones()[0], /design-systems\/kit\/src\/again\.ts/);
    fs.rmSync(path.join(root, 'design-systems/kit/src/again.ts'));
    // In an app as well as in a design system.
    fs.mkdirSync(path.join(root, 'apps/demo/src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'apps/demo/package.json'), manifest('@mini/demo', 'app'));
    fs.writeFileSync(path.join(root, 'apps/demo/src/index.ts'), body);
    assert.equal(clones().length, 1);
    assert.match(clones()[0], /apps\/demo\/src\/index\.ts/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the graph validator reports bypasses, undeclared packages and JavaScript sources', () => {
  const root = miniWorkspace({
    'packages/engine/package.json': manifest('@mini/engine', 'engine', { exports: { '.': './src/index.ts' } }),
    'packages/engine/src/index.ts': 'export const mechanics = true;\n',
    'packages/engine/src/legacy.js': 'export const legacy = true;\n',
    'design-systems/kit/package.json': manifest('@mini/kit', 'design-system', {
      exports: { '.': './src/index.ts', './system': './src/system.ts' },
      dependencies: { '@mini/engine': 'workspace:*' },
    }),
    'design-systems/kit/src/index.ts': 'export const kit = true;\n',
    'design-systems/kit/src/system.ts': 'export const system = true;\n',
    'apps/demo/package.json': manifest('@mini/demo', 'app', {
      exports: { '.': './src/index.ts' },
      dependencies: { '@mini/kit': 'workspace:*', '@mini/engine': 'workspace:*' },
    }),
    'apps/demo/src/index.ts': "export { page } from './pages/page.ts';\n",
    'apps/demo/src/pages/page.ts': [
      "import { mechanics } from '../../../../packages/engine/src/index.ts';",
      "import { kit } from '@mini/kit';",
      "import { system } from '@mini/kit/system';",
      "import { engine } from '@mini/engine';",
      "import { plugin } from '@mini/plugin';",
      "import { designSystem } from '@figma-harness/active-design-system';",
      'export const page = [mechanics, kit, system, engine, plugin, designSystem, figma];',
      '',
    ].join('\n'),
    'plugin/package.json': manifest('@mini/figma-plugin', 'plugin'),
    'plugin/src/entry.ts': [
      "import { page } from '@figma-harness/active-app';",
      "import { system } from '@figma-harness/active-design-system';",
      'export const composed = [page, system];',
      '',
    ].join('\n'),
  });
  const link = (from: string, name: string, to: string): void => {
    const target = path.join(root, from, 'node_modules', name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.symlinkSync(path.join(root, to), target);
  };
  try {
    link('apps/demo', '@mini/kit', 'design-systems/kit');
    link('apps/demo', '@mini/engine', 'packages/engine');
    const messages = validateSourceGraph({ root }).violations.map((issue: SourceGraphViolation) =>
      issue.file + ': ' + issue.message);
    assert.ok(messages.includes('packages/engine/src/legacy.js: product source must be TypeScript; .js is reserved for the generated plugin bundle'));
    assert.ok(messages.some((message) => message.includes('a relative import may not leave its package')));
    assert.ok(messages.some((message) => message.includes('design may not import design-systems/kit/src/system.ts (system in @mini/kit)')));
    assert.ok(messages.some((message) => message.includes('design may not import packages/engine/src/index.ts (engine in @mini/engine)')));
    assert.ok(messages.some((message) => message.includes('product source may import only its own modules and workspace packages: @mini/plugin')));
    assert.ok(messages.some((message) => message.includes('must not access the global Figma runtime')));
    assert.ok(messages.includes('apps/demo/src/pages/page.ts: only the plugin composes the active app and design system: @figma-harness/active-design-system'));
    // The plugin reaches the configured app and its design system through the build aliases.
    assert.equal(messages.some((message) => message.startsWith('plugin/')), false, messages.join('\n'));
    assert.equal(messages.some((message) => message.includes("'@mini/kit'") || message.endsWith('(facade in @mini/kit)')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('dependency cycles are canonicalized and reported once', () => {
  const cycles = findCycles(new Map([
    ['a.ts', new Set(['b.ts'])],
    ['b.ts', new Set(['c.ts'])],
    ['c.ts', new Set(['a.ts'])],
  ]));
  assert.deepEqual(cycles, ['a.ts -> b.ts -> c.ts -> a.ts']);
});

test('the authoring policy protects task scope and baselines', () => {
  const policy = loadPolicy();
  assert.deepEqual(validatePolicy(policy), []);
  assert.equal(pathMatches('apps/relay/src/pages/new-page.ts', 'apps/*/src/pages/**'), true);
  assert.equal(pathMatches('apps/relay/src/pages', 'apps/*/src/pages/**'), true);
  assert.equal(pathMatches('apps/relay/src/pagesx/a.ts', 'apps/*/src/pages/**'), false);
  assert.equal(pathMatches('apps/relay/src/screens.ts', 'apps/*/src/screens.ts'), true);
  assert.deepEqual(validateChangedPaths([
    'apps/relay/docs/briefs/new-page.md',
    'apps/relay/src/pages/new-page.ts',
    'apps/relay/src/screens.ts',
    'plugin/code.js',
  ], 'PAGE_AUTHORING', policy), []);
  for (const protectedPath of [
    'design-systems/primer/src/components/button.ts',
    'apps/relay/src/index.ts',
    'apps/relay/src/signatures.ts',
    'plugin/src/document/contract.ts',
    '.github/workflows/ci.yml',
  ]) {
    assert.match(
      validateChangedPaths([protectedPath], 'PAGE_AUTHORING', policy)[0],
      /outside PAGE_AUTHORING write scope/,
      protectedPath,
    );
  }
  assert.deepEqual(validateChangedPaths([
    'design-systems/primer/generators/tokens/catalog.ts',
    'pnpm-lock.yaml',
  ], 'DESIGN_SYSTEM_CHANGE', policy), []);
  assert.deepEqual(validateChangedPaths([
    '.github/workflows/ci.yml',
    'AGENTS.md',
    'packages/harness/src/bundle/build.ts',
  ], 'STRUCTURAL_MAINTENANCE', policy), []);
  assert.match(
    validateChangedPaths(['apps/relay/baselines/design.json'], 'STRUCTURAL_MAINTENANCE', policy)[0],
    /BASELINE_ACCEPTANCE/,
  );
  assert.match(
    validateChangedPaths(['apps/relay/baselines/components.json'], 'PAGE_AUTHORING', policy)[0],
    /BASELINE_ACCEPTANCE/,
  );
  assert.deepEqual(validateChangedPaths(['apps/relay/baselines/design.json'], 'BASELINE_ACCEPTANCE', policy), []);
  // Switching the active app is allowed in every authoring mode; templates change only in maintenance.
  assert.deepEqual(validateChangedPaths(['figma-harness.config.json'], 'PAGE_AUTHORING', policy), []);
  assert.match(
    validateChangedPaths(['templates/app/src/screens.ts'], 'PAGE_AUTHORING', policy)[0],
    /outside PAGE_AUTHORING write scope/,
  );
  assert.deepEqual(validateChangedPaths(['templates/app/src/screens.ts'], 'STRUCTURAL_MAINTENANCE', policy), []);
});

test('implicit instructions, policy, public APIs, package scripts, and CI stay wired', () => {
  assert.deepEqual(validateAuthoringContract(), []);
});
