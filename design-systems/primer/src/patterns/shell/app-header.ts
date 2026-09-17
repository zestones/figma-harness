/* The application header: a global bar (product, context, search, actions)
 * over the local UnderlineNav, on Primer's page-header ground. The nav's own
 * bottom border closes the header. */

import { dim, SHELL_DIMENSIONS } from '../../foundations/dimensions.ts';
import { bindDimensions, f as createFrame, strut as createStrut, strutForRow } from '@figma-harness/engine';
import { icon, type IconName } from '../../primitives/icons.ts';
import { t as createText } from '../../primitives/text.ts';
import { avatar } from '../../components/avatar.ts';
import { iconButton } from '../../components/button.ts';
import { underlineNav, type UnderlineNavItem } from '../../components/navigation.ts';
import { textInput } from '../../components/text-input.ts';

export interface AppHeaderOptions {
  /** Global actions before the avatar, as icon buttons. */
  actions?: ReadonlyArray<{ readonly icon: IconName; readonly label: string }>;
  /** Owner and project, broadest first; the last is emphasised. */
  context: readonly string[];
  nav: readonly UnderlineNavItem[];
  product: { readonly icon: IconName; readonly name: string };
  search?: string;
  user: { readonly initials: string; readonly name: string };
  w: number;
}

const SEARCH_WIDTH = 272;

export const appHeader = async function (options: AppHeaderOptions): Promise<FrameNode> {
  const header = await createFrame({
    name: 'App header', dir: 'V', w: options.w, gap: 0, fill: 'page/header/bgColor',
  });
  const bar = await createFrame({
    name: 'global-bar', dir: 'H', w: options.w, h: SHELL_DIMENSIONS.header,
    gap: dim('base/size/8'), pad: dim('base/size/16'), align: 'CENTER',
  });
  bindDimensions(bar, { height: dim('app/header/height') });

  const menu = await iconButton({ icon: 'three-bars', label: 'Open navigation' });
  const mark = await createFrame({ name: 'product-mark', dir: 'H', w: 32, h: 32, justify: 'CENTER', align: 'CENTER' });
  mark.appendChild(icon(options.product.icon, 'fgColor/default', 24));
  mark.setPluginData('aria.role', 'link');
  mark.setPluginData('aria.accessible-name', options.product.name + ' home');
  const context = await createFrame({ name: 'context', dir: 'H', gap: dim('base/size/4'), align: 'CENTER' });
  for (let index = 0; index < options.context.length; index++) {
    const last = index === options.context.length - 1;
    if (index > 0) context.appendChild(await createText({ style: 'body/medium', text: '/', color: 'fgColor/muted' }));
    const crumb = await createFrame({ name: 'context/' + options.context[index], dir: 'H', pad: [0, dim('base/size/4'), 0, dim('base/size/4')] });
    crumb.appendChild(await createText({
      style: last ? 'body/medium-600' : 'body/medium', text: options.context[index], color: 'fgColor/default',
    }));
    crumb.setPluginData('aria.role', 'link');
    context.appendChild(crumb);
  }
  const fixed: FrameNode[] = [menu, mark, context];
  const trailing: FrameNode[] = [];
  if (options.search) {
    trailing.push(await textInput({
      w: SEARCH_WIDTH, leadingVisual: 'search', placeholder: options.search, accessibleName: 'Search',
    }));
  }
  for (const action of options.actions || []) {
    trailing.push(await iconButton({ icon: action.icon, label: action.label }));
  }
  trailing.push(await avatar({ initials: options.user.initials, name: options.user.name, size: 32 }));
  for (const node of fixed) bar.appendChild(node);
  bar.appendChild(await createStrut(strutForRow(bar, [...fixed, ...trailing]), 1));
  for (const node of trailing) bar.appendChild(node);
  header.appendChild(bar);

  header.appendChild(await underlineNav({ accessibleName: options.product.name, items: options.nav, w: options.w }));
  header.setPluginData('aria.role', 'banner');
  return header;
};
