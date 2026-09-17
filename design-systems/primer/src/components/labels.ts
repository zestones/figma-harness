/* Components: Label, StateLabel, CounterLabel, Token and BranchName. */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { STATUS, type StatusKind } from '../foundations/semantics.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon, type IconName } from '../primitives/icons.ts';
import { t as createText } from '../primitives/text.ts';

export type LabelVariant = 'default' | 'secondary' | 'accent' | 'success' | 'attention' | 'severe' | 'danger' | 'done';

export interface LabelOptions {
  size?: 'small' | 'large';
  text: string;
  variant?: LabelVariant;
}

/* Primer paints a Label's border with the family's emphasis colour. Figma
   scopes Primer's background tokens to fills, so the border family carries it. */
const LABEL_COLORS: Readonly<Record<LabelVariant, readonly [stroke: ColorToken, ink: ColorToken]>> = Object.freeze({
  default: ['borderColor/default', 'fgColor/default'],
  secondary: ['borderColor/muted', 'fgColor/muted'],
  accent: ['borderColor/accent-emphasis', 'fgColor/accent'],
  success: ['borderColor/success-emphasis', 'fgColor/success'],
  attention: ['borderColor/attention-emphasis', 'fgColor/attention'],
  severe: ['borderColor/severe-emphasis', 'fgColor/severe'],
  danger: ['borderColor/danger-emphasis', 'fgColor/danger'],
  done: ['borderColor/done-emphasis', 'fgColor/done'],
});

/** A metadata label: an outlined pill, 20 or 24 px tall. */
export const label = async function (options: LabelOptions): Promise<FrameNode> {
  const variant = options.variant || 'default';
  const large = options.size === 'large';
  const [stroke, ink] = LABEL_COLORS[variant];
  const frame = await createFrame({
    name: 'label/' + options.text,
    dir: 'H',
    h: dim(large ? 'base/size/24' : 'base/size/20'),
    pad: [0, dim(large ? 'base/size/8' : 'base/size/6'), 0, dim(large ? 'base/size/8' : 'base/size/6')],
    align: 'CENTER',
    radius: dim('borderRadius/full'),
    stroke,
    strokeW: 1,
  });
  frame.appendChild(await createText({ style: 'label/small', text: options.text, color: ink }));
  frame.setPluginData('spec.label.variant', variant);
  return frame;
};

export type StateLabelStatus = 'open' | 'closed' | 'done' | 'draft' | 'queued' | 'unavailable';

const STATE_FAMILIES: Readonly<Record<StateLabelStatus, StatusKind>> = Object.freeze({
  open: 'open',
  closed: 'closed',
  done: 'done',
  draft: 'draft',
  queued: 'attention',
  unavailable: 'neutral',
});

export interface StateLabelOptions {
  icon?: IconName;
  size?: 'small' | 'medium';
  status: StateLabelStatus;
  text: string;
}

/** The state of an object: always a word and an icon on an emphasis fill. */
export const stateLabel = async function (options: StateLabelOptions): Promise<FrameNode> {
  const family = STATUS[STATE_FAMILIES[options.status]];
  const medium = options.size !== 'small';
  const frame = await createFrame({
    name: 'state-label/' + options.status,
    dir: 'H',
    h: medium ? 32 : 24,
    gap: dim('base/size/4'),
    pad: [0, dim(medium ? 'base/size/12' : 'base/size/8'), 0, dim(medium ? 'base/size/12' : 'base/size/8')],
    align: 'CENTER',
    radius: dim('borderRadius/full'),
    fill: family.emphasis,
    stroke: family.emphasisBorder,
    strokeW: 1,
  });
  if (options.icon) frame.appendChild(icon(options.icon, 'fgColor/onEmphasis', medium ? 16 : 12));
  frame.appendChild(await createText({
    style: medium ? 'body/medium-600' : 'body/small-600', text: options.text, color: 'fgColor/onEmphasis',
  }));
  frame.setPluginData('aria.role', 'status');
  frame.setPluginData('aria.accessible-name', options.text);
  return frame;
};

export interface CounterLabelOptions {
  count: number | string;
  /** Tokens for a counter inside a button; the button's variant decides them. */
  fill?: ColorToken;
  variant?: 'primary' | 'secondary';
}

/** A count: 12 px semibold in an 18 px capsule. */
export const counterLabel = async function (options: CounterLabelOptions): Promise<FrameNode> {
  const primary = options.variant === 'primary';
  const text = await createText({
    style: 'label/small-600',
    text: String(options.count),
    color: primary ? 'fgColor/onEmphasis' : 'fgColor/default',
  });
  // 2 px padding and a 1 px transparent border on each side, as Primer draws it.
  const frame = await createFrame({
    name: 'counter',
    dir: 'H',
    w: Math.ceil(text.width) + 14,
    h: 18,
    justify: 'CENTER',
    align: 'CENTER',
    radius: dim('borderRadius/full'),
    fill: options.fill || (primary ? 'counter/bgColor/emphasis' : 'counter/bgColor/muted'),
  });
  frame.appendChild(text);
  return frame;
};

export interface TokenOptions {
  icon?: IconName;
  selected?: boolean;
  size?: 'small' | 'medium' | 'large';
  text: string;
}

const TOKEN_SIZES = Object.freeze({
  small: { height: 16, padding: 'base/size/4', text: 'label/small-600' },
  medium: { height: 20, padding: 'base/size/6', text: 'label/small-600' },
  large: { height: 24, padding: 'base/size/8', text: 'label/small-600' },
} as const);

/** A token: a removable-looking value such as a filter or an environment. */
export const token = async function (options: TokenOptions): Promise<FrameNode> {
  const metrics = TOKEN_SIZES[options.size || 'medium'];
  const frame = await createFrame({
    name: 'token/' + options.text,
    dir: 'H',
    h: metrics.height,
    gap: dim('base/size/4'),
    pad: [0, dim(metrics.padding), 0, dim(metrics.padding)],
    align: 'CENTER',
    radius: dim('borderRadius/full'),
    fill: 'bgColor/neutral-muted',
    stroke: options.selected ? 'borderColor/emphasis' : 'borderColor/muted',
    strokeW: 1,
  });
  const ink: ColorToken = options.selected ? 'fgColor/default' : 'fgColor/muted';
  if (options.icon) frame.appendChild(icon(options.icon, ink, 12));
  frame.appendChild(await createText({ style: metrics.text, text: options.text, color: ink }));
  return frame;
};

/** A branch or reference name, in the monospace face on the accent tint. */
export const branchName = async function (name: string, link = true): Promise<FrameNode> {
  const frame = await createFrame({
    name: 'branch/' + name,
    dir: 'H',
    pad: [dim('base/size/2'), dim('base/size/6'), dim('base/size/2'), dim('base/size/6')],
    align: 'CENTER',
    radius: dim('borderRadius/medium'),
    fill: 'bgColor/accent-muted',
  });
  frame.appendChild(await createText({ style: 'code/small', text: name, color: link ? 'fgColor/link' : 'fgColor/muted' }));
  return frame;
};
