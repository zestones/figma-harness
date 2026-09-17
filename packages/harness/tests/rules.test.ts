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
    'orphans',
    'stress',
    'flow-contract',
    'prototype',
  ]);
  assert.equal(new Set(AUDIT_RULES.map((rule) => rule.id)).size, AUDIT_RULES.length);
  assert.equal(AUDIT_RULES.every((rule) => typeof rule.run === 'function'), true);
});
