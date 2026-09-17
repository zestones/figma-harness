/* Checkbox and Switch: a choice that is on or off, always with its label. */

import { P as tokenPaint, abs, f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { withFocus } from '../primitives/focus.ts';
import { icon } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';

export interface ChoiceOptions {
  checked: boolean;
  /** A line under the label. */
  description?: string;
  focused?: boolean;
  label: string;
  /** The layer name, which flows select. */
  name?: string;
  w: number;
}

/* `named` is the layer that carries the control's role; it may sit inside `control`. */
const labelled = async function (
  options: ChoiceOptions,
  control: FrameNode,
  prefix: string,
  named: FrameNode = control,
): Promise<FrameNode> {
  const row = await frame({
    name: options.name || prefix + '/' + options.label, dir: 'H', w: options.w, gap: dim('space/12'), align: 'MIN',
  });
  row.appendChild(control);
  const width = options.w - control.width - row.itemSpacing;
  const words = await frame({ name: prefix + '-text', dir: 'V', w: width, gap: dim('space/2') });
  words.appendChild(await text({ style: 'body/md-medium', text: options.label, w: width }));
  if (options.description) {
    words.appendChild(await text({ style: 'body/sm', text: options.description, color: 'text/tertiary', w: width }));
  }
  row.appendChild(words);
  named.setPluginData('aria.accessible-name', options.label);
  if (options.focused) await withFocus(control);
  return row;
};

export const checkbox = async function (options: ChoiceOptions): Promise<FrameNode> {
  const box = await frame({
    name: 'checkbox-box', dir: 'H', w: 16, h: 16, justify: 'CENTER', align: 'CENTER', radius: dim('radius/xs'),
    fill: options.checked ? 'accent/solid' : 'bg/surface',
    stroke: options.checked ? null : 'border/control', strokeW: 1,
  });
  if (options.checked) box.appendChild(icon('check', 'text/on-accent', 16));
  box.setPluginData('aria.role', 'checkbox');
  box.setPluginData('aria.checked', String(options.checked));
  // The box sits on the label's first line.
  const holder = await frame({ name: 'checkbox', dir: 'H', h: 20, align: 'CENTER' });
  holder.appendChild(box);
  const row = await labelled({ ...options, focused: false }, holder, 'checkbox', box);
  if (options.focused) await withFocus(box);
  return row;
};

export const toggle = async function (options: ChoiceOptions): Promise<FrameNode> {
  const track = await frame({
    name: 'switch', w: 36, h: 20, radius: dim('radius/full'),
    fill: options.checked ? 'accent/solid' : 'control/track',
  });
  const knob = figma.createEllipse();
  knob.name = 'switch-knob';
  knob.resize(16, 16);
  knob.fills = [tokenPaint('bg/surface')];
  abs(track, knob, options.checked ? 18 : 2, 2);
  track.setPluginData('aria.role', 'switch');
  track.setPluginData('aria.checked', String(options.checked));
  return labelled(options, track, 'switch');
};
