/* ListRow: a label, its detail and an optional badge, separated from the
 * previous row by a hairline. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';
import { badge, type BadgeTone } from './badge.ts';

export interface ListRowOptions {
  badge?: { readonly label: string; readonly tone: BadgeTone };
  detail: string;
  /** Rows after the first draw a divider above them. */
  divider?: boolean;
  label: string;
  /** The row opens something, so it is announced as a link. */
  link?: boolean;
  /** The layer name; `list-row/<label>` by default. */
  name?: string;
  w: number;
}

export const listRow = async function (options: ListRowOptions): Promise<FrameNode> {
  const row = await frame({
    name: options.name || 'list-row/' + options.label, dir: 'H', w: options.w,
    gap: dim('space/16'), pad: dim('space/16'), align: 'CENTER',
    stroke: options.divider ? 'border/default' : null, strokeSide: 'Top', strokeW: 1,
  });
  const mark = options.badge ? await badge(options.badge.label, options.badge.tone) : null;
  const width = options.w - 32 - (mark ? mark.width + 16 : 0);
  const column = await frame({ name: 'list-row/text', dir: 'V', w: width, gap: dim('space/4') });
  column.appendChild(await text({ style: 'body/strong', text: options.label, w: width, truncate: true }));
  column.appendChild(await text({ style: 'body/small', text: options.detail, color: 'text/muted', w: width, truncate: true }));
  row.appendChild(column);
  // The text column takes the room the badge leaves, so the badge ends the row.
  if (mark) row.appendChild(mark);
  row.setPluginData('aria.role', options.link ? 'link' : 'listitem');
  row.setPluginData('aria.accessible-name', options.label);
  return row;
};
