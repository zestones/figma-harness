'use strict';

import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'orphans',
  run({ created }) {
    const orphans = new Map<string, number>();
    for (const node of created) {
      // Live nodes and lightweight records of removed orphans preserve the
      // audit evidence without retaining destroyed document graphs. Figma
      // places every new node on the current page, so a node that is built
      // and never appended stays there as a stray layer, even an empty one.
      if (node._everAttached || node.type === 'PAGE' || node.type === 'DOCUMENT') continue;
      const key = node.type.toLowerCase() + ' ' + (node.name || '(unnamed)') + '  (' + node.children.length + ' children' +
        (node.children.length ? ', ' + node.children.map((child) => child.name).slice(0, 3).join(', ') : '') + ')';
      orphans.set(key, (orphans.get(key) || 0) + 1);
    }

    console.log('\n--- orphans ---');
    if (!orphans.size) {
      console.log('  every node the build created is attached to a page');
      return 0;
    }
    let issues = 0;
    for (const count of orphans.values()) issues += count;
    console.log('  ' + issues + ' BUILT BUT NEVER APPENDED:');
    for (const [key, count] of orphans) {
      console.log('   - ' + key + (count > 1 ? '  x' + count : ''));
    }
    return issues;
  },
};

module.exports = rule;
