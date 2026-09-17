/* Field: a labelled text input, and Select: a labelled choice. The label and
 * any message stay words; the edge only repeats the state. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { withFocus } from '../primitives/focus.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { kbd } from '../primitives/shapes.ts';
import { text } from '../primitives/text.ts';

export type FieldState = 'disabled' | 'error' | 'focus' | 'rest';

export const FIELD_STATES: readonly FieldState[] = Object.freeze(['rest', 'focus', 'error', 'disabled']);

export interface FieldOptions {
  /** A message under the field; in the error state it explains the error. */
  helper?: string;
  /** An icon before the value. */
  icon?: IconName;
  label?: string;
  /** The layer name of the input box; `field/<label>` by default. */
  name?: string;
  placeholder?: string;
  /** Text before the value, such as a currency symbol. */
  prefix?: string;
  required?: boolean;
  /** A keyboard shortcut shown at the end. */
  shortcut?: string;
  state?: FieldState;
  /** Text after the value, such as a currency code. */
  suffix?: string;
  /** An icon at the end, such as a chevron. */
  trailingIcon?: IconName;
  value?: string;
  w: number;
}

const EDGE: Readonly<Record<FieldState, ColorToken>> = Object.freeze({
  rest: 'border/control',
  focus: 'accent/solid',
  error: 'status/critical',
  disabled: 'border/default',
});

const build = async function (options: FieldOptions, role: string): Promise<FrameNode> {
  const state = options.state || 'rest';
  const disabled = state === 'disabled';
  const label = options.label || options.placeholder || 'Field';
  const column = await frame({ name: 'field-group', dir: 'V', w: options.w, gap: dim('space/6') });
  // A disabled field's label and helper belong to the inactive control.
  column.setPluginData('aria.disabled', String(disabled));
  if (options.label) {
    column.appendChild(await text({
      style: 'body/md-medium', text: options.label + (options.required ? ' *' : ''),
      color: disabled ? 'text/disabled' : 'text/primary', w: options.w, truncate: true,
    }));
  }
  const box = await frame({
    name: options.name || 'field/' + label, dir: 'H', w: options.w, h: dim('control/md'),
    pad: [0, dim('space/12'), 0, dim('space/12')], gap: dim('space/8'), align: 'CENTER', radius: dim('radius/sm'),
    fill: disabled ? 'bg/subtle' : 'bg/surface', stroke: EDGE[state], strokeW: 1, elevation: disabled ? null : 'shadow/xs',
  });
  const muted: ColorToken = disabled ? 'text/disabled' : 'text/tertiary';
  const ends: SceneNode[] = [];
  if (options.icon) box.appendChild(icon(options.icon, muted, 20));
  if (options.prefix) box.appendChild(await text({ style: 'body/md', text: options.prefix, color: muted }));
  if (options.suffix) ends.push(await text({ style: 'body/md', text: options.suffix, color: muted }));
  if (options.shortcut) ends.push(await kbd(options.shortcut));
  if (options.trailingIcon) ends.push(icon(options.trailingIcon, muted, 20));
  const used = box.children.reduce((sum, child) => sum + child.width, 0)
    + ends.reduce((sum, child) => sum + child.width, 0)
    + box.itemSpacing * (box.children.length + ends.length)
    + box.paddingLeft + box.paddingRight;
  const value = options.value || options.placeholder || '';
  box.appendChild(await text({
    style: 'body/md', text: value, w: options.w - used, truncate: true,
    color: disabled ? 'text/disabled' : options.value ? 'text/primary' : 'text/tertiary',
  }));
  for (const end of ends) box.appendChild(end);
  box.setPluginData('aria.role', role);
  box.setPluginData('aria.accessible-name', label);
  box.setPluginData('aria.disabled', String(disabled));
  box.setPluginData('aria.invalid', String(state === 'error'));
  box.setPluginData('aria.required', String(!!options.required));
  column.appendChild(box);
  if (options.helper) {
    const error = state === 'error';
    const message = await frame({ name: 'field-message', dir: 'H', w: options.w, gap: dim('space/6'), align: 'CENTER' });
    if (error) message.appendChild(icon('exclamation-circle', 'status/critical', 16));
    message.appendChild(await text({
      style: 'body/sm', text: options.helper, color: error ? 'status/critical' : 'text/tertiary',
      w: options.w - (error ? 22 : 0),
    }));
    column.appendChild(message);
  }
  if (state === 'focus') await withFocus(box);
  return column;
};

export const field = function (options: FieldOptions): Promise<FrameNode> {
  return build(options, options.icon === 'magnifying-glass' ? 'searchbox' : 'textbox');
};

export const select = function (options: Omit<FieldOptions, 'trailingIcon'>): Promise<FrameNode> {
  return build({ ...options, trailingIcon: 'chevron-up-down' }, 'combobox');
};
