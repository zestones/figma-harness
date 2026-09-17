/* Card: a bordered surface that holds rows, with an optional title. Rows
 * draw their own dividers (see list-row.ts). */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

export interface CardOptions {
  name?: string;
  rows: readonly FrameNode[];
  title?: string;
  w: number;
}

export const card = async function (options: CardOptions): Promise<FrameNode> {
  const node = await frame({
    name: options.name || 'card', dir: 'V', w: options.w, radius: dim('radius/medium'),
    fill: 'surface/page', stroke: 'border/default', strokeW: 1,
  });
  if (options.title) {
    const head = await frame({
      name: 'card/title', dir: 'H', w: options.w, pad: dim('space/16'),
      stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
    });
    head.appendChild(await text({ style: 'title/small', text: options.title, w: options.w - 32, truncate: true }));
    node.appendChild(head);
  }
  for (const row of options.rows) node.appendChild(row);
  return node;
};
