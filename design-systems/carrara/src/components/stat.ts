/* Stat: a key figure with its label, its change and its recent trend. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { sparkline } from '../primitives/visualization.ts';
import { trend, type TrendOptions } from './badge.ts';
import { card } from './card.ts';

export interface StatOptions {
  /** What the change is measured against, such as "vs. last month". */
  caption?: string;
  icon?: IconName;
  label: string;
  /** The layer name; `stat/<label>` by default. */
  name?: string;
  /** Recent values, drawn as a sparkline. */
  series?: readonly number[];
  trend?: TrendOptions;
  value: string;
  w: number;
}

const SPARK_WIDTH = 80;

export const stat = async function (options: StatOptions): Promise<FrameNode> {
  const layout = await card({ w: options.w, name: options.name || 'stat/' + options.label, gap: 'space/8' });
  const width = layout.bodyWidth;
  const top = await frame({ name: 'stat-label', dir: 'H', w: width, gap: dim('space/8'), align: 'CENTER' });
  if (options.icon) top.appendChild(icon(options.icon, 'text/tertiary', 16));
  top.appendChild(await text({
    style: 'body/md-medium', text: options.label, color: 'text/secondary', truncate: true,
    w: width - (options.icon ? 24 : 0),
  }));
  layout.body.appendChild(top);
  layout.body.appendChild(await text({ style: 'display/md', text: options.value, w: width, truncate: true }));
  // The change and the sparkline share a row; the caption always has its own
  // line, so every card in a row has the same shape whatever its words measure.
  const change = options.trend ? await trend(options.trend) : null;
  const gap = dim('space/8').value;
  const sparkFits = !change || change.width + gap + SPARK_WIDTH <= width;
  const spark = options.series && sparkFits ? sparkline({
    label: options.label + ' over time', values: options.series, w: SPARK_WIDTH, h: 28,
  }) : null;
  if (change || spark) {
    // Figma spaces a space-between row itself, so its gap stays a plain number.
    const bottom = await frame({
      name: 'stat-change', dir: 'H', w: width, gap, align: 'CENTER', justify: change && spark ? 'SPACE_BETWEEN' : 'MIN',
    });
    if (change) bottom.appendChild(change);
    if (spark) bottom.appendChild(spark);
    layout.body.appendChild(bottom);
  }
  if (options.caption) {
    layout.body.appendChild(await text({ style: 'body/sm', text: options.caption, color: 'text/tertiary', w: width, truncate: true }));
  }
  layout.frame.setPluginData('aria.role', 'group');
  layout.frame.setPluginData('aria.accessible-name', options.label + ': ' + options.value);
  return layout.frame;
};
