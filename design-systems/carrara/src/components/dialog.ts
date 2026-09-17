/* Dialog: a modal task over the page, and the scrim that covers the page. */

import { abs, f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { TONE_COLORS, type BadgeTone } from './badge.ts';
import { button, iconButton, type ButtonVariant } from './button.ts';

export interface DialogAction {
  readonly label: string;
  readonly name?: string;
  readonly variant?: ButtonVariant;
}

export interface DialogOptions {
  /** Built for the body width, between the heading and the actions. */
  body?: (width: number) => Promise<readonly SceneNode[]>;
  /** The layer name of the close button, which flows select. */
  closeName: string;
  description?: string;
  icon?: { readonly name: IconName; readonly tone: BadgeTone };
  name: string;
  primary: DialogAction;
  secondary?: DialogAction;
  title: string;
}

export const dialog = async function (options: DialogOptions): Promise<FrameNode> {
  const width = dim('dialog/width').value;
  const root = await frame({
    name: options.name, dir: 'V', w: dim('dialog/width'), pad: dim('space/24'), gap: dim('space/20'),
    radius: dim('radius/lg'), fill: 'bg/surface', stroke: 'border/default', strokeW: 1, elevation: 'shadow/xl',
  });
  const inner = width - dim('space/24').value * 2;
  const head = await frame({ name: 'dialog-header', dir: 'H', w: inner, gap: dim('space/16'), align: 'MIN' });
  if (options.icon) {
    const colors = TONE_COLORS[options.icon.tone];
    const chip = await frame({
      name: 'dialog-icon', dir: 'H', w: 40, h: 40, radius: dim('radius/full'), fill: colors.fill,
      justify: 'CENTER', align: 'CENTER',
    });
    chip.appendChild(icon(options.icon.name, colors.ink, 20));
    head.appendChild(chip);
  }
  const close = await iconButton({ icon: 'x-mark', label: 'Close', name: options.closeName, size: 'sm' });
  const room = inner - (options.icon ? 40 + head.itemSpacing : 0) - close.width - head.itemSpacing;
  const words = await frame({ name: 'dialog-heading', dir: 'V', w: room, gap: dim('space/4') });
  const heading = await text({ style: 'title/dialog', text: options.title, w: room });
  heading.setPluginData('aria.role', 'heading');
  heading.setPluginData('aria.level', '2');
  words.appendChild(heading);
  if (options.description) {
    words.appendChild(await text({ style: 'body/md', text: options.description, color: 'text/secondary', w: room }));
  }
  head.appendChild(words);
  head.appendChild(close);
  root.appendChild(head);
  for (const node of options.body ? await options.body(inner) : []) root.appendChild(node);
  const actions = await frame({ name: 'dialog-actions', dir: 'H', w: inner, gap: dim('space/12'), justify: 'MAX', align: 'CENTER' });
  if (options.secondary) {
    actions.appendChild(await button({ label: options.secondary.label, name: options.secondary.name, variant: options.secondary.variant || 'secondary' }));
  }
  actions.appendChild(await button({ label: options.primary.label, name: options.primary.name, variant: options.primary.variant || 'primary' }));
  root.appendChild(actions);
  root.setPluginData('aria.role', 'dialog');
  root.setPluginData('aria.modal', 'true');
  root.setPluginData('aria.accessible-name', options.title);
  return root;
};

/** Cover a whole screen with the scrim and centre the dialog near its top. */
export const scrim = async function (screen: FrameNode, content: FrameNode): Promise<FrameNode> {
  const cover = await frame({ name: 'scrim', w: screen.width, h: screen.height, fill: 'bg/overlay' });
  abs(cover, content, Math.round((screen.width - content.width) / 2), Math.max(dim('space/64').value, Math.round(screen.height * 0.16)));
  abs(screen, cover, 0, 0);
  return cover;
};
