/* Menu: the actions a control opens, with icons and shortcuts in words. */

import { f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { rule } from '../primitives/shapes.ts';
import { text } from '../primitives/text.ts';

export interface MenuItem {
  /** A destructive action. */
  readonly danger?: boolean;
  /** Draw a divider before this item. */
  readonly divider?: boolean;
  /** The item under the pointer. */
  readonly highlighted?: boolean;
  readonly icon?: IconName;
  readonly label: string;
  readonly name?: string;
  readonly shortcut?: string;
}

export const menu = async function (items: readonly MenuItem[], width: number): Promise<FrameNode> {
  if (!items.length) throw new Error('a menu needs at least one item');
  const root = await frame({
    name: 'menu', dir: 'V', w: width, pad: dim('space/4'), gap: dim('space/2'), radius: dim('radius/md'),
    fill: 'bg/surface', stroke: 'border/default', strokeW: 1, elevation: 'shadow/lg',
  });
  const inner = width - dim('space/4').value * 2;
  for (const item of items) {
    if (item.divider) {
      const gap = await frame({ name: 'menu-divider', dir: 'V', w: inner, pad: [dim('space/4'), 0, dim('space/4'), 0] });
      gap.appendChild(await rule(inner));
      root.appendChild(gap);
    }
    const ink: ColorToken = item.danger ? 'status/critical' : 'text/primary';
    const row = await frame({
      name: item.name || 'menu-item/' + item.label, dir: 'H', w: inner, h: dim('control/sm'), gap: dim('space/8'),
      pad: [0, dim('space/8'), 0, dim('space/8')], align: 'CENTER', radius: dim('radius/sm'),
      fill: item.highlighted ? 'bg/subtle' : false,
    });
    if (item.icon) row.appendChild(icon(item.icon, item.danger ? 'status/critical' : 'text/tertiary', 16));
    const shortcut = item.shortcut ? await text({ style: 'body/sm', text: item.shortcut, color: 'text/tertiary' }) : null;
    const room = inner - row.paddingLeft - row.paddingRight - (item.icon ? 16 + row.itemSpacing : 0)
      - (shortcut ? shortcut.width + row.itemSpacing : 0);
    row.appendChild(await text({ style: 'body/md', text: item.label, color: ink, w: room, truncate: true }));
    if (shortcut) row.appendChild(shortcut);
    row.setPluginData('aria.role', 'menuitem');
    root.appendChild(row);
  }
  root.setPluginData('aria.role', 'menu');
  return root;
};
