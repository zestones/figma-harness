/* The starter vocabulary: the screen a newly created app starts from, drawn
 * with this design system's screen, card, rows, badges and buttons. */

import type {
  StarterAction,
  StarterItem,
  StarterScreenOptions,
  StarterVocabulary,
} from '@figma-harness/contract';
import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import type { MotionName } from '../foundations/motion.ts';
import { text } from '../primitives/text.ts';
import { button } from '../components/button.ts';
import { card } from '../components/card.ts';
import { listRow } from '../components/list-row.ts';
import { screen } from './screen.ts';

const action = function (spec: StarterAction, variant: 'primary' | 'secondary'): Promise<FrameNode> {
  return button({ label: spec.label, name: spec.name, variant });
};

const rows = async function (items: readonly StarterItem[], width: number): Promise<FrameNode[]> {
  const result: FrameNode[] = [];
  for (const item of items) {
    result.push(await listRow({
      name: item.name, label: item.label, detail: item.detail, w: width,
      badge: item.status, divider: result.length > 0, link: item.link,
    }));
  }
  if (!result.length) {
    const empty = await frame({ name: 'starter-list/empty', dir: 'V', w: width, pad: dim('space/16') });
    empty.appendChild(await text({ style: 'body/default', text: 'Nothing here yet.', color: 'text/muted', w: width - 32 }));
    result.push(empty);
  }
  return result;
};

export const starter: StarterVocabulary = Object.freeze({
  stateMotion: 'stateChange' satisfies MotionName,
  async screen(options: StarterScreenOptions): Promise<FrameNode> {
    const layout = await screen({ name: options.name, w: options.w, h: options.h, product: options.product });
    const width = layout.contentWidth;
    const head = await frame({ name: 'screen-title', dir: 'V', w: width, gap: dim('space/8') });
    head.appendChild(await text({ style: 'title/large', text: options.title, w: width, truncate: true }));
    head.appendChild(await text({ style: 'body/default', text: options.text, color: 'text/muted', w: width }));
    layout.content.appendChild(head);
    if (options.items) layout.content.appendChild(await card({ name: 'starter-list', w: width, rows: await rows(options.items, width) }));
    if (options.primary || options.secondary) {
      const bar = await frame({ name: 'screen-actions', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
      if (options.secondary) bar.appendChild(await action(options.secondary, 'secondary'));
      if (options.primary) bar.appendChild(await action(options.primary, 'primary'));
      layout.content.appendChild(bar);
    }
    layout.fit();
    return layout.frame;
  },
});
