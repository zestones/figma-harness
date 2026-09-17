/* Timeline: what happened, newest first, each event in words with its time. */

import { abs, P as tokenPaint, f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { TONE_COLORS, type BadgeTone } from './badge.ts';

export interface TimelineEvent {
  detail?: string;
  icon: IconName;
  time: string;
  title: string;
  tone?: BadgeTone;
}

const MARK = 28;
const TIME_WIDTH = 104;

export const timeline = async function (events: readonly TimelineEvent[], width: number): Promise<FrameNode> {
  if (!events.length) throw new Error('a timeline needs at least one event; show an empty state instead');
  const root = await frame({ name: 'timeline', dir: 'V', w: width });
  const space = dim('space/16');
  for (const [index, event] of events.entries()) {
    const last = index === events.length - 1;
    // The space under an event holds the connector to the next one.
    const item = await frame({
      name: 'event/' + event.title, dir: 'H', w: width, gap: dim('space/12'), align: 'MIN',
      pad: [0, 0, last ? 0 : space, 0],
    });
    const colors = TONE_COLORS[event.tone || 'neutral'];
    // The icon sits next to the words, so its colour is never the only carrier.
    const chip = await frame({
      name: 'event-icon', dir: 'H', w: MARK, h: MARK, radius: dim('radius/full'), fill: colors.fill,
      justify: 'CENTER', align: 'CENTER',
    });
    chip.appendChild(icon(event.icon, colors.ink, 16));
    item.appendChild(chip);
    const room = width - MARK - TIME_WIDTH - item.itemSpacing * 2;
    const words = await frame({ name: 'event-text', dir: 'V', w: room, gap: dim('space/2'), pad: [dim('space/4'), 0, 0, 0] });
    words.appendChild(await text({ style: 'body/md-medium', text: event.title, w: room }));
    if (event.detail) words.appendChild(await text({ style: 'body/sm', text: event.detail, color: 'text/tertiary', w: room }));
    item.appendChild(words);
    const time = await frame({ name: 'event-time', dir: 'H', w: TIME_WIDTH, justify: 'MAX', pad: [dim('space/4'), 0, 0, 0] });
    time.appendChild(await text({ style: 'body/sm', text: event.time, color: 'text/tertiary', maxW: TIME_WIDTH }));
    item.appendChild(time);
    if (!last) {
      const gap = dim('space/4').value;
      const line = figma.createRectangle();
      line.name = 'event-connector';
      line.resize(2, Math.max(words.height, MARK) + space.value - MARK - gap * 2);
      line.fills = [tokenPaint('bg/muted')];
      abs(item, line, (MARK - 2) / 2, MARK + gap);
    }
    item.setPluginData('aria.role', 'listitem');
    root.appendChild(item);
  }
  root.setPluginData('aria.role', 'list');
  return root;
};
