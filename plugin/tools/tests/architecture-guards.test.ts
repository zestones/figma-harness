'use strict';

import type { SourceGraphViolation } from '../architecture/boundaries.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const fs: typeof import('node:fs') = require('node:fs');
const os: typeof import('node:os') = require('node:os');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');

const {
  findCycles,
  isBoundaryAllowed,
  validateSourceGraph,
} = require('../architecture/boundaries.ts') as typeof import('../architecture/boundaries.ts');
const { validateAuthoringContract } = require('../architecture/authoring-contract.ts') as typeof import('../architecture/authoring-contract.ts');
const { validateToolingHygiene } = require('../architecture/tooling-hygiene.ts') as typeof import('../architecture/tooling-hygiene.ts');
const {
  loadPolicy,
  pathMatches,
  validateChangedPaths,
  validatePolicy,
} = require('../architecture/authoring-policy.ts') as typeof import('../architecture/authoring-policy.ts');

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

test('designs can use public facades but cannot deep-import protected layers', () => {
  assert.equal(isBoundaryAllowed('design', 'facade', 'kit/public.ts'), true);
  assert.equal(isBoundaryAllowed('design', 'fixture', 'fixtures/public.ts'), true);
  assert.equal(isBoundaryAllowed('design', 'component', 'kit/components/buttons.ts'), false);
  assert.equal(isBoundaryAllowed('design', 'engine', 'engine/node-factory.ts'), false);
  assert.equal(isBoundaryAllowed('engine', 'design', 'designs/pages/overview.ts'), false);
  assert.equal(isBoundaryAllowed('pattern', 'fixture', 'fixtures/public.ts'), true);
  assert.equal(isBoundaryAllowed('pattern', 'fixture', 'fixtures/relay.ts'), false);
});

test('tool reachability recognizes bounded Node entry points and reports missing targets', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-harness-script-roots-'));
  try {
    fs.mkdirSync(path.join(temporary, 'src'));
    fs.mkdirSync(path.join(temporary, 'tools/color/experiments'), { recursive: true });
    fs.writeFileSync(path.join(temporary, 'tools/color/experiments/README.md'), '');
    fs.writeFileSync(path.join(temporary, 'tools/runner.ts'), 'export const ready = true;\n');
    const manifest = path.join(temporary, 'package.json');
    for (const command of [
      'tsx tools/runner.ts',
      'node --max-old-space-size=128 --import tsx tools/runner.ts',
      'node --import=tsx tools/runner.ts',
    ]) {
      fs.writeFileSync(manifest, JSON.stringify({ scripts: { check: command } }));
      assert.deepEqual(validateToolingHygiene({ pluginRoot: temporary }).violations, [], command);
    }
    fs.writeFileSync(manifest, JSON.stringify({ scripts: {
      check: 'node --import tsx tools/missing.ts',
    } }));
    const report = validateToolingHygiene({ pluginRoot: temporary });
    assert.ok(report.violations.some(issue => issue.message.includes('missing tool tools/missing.ts')));
    assert.ok(report.violations.some(issue => issue.file === 'tools/runner.ts'
      && issue.message.includes('unreachable')));
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
  }
});

test('the graph validator reports a synthetic design-to-engine bypass', () => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-harness-boundary-'));
  try {
    fs.mkdirSync(path.join(temporary, 'designs'), { recursive: true });
    fs.mkdirSync(path.join(temporary, 'engine'), { recursive: true });
    fs.writeFileSync(path.join(temporary, 'engine', 'mechanics.ts'), 'export const mechanics = true;\n');
    fs.writeFileSync(path.join(temporary, 'engine', 'legacy.js'), 'export const legacy = true;\n');
    fs.writeFileSync(
      path.join(temporary, 'designs', 'page.ts'),
      "import { mechanics } from '../engine/mechanics.ts';\nexport { mechanics };\n",
    );
    const report = validateSourceGraph({ sourceRoot: temporary });
    assert.equal(report.violations.some((issue: SourceGraphViolation) =>
      issue.message.includes('design may not import engine/mechanics.ts')), true);
    assert.equal(report.violations.some((issue: SourceGraphViolation) =>
      issue.file === 'engine/legacy.js' && issue.message.includes('must be TypeScript')), true);
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true });
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
  assert.equal(pathMatches('plugin/src/designs/pages/new-page.ts', 'plugin/src/designs/pages/**'), true);
  assert.deepEqual(validateChangedPaths([
    'docs/briefs/new-page.md',
    'plugin/src/designs/pages/new-page.ts',
    'plugin/code.js',
  ], 'PAGE_AUTHORING', policy), []);
  assert.match(
    validateChangedPaths(['plugin/src/kit/components/buttons.ts'], 'PAGE_AUTHORING', policy)[0],
    /outside PAGE_AUTHORING write scope/,
  );
  assert.match(
    validateChangedPaths(['.github/workflows/ci.yml'], 'PAGE_AUTHORING', policy)[0],
    /outside PAGE_AUTHORING write scope/,
  );
  assert.deepEqual(validateChangedPaths([
    '.github/workflows/ci.yml',
    'AGENTS.md',
    'plugin/tools/runtime/build.ts',
  ], 'STRUCTURAL_MAINTENANCE', policy), []);
  assert.match(
    validateChangedPaths([
      'plugin/tools/runtime/design-baseline.json',
    ], 'STRUCTURAL_MAINTENANCE', policy)[0],
    /BASELINE_ACCEPTANCE/,
  );
  assert.deepEqual(validateChangedPaths([
    'plugin/tools/runtime/design-baseline.json',
  ], 'BASELINE_ACCEPTANCE', policy), []);
});

test('implicit instructions, policy, public APIs, package scripts, and CI stay wired', () => {
  assert.deepEqual(validateAuthoringContract(), []);
});
