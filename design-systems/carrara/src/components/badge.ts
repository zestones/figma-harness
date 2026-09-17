/* Badge: a state as a word on its tint, and Trend: a change as a signed value.
 * The word carries the meaning; the colour only repeats it. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { dot } from '../primitives/shapes.ts';
import { text } from '../primitives/text.ts';

export type BadgeTone = 'accent' | 'critical' | 'neutral' | 'positive' | 'warning';

export const BADGE_TONES: readonly BadgeTone[] = Object.freeze(['neutral', 'accent', 'positive', 'warning', 'critical']);

/** Fill, ink and mark of each tone. */
export const TONE_COLORS: Readonly<Record<BadgeTone, { readonly fill: ColorToken; readonly ink: ColorToken; readonly mark: ColorToken }>> = Object.freeze({
  neutral: { fill: 'status/neutral-subtle', ink: 'status/neutral', mark: 'status/neutral' },
  accent: { fill: 'accent/subtle', ink: 'accent/text', mark: 'accent/solid' },
  positive: { fill: 'status/positive-subtle', ink: 'status/positive', mark: 'status/positive' },
  warning: { fill: 'status/warning-subtle', ink: 'status/warning', mark: 'status/warning' },
  critical: { fill: 'status/critical-subtle', ink: 'status/critical', mark: 'status/critical' },
});

export interface BadgeOptions {
  /** A dot before the word. */
  dot?: boolean;
  icon?: IconName;
  label: string;
  tone?: BadgeTone;
}

export const badge = async function (options: BadgeOptions): Promise<FrameNode> {
  const tone = options.tone || 'neutral';
  const colors = TONE_COLORS[tone];
  const leading = options.dot || options.icon;
  const node = await frame({
    name: 'badge/' + tone, dir: 'H', gap: dim('space/6'), align: 'CENTER', radius: dim('radius/full'), fill: colors.fill,
    pad: [dim('space/2'), dim('space/8'), dim('space/2'), leading ? dim('space/6') : dim('space/8')],
  });
  if (options.dot) node.appendChild(dot(colors.mark));
  if (options.icon) node.appendChild(icon(options.icon, colors.ink, 16));
  node.appendChild(await text({ style: 'body/sm-medium', text: options.label, color: colors.ink }));
  return node;
};

export interface TrendOptions {
  direction: 'down' | 'up';
  /** Whether the change is good news; a rising value is, by default. */
  good?: boolean;
  /** The change, written with its sign, such as +12.4%. */
  value: string;
}

export const trend = async function (options: TrendOptions): Promise<FrameNode> {
  const good = options.good ?? options.direction === 'up';
  const colors = TONE_COLORS[good ? 'positive' : 'critical'];
  const node = await frame({
    name: 'trend/' + options.direction, dir: 'H', gap: dim('space/4'), align: 'CENTER', radius: dim('radius/full'),
    fill: colors.fill, pad: [dim('space/2'), dim('space/8'), dim('space/2'), dim('space/6')],
  });
  node.appendChild(icon(options.direction === 'up' ? 'arrow-trending-up' : 'arrow-trending-down', colors.ink, 16));
  node.appendChild(await text({ style: 'body/sm-medium', text: options.value, color: colors.ink }));
  node.setPluginData('aria.role', 'img');
  node.setPluginData('aria.accessible-name', (options.direction === 'up' ? 'Up ' : 'Down ') + options.value);
  return node;
};
