/* Alert: a message about the page, with its tone in words and an icon.
 * Toast: a short confirmation that appears over the page. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { TONE_COLORS, type BadgeTone } from './badge.ts';
import { button } from './button.ts';

const ALERT_ICONS: Readonly<Record<BadgeTone, IconName>> = Object.freeze({
  neutral: 'information-circle',
  accent: 'information-circle',
  positive: 'check-circle',
  warning: 'exclamation-triangle',
  critical: 'x-circle',
});

export interface AlertOptions {
  /** A follow-up action, as a compact secondary button. */
  action?: { readonly label: string; readonly name?: string };
  name?: string;
  text: string;
  title: string;
  tone: BadgeTone;
  w: number;
}

export const alert = async function (options: AlertOptions): Promise<FrameNode> {
  const colors = TONE_COLORS[options.tone];
  const root = await frame({
    name: options.name || 'alert/' + options.tone, dir: 'H', w: options.w, gap: dim('space/12'), align: 'MIN',
    pad: dim('space/16'), radius: dim('radius/md'), fill: colors.fill,
  });
  root.appendChild(icon(ALERT_ICONS[options.tone], colors.ink, 20));
  const action = options.action
    ? await button({ label: options.action.label, name: options.action.name, size: 'sm' })
    : null;
  const room = options.w - root.paddingLeft - root.paddingRight - 20 - root.itemSpacing
    - (action ? action.width + root.itemSpacing : 0);
  const words = await frame({ name: 'alert-text', dir: 'V', w: room, gap: dim('space/2') });
  words.appendChild(await text({ style: 'body/md-strong', text: options.title, w: room }));
  words.appendChild(await text({ style: 'body/md', text: options.text, color: 'text/secondary', w: room }));
  root.appendChild(words);
  if (action) root.appendChild(action);
  root.setPluginData('aria.role', options.tone === 'critical' || options.tone === 'warning' ? 'alert' : 'status');
  return root;
};

export interface ToastOptions {
  text?: string;
  title: string;
  w: number;
}

export const toast = async function (options: ToastOptions): Promise<FrameNode> {
  const root = await frame({
    name: 'toast', dir: 'H', w: options.w, gap: dim('space/12'), align: 'MIN', pad: dim('space/16'),
    radius: dim('radius/md'), fill: 'bg/inverse', elevation: 'shadow/lg',
  });
  root.appendChild(icon('check-circle', 'text/inverse-strong', 20));
  const room = options.w - root.paddingLeft - root.paddingRight - 20 - 16 - root.itemSpacing * 2;
  const words = await frame({ name: 'toast-text', dir: 'V', w: room, gap: dim('space/2') });
  words.appendChild(await text({ style: 'body/md-medium', text: options.title, color: 'text/inverse-strong', w: room }));
  if (options.text) words.appendChild(await text({ style: 'body/sm', text: options.text, color: 'text/inverse', w: room }));
  root.appendChild(words);
  root.appendChild(icon('x-mark', 'text/inverse', 16));
  root.setPluginData('aria.role', 'status');
  return root;
};
