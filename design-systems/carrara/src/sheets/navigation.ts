/* C2 · Navigation. */

import {
  badge,
  button,
  pageHeader,
  pagination,
  sidebar,
  tabs,
  topbar,
} from '../index.ts';
import { column, columnWidth, defineSheet, note, section, sheet, stage } from './support.ts';

export const sheetNavigation = defineSheet({
  code: 'C2', group: 'Components', title: 'Navigation',
  build: async () => {
    const layout = await sheet('C2', 'Navigation', 'The sidebar, the top bar and the page header every screen shares, with tabs and pagination for long views.');
    const width = columnWidth(layout, 3);
    const first = await column(layout.body, width);
    const side = await section(first, 'Sidebar', width, 'The current item is filled and marked as the current page. Counts are words, not dots.');
    side.appendChild(await sidebar({
      h: 720,
      product: { name: 'Coffer', plan: 'Brightline Studio' },
      sections: [
        {
          items: [
            { label: 'Overview', icon: 'home', current: true },
            { label: 'Payments', icon: 'credit-card', count: '12' },
            { label: 'Customers', icon: 'users' },
          ],
        },
        {
          label: 'Finance',
          items: [
            { label: 'Invoices', icon: 'document-text', count: '3' },
            { label: 'Payouts', icon: 'banknotes' },
            { label: 'Reports', icon: 'chart-bar' },
          ],
        },
      ],
      footer: [
        { label: 'Help', icon: 'question-mark-circle' },
        { label: 'Settings', icon: 'cog-6-tooth' },
      ],
      user: { name: 'Maya Castellanos', email: 'maya@brightline.example', initials: 'MC' },
    }));

    const wide = width * 2 + layout.body.itemSpacing;
    const second = await column(layout.body, wide);
    const bar = await section(second, 'Top bar', wide);
    bar.appendChild(await topbar({ w: wide, search: 'Search payments, customers and invoices' }));
    const compact = await section(second, 'Top bar, compact', wide, 'Under 1024 px the sidebar folds into the top bar: the menu button opens it, and search becomes a button.');
    compact.appendChild(await topbar({ w: wide, search: 'Search payments, customers and invoices', compactProduct: 'Coffer' }));
    const header = await stage(await section(second, 'Page header', wide), wide);
    header.appendChild(await pageHeader({
      w: wide - 40,
      breadcrumbs: [{ label: 'Payments', name: 'crumb/Payments · specimen' }],
      title: '$2,400.00',
      titleStyle: 'display/lg',
      meta: await badge({ label: 'Succeeded', tone: 'positive', icon: 'check-circle' }),
      description: 'Paid by Brightline Studio on Sept 12, 2026, 14:32',
      actions: [
        await button({ label: 'Refund', icon: 'arrow-uturn-left', name: 'button/Refund · specimen' }),
        await button({ label: 'Send receipt', icon: 'envelope', variant: 'primary', name: 'button/Send receipt · specimen' }),
      ],
    }));
    header.appendChild(await note('Breadcrumbs lead back to the list; the title states the object, and its state follows it as a word.', wide - 40));
    const lists = await stage(await section(second, 'Tabs and pagination', wide), wide);
    lists.appendChild(await tabs([
      { label: 'All', count: '12,845', current: true },
      { label: 'Succeeded', count: '12,512' },
      { label: 'Refunded', count: '214' },
      { label: 'Disputed', count: '9' },
      { label: 'Failed', count: '110' },
    ], wide - 40));
    lists.appendChild(await pagination({ w: wide - 40, summary: 'Showing 1–10 of 12,845 payments', hasPrevious: false, hasNext: true }));
    return layout.frame;
  },
});
