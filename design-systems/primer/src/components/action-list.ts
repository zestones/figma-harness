/* Components: ActionList and NavList. */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame } from '@figma-harness/engine';
import { icon, type IconName } from '../primitives/icons.ts';
import { withFocus } from '../primitives/focus.ts';
import { t as createText } from '../primitives/text.ts';
import { counterLabel } from './labels.ts';
import type { InteractionState } from './interaction-state.ts';

export interface ActionListItemOptions {
  /** The item is the page being shown: a selected fill, a semibold label and an accent bar. */
  current?: boolean;
  description?: string;
  label: string;
  leadingVisual?: IconName;
  state?: InteractionState;
  trailingCount?: number;
  trailingText?: string;
  variant?: 'default' | 'danger';
}

export interface ActionListOptions {
  /** Hairlines between items. */
  dividers?: boolean;
  /** A group heading above the items. */
  heading?: string;
  items: readonly ActionListItemOptions[];
  /** Name prefix of every item, used by prototype selectors. */
  itemPrefix?: string;
  role?: 'list' | 'navigation';
  w: number;
}

const ITEM_HEIGHT = 32;
const INSET = 8;

const itemFill = function (options: ActionListItemOptions): ColorToken | null {
  const state = options.state || 'rest';
  if (state === 'disabled') return null;
  if (options.variant === 'danger' && (state === 'hover' || state === 'active')) return 'control/danger/bgColor/hover';
  if (state === 'active') return 'control/transparent/bgColor/active';
  if (options.current) return 'control/transparent/bgColor/selected';
  if (state === 'hover') return 'control/transparent/bgColor/hover';
  return null;
};

const itemInk = function (options: ActionListItemOptions): ColorToken {
  if (options.state === 'disabled') return 'control/fgColor/disabled';
  return options.variant === 'danger' ? 'control/danger/fgColor/rest' : 'control/fgColor/rest';
};

/** One item, inset by 8 px inside its list so the current bar has room. */
export const actionListItem = async function (
  options: ActionListItemOptions,
  width: number,
  name?: string,
  role: 'link' | 'menuitem' = 'menuitem',
): Promise<FrameNode> {
  const slot = await createFrame({
    name: (name || 'action-list/') + options.label, dir: 'H', w: width, h: ITEM_HEIGHT + (options.description ? 20 : 0),
    pad: [0, dim('base/size/8'), 0, dim('base/size/8')],
  });
  const item = await createFrame({
    name: 'item', dir: 'H', w: width - INSET * 2, h: slot.height, gap: dim('control/medium/gap'),
    pad: [0, dim('control/medium/paddingInline/condensed'), 0, dim('control/medium/paddingInline/condensed')],
    align: 'CENTER', radius: dim('borderRadius/medium'), fill: itemFill(options),
  });
  const ink = itemInk(options);
  const muted: ColorToken = options.state === 'disabled' ? 'control/fgColor/disabled' : 'fgColor/muted';
  let used = 16;
  if (options.leadingVisual) {
    item.appendChild(icon(options.leadingVisual, options.variant === 'danger' ? ink : muted, 16));
    used += 24;
  }
  const trailing: (SceneNode & LayoutMixin)[] = [];
  if (options.trailingText) {
    trailing.push(await createText({ style: 'body/small', text: options.trailingText, color: muted }));
  }
  if (options.trailingCount != null) {
    trailing.push(await counterLabel({ count: options.trailingCount }));
  }
  for (const node of trailing) used += node.width + 8;
  const labelWidth = Math.max(1, item.width - used);
  const labels = await createFrame({ name: 'item/labels', dir: 'V', w: labelWidth, gap: 0 });
  labels.appendChild(await createText({
    style: options.current ? 'body/medium-600' : 'body/medium', text: options.label, color: ink,
    w: labelWidth, truncate: true,
  }));
  if (options.description) {
    labels.appendChild(await createText({
      style: 'body/small', text: options.description, color: muted, w: labelWidth, truncate: true,
    }));
  }
  item.appendChild(labels);
  for (const node of trailing) item.appendChild(node);
  slot.appendChild(item);
  if (options.current) {
    const bar = await createFrame({
      name: 'current-indicator', w: dim('base/size/4'), h: slot.height - 8,
      radius: dim('borderRadius/medium'), fill: 'bgColor/accent-emphasis',
    });
    slot.appendChild(bar);
    bar.layoutPositioning = 'ABSOLUTE';
    bar.x = 0;
    bar.y = 4;
  }
  item.setPluginData('aria.role', role);
  item.setPluginData('aria.accessible-name', options.label);
  item.setPluginData('aria.disabled', String(options.state === 'disabled'));
  if (options.current) item.setPluginData('aria.current', 'page');
  if (options.state === 'focus') await withFocus(item, 'flush');
  return slot;
};

export const actionList = async function (options: ActionListOptions): Promise<FrameNode> {
  const list = await createFrame({
    name: options.role === 'navigation' ? 'nav-list' : 'action-list', dir: 'V', w: options.w,
    gap: 0, pad: [dim('base/size/8'), 0, dim('base/size/8'), 0],
  });
  if (options.heading) {
    const heading = await createFrame({
      name: 'group-heading', dir: 'H', w: options.w, h: 32,
      pad: [0, dim('base/size/16'), 0, dim('base/size/16')], align: 'CENTER',
    });
    heading.appendChild(await createText({
      style: 'body/small-600', text: options.heading, color: 'fgColor/muted', w: options.w - 32, truncate: true,
    }));
    list.appendChild(heading);
  }
  let index = 0;
  for (const item of options.items) {
    if (options.dividers && index > 0) {
      const divider = await createFrame({
        name: 'divider', w: options.w, h: 1, stroke: 'borderColor/muted', strokeSide: 'Top', strokeW: 1,
      });
      list.appendChild(divider);
    }
    list.appendChild(await actionListItem(item, options.w, options.itemPrefix,
      options.role === 'navigation' ? 'link' : 'menuitem'));
    index++;
  }
  list.setPluginData('aria.role', options.role === 'navigation' ? 'navigation' : 'list');
  return list;
};

/** A NavList: an ActionList whose current item is the page being shown. */
export const navList = function (options: Omit<ActionListOptions, 'role'>): Promise<FrameNode> {
  return actionList({ ...options, role: 'navigation', itemPrefix: options.itemPrefix || 'nav/' });
};
