/* Avatar: a person's or a company's initials in a circle. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import type { TextStyleName } from '../foundations/typography.ts';
import { text } from './text.ts';

export type AvatarSize = 24 | 32 | 40;
export type AvatarTone = 'accent' | 'neutral';

export const AVATAR_SIZES: readonly AvatarSize[] = Object.freeze([24, 32, 40]);

export interface AvatarOptions {
  initials: string;
  /** The person or company, for assistive technology. */
  label: string;
  size?: AvatarSize;
  tone?: AvatarTone;
}

const LOOK: Readonly<Record<AvatarTone, readonly [ColorToken, ColorToken]>> = Object.freeze({
  accent: ['accent/subtle', 'accent/text'],
  neutral: ['bg/muted', 'text/secondary'],
});

export const avatar = async function (options: AvatarOptions): Promise<FrameNode> {
  const size = options.size || 32;
  const [fill, ink] = LOOK[options.tone || 'accent'];
  const node = await frame({
    name: 'avatar', dir: 'H', w: size, h: size, radius: dim('radius/full'), fill,
    justify: 'CENTER', align: 'CENTER',
  });
  const style: TextStyleName = size >= 40 ? 'body/md-medium' : 'body/sm-medium';
  node.appendChild(await text({ style, text: options.initials.slice(0, 2).toUpperCase(), color: ink }));
  node.setPluginData('aria.role', 'img');
  node.setPluginData('aria.accessible-name', options.label);
  return node;
};
