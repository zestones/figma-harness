'use strict';

import type { MockNode } from './figma-mock/types.ts';

export function printMeasurement(
  pages: readonly MockNode[],
  requestedName?: string,
): void {
  if (!requestedName) return;
  console.log('\n--- measure "' + requestedName + '" ---');
  for (const page of pages) {
    for (const top of page.children) {
      for (const node of [top, ...top.findAll(() => true)]) {
        if (node.name !== requestedName || !node.children.length) continue;
        const vertical = node.layoutMode === 'VERTICAL';
        const padding = vertical
          ? (node.paddingTop || 0) + (node.paddingBottom || 0)
          : (node.paddingLeft || 0) + (node.paddingRight || 0);
        const gaps = (node.children.length - 1) * (node.itemSpacing || 0);
        let sum = 0;
        for (const child of node.children) {
          if (child.layoutPositioning === 'ABSOLUTE') continue;
          sum += vertical ? child.height : child.width;
          console.log('  ' + String(Math.round(child.width)).padStart(5) + ' x '
            + String(Math.round(child.height)).padStart(3) + '  ' + child.name);
        }
        const box = vertical ? node.height : node.width;
        const total = Math.round(sum + padding + gaps);
        console.log('  ----- ' + (vertical ? 'heights ' : 'widths ') + Math.round(sum)
          + ' + pad ' + padding + ' + gaps ' + gaps + ' = ' + total
          + '   (box is ' + Math.round(box) + ')'
          + (total > Math.round(box) ? '  OVER by ' + (total - Math.round(box)) : ''));
      }
    }
  }
}
