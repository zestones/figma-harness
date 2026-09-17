/* Progress: how far a value has come, and BarList: shares of a whole, each
 * named and valued in words. */

import { abs, f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { text } from '../primitives/text.ts';

const bar = async function (width: number, share: number): Promise<FrameNode> {
  const track = await frame({ name: 'progress-track', w: width, h: 6, radius: dim('radius/full'), fill: 'bg/muted' });
  const filled = await frame({
    name: 'progress-value', w: Math.max(6, Math.round(width * Math.min(1, Math.max(0, share)))), h: 6,
    radius: dim('radius/full'), fill: 'accent/solid',
  });
  abs(track, filled, 0, 0);
  return track;
};

/* Half a row, less half its gap. */
const half = function (width: number, gap: number): number {
  return Math.floor((width - gap) / 2);
};

export interface ProgressOptions {
  /** Such as "$18,420 of $25,000". */
  detail?: string;
  label: string;
  /** Between 0 and 1. */
  value: number;
  w: number;
}

export const progress = async function (options: ProgressOptions): Promise<FrameNode> {
  const root = await frame({ name: 'progress/' + options.label, dir: 'V', w: options.w, gap: dim('space/8') });
  // Figma spaces a space-between row itself, so its gap stays a plain number.
  const top = await frame({
    name: 'progress-label', dir: 'H', w: options.w, gap: dim('space/12').value, align: 'CENTER', justify: 'SPACE_BETWEEN',
  });
  // The detail takes at most half the row, and the label the rest.
  const detail = options.detail ? await text({
    style: 'body/sm', text: options.detail, color: 'text/tertiary', maxW: half(options.w, top.itemSpacing),
  }) : null;
  top.appendChild(await text({
    style: 'body/md-medium', text: options.label, maxW: options.w - (detail ? detail.width + top.itemSpacing : 0),
  }));
  if (detail) top.appendChild(detail);
  root.appendChild(top);
  root.appendChild(await bar(options.w, options.value));
  root.setPluginData('aria.role', 'progressbar');
  root.setPluginData('aria.accessible-name', options.label);
  root.setPluginData('aria.valuenow', String(Math.round(options.value * 100)));
  return root;
};

export interface BarListRow {
  label: string;
  /** Between 0 and 1. */
  share: number;
  value: string;
}

export const barList = async function (rows: readonly BarListRow[], width: number): Promise<FrameNode> {
  if (!rows.length) throw new Error('a bar list needs at least one row; show an empty state instead');
  const root = await frame({ name: 'bar-list', dir: 'V', w: width, gap: dim('space/16') });
  for (const row of rows) {
    const item = await frame({ name: 'bar/' + row.label, dir: 'V', w: width, gap: dim('space/8') });
    const top = await frame({
      name: 'bar-label', dir: 'H', w: width, gap: dim('space/12').value, align: 'CENTER', justify: 'SPACE_BETWEEN',
    });
    const value = await text({ style: 'body/md-medium', text: row.value, maxW: half(width, top.itemSpacing) });
    top.appendChild(await text({ style: 'body/md', text: row.label, color: 'text/secondary', maxW: width - value.width - top.itemSpacing }));
    top.appendChild(value);
    item.appendChild(top);
    item.appendChild(await bar(width, row.share));
    item.setPluginData('aria.role', 'listitem');
    root.appendChild(item);
  }
  root.setPluginData('aria.role', 'list');
  return root;
};
