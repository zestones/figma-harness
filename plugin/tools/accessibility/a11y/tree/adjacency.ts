import { ensureBuilt } from './ensure-built.ts';
import type {
  ContractTreeHarness,
  TreeNode,
  TreePaint,
} from './types.ts';

const { paintTokenName } = require('../../../color/core/token-values.ts');

/* Record category colours that actually meet on the same product artboard. */
export async function adjacency(harness: ContractTreeHarness): Promise<Set<string>> {
  await ensureBuilt(harness);
  const nameOf = (paint: TreePaint): string | null =>
    paintTokenName(paint, harness.vars) || null;
  const { designSystem, workspace } = harness.runtime.CONTRACT;
  const watched = {
    test: (token: string): boolean =>
      designSystem.adjacencyPrefixes.some((prefix) => token.startsWith(prefix)),
  };
  const context = new Map<TreeNode, Set<string>>();
  const walk = (node: TreeNode, top: TreeNode): void => {
    const tokens = [
      ...(node.fills || []).map(nameOf),
      ...(node.strokes || []).map(nameOf),
    ].filter((token): token is string => !!token && watched.test(token));
    if (tokens.length) {
      const set = context.get(top) || new Set<string>();
      for (const token of tokens) set.add(token);
      context.set(top, set);
    }
    for (const child of node.children || []) walk(child, top);
  };
  for (const page of harness.pages) {
    if (page.name !== workspace.pages['screens']) continue;
    for (const child of page.children || []) walk(child, child);
  }

  const pairs = new Set<string>();
  for (const set of context.values()) {
    const list = [...set];
    for (let left = 0; left < list.length; left++) {
      for (let right = left + 1; right < list.length; right++) {
        pairs.add(list[left] + '|' + list[right]);
        pairs.add(list[right] + '|' + list[left]);
      }
    }
  }
  return pairs;
}
