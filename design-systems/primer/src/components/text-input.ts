/* Components: TextInput, Select and Textarea. */

import { CONTROL_SIZES, dim, type ControlSize } from '../foundations/dimensions.ts';
import { FOCUS } from '../foundations/focus.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon, type IconName } from '../primitives/icons.ts';
import { withFocus } from '../primitives/focus.ts';
import { t as createText } from '../primitives/text.ts';

export interface InputState {
  disabled?: boolean;
  focused?: boolean;
  validation?: 'error' | 'success';
}

export interface TextInputOptions extends InputState {
  /** The accessible name when no FormControl label is visible. */
  accessibleName: string;
  leadingVisual?: IconName;
  placeholder?: string;
  size?: ControlSize;
  trailingVisual?: IconName;
  value?: string;
  w: number;
}

export interface SelectOptions extends InputState {
  accessibleName: string;
  placeholder?: string;
  value?: string;
  w: number;
}

export interface TextareaOptions extends InputState {
  accessibleName: string;
  placeholder?: string;
  rows?: number;
  value?: string;
  w: number;
}

interface InputLook {
  fill: ColorToken;
  ink: ColorToken;
  stroke: ColorToken;
}

/* Primer's TextInputBaseWrapper: a white field, a 1 px border that turns accent
   on focus and danger on error, and an inset shadow at rest. */
export const inputAppearance = function (state: InputState): InputLook {
  if (state.disabled) {
    return { fill: 'control/bgColor/disabled', stroke: 'control/borderColor/disabled', ink: 'control/fgColor/disabled' };
  }
  const stroke: ColorToken = state.focused ? 'borderColor/accent-emphasis'
    : state.validation === 'error' ? 'control/borderColor/danger'
      : state.validation === 'success' ? 'control/borderColor/success'
        : 'control/borderColor/rest';
  return { fill: 'bgColor/default', stroke, ink: 'fgColor/default' };
};

const shell = async function (name: string, state: InputState, width: number, height: number, padLeft: number, padRight: number) {
  if (state.focused && state.validation === 'error') {
    throw new Error(name + ': Primer draws a focused invalid field with a danger outline; show one state at a time');
  }
  const look = inputAppearance(state);
  const frame = await createFrame({
    name,
    dir: 'H',
    w: width,
    h: height,
    gap: dim('base/size/8'),
    pad: [0, padRight, 0, padLeft],
    align: 'CENTER',
    radius: dim('borderRadius/medium'),
    fill: look.fill,
    stroke: look.stroke,
    strokeW: 1,
    elevation: state.disabled ? null : 'shadow/inset',
  });
  return { frame, look };
};

const finish = async function (frame: FrameNode, role: string, options: InputState & { accessibleName: string }) {
  frame.setPluginData('aria.role', role);
  frame.setPluginData('aria.accessible-name', options.accessibleName);
  frame.setPluginData('aria.disabled', String(!!options.disabled));
  frame.setPluginData('aria.invalid', String(options.validation === 'error'));
  if (options.focused && !options.disabled) {
    // Primer turns the border accent under the outline; the audit compares against the resting edge.
    frame.setPluginData(FOCUS.restEdgeKey, inputAppearance({ ...options, focused: false }).stroke);
    await withFocus(frame, 'edge');
  }
  return frame;
};

export const textInput = async function (options: TextInputOptions): Promise<FrameNode> {
  const size = options.size || 'medium';
  const small = size === 'small';
  const lead = !!options.leadingVisual;
  const trail = !!options.trailingVisual;
  const padLeft = lead ? (size === 'large' ? 12 : 8) : 12;
  const padRight = trail ? (size === 'large' ? 12 : 8) : 12;
  const { frame, look } = await shell('text-input', options, options.w, CONTROL_SIZES[size], padLeft, padRight);
  const iconInk: ColorToken = options.disabled ? 'control/fgColor/disabled' : 'fgColor/muted';
  if (options.leadingVisual) frame.appendChild(icon(options.leadingVisual, iconInk, 16));
  const textWidth = options.w - 2 - padLeft - padRight - (lead ? 24 : 0) - (trail ? 24 : 0);
  frame.appendChild(await createText({
    style: small ? 'body/small' : 'body/medium',
    text: options.value || options.placeholder || '',
    color: options.value || options.disabled ? look.ink : 'control/fgColor/placeholder',
    w: Math.max(1, textWidth), truncate: true,
  }));
  if (options.trailingVisual) frame.appendChild(icon(options.trailingVisual, iconInk, 16));
  return finish(frame, 'textbox', options);
};

export const select = async function (options: SelectOptions): Promise<FrameNode> {
  const { frame, look } = await shell('select', options, options.w, CONTROL_SIZES.medium, 12, 8);
  frame.appendChild(await createText({
    style: 'body/medium',
    text: options.value || options.placeholder || 'Choose an option',
    color: options.value || options.disabled ? look.ink : 'control/fgColor/placeholder',
    w: Math.max(1, options.w - 2 - 12 - 8 - 24), truncate: true,
  }));
  frame.appendChild(icon('triangle-down', options.disabled ? 'control/fgColor/disabled' : 'fgColor/default', 16));
  return finish(frame, 'combobox', options);
};

export const textarea = async function (options: TextareaOptions): Promise<FrameNode> {
  const look = inputAppearance(options);
  const rows = options.rows || 3;
  const frame = await createFrame({
    name: 'textarea',
    dir: 'V',
    w: options.w,
    pad: dim('base/size/12'),
    radius: dim('borderRadius/medium'),
    fill: look.fill,
    stroke: look.stroke,
    strokeW: 1,
    elevation: options.disabled ? null : 'shadow/inset',
  });
  const text = await createText({
    style: 'body/medium',
    text: options.value || options.placeholder || '',
    color: options.value || options.disabled ? look.ink : 'control/fgColor/placeholder',
    w: options.w - 26,
  });
  frame.appendChild(text);
  const minimum = rows * 21 + 26;
  if (frame.height < minimum) {
    frame.resize(options.w, minimum);
    frame.primaryAxisSizingMode = 'FIXED';
  }
  frame.setPluginData('aria.multiline', 'true');
  return finish(frame, 'textbox', options);
};
