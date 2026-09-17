/* Pagination: where the reader is in a long list, and the way to the next page. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';
import { button } from './button.ts';

export interface PaginationOptions {
  /** Whether a next page exists. */
  hasNext: boolean;
  /** Whether a previous page exists. */
  hasPrevious: boolean;
  /** Such as "Showing 1–10 of 12,845 payments". */
  summary: string;
  w: number;
}

export const pagination = async function (options: PaginationOptions): Promise<FrameNode> {
  // Figma spaces a space-between row itself, so its gap stays a plain number.
  const row = await frame({
    name: 'pagination', dir: 'H', w: options.w, gap: dim('space/16').value, align: 'CENTER', justify: 'SPACE_BETWEEN',
    pad: [dim('space/12'), dim('space/20'), dim('space/12'), dim('space/20')],
    stroke: 'border/default', strokeSide: 'Top', strokeW: 1,
  });
  const controls = await frame({ name: 'pagination-controls', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
  controls.appendChild(await button({
    label: 'Previous', icon: 'chevron-left', size: 'sm', name: 'button/Previous page',
    state: options.hasPrevious ? 'rest' : 'disabled',
  }));
  controls.appendChild(await button({
    label: 'Next', iconAfter: 'chevron-right', size: 'sm', name: 'button/Next page',
    state: options.hasNext ? 'rest' : 'disabled',
  }));
  const room = options.w - dim('space/20').value * 2 - controls.width - row.itemSpacing;
  row.appendChild(await text({ style: 'body/sm', text: options.summary, color: 'text/tertiary', maxW: room }));
  row.appendChild(controls);
  row.setPluginData('aria.role', 'navigation');
  row.setPluginData('aria.accessible-name', 'Pagination');
  return row;
};
