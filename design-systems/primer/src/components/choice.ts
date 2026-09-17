/* Components: Checkbox, Radio, ToggleSwitch and SegmentedControl.
 *
 * A checkbox or radio is identified by its edge, so the unchecked edge uses
 * control/borderColor/emphasis (3:1 on the page). Selection changes the fill,
 * never only the mark. */

import { dim, type ControlSize } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame, spread } from '@figma-harness/engine';
import { glyph } from '../primitives/glyph.ts';
import { icon, type IconName } from '../primitives/icons.ts';
import { withFocus } from '../primitives/focus.ts';
import { t as createText } from '../primitives/text.ts';

export interface ChoiceOptions {
  caption?: string;
  checked?: boolean;
  disabled?: boolean;
  focused?: boolean;
  label?: string;
  /** Width available to the label and caption. */
  w?: number;
}

export interface CheckboxOptions extends ChoiceOptions {
  indeterminate?: boolean;
}

/* The checkmark and dash Primer masks onto a checked box. */
const CHECK = 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z';
const DASH = 'M3 8a.75.75 0 0 1 .75-.75h8.5a.75.75 0 0 1 0 1.5h-8.5A.75.75 0 0 1 3 8Z';

const labelled = async function (control: FrameNode, options: ChoiceOptions, name: string): Promise<FrameNode> {
  control.setPluginData('aria.checked', String(!!options.checked));
  control.setPluginData('aria.disabled', String(!!options.disabled));
  if (options.focused && !options.disabled) await withFocus(control, 'outset');
  if (!options.label) return control;
  control.setPluginData('aria.accessible-name', options.label);
  const width = options.w || 240;
  const row = await createFrame({ name: name + '/' + options.label, dir: 'H', w: width, gap: dim('base/size/8'), align: 'MIN' });
  row.setPluginData('aria.disabled', String(!!options.disabled));
  // Primer lowers the box by 2 px to sit on the first line of its label.
  const holder = await createFrame({ name: 'choice-control', dir: 'V', pad: [dim('base/size/2'), 0, 0, 0] });
  holder.appendChild(control);
  row.appendChild(holder);
  const text = await createFrame({ name: 'choice-text', dir: 'V', w: width - 24, gap: dim('base/size/4') });
  text.appendChild(await createText({
    style: 'body/medium', text: options.label, w: width - 24,
    color: options.disabled ? 'control/fgColor/disabled' : 'fgColor/default',
  }));
  if (options.caption) {
    text.appendChild(await createText({
      style: 'body/small', text: options.caption, w: width - 24,
      color: options.disabled ? 'control/fgColor/disabled' : 'fgColor/muted',
    }));
  }
  row.appendChild(text);
  return row;
};

export const checkbox = async function (options: CheckboxOptions = {}): Promise<FrameNode> {
  const selected = !!options.checked || !!options.indeterminate;
  let fill: ColorToken = 'bgColor/default';
  let stroke: ColorToken = 'control/borderColor/emphasis';
  if (options.disabled && selected) { fill = 'control/checked/bgColor/disabled'; stroke = 'control/checked/borderColor/disabled'; }
  else if (options.disabled) { fill = 'control/bgColor/disabled'; stroke = 'control/borderColor/disabled'; }
  else if (selected) { fill = 'control/checked/bgColor/rest'; stroke = 'control/checked/borderColor/rest'; }
  const box = await createFrame({
    name: 'checkbox', dir: 'H', w: dim('base/size/16'), h: dim('base/size/16'),
    justify: 'CENTER', align: 'CENTER', radius: dim('borderRadius/small'),
    fill, stroke, strokeW: 1,
  });
  if (selected) {
    box.appendChild(glyph(options.indeterminate ? 'checkbox-dash' : 'checkbox-check', [{
      d: options.indeterminate ? DASH : CHECK,
      token: options.disabled ? 'control/checked/fgColor/disabled' : 'control/checked/fgColor/rest',
    }], 12));
  }
  box.setPluginData('aria.role', 'checkbox');
  const result = await labelled(box, options, 'checkbox-row');
  if (options.indeterminate) box.setPluginData('aria.checked', 'mixed');
  return result;
};

export const radio = async function (options: ChoiceOptions = {}): Promise<FrameNode> {
  const checked = !!options.checked;
  const box = await createFrame({
    name: 'radio', w: dim('base/size/16'), h: dim('base/size/16'), radius: dim('borderRadius/full'),
    // The checked centre is the page showing through Primer's 4 px ring.
    fill: options.disabled && !checked ? 'control/bgColor/disabled' : 'bgColor/default',
    stroke: checked
      ? (options.disabled ? 'control/checked/borderColor/disabled' : 'control/checked/borderColor/rest')
      : (options.disabled ? 'control/borderColor/disabled' : 'control/borderColor/emphasis'),
    // A checked radio is a 4 px ring around the page-coloured centre.
    strokeW: checked ? 4 : 1,
  });
  box.setPluginData('aria.role', 'radio');
  return labelled(box, options, 'radio-row');
};

export interface ToggleSwitchOptions {
  disabled?: boolean;
  focused?: boolean;
  /** The accessible name of the setting the switch controls. */
  label: string;
  on?: boolean;
  size?: 'small' | 'medium';
}

/* Primer's switch glyphs: a bar on the "on" half, a ring on the "off" half. */
const LINE = 'M8 2a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-1.5 0V2.75A.75.75 0 0 1 8 2Z';
const CIRCLE = 'M8 12.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12Z';

/** A switch commits immediately and always states "On" or "Off" beside it. */
export const toggleSwitch = async function (options: ToggleSwitchOptions): Promise<FrameNode> {
  const on = !!options.on;
  const small = options.size === 'small';
  const width = small ? 48 : 64;
  const height = small ? 24 : 32;
  const track = await createFrame({
    name: 'toggle-switch', w: width, h: height, radius: dim('borderRadius/default'),
    fill: options.disabled ? 'controlTrack/bgColor/disabled' : on ? 'control/checked/bgColor/rest' : 'controlTrack/bgColor/rest',
    stroke: options.disabled ? null : on ? 'control/checked/borderColor/rest' : 'controlTrack/borderColor/rest',
    strokeW: 1,
  });
  const half = (width - 2) / 2;
  const glyphSize = small ? 12 : 16;
  const mark = glyph('toggle-glyph', [{
    d: on ? LINE : CIRCLE,
    token: options.disabled ? 'controlTrack/fgColor/disabled' : on ? 'control/checked/fgColor/rest' : 'controlTrack/fgColor/rest',
  }], glyphSize);
  track.appendChild(mark);
  mark.x = (on ? 1 : 1 + half) + (half - glyphSize) / 2;
  mark.y = (height - glyphSize) / 2;
  // The knob sits 1 px inside the border, takes half the track, and nests its
  // corners inside the track's: 6 px less the 2 px between them.
  const knob = await createFrame({
    name: 'toggle-knob', w: half, h: height - 4, radius: 4,
    fill: options.disabled ? 'controlKnob/bgColor/disabled' : 'controlKnob/bgColor/rest',
    stroke: options.disabled ? 'controlTrack/borderColor/disabled' : on ? 'controlKnob/borderColor/checked' : 'controlKnob/borderColor/rest',
    strokeW: 1,
  });
  track.appendChild(knob);
  knob.x = on ? width - 2 - half : 2;
  knob.y = 2;
  track.setPluginData('aria.role', 'switch');
  track.setPluginData('aria.checked', String(on));
  track.setPluginData('aria.accessible-name', options.label);
  track.setPluginData('aria.disabled', String(!!options.disabled));
  if (options.focused && !options.disabled) await withFocus(track, 'toggle');

  const row = await createFrame({ name: 'toggle-row', dir: 'H', gap: dim('base/size/8'), align: 'CENTER' });
  row.setPluginData('aria.disabled', String(!!options.disabled));
  const status = await createFrame({ name: 'toggle-status', dir: 'H', w: 28, justify: 'MAX' });
  status.appendChild(await createText({
    style: small ? 'body/small' : 'body/medium', text: on ? 'On' : 'Off',
    color: options.disabled ? 'fgColor/muted' : 'fgColor/default',
  }));
  row.appendChild(status);
  row.appendChild(track);
  return row;
};

export interface SegmentedOption {
  readonly icon?: IconName;
  readonly label: string;
  readonly selected?: boolean;
}

export interface SegmentedControlOptions {
  accessibleName: string;
  focusedIndex?: number;
  options: readonly SegmentedOption[];
  size?: ControlSize;
  /** Fill this width; otherwise each segment hugs its label. */
  w?: number;
}

/** Segments on a sunken track; the selected one is a raised knob with a semibold label. */
export const segmentedControl = async function (options: SegmentedControlOptions): Promise<FrameNode> {
  const small = options.size === 'small';
  const height = small ? 28 : 32;
  const track = await createFrame({
    name: 'segmented-control', dir: 'H', h: height, align: 'CENTER',
    radius: dim('borderRadius/medium'),
    fill: 'controlTrack/bgColor/rest', stroke: 'controlTrack/borderColor/rest', strokeW: 1,
  });
  const segments: FrameNode[] = [];
  let index = 0;
  for (const option of options.options) {
    const style = small ? 'body/small-600' : 'body/medium-600';
    // The label is sized at its selected weight, so selection never shifts the row.
    const measured = await createText({ style, text: option.label });
    const labelWidth = Math.ceil(measured.width);
    measured.remove();
    // 4 px inset, 1 px border and 8 px padding a side: the same width selected or not.
    const segment = await createFrame({
      name: 'segment/' + option.label, dir: 'H',
      w: labelWidth + (option.icon ? 24 : 0) + 26, h: height - 2,
      gap: dim('base/size/8'), justify: 'CENTER', align: 'CENTER',
      radius: dim('borderRadius/medium'),
      fill: option.selected ? 'controlKnob/bgColor/rest' : null,
      stroke: option.selected ? 'controlKnob/borderColor/rest' : null,
      strokeW: 1,
    });
    const ink: ColorToken = option.selected ? 'fgColor/default' : 'fgColor/muted';
    if (option.icon) segment.appendChild(icon(option.icon, ink, 16));
    segment.appendChild(await createText({
      style: option.selected ? style : (small ? 'body/small' : 'body/medium'),
      text: option.label, color: ink, w: labelWidth, align: 'CENTER',
    }));
    segment.setPluginData('aria.role', 'button');
    segment.setPluginData('aria.pressed', String(!!option.selected));
    if (options.focusedIndex === index) await withFocus(segment, 'edge');
    track.appendChild(segment);
    segments.push(segment);
    index++;
  }
  const natural = segments.reduce((sum, segment) => sum + segment.width, 0);
  const width = Math.max(options.w || 0, natural);
  track.resize(width, height);
  track.primaryAxisSizingMode = 'FIXED';
  track.counterAxisSizingMode = 'FIXED';
  if (width > natural) spread(track, width);
  track.setPluginData('aria.role', 'group');
  track.setPluginData('aria.accessible-name', options.accessibleName);
  return track;
};
