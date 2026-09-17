/* Badge: a state as a word on its tint. The word carries the meaning; the
 * colour only repeats it. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

export type BadgeTone = 'critical' | 'neutral' | 'positive' | 'warning';

export const BADGE_TONES: readonly BadgeTone[] = Object.freeze(['neutral', 'positive', 'warning', 'critical']);

export const badge = async function (label: string, tone: BadgeTone): Promise<FrameNode> {
  const node = await frame({
    name: 'badge/' + tone, dir: 'H', pad: [dim('space/2'), dim('space/8'), dim('space/2'), dim('space/8')],
    align: 'CENTER', radius: dim('radius/full'), fill: ('status/' + tone + '-subtle') as ColorToken,
  });
  node.appendChild(await text({ style: 'label/small', text: label, color: ('status/' + tone) as ColorToken }));
  node.setPluginData('aria.role', 'status');
  return node;
};
