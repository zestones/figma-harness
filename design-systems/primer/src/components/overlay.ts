/* Components: Dialog, Tooltip and the overlay backdrop. */

import { dim, OVERLAY_WIDTHS } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { FOCUS } from '../foundations/focus.ts';
import { f as createFrame, strut as createStrut, strutForRow } from '@figma-harness/engine';
import { t as createText } from '../primitives/text.ts';
import { iconButton } from './button.ts';

export interface DialogOptions {
  body: (width: number) => Promise<FrameNode | TextNode>;
  /** Footer buttons, in reading order; the last is the primary action. */
  footer?: readonly FrameNode[];
  /** Node name; the close button is `<name>/close`. */
  name?: string;
  subtitle?: string;
  title: string;
  w?: number;
}

/** A modal dialog: 12 px corners, a floating shadow, header, body and footer. */
export const dialog = async function (options: DialogOptions): Promise<FrameNode> {
  const width = options.w || OVERLAY_WIDTHS.medium;
  const name = options.name || 'dialog';
  const frame = await createFrame({
    name, dir: 'V', w: width, gap: 0, clip: true,
    radius: dim('borderRadius/large'), fill: 'overlay/bgColor',
    stroke: 'overlay/borderColor', strokeW: 1, elevation: 'shadow/floating/small',
  });
  const header = await createFrame({
    name: 'dialog/header', dir: 'H', w: width, pad: dim('base/size/8'), align: 'MIN',
    stroke: 'borderColor/default', strokeSide: 'Bottom', strokeW: 1,
  });
  const close = await iconButton({ icon: 'x', label: 'Close', variant: 'invisible' });
  close.name = name + '/close';
  const titleWidth = width - 16 - 32;
  const titles = await createFrame({
    name: 'dialog/titles', dir: 'V', w: titleWidth,
    pad: [dim('base/size/6'), dim('base/size/8'), dim('base/size/6'), dim('base/size/8')], gap: dim('base/size/4'),
  });
  titles.appendChild(await createText({ style: 'body/medium-600', text: options.title, w: titleWidth - 16 }));
  if (options.subtitle) {
    titles.appendChild(await createText({ style: 'body/small', text: options.subtitle, color: 'fgColor/muted', w: titleWidth - 16 }));
  }
  header.appendChild(titles);
  header.appendChild(close);
  frame.appendChild(header);
  const body = await createFrame({ name: 'dialog/body', dir: 'V', w: width, pad: dim('overlay/padding/normal') });
  body.appendChild(await options.body(width - 32));
  frame.appendChild(body);
  if (options.footer?.length) {
    const footer = await createFrame({
      name: 'dialog/footer', dir: 'H', w: width, gap: dim('base/size/8'), pad: dim('overlay/padding/normal'),
      justify: 'MAX', align: 'CENTER',
    });
    for (const button of options.footer) footer.appendChild(button);
    frame.appendChild(footer);
  }
  frame.setPluginData('aria.role', 'dialog');
  frame.setPluginData('aria.modal', 'true');
  frame.setPluginData('aria.accessible-name', options.title);
  frame.setPluginData('spec.dialog.escape', 'close');
  // A footer button shown focused is the one the dialog focuses when it opens.
  const initial = options.footer?.find((button) => button.getPluginData(FOCUS.specimenKey) === FOCUS.specimenValue);
  frame.setPluginData('spec.dialog.focus',
    (initial ? initial.name : 'first focusable element') + '; returns to the trigger on close');
  return frame;
};

/** The translucent layer a modal dialog sits on. */
export const overlayBackdrop = function (width: number, height: number): Promise<FrameNode> {
  return createFrame({ name: 'overlay-backdrop', w: width, h: height, fill: 'overlay/backdrop/bgColor' });
};

/** A tooltip names its trigger; it never holds anything interactive. */
export const tooltip = async function (text: string): Promise<FrameNode> {
  const frame = await createFrame({
    name: 'tooltip', dir: 'H',
    pad: [dim('base/size/4'), dim('overlay/padding/condensed'), dim('base/size/4'), dim('overlay/padding/condensed')],
    radius: dim('borderRadius/medium'), fill: 'tooltip/bgColor',
  });
  const label = await createText({ style: 'body/small', text, color: 'tooltip/fgColor' });
  if (label.width > 234) {
    label.remove();
    frame.appendChild(await createText({ style: 'body/small', text, color: 'tooltip/fgColor', w: 234 }));
  } else frame.appendChild(label);
  frame.setPluginData('aria.role', 'tooltip');
  return frame;
};

export interface BoxOptions {
  /** The edge; a danger zone uses borderColor/danger-emphasis. */
  border?: ColorToken;
  footer?: FrameNode;
  header?: { readonly actions?: readonly FrameNode[]; readonly count?: FrameNode; readonly title: string };
  name?: string;
  /** Rows drawn at the box width; the box separates them. */
  rows: readonly FrameNode[];
  w: number;
}

/** A bordered box of rows with a muted header: Primer's list container. */
export const box = async function (options: BoxOptions): Promise<FrameNode> {
  const frame = await createFrame({
    name: options.name || 'box', dir: 'V', w: options.w, gap: 0, clip: true,
    radius: dim('borderRadius/medium'), fill: 'bgColor/default', stroke: options.border || 'borderColor/default', strokeW: 1,
  });
  if (options.header) {
    const header = await createFrame({
      name: 'box/header', dir: 'H', w: options.w, h: 56, gap: dim('base/size/8'),
      pad: [0, dim('base/size/16'), 0, dim('base/size/16')], align: 'CENTER',
      fill: 'bgColor/muted', stroke: 'borderColor/default', strokeSide: 'Bottom', strokeW: 1,
    });
    const title = await createText({ style: 'body/medium-600', text: options.header.title });
    header.appendChild(title);
    const placed: (SceneNode & LayoutMixin)[] = [title];
    if (options.header.count) {
      header.appendChild(options.header.count);
      placed.push(options.header.count);
    }
    const actions = options.header.actions || [];
    placed.push(...actions);
    header.appendChild(await createStrut(strutForRow(header, placed), 1));
    for (const action of actions) header.appendChild(action);
    frame.appendChild(header);
  }
  let index = 0;
  for (const row of options.rows) {
    if (index > 0) {
      frame.appendChild(await createFrame({
        name: 'box/divider', w: options.w, h: 1, stroke: 'borderColor/muted', strokeSide: 'Top', strokeW: 1,
      }));
    }
    frame.appendChild(row);
    index++;
  }
  if (options.footer) {
    frame.appendChild(await createFrame({
      name: 'box/divider', w: options.w, h: 1, stroke: 'borderColor/muted', strokeSide: 'Top', strokeW: 1,
    }));
    frame.appendChild(options.footer);
  }
  return frame;
};
