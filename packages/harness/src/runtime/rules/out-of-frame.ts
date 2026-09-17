'use strict';

import { escapesOf } from '../escapes.ts';
import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'out-of-frame',
  run({ pages, solveLayout }) {
    const escapes: string[] = [];
    for (const page of pages) {
      for (const top of page.children) {
        if (top.type !== 'FRAME' || !top.width) continue;
        escapes.push(...escapesOf(top, solveLayout));
      }
    }

    console.log('\n--- out of frame ---');
    if (!escapes.length) {
      console.log('  every node lands inside its artboard');
      return 0;
    }
    console.log('  ' + escapes.length + ' NODE(S) OUTSIDE THE ARTBOARD:');
    for (const escape of escapes.slice(0, 16)) console.log('   - ' + escape);
    return escapes.length;
  },
};

module.exports = rule;
