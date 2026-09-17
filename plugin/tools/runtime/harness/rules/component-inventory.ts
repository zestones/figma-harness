'use strict';

import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'component-inventory',
  run({ pages, runtime }) {
    const PRIMITIVES = runtime.CONTRACT.designSystem.componentInventory;
    const systemPage = runtime.CONTRACT.workspace.pages['system'];
    const names = new Set<string>();
    const walk = (node: MockNode): void => {
      names.add(String(node.name || ''));
      for (const child of node.children || []) walk(child);
    };
    for (const page of pages) {
      if (page.name !== systemPage) continue;
      for (const child of page.children || []) walk(child);
    }

    const renderedNames = [...names];
    const undocumented = PRIMITIVES
      .filter(([, pattern]) => !renderedNames.some((name) => pattern.test(name)))
      .map(([name]) => name);
    console.log('\n--- component inventory ---');
    if (undocumented.length) {
      console.log('  ' + undocumented.length +
        ' primitive(s) in the kit and on NO sheet: ' + undocumented.join(', '));
    } else {
      console.log('  all ' + PRIMITIVES.length + ' primitives appear on a sheet');
    }
    return undocumented.length;
  },
};

module.exports = rule;
