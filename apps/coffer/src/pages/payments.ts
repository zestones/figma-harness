/* 02 · Payments: every payment, filtered by state. A row opens the payment. */

import {
  button,
  card,
  dim,
  f as frame,
  field,
  pageHeader,
  pagination,
  tabs,
  type TabItem,
} from '@figma-harness/carrara';
import { appShell } from '../app.ts';
import { COFFER } from '../fixtures/index.ts';
import { count } from './format.ts';
import { paymentTable } from './payment-table.ts';

const SEARCH_WIDTH = 320;

const stateTabs = function (withCounts: boolean): TabItem[] {
  const { counts } = COFFER;
  const tab = (label: string, value: number, current = false): TabItem => (
    withCounts ? { label, count: count(value), current } : { label, current }
  );
  return [
    tab('All', counts.all, true),
    tab('Succeeded', counts.succeeded),
    tab('Processing', counts.processing),
    tab('Refunded', counts.refunded),
    tab('Needs response', counts.disputed),
    tab('Failed', counts.failed),
  ];
};

const toolbar = async function (width: number): Promise<FrameNode> {
  const wide = width >= 960;
  const row = await frame({
    name: 'payments-toolbar', dir: 'H', w: width, gap: dim('space/8').value, align: 'CENTER', justify: 'SPACE_BETWEEN',
    pad: [dim('space/16'), dim('space/20'), dim('space/16'), dim('space/20')],
    stroke: 'border/default', strokeSide: 'Bottom', strokeW: 1,
  });
  const filters = await frame({ name: 'payments-filters', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
  filters.appendChild(await button({ label: 'Last 30 days', icon: 'calendar', size: 'sm', name: 'filter/Date' }));
  filters.appendChild(await button({ label: 'Status', icon: 'funnel', size: 'sm', name: 'filter/Status' }));
  if (wide) {
    filters.appendChild(await button({ label: 'Method', icon: 'credit-card', size: 'sm', name: 'filter/Method' }));
    filters.appendChild(await button({ label: 'Amount', icon: 'currency-dollar', size: 'sm', name: 'filter/Amount' }));
  }
  const room = width - dim('space/20').value * 2 - filters.width - row.itemSpacing;
  row.appendChild(await field({
    w: Math.min(SEARCH_WIDTH, room), icon: 'magnifying-glass', name: 'search/payments',
    placeholder: wide ? 'Search by customer, amount or ID' : 'Search payments',
  }));
  row.appendChild(filters);
  return row;
};

export const screenPayments = async function (name: string): Promise<FrameNode> {
  const layout = await appShell(name, 'Payments');
  const width = layout.contentWidth;
  const wide = width >= 960;
  layout.content.appendChild(await pageHeader({
    w: width,
    title: 'Payments',
    description: 'Every charge, refund and dispute on ' + COFFER.workspace.name + '.',
    actions: [
      await button({ label: 'Export', icon: 'arrow-down-tray' }),
      await button({ label: 'Create payment', icon: 'plus', variant: 'primary' }),
    ],
  }));
  layout.content.appendChild(await tabs(stateTabs(wide), width));

  const list = await card({ w: width, flush: true, name: 'payments-list' });
  list.body.appendChild(await toolbar(width));
  list.body.appendChild(await paymentTable({ w: width, label: 'Payments', payments: COFFER.payments, ids: true }));
  const shown = COFFER.payments.length;
  list.body.appendChild(await pagination({
    w: width,
    summary: shown ? 'Showing 1–' + shown + ' of ' + count(COFFER.counts.all) + ' payments' : 'No payments',
    hasPrevious: false,
    hasNext: shown > 0 && COFFER.counts.all > shown,
  }));
  layout.content.appendChild(list.frame);
  layout.fit();
  return layout.frame;
};
