'use strict';

import type { AuditRule } from '../runtime/harness/rules/types.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const runtimeGlobal = global as typeof global & { figma?: unknown };

test('sheet catalog is declarative, ordered, unique, and Figma-free at import', async () => {
  delete runtimeGlobal.figma;
  const { SHEETS } = await import('../../src/designs/sheets/catalog.ts');
  assert.equal(runtimeGlobal.figma, undefined);
  assert.equal(Object.isFrozen(SHEETS), true);
  assert.deepEqual(SHEETS.map((definition) => definition.code), [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7',
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  ]);
  assert.equal(new Set(SHEETS.map((definition) => definition.code)).size, SHEETS.length);
  assert.equal(SHEETS.every((definition) =>
    Object.isFrozen(definition) && typeof definition.build === 'function'), true);
});

test('document catalog is import-safe, complete, frozen, and uniquely named', async () => {
  delete runtimeGlobal.figma;
  const { BUILDERS, PAGES } = await import('../../src/designs/catalog.ts');
  assert.equal(runtimeGlobal.figma, undefined);
  assert.equal(Object.isFrozen(BUILDERS), true);
  assert.equal(Object.isFrozen(PAGES), true);
  assert.deepEqual(Object.keys(BUILDERS).sort(), ['screens', 'states', 'system']);
  assert.deepEqual(Object.keys(PAGES).sort(), ['screens', 'states', 'system']);
  assert.equal(new Set(Object.values(PAGES)).size, Object.values(PAGES).length);
  assert.equal(Object.values(BUILDERS).every((builder) => typeof builder === 'function'), true);
});

test('the generated Primer modules match the pinned packages', () => {
  const { formatTokenModule } = require('../tokens/tokens.ts') as typeof import('../tokens/tokens.ts');
  const { generateTokens } = require('../tokens/generate.ts') as typeof import('../tokens/generate.ts');
  const { formatIconModule, loadOcticons } = require('../icons/generate.ts') as typeof import('../icons/generate.ts');
  const fs: typeof import('node:fs') = require('node:fs');
  const path: typeof import('node:path') = require('node:path');
  const root = path.resolve(__dirname, '..', '..');
  assert.equal(
    fs.readFileSync(path.join(root, 'src', 'kit', 'foundations', 'primer.generated.ts'), 'utf8'),
    formatTokenModule(generateTokens()),
  );
  assert.equal(
    fs.readFileSync(path.join(root, 'src', 'kit', 'primitives', 'icons.generated.ts'), 'utf8'),
    formatIconModule(loadOcticons(path.join(root, 'node_modules', '@primer', 'octicons'))),
  );
});

test('the token generator refuses what Primer does not publish and describes component roles', () => {
  const { colorHex, describeComponentToken } = require('../tokens/generate.ts') as typeof import('../tokens/generate.ts');
  const { glyphPaths } = require('../icons/generate.ts') as typeof import('../icons/generate.ts');
  assert.equal(colorHex({ r: 209 / 255, g: 217 / 255, b: 224 / 255, a: 0.7 }), '#D1D9E0B3');
  assert.equal(colorHex({ r: 1, g: 1, b: 1 }), '#FFFFFF');
  assert.equal(describeComponentToken('control/checked/bgColor/hover'), 'Checked control background when hovered');
  assert.equal(describeComponentToken('controlTrack/bgColor/rest'), 'Control track background at rest');
  assert.throws(() => glyphPaths('<svg viewBox="0 0 16 16"><circle r="3"/></svg>', 'dot'), /contains/);
  assert.throws(() => glyphPaths('<svg viewBox="0 0 16 16"><path d="M0 0" stroke="red"/></svg>', 'stroke'), /attribute stroke/);
});

test('harness audit rules expose one validated concern each', () => {
  const { AUDIT_RULES } = require('../runtime/harness/rules/index.ts') as {
    AUDIT_RULES: readonly AuditRule[];
  };
  assert.equal(Object.isFrozen(AUDIT_RULES), true);
  assert.deepEqual(AUDIT_RULES.map((rule) => rule.id), [
    'layout-lint',
    'spacing-ramp',
    'radius-scale',
    'out-of-frame',
    'color-inventory',
    'component-inventory',
    'token-scope',
    'icon-glyph',
    'export-names',
    'orphans',
    'stress',
    'flow-contract',
    'prototype',
  ]);
  assert.equal(new Set(AUDIT_RULES.map((rule) => rule.id)).size, AUDIT_RULES.length);
  assert.equal(AUDIT_RULES.every((rule) => typeof rule.run === 'function'), true);
});
