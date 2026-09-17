/* Topbar: search on the left, help, notifications and actions on the right.
 * On a narrow screen it carries the menu button and the product name instead
 * of the sidebar, and search becomes a button. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { iconButton } from '../components/button.ts';
import { field } from '../components/field.ts';
import { text } from '../primitives/text.ts';

export interface TopbarOptions {
  /** Controls after the icons, such as a primary button. */
  actions?: readonly SceneNode[];
  /** Show the menu button and this product name, for narrow screens. */
  compactProduct?: string;
  search: string;
  w: number;
}

export const topbar = async function (options: TopbarOptions): Promise<FrameNode> {
  const compact = options.compactProduct != null;
  const side = dim(compact ? 'space/16' : 'space/32');
  // Figma spaces a space-between row itself, so its gap stays a plain number.
  const root = await frame({
    name: 'topbar', dir: 'H', w: options.w, h: dim('topbar/height'), gap: dim('space/16').value, align: 'CENTER',
    justify: 'SPACE_BETWEEN', pad: [0, side, 0, side],
    fill: 'bg/surface', stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
  });
  const tools = await frame({ name: 'topbar-tools', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
  if (compact) tools.appendChild(await iconButton({ icon: 'magnifying-glass', label: options.search, name: 'icon-button/Search' }));
  tools.appendChild(await iconButton({ icon: 'question-mark-circle', label: 'Help' }));
  tools.appendChild(await iconButton({ icon: 'bell', label: 'Notifications' }));
  for (const action of options.actions || []) tools.appendChild(action);
  if (compact) {
    const lead = await frame({ name: 'topbar-product', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
    lead.appendChild(await iconButton({ icon: 'bars-3', label: 'Open navigation', name: 'icon-button/Menu' }));
    lead.appendChild(await text({
      style: 'body/md-strong', text: options.compactProduct || '',
      maxW: options.w - side.value * 2 - tools.width - root.itemSpacing - 36 - lead.itemSpacing,
    }));
    root.appendChild(lead);
  } else {
    root.appendChild(await field({
      w: Math.min(400, options.w - side.value * 2 - tools.width - root.itemSpacing), icon: 'magnifying-glass',
      placeholder: options.search, shortcut: '/', name: 'field/Search',
    }));
  }
  root.appendChild(tools);
  root.setPluginData('aria.role', 'banner');
  return root;
};
