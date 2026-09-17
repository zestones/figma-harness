/* Components: Banner, Blankslate, InlineMessage and skeletons.
 * Decision: design-systems/primer/docs/adr/0005-form-states-and-action-feedback.md */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { STATUS, type StatusKind } from '../foundations/semantics.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon, type IconName } from '../primitives/icons.ts';
import { t as createText } from '../primitives/text.ts';
import { iconButton } from './button.ts';

export type BannerVariant = 'critical' | 'info' | 'success' | 'warning';

const BANNER: Readonly<Record<BannerVariant, { readonly family: StatusKind; readonly icon: IconName }>> = Object.freeze({
  critical: { family: 'danger', icon: 'stop' },
  info: { family: 'accent', icon: 'info' },
  success: { family: 'success', icon: 'check-circle' },
  warning: { family: 'attention', icon: 'alert' },
});

export interface BannerOptions {
  /** Buttons after the message, most important first. */
  actions?: readonly FrameNode[];
  description?: string;
  /** A dismiss button; its node name is `<name>/dismiss`. */
  dismissible?: boolean;
  name?: string;
  title: string;
  variant: BannerVariant;
  w: number;
}

/** A banner: the family's tint and border, its icon, a title and a sentence. */
export const banner = async function (options: BannerOptions): Promise<FrameNode> {
  const spec = BANNER[options.variant];
  const family = STATUS[spec.family];
  const name = options.name || 'banner/' + options.variant;
  const frame = await createFrame({
    name, dir: 'H', w: options.w, gap: 0, pad: dim('base/size/8'), align: 'MIN',
    radius: dim('borderRadius/medium'), fill: family.muted, stroke: family.mutedBorder, strokeW: 1,
  });
  const visual = await createFrame({ name: 'banner/icon', dir: 'H', pad: dim('base/size/8') });
  visual.appendChild(icon(spec.icon, family.fg, 20));
  frame.appendChild(visual);
  const dismissWidth = options.dismissible ? 36 : 0;
  const bodyWidth = options.w - 16 - 36 - dismissWidth;
  const body = await createFrame({
    name: 'banner/content', dir: 'V', w: bodyWidth, gap: dim('base/size/4'),
    pad: [dim('base/size/8'), 0, dim('base/size/8'), 0],
  });
  body.appendChild(await createText({ style: 'body/medium-600', text: options.title, color: 'fgColor/default', w: bodyWidth }));
  if (options.description) {
    body.appendChild(await createText({ style: 'body/medium', text: options.description, color: 'fgColor/default', w: bodyWidth }));
  }
  if (options.actions?.length) {
    const actions = await createFrame({
      name: 'banner/actions', dir: 'H', gap: dim('base/size/8'), align: 'CENTER', pad: [dim('base/size/4'), 0, 0, 0],
    });
    for (const action of options.actions) actions.appendChild(action);
    body.appendChild(actions);
  }
  frame.appendChild(body);
  if (options.dismissible) {
    const dismiss = await iconButton({ icon: 'x', label: 'Dismiss', variant: 'invisible' });
    dismiss.name = name + '/dismiss';
    const holder = await createFrame({ name: 'banner/dismiss', dir: 'H', pad: [0, 0, 0, dim('base/size/4')] });
    holder.appendChild(dismiss);
    frame.appendChild(holder);
  }
  frame.setPluginData('aria.role', options.variant === 'critical' ? 'alert' : 'status');
  frame.setPluginData('aria.live', options.variant === 'critical' ? 'assertive' : 'polite');
  frame.setPluginData('aria.accessible-name', options.title);
  return frame;
};

export interface BlankslateOptions {
  actions?: readonly FrameNode[];
  border?: boolean;
  description: string;
  heading: string;
  icon: IconName;
  name?: string;
  spacious?: boolean;
  w: number;
}

/** The interface saying there is nothing here, and what to do about it. */
export const blankslate = async function (options: BlankslateOptions): Promise<FrameNode> {
  const frame = await createFrame({
    name: options.name || 'blankslate', dir: 'V', w: options.w, align: 'CENTER', gap: 0,
    pad: options.spacious
      ? [dim('base/size/44'), dim('base/size/28'), dim('base/size/44'), dim('base/size/28')]
      : dim('base/size/20'),
    radius: options.border ? dim('borderRadius/medium') : undefined,
    stroke: options.border ? 'borderColor/default' : null,
    strokeW: 1,
  });
  const inner = options.w - (options.spacious ? 56 : 40);
  const visual = await createFrame({ name: 'blankslate/visual', dir: 'H', pad: [0, 0, dim('base/size/8'), 0] });
  visual.appendChild(icon(options.icon, 'fgColor/muted', 24));
  frame.appendChild(visual);
  const heading = await createText({ style: 'title/small', text: options.heading, w: inner, align: 'CENTER' });
  const headingBox = await createFrame({ name: 'blankslate/heading', dir: 'V', pad: [0, 0, dim('base/size/4'), 0] });
  headingBox.appendChild(heading);
  frame.appendChild(headingBox);
  frame.appendChild(await createText({
    style: 'body/medium', text: options.description, color: 'fgColor/muted', w: inner, align: 'CENTER',
  }));
  if (options.actions?.length) {
    const actions = await createFrame({
      name: 'blankslate/actions', dir: 'V', gap: dim('base/size/8'), align: 'CENTER', pad: [dim('base/size/16'), 0, 0, 0],
    });
    for (const action of options.actions) actions.appendChild(action);
    frame.appendChild(actions);
  }
  return frame;
};

export type InlineMessageVariant = 'critical' | 'success' | 'warning' | 'unavailable';

const INLINE: Readonly<Record<InlineMessageVariant, readonly [ColorToken, IconName]>> = Object.freeze({
  critical: ['fgColor/danger', 'alert-fill'],
  success: ['fgColor/success', 'check-circle-fill'],
  warning: ['fgColor/attention', 'alert-fill'],
  unavailable: ['fgColor/muted', 'alert-fill'],
});

/** A short status sentence with its icon, in the family's ink. */
export const inlineMessage = async function (
  variant: InlineMessageVariant,
  text: string,
  width: number,
): Promise<FrameNode> {
  const [ink, glyph] = INLINE[variant];
  const row = await createFrame({ name: 'inline-message/' + variant, dir: 'H', w: width, gap: dim('base/size/8'), align: 'CENTER' });
  row.appendChild(icon(glyph, ink, 16));
  row.appendChild(await createText({ style: 'body/medium', text, color: ink, w: width - 24 }));
  row.setPluginData('aria.live', variant === 'critical' ? 'assertive' : 'polite');
  return row;
};

/** A loading placeholder in Primer's skeleton tint. */
export const skeletonBox = function (width: number, height = 16): Promise<FrameNode> {
  return createFrame({
    name: 'skeleton', w: width, h: height, radius: dim('borderRadius/small'), fill: 'skeletonLoader/bgColor',
  });
};
