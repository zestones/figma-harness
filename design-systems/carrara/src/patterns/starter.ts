/* The starter vocabulary: the screen an app created from the app template
 * starts from, drawn with Carrara's shell, header, card and rows. */

import type {
  StarterAction,
  StarterItem,
  StarterScreenOptions,
  StarterVocabulary,
} from '@figma-harness/contract';
import type { MotionName } from '../foundations/motion.ts';
import { button } from '../components/button.ts';
import { card } from '../components/card.ts';
import { emptyState } from '../components/empty-state.ts';
import { listRow } from '../components/list-row.ts';
import { pageHeader } from './page-header.ts';
import { shell } from './shell.ts';

const action = function (spec: StarterAction, variant: 'primary' | 'secondary'): Promise<FrameNode> {
  return button({ label: spec.label, name: spec.name, variant });
};

export const starter: StarterVocabulary = Object.freeze({
  stateMotion: 'stateChange' satisfies MotionName,
  async screen(options: StarterScreenOptions): Promise<FrameNode> {
    const layout = await shell({
      name: options.name, w: options.w, h: options.h, search: 'Search',
      product: { name: options.product, plan: 'Workspace' },
      sections: [{ items: [{ label: 'Home', icon: 'home', current: true, name: 'nav/Home' }] }],
      footer: [{ label: 'Settings', icon: 'cog-6-tooth', name: 'nav/Settings' }],
      user: { name: 'Signed-in person', email: 'you@workspace.example', initials: 'YO' },
    });
    const width = layout.contentWidth;
    const actions: FrameNode[] = [];
    if (options.secondary) actions.push(await action(options.secondary, 'secondary'));
    if (options.primary) actions.push(await action(options.primary, 'primary'));
    layout.content.appendChild(await pageHeader({ w: width, title: options.title, description: options.text, actions }));
    if (options.items) {
      const list = await card({ w: width, name: 'starter-list', gap: 0 });
      const rows = options.items as readonly StarterItem[];
      for (const [index, item] of rows.entries()) {
        list.body.appendChild(await listRow({
          name: item.name, label: item.label, detail: item.detail, w: list.bodyWidth, divider: index > 0,
          badge: item.status ? { label: item.status.label, tone: item.status.tone } : undefined, link: item.link,
        }));
      }
      if (!rows.length) {
        list.body.appendChild(await emptyState({
          w: list.bodyWidth, icon: 'squares-2x2', title: 'Nothing here yet', text: 'Items you add appear in this list.',
        }));
      }
      layout.content.appendChild(list.frame);
    }
    layout.fit();
    return layout.frame;
  },
});
