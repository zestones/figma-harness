/* Product identity and navigation: the sidebar every Coffer screen shares. */

import { shell, type NavSection, type ShellLayout } from '@figma-harness/carrara';
import { COFFER } from './fixtures/index.ts';
import { FRAME_H, FRAME_W } from './pages/frame.ts';

export const PRODUCT = Object.freeze({ name: 'Coffer' });

export type AppSection = 'Customers' | 'Overview' | 'Payments';

const sections = function (current: AppSection): NavSection[] {
  return [
    {
      items: [
        { label: 'Overview', icon: 'home', current: current === 'Overview' },
        { label: 'Payments', icon: 'credit-card', current: current === 'Payments' },
        { label: 'Customers', icon: 'users', current: current === 'Customers' },
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
  ];
};

/** The frame of a Coffer screen, with the section it belongs to marked current. */
export const appShell = function (name: string, current: AppSection): Promise<ShellLayout> {
  return shell({
    name, w: FRAME_W, h: FRAME_H, search: 'Search payments, customers and invoices',
    product: { name: PRODUCT.name, plan: COFFER.workspace.name },
    sections: sections(current),
    footer: [
      { label: 'Help', icon: 'question-mark-circle' },
      { label: 'Settings', icon: 'cog-6-tooth' },
    ],
    user: COFFER.user,
  });
};
