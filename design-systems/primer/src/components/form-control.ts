/* FormControl: a label, the control, a validation message and a caption, in
 * Primer's order and spacing.
 * Decision: design-systems/primer/docs/adr/0005-form-states-and-action-feedback.md */

import { dim } from '../foundations/dimensions.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon } from '../primitives/icons.ts';
import { t as createText } from '../primitives/text.ts';

export type Validation = { readonly message: string; readonly variant: 'error' | 'success' };

export interface FormControlOptions {
  caption?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  validation?: Validation;
  w: number;
}

/** A validation message: a 12 px icon and a semibold 12 px sentence. */
export const validationMessage = async function (validation: Validation, width: number): Promise<FrameNode> {
  const error = validation.variant === 'error';
  const row = await createFrame({
    name: error ? 'validation/error' : 'validation/success',
    dir: 'H', w: width, gap: dim('base/size/4'), align: 'CENTER',
  });
  row.appendChild(icon(error ? 'alert-fill' : 'check-circle-fill', error ? 'fgColor/danger' : 'fgColor/success', 12));
  row.appendChild(await createText({
    style: 'body/small-600', text: validation.message, color: error ? 'fgColor/danger' : 'fgColor/success', w: width - 16,
  }));
  row.setPluginData('aria.live', error ? 'assertive' : 'polite');
  return row;
};

/** Wrap a text input, select or textarea; the control keeps its own states. */
export const formControl = async function (control: FrameNode, options: FormControlOptions): Promise<FrameNode> {
  const group = await createFrame({ name: 'form-control', dir: 'V', w: options.w, gap: dim('base/size/4') });
  // A disabled field's label and caption belong to the inactive control.
  group.setPluginData('aria.disabled', String(!!options.disabled));
  control.setPluginData('aria.required', String(!!options.required));
  control.setPluginData('aria.invalid', String(options.validation?.variant === 'error'));
  if (options.label) {
    const label = await createText({
      style: 'body/medium-600',
      text: options.label + (options.required ? ' *' : ''),
      color: options.disabled ? 'control/fgColor/disabled' : 'fgColor/default',
      w: options.w,
    });
    label.name = 'form-control/label';
    group.appendChild(label);
    control.setPluginData('aria.labelledby', label.id);
  }
  group.appendChild(control);
  const described: string[] = [];
  if (options.validation) {
    const message = await validationMessage(options.validation, options.w);
    group.appendChild(message);
    described.push(message.id);
  }
  if (options.caption) {
    const caption = await createText({
      style: 'body/small', text: options.caption, w: options.w,
      color: options.disabled ? 'control/fgColor/disabled' : 'fgColor/muted',
    });
    caption.name = 'form-control/caption';
    group.appendChild(caption);
    described.push(caption.id);
  }
  if (described.length) control.setPluginData('aria.describedby', described.join(' '));
  return group;
};
