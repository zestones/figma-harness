'use strict';

import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'color-inventory',
  run({ pages, store }) {
    const declared = new Set(
      (store.vars || []).filter((variable) => variable.resolvedType === 'COLOR')
        .map((variable) => variable.name));
    const shown = new Set<string>();
    const walk = (node: MockNode): void => {
      const match = /^c\/(.+)$/.exec(String(node.name || ''));
      if (match) shown.add(match[1]);
      for (const child of node.children || []) walk(child);
    };
    for (const page of pages) {
      for (const child of page.children || []) walk(child);
    }

    const missing = [...declared].filter((token) => !shown.has(token)).sort();
    const ghost = [...shown].filter((token) => !declared.has(token)).sort();
    console.log('\n--- colour inventory ---');
    if (missing.length) {
      console.log('  ' + missing.length + ' colour token(s) declared but NOT on any sheet:');
      for (const token of missing.slice(0, 20)) console.log('   - ' + token);
      if (missing.length > 20) console.log('   … and ' + (missing.length - 20) + ' more');
    }
    if (ghost.length) {
      console.log('  ' + ghost.length +
        ' row(s) naming a token that does not exist: ' + ghost.join(', '));
    }
    if (!missing.length && !ghost.length) {
      console.log('  all ' + declared.size + ' colour tokens appear on a Colour sheet');
    }
    return missing.length + ghost.length;
  },
};

module.exports = rule;
