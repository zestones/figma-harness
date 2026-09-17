'use strict';

import type { MockNode } from './figma-mock/types.ts';

/** Every node that lands outside `top`, the frame it belongs to. The
 *  out-of-frame rule checks each top-level frame with it, and the stress run
 *  each result. Clipped hand-placed layers and scrolling frames are skipped. */
export function escapesOf(top: MockNode, solveLayout: (node: MockNode) => void): string[] {
  const escapes: string[] = [];
  const walk = (node: MockNode, offsetX: number, offsetY: number, depth: number): void => {
    if (depth > 40 || node._svg || node.type === 'VECTOR') return;
    if (node.overflowDirection && node.overflowDirection !== 'NONE') return;
    const handPlaced = node.layoutPositioning === 'ABSOLUTE' ||
      (node.parent && (!node.parent.layoutMode || node.parent.layoutMode === 'NONE'));
    // A clipping frame hides what its hand-placed layers push outside; the frame itself is always checked.
    if (node !== top && handPlaced && top.clipsContent) return;

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
    for (const child of node.children || []) walk(child, x, y, depth + 1);
  };

  const sourceX = top.x;
  const sourceY = top.y;
  top.x = 0;
  top.y = 0;
  try {
    walk(top, 0, 0, 0);
  } finally {
    top.x = sourceX;
    top.y = sourceY;
  }
  return escapes;
}
