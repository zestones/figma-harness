import { ensureBuilt } from './ensure-built.ts';
import type {
  AddFinding,
  ContractTreeHarness,
  TreeNode,
  TreePaint,
} from './types.ts';

const { paintTokenName } = require('../../../color/core/token-values.ts');

/* WCAG 1.4.1: every status-painted mark needs a word or texture within reach. */
export async function soleCarrierCheck(
  harness: ContractTreeHarness,
  add: AddFinding,
): Promise<void> {
  await ensureBuilt(harness);
  const solid = new Set(harness.runtime.CONTRACT.designSystem.statusColorTokens);
  const nameOf = (paint: TreePaint): string | null =>
    paintTokenName(paint, harness.vars) || null;
  const wordCache = new WeakMap<TreeNode, boolean>();
  const hasWord = (node: TreeNode | null | undefined): boolean => {
    if (!node) return false;
    const cached = wordCache.get(node);
    if (cached !== undefined) return cached;
    let value = node.type === 'TEXT' && !!String(node.characters || '').trim();
    for (const child of node.children || []) {
      if (hasWord(child)) {
        value = true;
        break;
      }
    }
    wordCache.set(node, value);
    return value;
  };

  let painted = 0;
  const naked: Array<{ name: string; token: string; where: string }> = [];
  const seen = new Set<TreeNode>();
  const reach = 3;
  const walk = (node: TreeNode, chain: TreeNode[]): void => {
    const tokens = [
      ...(node.fills || []).map(nameOf),
      ...(node.strokes || []).map(nameOf),
    ].filter((token): token is string => !!token && solid.has(token));
    if (tokens.length) {
      const mark = /^v\d+$/.test(String(node.name || '')) && chain.length
        ? chain[chain.length - 1]
        : node;
      if (!seen.has(mark)) {
        seen.add(mark);
        painted++;
        const textured = [node].concat(chain.slice(-reach)).some((candidate) =>
          /hatch|dash|stripe|pattern/i.test(String(candidate.name || ''))
          || (!!candidate.strokes?.length && !!candidate.dashPattern?.length));
        let okay = textured || hasWord(node);
        for (
          let index = chain.length - 1;
          index >= 0 && index >= chain.length - reach && !okay;
          index--
        ) {
          okay = hasWord(chain[index]);
        }
        if (!okay) {
          naked.push({
            name: node.name || node.type,
            token: tokens[0],
            where: chain.slice(-2).map((candidate) => candidate.name || candidate.type).join(' / '),
          });
        }
      }
    }
    chain.push(node);
    for (const child of node.children || []) walk(child, chain);
    chain.pop();
  };
  for (const page of harness.pages) {
    for (const child of page.children || []) walk(child, [page]);
  }

  if (naked.length) {
    const shown = naked.slice(0, 6)
      .map((item) => `${item.where} > ${item.name} (${item.token})`)
      .join(' · ');
    add(
      'FAIL',
      '1.4.1',
      'colour with no word beside it',
      `${naked.length} of ${painted} status-painted nodes carry no readable text within reach: ${shown}`,
    );
  } else {
    add(
      'note',
      '1.4.1',
      'every status colour is accompanied',
      `all ${painted} status-painted nodes have a word within reach — the CVD collapses below cost a reader nothing they cannot read`,
    );
  }
}
