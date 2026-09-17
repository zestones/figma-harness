/* Components: Button and IconButton, as Primer React draws them. */

import { dim, type ControlSize } from '../foundations/dimensions.ts';
import { f as createFrame } from '@figma-harness/engine';
import { spinner } from '../primitives/glyph.ts';
import { icon, type IconName } from '../primitives/icons.ts';
import { withFocus } from '../primitives/focus.ts';
import { t as createText } from '../primitives/text.ts';
import { counterLabel } from './labels.ts';
import type { InteractionState } from './interaction-state.ts';
import {
  BUTTON_METRICS,
  resolveButtonAppearance,
  type ButtonVariant,
} from './button/model.ts';

export { BUTTON_METRICS, resolveButtonAppearance } from './button/model.ts';
export type { ButtonAppearance, ButtonMetrics, ButtonVariant } from './button/model.ts';

export interface ButtonOptions {
  count?: number;
  /** Looks unavailable yet stays focusable; the reason is announced. */
  inactive?: boolean;
  label: string;
  leadingVisual?: IconName;
  size?: ControlSize;
  state?: InteractionState;
  /** A dropdown affordance after the label. */
  trailingAction?: boolean;
  trailingVisual?: IconName;
  variant?: ButtonVariant;
  /** A block button fills this width and centres its content. */
  w?: number;
}

export interface IconButtonOptions {
  icon: IconName;
  /** The accessible name; an icon alone has none. */
  label: string;
  size?: ControlSize;
  state?: InteractionState;
  variant?: ButtonVariant;
}

const dimensionFor = function (size: ControlSize) {
  return dim(size === 'small' ? 'control/small/size' : size === 'large' ? 'control/large/size' : 'control/medium/size');
};

const finish = async function (frame: FrameNode, name: string, state: InteractionState, variant: ButtonVariant) {
  frame.setPluginData('aria.role', 'button');
  frame.setPluginData('aria.accessible-name', name);
  frame.setPluginData('aria.disabled', String(state === 'disabled'));
  frame.setPluginData('aria.busy', String(state === 'loading'));
  frame.setPluginData('spec.button.variant', variant);
  frame.setPluginData('spec.button.state', state);
  if (state === 'focus') await withFocus(frame, 'inset', { band: variant === 'primary' });
  return frame;
};

export const button = async function (options: ButtonOptions): Promise<FrameNode> {
  const variant = options.variant || 'default';
  const size = options.size || 'medium';
  const state = options.state || 'rest';
  const metrics = BUTTON_METRICS[size];
  const look = resolveButtonAppearance(variant, state, options.inactive);
  const parts: (SceneNode & LayoutMixin)[] = [];
  if (options.leadingVisual) parts.push(icon(options.leadingVisual, look.icon, 16));
  const label = await createText({ style: metrics.text, text: options.label, color: look.ink });
  parts.push(label);
  if (options.count != null) {
    parts.push(await counterLabel({
      count: options.count,
      variant: variant === 'primary' ? 'primary' : 'secondary',
      fill: variant === 'primary' ? 'buttonCounter/primary/bgColor/rest' : 'buttonCounter/default/bgColor/rest',
    }));
  }
  if (options.trailingVisual) parts.push(icon(options.trailingVisual, look.icon, 16));
  if (options.trailingAction) parts.push(icon('triangle-down', look.icon, 16));

  // Loading keeps the label's space and centres a spinner in it, as Primer does.
  if (state === 'loading') {
    const index = parts.indexOf(label);
    const space = await createFrame({
      name: 'label-space', dir: 'H', w: Math.ceil(label.width), h: label.height,
      justify: 'CENTER', align: 'CENTER',
    });
    space.appendChild(spinner(look.ink, 16));
    label.remove();
    parts[index] = space;
  }

  const content = parts.reduce((sum, part) => sum + part.width, 0) + metrics.gap * (parts.length - 1);
  const natural = Math.ceil(content) + metrics.paddingX * 2 + (options.trailingAction ? -4 : 0);
  const frame = await createFrame({
    name: 'button/' + options.label,
    dir: 'H',
    w: options.w || natural,
    h: dimensionFor(size),
    gap: dim(size === 'small' ? 'control/small/gap' : size === 'large' ? 'control/large/gap' : 'control/medium/gap'),
    pad: [0, metrics.paddingX + (options.trailingAction ? -4 : 0), 0, metrics.paddingX],
    justify: 'CENTER',
    align: 'CENTER',
    radius: dim('borderRadius/medium'),
    fill: look.fill,
    stroke: look.stroke,
    strokeW: 1,
    elevation: look.shadow,
  });
  for (const part of parts) frame.appendChild(part);
  if (options.w && options.w < natural) {
    throw new Error('button "' + options.label + '" needs ' + natural + ' px but was given ' + options.w);
  }
  if (options.inactive) frame.setPluginData('aria.inactive', 'true');
  return finish(frame, options.label, state, variant);
};

export const iconButton = async function (options: IconButtonOptions): Promise<FrameNode> {
  const variant = options.variant || 'default';
  const size = options.size || 'medium';
  const state = options.state || 'rest';
  const look = resolveButtonAppearance(variant, state);
  const frame = await createFrame({
    name: 'icon-button/' + options.icon,
    dir: 'H',
    w: dimensionFor(size),
    h: dimensionFor(size),
    justify: 'CENTER',
    align: 'CENTER',
    radius: dim('borderRadius/medium'),
    fill: look.fill,
    stroke: look.stroke,
    strokeW: 1,
    elevation: look.shadow,
  });
  // Primer mutes a default icon button's glyph; the label is its name.
  const ink = variant === 'default' && state !== 'disabled' ? 'fgColor/muted' : look.icon;
  frame.appendChild(state === 'loading' ? spinner(ink, 16) : icon(options.icon, ink, 16));
  return finish(frame, options.label, state, variant);
};
