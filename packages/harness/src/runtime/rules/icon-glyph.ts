'use strict';

import type { MockNode } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

const GLYPH_KEY = 'spec.icon.glyph';
const DESIGN_HEIGHTS = new Set([12, 16, 24]);

/** Every icon is a filled Octicon: square, drawn from a published grid, every
 * vector filled with one bound colour and stroked with nothing. */
export function inspectIcons(pages: readonly MockNode[]): { icons: number; issues: Map<string, number> } {
  let icons = 0;
  const issues = new Map<string, number>();
  const report = (key: string): void => { issues.set(key, (issues.get(key) || 0) + 1); };
  const walk = (node: MockNode): void => {
    if (node._svg && /^icon\//.test(String(node.name || ''))) {
      icons++;
      const name = String(node.name);
      const glyph = node.getPluginData(GLYPH_KEY);
      const height = Number(glyph.split('@')[1]);
      if (!glyph || !DESIGN_HEIGHTS.has(height)) report(name + '  has no published design grid');
      else if (!String(node._svg).includes('viewBox="0 0 ' + height + ' ' + height + '"')) {
        report(name + '  is not drawn on its ' + height + ' px grid');
      }
      if (Math.abs(node.width - node.height) > 0.01) report(name + '  is not square');
      if ((node.fills || []).length) report(name + '  paints its own frame');
      const elements = String(node._svg).match(/<(?!path\b|svg\b|\/)([a-z]+)/g) || [];
      if (elements.length) report(name + '  uses ' + [...new Set(elements)].join(', ') + ', not path');
      for (const vector of node.findAll((child) => child.type === 'VECTOR')) {
        const fills = vector.fills || [];
        if (fills.length !== 1 || !fills[0].boundVariables?.color) report(name + '  has a vector without one bound fill');
        if ((vector.strokes || []).length) report(name + '  strokes a filled glyph');
      }
    }
    for (const child of node.children || []) walk(child);
  };
  for (const page of pages) {
    for (const child of page.children || []) walk(child);
  }
  return { icons, issues };
}

const rule: AuditRule = {
  id: 'icon-glyph',
  run({ pages }) {
    const { icons, issues } = inspectIcons(pages);
    console.log('\n--- icon glyphs ---');
    if (!issues.size) {
      console.log('  ' + icons + ' icons: filled Octicons on their own grid, one bound colour, no strokes');
      return 0;
    }
    let count = 0;
    for (const value of issues.values()) count += value;
    console.log('  ' + count + ' ICON ISSUE(S):');
    for (const [key, value] of issues) console.log('   - ' + key + (value > 1 ? '  x' + value : ''));
    return count;
  },
};

module.exports = rule;
