/* PageHeader: where the page sits, what it is, and its main actions. */

import { f as frame } from '@figma-harness/engine';
import { dim } from '../foundations/dimensions.ts';
import { icon } from '../primitives/icon.ts';
import { text } from '../primitives/text.ts';

export interface Crumb {
  readonly label: string;
  /** The layer name, which flows select; `crumb/<label>` by default. */
  readonly name?: string;
}

export interface PageHeaderOptions {
  actions?: readonly SceneNode[];
  /** Links to the pages above this one; the page itself comes last. */
  breadcrumbs?: readonly Crumb[];
  description?: string;
  /** A node after the title, such as a badge. */
  meta?: SceneNode;
  /** Built for the title column, under the description, such as a row of facts. */
  details?: (width: number) => Promise<SceneNode>;
  /** A node before the title, such as an avatar. */
  leading?: SceneNode;
  title: string;
  /** A title style for large figures. */
  titleStyle?: 'display/lg' | 'title/page';
  w: number;
}

export const pageHeader = async function (options: PageHeaderOptions): Promise<FrameNode> {
  const root = await frame({ name: 'page-header', dir: 'V', w: options.w, gap: dim('space/8') });
  if (options.breadcrumbs?.length) {
    const trail = await frame({ name: 'breadcrumbs', dir: 'H', gap: dim('space/6'), align: 'CENTER' });
    for (const crumb of options.breadcrumbs) {
      const link = await frame({ name: crumb.name || 'crumb/' + crumb.label, dir: 'H', align: 'CENTER' });
      link.appendChild(await text({ style: 'body/md-medium', text: crumb.label, color: 'text/secondary' }));
      link.setPluginData('aria.role', 'link');
      trail.appendChild(link);
      trail.appendChild(icon('chevron-right', 'text/tertiary', 16));
    }
    trail.appendChild(await text({ style: 'body/md-medium', text: options.title, maxW: options.w / 2 }));
    trail.setPluginData('aria.role', 'navigation');
    trail.setPluginData('aria.accessible-name', 'Breadcrumb');
    root.appendChild(trail);
  }
  // Figma places every new frame on the page, so the actions frame exists only when it is used.
  const actions = options.actions?.length
    ? await frame({ name: 'page-actions', dir: 'H', gap: dim('space/12'), align: 'CENTER' })
    : null;
  for (const action of options.actions || []) actions?.appendChild(action);
  // On a narrow page the actions move under the title.
  const stacked = !!actions && options.w - actions.width < 320;
  // Figma spaces a space-between row itself, so that gap stays a plain number.
  const main = await frame({
    name: 'page-heading', dir: stacked ? 'V' : 'H', w: options.w, gap: stacked ? dim('space/16') : dim('space/24').value,
    // Beside a heading with details, the actions line up with the title.
    align: stacked || options.details ? 'MIN' : 'MAX', justify: stacked ? 'MIN' : 'SPACE_BETWEEN',
  });
  const lead = options.leading ? await frame({ name: 'page-lead', dir: 'H', gap: dim('space/16'), align: 'CENTER' }) : null;
  if (lead && options.leading) lead.appendChild(options.leading);
  const room = options.w - (actions && !stacked ? actions.width + main.itemSpacing : 0)
    - (options.leading ? options.leading.width + dim('space/16').value : 0);
  const words = await frame({ name: 'page-title', dir: 'V', w: room, gap: dim('space/4') });
  const titleRow = await frame({ name: 'title-row', dir: 'H', w: room, gap: dim('space/12'), align: 'CENTER' });
  const titleRoom = room - (options.meta ? options.meta.width + titleRow.itemSpacing : 0);
  const heading = await text({ style: options.titleStyle || 'title/page', text: options.title, maxW: titleRoom });
  heading.setPluginData('aria.role', 'heading');
  heading.setPluginData('aria.level', '1');
  titleRow.appendChild(heading);
  if (options.meta) titleRow.appendChild(options.meta);
  words.appendChild(titleRow);
  if (options.description) {
    words.appendChild(await text({ style: 'body/md', text: options.description, color: 'text/secondary', w: room }));
  }
  if (options.details) words.appendChild(await options.details(room));
  if (lead) {
    lead.appendChild(words);
    main.appendChild(lead);
  } else {
    main.appendChild(words);
  }
  if (actions) main.appendChild(actions);
  root.appendChild(main);
  return root;
};
