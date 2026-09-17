/* Components: Timeline. */

import { dim } from '../foundations/dimensions.ts';
import { STATUS, type StatusKind } from '../foundations/semantics.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon, type IconName } from '../primitives/icons.ts';

export interface TimelineItemOptions {
  /** Content beside the badge: text, links, labels. Drawn at the body width. */
  body: (width: number) => Promise<FrameNode>;
  /** A small event: a 16 px glyph on the page ground instead of a badge. */
  condensed?: boolean;
  icon: IconName;
  /** A family paints the badge; without one it is the quiet timeline grey. */
  variant?: StatusKind;
}

export interface TimelineOptions {
  items: readonly TimelineItemOptions[];
  w: number;
}

const BADGE = 32;
const GUTTER = BADGE + 8;

/** Events on a 2 px rail; each badge is centred on it and masks it. */
export const timeline = async function (options: TimelineOptions): Promise<FrameNode> {
  const list = await createFrame({ name: 'timeline', dir: 'V', w: options.w, gap: 0 });
  for (const item of options.items) {
    const condensed = !!item.condensed;
    const family = item.variant ? STATUS[item.variant] : null;
    const row = await createFrame({
      name: 'timeline/item', dir: 'H', w: options.w, gap: dim('base/size/8'), align: 'MIN',
      pad: condensed ? [dim('base/size/4'), 0, 0, 0] : [dim('base/size/16'), 0, dim('base/size/16'), 0],
    });
    const badge = await createFrame({
      name: 'timeline/badge', dir: 'H', w: BADGE, h: condensed ? 16 : BADGE,
      justify: 'CENTER', align: 'CENTER', radius: condensed ? undefined : dim('borderRadius/full'),
      fill: condensed ? 'bgColor/default' : family ? family.emphasis : 'timelineBadge/bgColor',
      stroke: condensed ? null : 'bgColor/default', strokeW: 2,
    });
    badge.appendChild(icon(item.icon, family && !condensed ? 'fgColor/onEmphasis' : 'fgColor/muted', 16));
    const holder = await createFrame({
      name: 'timeline/badge-holder', dir: 'V',
      pad: condensed ? [dim('base/size/8'), 0, dim('base/size/8'), 0] : 0,
    });
    holder.appendChild(badge);
    row.appendChild(holder);
    const bodyWidth = options.w - GUTTER;
    const body = await createFrame({
      name: 'timeline/body', dir: 'V', w: bodyWidth, pad: [dim('base/size/4'), 0, 0, 0],
    });
    body.appendChild(await item.body(bodyWidth));
    row.appendChild(body);
    // The rail spans the whole item, padding included, behind the badge.
    const rail = await createFrame({
      name: 'timeline/rail', w: 2, h: row.height, stroke: 'borderColor/muted', strokeSide: 'Left', strokeW: 2,
    });
    row.insertChild(0, rail);
    rail.layoutPositioning = 'ABSOLUTE';
    rail.x = BADGE / 2 - 1;
    rail.y = 0;
    rail.constraints = { horizontal: 'MIN', vertical: 'STRETCH' };
    list.appendChild(row);
  }
  return list;
};
