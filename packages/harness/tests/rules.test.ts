'use strict';

import type { AuditRule } from '../src/runtime/rules/types.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('harness audit rules expose one validated concern each', () => {
  const { AUDIT_RULES } = require('../src/runtime/rules/index.ts') as {
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
    'stress',
    'orphans',
    'flow-contract',
    'prototype',
  ]);
  assert.equal(new Set(AUDIT_RULES.map((rule) => rule.id)).size, AUDIT_RULES.length);
  assert.equal(AUDIT_RULES.every((rule) => typeof rule.run === 'function'), true);
});

test('the stress run fails a result that builds but does not pass inspection', async () => {
  const { stress } = require('../src/runtime/stress.ts') as typeof import('../src/runtime/stress.ts');
  let size: readonly [number, number] = [100, 100];
  const runtime = {
    CONTRACT: {
      document: {
        stress: {
          boxes: [{ name: 'box', build: (width: number) => ({ width }), widths: [10, 20], heights: [0] }],
          frameSizes: [],
          screens: [],
          frameSize: () => size,
          setFrameSize: (width: number, height: number) => { size = [width, height]; },
          prepareMutations: () => ({ mutations: [], restore: () => undefined }),
        },
      },
    },
  };
  const lines: string[] = [];
  const original = console.log;
  let failures: number;
  try {
    console.log = (line?: unknown) => { lines.push(String(line)); };
    failures = await stress(runtime as never, (result) => ((result as { width: number }).width > 15 ? ['too wide'] : []));
  } finally {
    console.log = original;
  }
  assert.equal(failures, 1);
  assert.ok(lines.some((line) => line.includes('box 20x0 -> too wide')), lines.join('\n'));
});

test('a clipping frame on a page is still checked for layers outside it', () => {
  const { createMockNodeFactory } = require('../src/runtime/figma-mock/node-factory.ts') as typeof import('../src/runtime/figma-mock/node-factory.ts');
  const { escapesOf } = require('../src/runtime/escapes.ts') as typeof import('../src/runtime/escapes.ts');
  const { solveLayout } = require('../src/runtime/layout.ts') as typeof import('../src/runtime/layout.ts');
  const factory = createMockNodeFactory();
  const page = factory.node('PAGE', 'page');
  const screen = factory.node('FRAME', 'screen');
  screen.layoutMode = 'VERTICAL';
  screen.resize(100, 100);
  screen.clipsContent = true;
  page.appendChild(screen);
  const wide = factory.node('FRAME', 'wide');
  wide.resize(140, 20);
  screen.appendChild(wide);
  assert.deepEqual(escapesOf(screen, solveLayout), ['screen / wide  past the right edge by 40 px']);

  const badge = factory.node('FRAME', 'badge');
  badge.resize(40, 20);
  screen.appendChild(badge);
  badge.layoutPositioning = 'ABSOLUTE';
  badge.x = 90;
  assert.deepEqual(escapesOf(screen, solveLayout), ['screen / wide  past the right edge by 40 px'], 'a clipped hand-placed layer is hidden, not reported');
});
