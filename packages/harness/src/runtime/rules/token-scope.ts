'use strict';

import { variableIndex } from '../../color/core/token-values.ts';
import type { HarnessContract } from '@figma-harness/contract';
import type { MockNode, MockPaint, MockVariable } from '../figma-mock/types.ts';
import type { AuditRule } from './types.ts';

const SHAPES = new Set(['RECTANGLE', 'ELLIPSE', 'VECTOR', 'POLYGON', 'STAR', 'LINE', 'BOOLEAN_OPERATION']);

/** The scope a paint needs, from where it is painted. */
const requiredScope = function (node: MockNode, which: 'fills' | 'strokes'): string | null {
  if (which === 'strokes') return 'STROKE_COLOR';
  if (node.type === 'TEXT') return 'TEXT_FILL';
  if (SHAPES.has(node.type)) return 'SHAPE_FILL';
  if (node.type === 'FRAME' || node.type === 'COMPONENT' || node.type === 'INSTANCE') return 'FRAME_FILL';
  return null;
};

/** Every bound colour must be painted where its declared Figma scope allows,
 * as the design system scopes its tokens, for example border tokens stroke and ink fills text. */
export function inspectTokenScopes(
  pages: readonly MockNode[],
  variables: readonly MockVariable[],
  contract: HarnessContract,
): { checked: number; issues: Map<string, number>; reviewed: Map<string, number> } {
  const scopes = contract.designSystem.colorScopes;
  const exceptions = contract.designSystem.colorScopeExceptions;
  const byId = variableIndex(variables);
  const issues = new Map<string, number>();
  const reviewed = new Map<string, number>();
  let checked = 0;
  const inspect = (node: MockNode, which: 'fills' | 'strokes', paints: readonly MockPaint[]): void => {
    for (const paint of paints) {
      const id = paint.boundVariables?.color?.id;
      if (!id) continue;
      const variable = byId.get(id);
      if (!variable) continue;
      checked++;
      const needed = requiredScope(node, which);
      const allowed = scopes[variable.name];
      if (!needed || !allowed || allowed.includes('ALL_SCOPES') || allowed.includes(needed)) continue;
      const exception = exceptions.find((candidate) =>
        candidate.token === variable.name && candidate.scope === needed && candidate.node === node.name);
      const key = variable.name + ' as ' + needed + ' on ' + node.type.toLowerCase() + ' "' + node.name + '"';
      if (exception) reviewed.set(key + ': ' + exception.reason, (reviewed.get(key + ': ' + exception.reason) || 0) + 1);
      else issues.set(key, (issues.get(key) || 0) + 1);
    }
  };
  const walk = (node: MockNode): void => {
    inspect(node, 'fills', node.fills || []);
    inspect(node, 'strokes', node.strokes || []);
    for (const child of node.children || []) walk(child);
  };
  for (const page of pages) {
    for (const child of page.children || []) walk(child);
  }
  return { checked, issues, reviewed };
}

const rule: AuditRule = {
  id: 'token-scope',
  run({ pages, runtime, store }) {
    const { checked, issues, reviewed } = inspectTokenScopes(pages, store.vars, runtime.CONTRACT);
    console.log('\n--- token scopes ---');
    for (const [key, count] of reviewed) console.log('  reviewed  ' + key + (count > 1 ? '  x' + count : ''));
    if (!issues.size) {
      console.log('  ' + checked + ' bound paints, each where its Figma scope allows it or under a reviewed exception');
      return 0;
    }
    let count = 0;
    for (const value of issues.values()) count += value;
    console.log('  ' + count + ' PAINT(S) OUTSIDE THEIR SCOPE:');
    for (const [key, value] of [...issues].sort((a, b) => b[1] - a[1]).slice(0, 16)) {
      console.log('   - ' + key + (value > 1 ? '  x' + value : ''));
    }
    return count;
  },
};

module.exports = rule;
