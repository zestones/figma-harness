/* Components: ProgressBar. */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame } from '../../engine/node-factory.ts';

export interface ProgressSegment {
  readonly label: string;
  readonly token: ColorToken;
  readonly value: number;
}

export interface ProgressBarOptions {
  /** The words a reader hears: "3 of 5 checks passed". */
  accessibleName: string;
  segments: readonly ProgressSegment[];
  size?: 'small' | 'default' | 'large';
  /** The value the whole track stands for; defaults to 100. */
  total?: number;
  w: number;
}

/** A track with one or more segments separated by 2 px gaps. */
export const progressBar = async function (options: ProgressBarOptions): Promise<FrameNode> {
  const height = options.size === 'small' ? 5 : options.size === 'large' ? 10 : 8;
  const total = options.total || 100;
  const track = await createFrame({
    name: 'progress-bar', dir: 'H', w: options.w, h: height, gap: dim('base/size/2'),
    radius: dim('borderRadius/small'), fill: 'progressBar/track/bgColor', clip: true,
  });
  let remaining = options.w;
  let index = 0;
  for (const segment of options.segments) {
    if (segment.value <= 0) continue;
    const gap = index > 0 ? 2 : 0;
    const width = Math.min(remaining - gap, Math.max(2, Math.round(options.w * Math.min(1, segment.value / total)) - gap));
    if (width <= 0) break;
    remaining -= width + gap;
    track.appendChild(await createFrame({ name: 'segment/' + segment.label, w: width, h: height, fill: segment.token }));
    index++;
  }
  track.setPluginData('aria.role', 'progressbar');
  track.setPluginData('aria.accessible-name', options.accessibleName);
  return track;
};
