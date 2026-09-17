/* Button: an action, as text with an optional icon, or as an icon alone. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { withFocus } from '../primitives/focus.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';

export type ButtonVariant = 'danger' | 'ghost' | 'primary' | 'secondary';
export type ButtonSize = 'md' | 'sm';
export type ButtonState = 'disabled' | 'focus' | 'hover' | 'rest';

export const BUTTON_VARIANTS: readonly ButtonVariant[] = Object.freeze(['primary', 'secondary', 'ghost', 'danger']);
export const BUTTON_STATES: readonly ButtonState[] = Object.freeze(['rest', 'hover', 'focus', 'disabled']);

interface Look {
  readonly fill: ColorToken | null;
  readonly icon: ColorToken;
  readonly ink: ColorToken;
  readonly raised: boolean;
  readonly stroke: ColorToken | null;
}

const look = function (variant: ButtonVariant, state: ButtonState): Look {
  const hover = state === 'hover';
  if (state === 'disabled') {
    return {
      fill: variant === 'ghost' ? null : 'bg/subtle',
      ink: 'text/disabled',
      icon: 'text/disabled',
      stroke: variant === 'secondary' ? 'border/default' : null,
      raised: false,
    };
  }
  if (variant === 'primary') {
    return { fill: hover ? 'accent/solid-hover' : 'accent/solid', ink: 'text/on-accent', icon: 'text/on-accent', stroke: null, raised: true };
  }
  if (variant === 'danger') {
    return {
      fill: hover ? 'status/critical-solid-hover' : 'status/critical-solid',
      ink: 'text/on-accent', icon: 'text/on-accent', stroke: null, raised: true,
    };
  }
  if (variant === 'secondary') {
    return { fill: hover ? 'bg/subtle' : 'bg/surface', ink: 'text/primary', icon: 'text/secondary', stroke: 'border/control', raised: true };
  }
  return {
    fill: hover ? 'bg/subtle' : null,
    ink: hover ? 'text/primary' : 'text/secondary',
    icon: hover ? 'text/primary' : 'text/secondary',
    stroke: null,
    raised: false,
  };
};

const describe = function (node: FrameNode, label: string, state: ButtonState): void {
  node.setPluginData('aria.role', 'button');
  node.setPluginData('aria.accessible-name', label);
  node.setPluginData('aria.disabled', String(state === 'disabled'));
};

export interface ButtonOptions {
  /** An icon before the label. */
  icon?: IconName;
  /** An icon after the label, such as a chevron. */
  iconAfter?: IconName;
  label: string;
  /** The layer name, which flows select; `button/<label>` by default. */
  name?: string;
  size?: ButtonSize;
  state?: ButtonState;
  variant?: ButtonVariant;
}

export const button = async function (options: ButtonOptions): Promise<FrameNode> {
  const size = options.size || 'md';
  const state = options.state || 'rest';
  const colors = look(options.variant || 'secondary', state);
  const side = dim(size === 'sm' ? 'space/12' : 'space/16');
  const inner = dim(size === 'sm' ? 'space/8' : 'space/12');
  const node = await frame({
    name: options.name || 'button/' + options.label,
    dir: 'H', h: dim(size === 'sm' ? 'control/sm' : 'control/md'), gap: dim('space/6'),
    pad: [0, options.iconAfter ? inner : side, 0, options.icon ? inner : side],
    justify: 'CENTER', align: 'CENTER', radius: dim('radius/sm'),
    fill: colors.fill || false, stroke: colors.stroke, strokeW: 1, elevation: colors.raised ? 'shadow/xs' : null,
  });
  const glyph = size === 'sm' ? 16 : 20;
  if (options.icon) node.appendChild(icon(options.icon, colors.icon, glyph));
  node.appendChild(await text({ style: 'body/md-medium', text: options.label, color: colors.ink }));
  if (options.iconAfter) node.appendChild(icon(options.iconAfter, colors.icon, glyph));
  describe(node, options.label, state);
  if (state === 'focus') await withFocus(node);
  return node;
};

export interface IconButtonOptions {
  icon: IconName;
  /** What the button does, for assistive technology. */
  label: string;
  /** The layer name; `icon-button/<label>` by default. */
  name?: string;
  size?: ButtonSize;
  state?: ButtonState;
  variant?: 'ghost' | 'secondary';
}

export const iconButton = async function (options: IconButtonOptions): Promise<FrameNode> {
  const size = options.size || 'md';
  const state = options.state || 'rest';
  const colors = look(options.variant || 'ghost', state);
  const edge = dim(size === 'sm' ? 'control/sm' : 'control/md');
  const node = await frame({
    name: options.name || 'icon-button/' + options.label,
    dir: 'H', w: edge, h: edge, justify: 'CENTER', align: 'CENTER', radius: dim('radius/sm'),
    fill: colors.fill || false, stroke: colors.stroke, strokeW: 1, elevation: colors.raised ? 'shadow/xs' : null,
  });
  node.appendChild(icon(options.icon, colors.icon, size === 'sm' ? 16 : 20));
  describe(node, options.label, state);
  if (state === 'focus') await withFocus(node);
  return node;
};
