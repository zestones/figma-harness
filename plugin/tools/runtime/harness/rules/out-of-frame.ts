'use strict';

import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

const rule: AuditRule = {
  id: 'out-of-frame',
  run({ pages, solveLayout }) {
    const escapes: string[] = [];
    for (const page of pages) {
      for (const top of page.children) {
        if (top.type !== 'FRAME' || !top.width) continue;
        const walk = (
          node: MockNode,
          offsetX: number,
          offsetY: number,
          depth: number,
        ): void => {
          if (depth > 40 || node._svg || node.type === 'VECTOR') return;
          if (node.overflowDirection && node.overflowDirection !== 'NONE') return;
          const handPlaced = node.layoutPositioning === 'ABSOLUTE' ||
            (node.parent && (!node.parent.layoutMode || node.parent.layoutMode === 'NONE'));
          if (handPlaced && top.clipsContent) return;

          solveLayout(node);
          const x = offsetX + (node.x || 0);
          const y = offsetY + (node.y || 0);
          const overRight = Math.round(x + node.width - top.width);
          const overBottom = Math.round(y + node.height - top.height);
          if (node !== top && (overRight > 2 || overBottom > 2 || x < -2 || y < -2)) {
            escapes.push(top.name + ' / ' + node.name + '  ' +
              (overRight > 2 ? 'past the right edge by ' + overRight + ' px' : '') +
              (overBottom > 2 ? (overRight > 2 ? ' and ' : '') +
                'past the bottom by ' + overBottom + ' px' : '') +
              (x < -2 ? ' off the left by ' + Math.round(-x) + ' px' : '') +
              (y < -2 ? ' off the top by ' + Math.round(-y) + ' px' : ''));
            return;
          }
          for (const child of node.children || []) {
            walk(child, x, y, depth + 1);
          }
        };

        const sourceX = top.x;
        const sourceY = top.y;
        top.x = 0;
        top.y = 0;
        walk(top, 0, 0, 0);
        top.x = sourceX;
        top.y = sourceY;
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
