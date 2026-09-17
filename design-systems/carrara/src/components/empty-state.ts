/* EmptyState: what an empty view means, and what to do next. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';
import { button } from './button.ts';

export interface EmptyStateOptions {
  action?: { readonly label: string; readonly name?: string };
  icon: IconName;
  text: string;
  title: string;
  w: number;
}

export const emptyState = async function (options: EmptyStateOptions): Promise<FrameNode> {
  const root = await frame({
    name: 'empty-state', dir: 'V', w: options.w, gap: dim('space/12'), align: 'CENTER',
    pad: [dim('space/40'), dim('space/24'), dim('space/40'), dim('space/24')],
  });
  const chip = await frame({
    name: 'empty-icon', dir: 'H', w: 48, h: 48, radius: dim('radius/full'), fill: 'bg/subtle',
    justify: 'CENTER', align: 'CENTER',
  });
  chip.appendChild(icon(options.icon, 'text/tertiary', 20));
  root.appendChild(chip);
  const width = Math.min(options.w - dim('space/24').value * 2, 360);
  root.appendChild(await text({ style: 'title/card', text: options.title, w: width, align: 'CENTER' }));
  root.appendChild(await text({ style: 'body/md', text: options.text, color: 'text/secondary', w: width, align: 'CENTER' }));
  if (options.action) {
    root.appendChild(await button({ label: options.action.label, name: options.action.name, icon: 'plus', variant: 'primary' }));
  }
  return root;
};
