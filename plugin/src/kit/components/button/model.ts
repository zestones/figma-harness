/* Figma-free resolution of Primer's button variants, sizes and states. */

import type { ColorToken } from '../../foundations/colors.ts';
import type { ShadowName } from '../../foundations/elevation.ts';
import type { ControlSize } from '../../foundations/dimensions.ts';
import type { TextStyleName } from '../../foundations/typography.ts';
import type { InteractionState } from '../interaction-state.ts';

export type ButtonVariant = 'default' | 'primary' | 'invisible' | 'danger';

export interface ButtonAppearance {
  readonly fill: ColorToken | null;
  readonly icon: ColorToken;
  readonly ink: ColorToken;
  readonly shadow: ShadowName | null;
  readonly stroke: ColorToken | null;
}

export interface ButtonMetrics {
  readonly gap: number;
  readonly height: number;
  readonly paddingX: number;
  readonly text: TextStyleName;
}

/** Primer React's ButtonBase: height, inline padding, gap and label size. */
export const BUTTON_METRICS: Readonly<Record<ControlSize, ButtonMetrics>> = Object.freeze({
  small: Object.freeze({ height: 28, paddingX: 8, gap: 4, text: 'body/small-500' }),
  medium: Object.freeze({ height: 32, paddingX: 12, gap: 8, text: 'body/medium-500' }),
  large: Object.freeze({ height: 40, paddingX: 16, gap: 8, text: 'body/medium-500' }),
});

type Table = Readonly<Partial<Record<InteractionState, Partial<ButtonAppearance>>>>;

const REST: Readonly<Record<ButtonVariant, ButtonAppearance>> = Object.freeze({
  default: {
    fill: 'button/default/bgColor/rest', stroke: 'button/default/borderColor/rest',
    ink: 'button/default/fgColor/rest', icon: 'fgColor/muted', shadow: 'button/default/shadow/resting',
  },
  primary: {
    fill: 'button/primary/bgColor/rest', stroke: 'button/primary/borderColor/rest',
    ink: 'button/primary/fgColor/rest', icon: 'button/primary/fgColor/rest', shadow: 'shadow/resting/small',
  },
  invisible: {
    fill: null, stroke: null,
    ink: 'button/invisible/fgColor/rest', icon: 'button/invisible/iconColor/rest', shadow: null,
  },
  danger: {
    fill: 'button/danger/bgColor/rest', stroke: 'button/danger/borderColor/rest',
    ink: 'button/danger/fgColor/rest', icon: 'button/danger/iconColor/rest', shadow: 'button/default/shadow/resting',
  },
});

const STATES: Readonly<Record<ButtonVariant, Table>> = Object.freeze({
  default: {
    hover: { fill: 'button/default/bgColor/hover' },
    active: { fill: 'button/default/bgColor/active' },
    disabled: {
      fill: 'control/bgColor/disabled', stroke: 'button/default/borderColor/disabled',
      ink: 'button/default/fgColor/disabled', icon: 'button/default/fgColor/disabled', shadow: null,
    },
  },
  primary: {
    hover: { fill: 'button/primary/bgColor/hover' },
    active: { fill: 'button/primary/bgColor/active', shadow: 'button/primary/shadow/selected' },
    disabled: {
      fill: 'button/primary/bgColor/disabled', stroke: 'button/primary/borderColor/disabled',
      ink: 'button/primary/fgColor/disabled', icon: 'button/primary/fgColor/disabled', shadow: null,
    },
  },
  invisible: {
    hover: { fill: 'button/invisible/bgColor/hover' },
    active: { fill: 'button/invisible/bgColor/active' },
    disabled: { ink: 'button/invisible/fgColor/disabled', icon: 'button/invisible/fgColor/disabled' },
  },
  danger: {
    hover: {
      fill: 'button/danger/bgColor/hover', stroke: 'button/danger/borderColor/hover',
      ink: 'button/danger/fgColor/hover', icon: 'button/danger/iconColor/hover', shadow: 'shadow/resting/small',
    },
    active: {
      fill: 'button/danger/bgColor/active', stroke: 'button/danger/borderColor/hover',
      ink: 'button/danger/fgColor/hover', icon: 'button/danger/iconColor/hover', shadow: null,
    },
    disabled: {
      fill: 'button/danger/bgColor/disabled', stroke: 'button/default/borderColor/disabled',
      ink: 'button/danger/fgColor/disabled', icon: 'button/danger/fgColor/disabled', shadow: null,
    },
  },
});

/** Primer's inactive button: looks unavailable, stays focusable and explains why. */
const INACTIVE: ButtonAppearance = Object.freeze({
  fill: 'button/inactive/bgColor', stroke: null,
  ink: 'button/inactive/fgColor', icon: 'button/inactive/fgColor', shadow: null,
});

/** Resolve a button's tokens without creating a Figma node. Focus and loading
 *  keep the resting surface; they add a ring or a spinner. */
export const resolveButtonAppearance = function (
  variant: ButtonVariant = 'default',
  state: InteractionState = 'rest',
  inactive = false,
): ButtonAppearance {
  if (inactive) return INACTIVE;
  return Object.freeze({ ...REST[variant], ...(STATES[variant][state] || {}) });
};
