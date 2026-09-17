/* Components: UnderlineNav, Breadcrumbs and Pagination. */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame } from '../../engine/node-factory.ts';
import { icon, type IconName } from '../primitives/icons.ts';
import { withFocus } from '../primitives/focus.ts';
import { t as createText } from '../primitives/text.ts';
import { counterLabel } from './labels.ts';

export interface UnderlineNavItem {
  readonly count?: number;
  readonly current?: boolean;
  readonly focused?: boolean;
  readonly hovered?: boolean;
  readonly icon?: IconName;
  readonly label: string;
}

export interface UnderlineNavOptions {
  accessibleName: string;
  /** Flush drops the 16 px inline padding, for a nav inside a padded region. */
  flush?: boolean;
  /** Node-name prefix of every item, used by prototype selectors. */
  itemPrefix?: string;
  items: readonly UnderlineNavItem[];
  w: number;
}

const NAV_HEIGHT = 48;

/** Primer's UnderlineNav: 32 px items on a 48 px bar, the current one underlined. */
export const underlineNav = async function (options: UnderlineNavOptions): Promise<FrameNode> {
  const bar = await createFrame({
    name: 'underline-nav', dir: 'H', w: options.w, h: dim('control/xlarge/size'),
    gap: dim('stack/gap/condensed'), align: 'MIN',
    pad: [dim('base/size/8'), options.flush ? 0 : dim('stack/padding/normal'), 0, options.flush ? 0 : dim('stack/padding/normal')],
    stroke: 'borderColor/muted', strokeSide: 'Bottom', strokeW: 1,
  });
  for (const item of options.items) {
    const tab = await createFrame({ name: (options.itemPrefix || 'nav/') + item.label, dir: 'V', h: NAV_HEIGHT - 8 });
    const body = await createFrame({
      name: 'tab-body', dir: 'H', h: dim('base/size/32'), gap: dim('base/size/8'),
      pad: [0, dim('base/size/8'), 0, dim('base/size/8')], align: 'CENTER',
      radius: dim('borderRadius/medium'), fill: item.hovered ? 'bgColor/neutral-muted' : null,
    });
    if (item.icon) body.appendChild(icon(item.icon, 'underlineNav/iconColor/rest', 16));
    body.appendChild(await createText({
      style: item.current ? 'body/medium-600' : 'body/medium', text: item.label, color: 'fgColor/default',
    }));
    if (item.count != null) body.appendChild(await counterLabel({ count: item.count }));
    tab.appendChild(body);
    if (item.current) {
      const underline = await createFrame({
        name: 'current-underline', w: body.width, h: 2,
        stroke: 'underlineNav/borderColor/active', strokeSide: 'Bottom', strokeW: 2,
      });
      tab.appendChild(underline);
      underline.layoutPositioning = 'ABSOLUTE';
      underline.x = 0;
      underline.y = NAV_HEIGHT - 8 - 2;
      body.setPluginData('aria.current', 'page');
    }
    body.setPluginData('aria.role', 'link');
    body.setPluginData('aria.accessible-name', item.label + (item.count != null ? ' (' + item.count + ')' : ''));
    if (item.focused) await withFocus(body, 'inset');
    bar.appendChild(tab);
  }
  bar.setPluginData('aria.role', 'navigation');
  bar.setPluginData('aria.accessible-name', options.accessibleName);
  return bar;
};

export interface BreadcrumbItem {
  readonly focused?: boolean;
  readonly label: string;
}

/** Links separated by slashes; the last item is the current page. */
export const breadcrumbs = async function (items: readonly BreadcrumbItem[]): Promise<FrameNode> {
  const row = await createFrame({ name: 'breadcrumbs', dir: 'H', gap: dim('base/size/8'), align: 'CENTER' });
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const current = index === items.length - 1;
    if (index > 0) {
      row.appendChild(await createText({ style: 'body/medium', text: '/', color: 'fgColor/muted' }));
    }
    const crumb = await createFrame({ name: 'crumb/' + item.label, dir: 'H', radius: dim('borderRadius/small') });
    crumb.appendChild(await createText({
      style: current ? 'body/medium-600' : 'body/medium', text: item.label,
      color: current ? 'fgColor/default' : 'fgColor/link',
    }));
    crumb.setPluginData('aria.role', 'link');
    crumb.setPluginData('aria.accessible-name', item.label);
    if (current) crumb.setPluginData('aria.current', 'page');
    if (item.focused) await withFocus(crumb, 'outset');
    row.appendChild(crumb);
  }
  row.setPluginData('aria.role', 'navigation');
  row.setPluginData('aria.accessible-name', 'Breadcrumbs');
  return row;
};

export interface PaginationOptions {
  currentPage: number;
  /** A page to draw focused, for specimens. */
  focusedPage?: number;
  pageCount: number;
}

/** Which page numbers Primer shows: the ends, the neighbours and gaps between. */
export const paginationPages = function (pageCount: number, currentPage: number): (number | null)[] {
  if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('pagination: pageCount must be a positive integer');
  if (!Number.isInteger(currentPage) || currentPage < 1 || currentPage > pageCount) {
    throw new Error('pagination: currentPage must be between 1 and pageCount');
  }
  const wanted = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]
    .filter((page) => page >= 1 && page <= pageCount));
  if (currentPage <= 3) [2, 3, 4].forEach((page) => page <= pageCount && wanted.add(page));
  if (currentPage >= pageCount - 2) [pageCount - 3, pageCount - 2, pageCount - 1].forEach((page) => page >= 1 && wanted.add(page));
  const pages = [...wanted].sort((a, b) => a - b);
  const result: (number | null)[] = [];
  pages.forEach((page, index) => {
    if (index > 0 && page - pages[index - 1] > 1) result.push(null);
    result.push(page);
  });
  return result;
};

const pageControl = async function (
  name: string,
  content: (SceneNode & LayoutMixin)[],
  fill: ColorToken | null,
  accessibleName: string,
): Promise<FrameNode> {
  const control = await createFrame({
    name, dir: 'H', h: dim('base/size/32'), gap: dim('base/size/4'),
    pad: [0, dim('base/size/6'), 0, dim('base/size/6')],
    justify: 'CENTER', align: 'CENTER', radius: dim('borderRadius/medium'), fill,
  });
  for (const node of content) control.appendChild(node);
  if (control.width < 32) {
    control.resize(32, 32);
    control.primaryAxisSizingMode = 'FIXED';
  }
  control.setPluginData('aria.role', 'link');
  control.setPluginData('aria.accessible-name', accessibleName);
  return control;
};

export const pagination = async function (options: PaginationOptions): Promise<FrameNode> {
  const row = await createFrame({ name: 'pagination', dir: 'H', gap: dim('base/size/4'), align: 'CENTER' });
  const first = options.currentPage === 1;
  const last = options.currentPage === options.pageCount;
  const edge = async function (direction: 'previous' | 'next', disabled: boolean): Promise<FrameNode> {
    const ink: ColorToken = disabled ? 'fgColor/disabled' : 'fgColor/accent';
    const text = await createText({ style: 'body/medium', text: direction === 'previous' ? 'Previous' : 'Next', color: ink });
    const glyph = icon(direction === 'previous' ? 'chevron-left' : 'chevron-right', ink, 16);
    const control = await pageControl('pagination/' + direction,
      direction === 'previous' ? [glyph, text] : [text, glyph], null,
      direction === 'previous' ? 'Previous page' : 'Next page');
    control.setPluginData('aria.disabled', String(disabled));
    return control;
  };
  row.appendChild(await edge('previous', first));
  for (const page of paginationPages(options.pageCount, options.currentPage)) {
    if (page == null) {
      row.appendChild(await pageControl('pagination/gap', [
        await createText({ style: 'body/medium', text: '…', color: 'fgColor/muted' }),
      ], null, 'More pages'));
      continue;
    }
    const current = page === options.currentPage;
    const control = await pageControl('pagination/page-' + page, [
      await createText({ style: 'body/medium', text: String(page), color: current ? 'fgColor/onEmphasis' : 'fgColor/default' }),
    ], current ? 'bgColor/accent-emphasis' : null, 'Page ' + page);
    if (current) control.setPluginData('aria.current', 'page');
    if (options.focusedPage === page) await withFocus(control, 'inset', { band: current });
    row.appendChild(control);
  }
  row.appendChild(await edge('next', last));
  row.setPluginData('aria.role', 'navigation');
  row.setPluginData('aria.accessible-name', 'Pagination');
  return row;
};
