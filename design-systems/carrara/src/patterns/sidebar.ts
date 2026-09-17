/* Sidebar: the product, its sections, and the signed-in person, on the
 * inverse surface. The current item is marked for assistive technology. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { avatar } from '../primitives/avatar.ts';
import { icon, type IconName } from '../primitives/icon.ts';
import { rule } from '../primitives/shapes.ts';
import { text } from '../primitives/text.ts';

export interface NavItem {
  /** A count at the end, such as 12. */
  readonly count?: string;
  readonly current?: boolean;
  readonly icon: IconName;
  readonly label: string;
  /** The layer name, which flows select; `nav/<label>` by default. */
  readonly name?: string;
}

export interface NavSection {
  readonly items: readonly NavItem[];
  /** A label above the items, written in capitals. */
  readonly label?: string;
}

export interface SidebarUser {
  readonly email: string;
  readonly initials: string;
  readonly name: string;
}

export interface SidebarOptions {
  /** Items pinned to the bottom, such as Settings. */
  footer?: readonly NavItem[];
  h: number;
  product: { readonly name: string; readonly plan: string };
  sections: readonly NavSection[];
  user: SidebarUser;
}

const INNER = 224;

const navItem = async function (item: NavItem): Promise<FrameNode> {
  const row = await frame({
    name: item.name || 'nav/' + item.label, dir: 'H', w: INNER, h: dim('control/md'), gap: dim('space/12'),
    pad: [0, dim('space/12'), 0, dim('space/12')], align: 'CENTER', radius: dim('radius/sm'),
    fill: item.current ? 'bg/inverse-raised' : false,
  });
  row.appendChild(icon(item.icon, item.current ? 'text/inverse-strong' : 'text/inverse-muted', 20));
  let count: FrameNode | null = null;
  if (item.count) {
    count = await frame({
      name: 'nav-count', dir: 'H', h: 20, pad: [0, dim('space/8'), 0, dim('space/8')], align: 'CENTER',
      radius: dim('radius/full'), fill: item.current ? 'accent/solid' : 'bg/inverse-raised',
    });
    count.appendChild(await text({
      style: 'body/sm-medium', text: item.count, color: item.current ? 'text/on-accent' : 'text/inverse',
    }));
  }
  const room = INNER - row.paddingLeft - row.paddingRight - 20 - row.itemSpacing - (count ? count.width + row.itemSpacing : 0);
  row.appendChild(await text({
    style: 'body/md-medium', text: item.label, w: room, truncate: true,
    color: item.current ? 'text/inverse-strong' : 'text/inverse',
  }));
  if (count) row.appendChild(count);
  row.setPluginData('aria.role', 'link');
  if (item.current) row.setPluginData('aria.current', 'page');
  return row;
};

export const sidebar = async function (options: SidebarOptions): Promise<FrameNode> {
  if (!options.sections.length) throw new Error('a sidebar needs at least one section');
  const root = await frame({
    name: 'sidebar', dir: 'V', w: dim('sidebar/width'), h: options.h, justify: 'SPACE_BETWEEN',
    pad: [dim('space/20'), dim('space/12'), dim('space/16'), dim('space/12')], fill: 'bg/inverse',
  });
  const top = await frame({ name: 'sidebar-top', dir: 'V', w: INNER, gap: dim('space/24') });
  const brand = await frame({
    name: 'workspace', dir: 'H', w: INNER, gap: dim('space/12'), align: 'CENTER', pad: [0, dim('space/8'), 0, dim('space/8')],
  });
  const mark = await frame({
    name: 'logo', dir: 'H', w: 32, h: 32, radius: dim('radius/md'), fill: 'accent/solid', justify: 'CENTER', align: 'CENTER',
  });
  mark.appendChild(icon('bolt', 'text/on-accent', 20));
  mark.setPluginData('aria.role', 'img');
  mark.setPluginData('aria.accessible-name', options.product.name);
  brand.appendChild(mark);
  const brandRoom = INNER - 16 - 32 - 16 - brand.itemSpacing * 2;
  const brandText = await frame({ name: 'workspace-text', dir: 'V', w: brandRoom });
  brandText.appendChild(await text({
    style: 'body/md-strong', text: options.product.name, color: 'text/inverse-strong', w: brandRoom, truncate: true,
  }));
  brandText.appendChild(await text({
    style: 'body/sm', text: options.product.plan, color: 'text/inverse-muted', w: brandRoom, truncate: true,
  }));
  brand.appendChild(brandText);
  brand.appendChild(icon('chevron-up-down', 'text/inverse-muted', 16));
  top.appendChild(brand);
  const sections = await frame({ name: 'nav', dir: 'V', w: INNER, gap: dim('space/20') });
  for (const section of options.sections) {
    if (!section.items.length) throw new Error('a sidebar section needs at least one item');
    const group = await frame({ name: 'nav-section', dir: 'V', w: INNER, gap: dim('space/2') });
    if (section.label) {
      const heading = await frame({ name: 'nav-heading', dir: 'H', w: INNER, pad: [0, dim('space/12'), dim('space/6'), dim('space/12')] });
      heading.appendChild(await text({
        style: 'label/overline', text: section.label.toUpperCase(), color: 'text/inverse-muted', w: INNER - 24, truncate: true,
      }));
      group.appendChild(heading);
    }
    for (const item of section.items) group.appendChild(await navItem(item));
    sections.appendChild(group);
  }
  sections.setPluginData('aria.role', 'navigation');
  top.appendChild(sections);
  root.appendChild(top);

  const bottom = await frame({ name: 'sidebar-bottom', dir: 'V', w: INNER, gap: dim('space/12') });
  if (options.footer?.length) {
    const footer = await frame({ name: 'nav-footer', dir: 'V', w: INNER, gap: dim('space/2') });
    for (const item of options.footer) footer.appendChild(await navItem(item));
    bottom.appendChild(footer);
  }
  bottom.appendChild(await rule(INNER, 'border/inverse'));
  const person = await frame({
    name: 'account', dir: 'H', w: INNER, gap: dim('space/12'), align: 'CENTER', pad: [0, dim('space/8'), 0, dim('space/8')],
  });
  person.appendChild(await avatar({ initials: options.user.initials, label: options.user.name, size: 32 }));
  const personRoom = INNER - 16 - 32 - 16 - person.itemSpacing * 2;
  const personText = await frame({ name: 'account-text', dir: 'V', w: personRoom });
  personText.appendChild(await text({
    style: 'body/md-medium', text: options.user.name, color: 'text/inverse-strong', w: personRoom, truncate: true,
  }));
  personText.appendChild(await text({
    style: 'body/sm', text: options.user.email, color: 'text/inverse-muted', w: personRoom, truncate: true,
  }));
  person.appendChild(personText);
  person.appendChild(icon('ellipsis-horizontal', 'text/inverse-muted', 16));
  bottom.appendChild(person);
  root.appendChild(bottom);
  return root;
};
