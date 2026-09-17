'use strict';

import type { AuditRule } from './types.ts';
import { radiusScale } from './radius-scale.ts';

const layoutLint = require('./layout-lint.ts') as AuditRule;
const spacingRamp = require('./spacing-ramp.ts') as AuditRule;
const outOfFrame = require('./out-of-frame.ts') as AuditRule;
const colorInventory = require('./color-inventory.ts') as AuditRule;
const componentInventory = require('./component-inventory.ts') as AuditRule;
const iconGlyph = require('./icon-glyph.ts') as AuditRule;
const tokenScope = require('./token-scope.ts') as AuditRule;
const exportNames = require('./export-names.ts') as AuditRule;
const orphans = require('./orphans.ts') as AuditRule;
const flowContract = require('./flow-contract.ts') as AuditRule;
const prototype = require('./prototype.ts') as AuditRule;

const stress: AuditRule = {
  id: 'stress',
  run(context) {
    return context.stress();
  },
};

const AUDIT_RULES: readonly AuditRule[] = Object.freeze([
  layoutLint,
  spacingRamp,
  radiusScale,
  outOfFrame,
  colorInventory,
  componentInventory,
  tokenScope,
  iconGlyph,
  exportNames,
  orphans,
  stress,
  flowContract,
  prototype,
]);

const ids = new Set<string>();
for (const rule of AUDIT_RULES) {
  if (!rule.id || typeof rule.run !== 'function') {
    throw new Error('Every harness audit rule requires an id and run(context)');
  }
  if (ids.has(rule.id)) throw new Error('Duplicate harness audit rule: ' + rule.id);
  ids.add(rule.id);
}

module.exports = { AUDIT_RULES };
