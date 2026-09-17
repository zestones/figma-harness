/* ============================================================================
 * WCAG contrast audit of the declared palette pairs.
 *
 * Every pair the design system declares is checked against the level it must
 * meet. Body text needs 4.5:1, large text and non-text indicators need 3:1.
 * A translucent background is composited over the pair's declared ground
 * first, and a translucent ink over that result, as a browser would paint them.
 *
 *   pnpm audit:contrast
 * ==========================================================================*/

'use strict';

import { apca } from './apca.ts';
import { flatten, ratio as colorRatio, rgba, toHex, type Color } from '../color/core/color.ts';
import { readProjectColorTokens } from '../color/core/token-source.ts';
import { loadContract } from '../bundle/contract-loader.ts';
import type { ContrastPairContract, DesignSystemContract } from '@figma-harness/contract';

export interface PairMeasurement {
  readonly background: Color;
  readonly foreground: Color;
  readonly ratio: number;
}

/** Composite a declared pair the way it is painted, then measure it. */
export function measurePair(
  tokens: Readonly<Record<string, string>>,
  pair: ContrastPairContract,
): PairMeasurement {
  const [foregroundName, backgroundName, , , groundName] = pair;
  const lookup = (name: string) => {
    const value = tokens[name];
    if (!value) throw new Error('the contract names an undeclared colour token: ' + name);
    return rgba(value);
  };
  const backgroundColor = lookup(backgroundName);
  let background: Color = backgroundColor;
  if (backgroundColor.a < 1) {
    if (!groundName) throw new Error(backgroundName + ' is translucent; the pair must declare the ground under it');
    const ground = lookup(groundName);
    if (ground.a < 1) throw new Error('the ground ' + groundName + ' must be opaque');
    background = flatten(backgroundColor, ground);
  }
  const foreground = flatten(lookup(foregroundName), background);
  // Preserve this audit's historical breakpoint while sharing the implementation.
  return { foreground, background, ratio: colorRatio(foreground, background, 0.03928) };
}

/** Measure every declared pair and print the table. Returns the failure count. */
function auditContrast(contract: DesignSystemContract, options: { all?: boolean } = {}): number {
  const tokens = readProjectColorTokens(contract);
  const pairs = contract.contrastPairs;
  let fails = 0;
  let warns = 0;
  const rows: Array<[string, string, string, string]> = [];
  for (const pair of pairs) {
    const [foreground, background, need, what, ground] = pair;
    let measured: PairMeasurement;
    try {
      measured = measurePair(tokens, pair);
    } catch (error) {
      rows.push(['FAIL', foreground + ' / ' + background, '', error instanceof Error ? error.message : String(error)]);
      fails++;
      continue;
    }
    const ok = measured.ratio >= need;
    /* APCA beside the ratio, for the TEXT pairs only — the 3:1 rows are marks
       and edges, which APCA does not model. It is reported, never enforced:
       1.4.3 is the law and this is not. */
    const isText = need >= 4.5;
    const lc = isText ? Math.abs(apca(toHex(measured.foreground), toHex(measured.background))) : null;
    const thin = lc !== null && lc < 60;
    if (!ok) fails++;
    else if (measured.ratio < need * 1.08 || thin) warns++;
    const state = !ok ? 'FAIL' : (thin ? 'THIN' : (measured.ratio < need * 1.08 ? 'tight' : 'ok'));
    rows.push([state, foreground + '  on  ' + background + (ground ? '  over  ' + ground : ''),
      measured.ratio.toFixed(2) + ' / ' + need.toFixed(1),
      (lc == null ? '' : 'Lc ' + lc.toFixed(0).padStart(3) + '  ') + what]);
  }

  const w0 = Math.max(0, ...rows.map((row) => row[0].length));
  const w1 = Math.max(0, ...rows.map((row) => row[1].length));
  const w2 = Math.max(0, ...rows.map((row) => row[2].length));
  for (const row of rows) {
    if (options.all || row[0] !== 'ok') {
      console.log(row[0].padEnd(w0) + '  ' + row[1].padEnd(w1) + '  ' + row[2].padStart(w2) + '  ' + row[3]);
    }
  }
  const thinCount = rows.filter((row) => row[0] === 'THIN').length;
  console.log('\n' + pairs.length + ' pairs · ' + fails + ' failing · ' + warns + ' flagged'
    + (thinCount ? ' (' + thinCount + ' legal under 1.4.3 but under APCA Lc 60)' : ''));
  return fails;
}

if (require.main === module) {
  const fails = auditContrast(loadContract().designSystem, { all: process.argv.includes('--all') });
  process.exit(fails ? 1 : 0);
}
