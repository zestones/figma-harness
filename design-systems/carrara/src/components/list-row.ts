/* ListRow: one item of a list, with an optional avatar or icon before it and
 * a badge or a value after it. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { avatar } from '../primitives/avatar.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { badge, type BadgeOptions } from './badge.ts';

export interface ListRowOptions {
  /** A badge at the end. */
  badge?: BadgeOptions;
  detail?: string;
  /** Rows after the first draw a divider above them. */
  divider?: boolean;
  /** Initials in an avatar, or an icon, before the text. */
  leading?: { readonly initials: string } | { readonly icon: IconName };
  label: string;
  /** The row opens something, so it is announced as a link. */
  link?: boolean;
  /** The layer name, which flows select; `list-row/<label>` by default. */
  name?: string;
  /** A value at the end, with an optional caption under it. */
  value?: { readonly caption?: string; readonly text: string };
  w: number;
}

export const listRow = async function (options: ListRowOptions): Promise<FrameNode> {
  const row = await frame({
    name: options.name || 'list-row/' + options.label, dir: 'H', w: options.w, gap: dim('space/12'), align: 'CENTER',
    pad: [dim('space/12'), 0, dim('space/12'), 0],
    stroke: options.divider ? 'border/default' : null, strokeSide: 'Top', strokeW: 1,
  });
  let lead: SceneNode | null = null;
  if (options.leading && 'initials' in options.leading) {
    lead = await avatar({ initials: options.leading.initials, label: options.label, size: 32 });
  } else if (options.leading) {
    const chip = await frame({
      name: 'list-row-icon', dir: 'H', w: 32, h: 32, radius: dim('radius/md'), fill: 'bg/subtle',
      justify: 'CENTER', align: 'CENTER',
    });
    chip.appendChild(icon(options.leading.icon, 'text/secondary', 16));
    lead = chip;
  }
  let trail: FrameNode | null = null;
  if (options.badge) {
    trail = await badge(options.badge);
  } else if (options.value) {
    trail = await frame({ name: 'list-row-value', dir: 'V', gap: dim('space/2'), align: 'MAX' });
    trail.appendChild(await text({ style: 'body/md-strong', text: options.value.text, align: 'RIGHT' }));
    if (options.value.caption) {
      trail.appendChild(await text({ style: 'body/sm', text: options.value.caption, color: 'text/tertiary', align: 'RIGHT' }));
    }
  }
  const room = options.w - (lead ? lead.width + row.itemSpacing : 0) - (trail ? trail.width + row.itemSpacing : 0);
  const words = await frame({ name: 'list-row-text', dir: 'V', w: room, gap: dim('space/2') });
  words.appendChild(await text({ style: 'body/md-medium', text: options.label, w: room, truncate: true }));
  if (options.detail) {
    words.appendChild(await text({ style: 'body/sm', text: options.detail, color: 'text/tertiary', w: room, truncate: true }));
  }
  if (lead) row.appendChild(lead);
  row.appendChild(words);
  if (trail) row.appendChild(trail);
  row.setPluginData('aria.role', options.link ? 'link' : 'listitem');
  row.setPluginData('aria.accessible-name', options.label);
  return row;
};
