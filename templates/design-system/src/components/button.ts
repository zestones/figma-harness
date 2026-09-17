/* Button: a primary or secondary action in one of its states. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { withFocus } from '../primitives/focus.ts';
import { text } from '../primitives/text.ts';

export type ButtonVariant = 'primary' | 'secondary';
export type ButtonState = 'disabled' | 'focus' | 'hover' | 'rest';

export const BUTTON_STATES: readonly ButtonState[] = Object.freeze(['rest', 'hover', 'focus', 'disabled']);

export interface ButtonOptions {
  label: string;
  /** The layer name; `button/<label>` by default. */
  name?: string;
  state?: ButtonState;
  variant?: ButtonVariant;
}

interface Look {
  readonly fill: ColorToken;
  readonly ink: ColorToken;
  readonly stroke: ColorToken | null;
}

const look = function (variant: ButtonVariant, state: ButtonState): Look {
  if (state === 'disabled') return { fill: 'surface/disabled', ink: 'text/disabled', stroke: null };
  if (variant === 'primary') {
    return { fill: state === 'hover' ? 'accent/hover' : 'accent/default', ink: 'text/on-accent', stroke: null };
  }
  return { fill: state === 'hover' ? 'surface/subtle' : 'surface/page', ink: 'text/default', stroke: 'border/control' };
};

export const button = async function (options: ButtonOptions): Promise<FrameNode> {
  const variant = options.variant || 'secondary';
  const state = options.state || 'rest';
  const colors = look(variant, state);
  const node = await frame({
    name: options.name || 'button/' + options.label,
    dir: 'H', h: dim('control/height'), pad: [0, dim('space/16'), 0, dim('space/16')],
    justify: 'CENTER', align: 'CENTER', radius: dim('radius/medium'),
    fill: colors.fill, stroke: colors.stroke, strokeW: 1,
  });
  node.appendChild(await text({ style: 'body/strong', text: options.label, color: colors.ink }));
  node.setPluginData('aria.role', 'button');
  node.setPluginData('aria.accessible-name', options.label);
  node.setPluginData('aria.disabled', String(state === 'disabled'));
  if (state === 'focus') await withFocus(node);
  return node;
};
