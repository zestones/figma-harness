/* 06 · Customer: who pays, what they pay for, and what happened lately. */

import {
  avatar,
  badge,
  button,
  card,
  descriptionList,
  dim,
  emptyState,
  f as frame,
  iconButton,
  iconCell,
  listRow,
  pageHeader,
  progress,
  stat,
  text,
  timeline,
  type BadgeTone,
  type IconName,
} from '@figma-harness/carrara';
import { appShell } from '../app.ts';
import { COFFER, customerById, type ActivityEvent, type Customer, type Invoice, type Payment } from '../fixtures/index.ts';
import { count, methodIcon, methodLabel, money, wholeMoney } from './format.ts';
import { paymentTable } from './payment-table.ts';

const SIDE_WIDTH = 360;
const RECENT_PAYMENTS = 6;

const ACTIVITY_LOOK: Readonly<Record<ActivityEvent['kind'], { readonly icon: IconName; readonly tone: BadgeTone }>> = Object.freeze({
  dispute: { icon: 'exclamation-triangle', tone: 'warning' },
  invoice: { icon: 'document-text', tone: 'neutral' },
  payment: { icon: 'check-circle', tone: 'positive' },
  payout: { icon: 'banknotes', tone: 'neutral' },
  refund: { icon: 'arrow-uturn-left', tone: 'neutral' },
  subscription: { icon: 'arrow-path', tone: 'accent' },
});

const paymentsOf = function (customer: Customer): Payment[] {
  return [...COFFER.payments, ...COFFER.history].filter((payment) => payment.customerId === customer.id);
};

const figures = async function (customer: Customer, payments: readonly Payment[], width: number): Promise<FrameNode> {
  const perRow = width >= 960 ? 4 : 2;
  const tile = Math.floor((width - dim('space/16').value * (perRow - 1)) / perRow);
  const failed = payments.filter((payment) => payment.status === 'failed').length;
  const values = [
    { label: 'Lifetime value', value: wholeMoney(customer.totals.lifetime), caption: 'Since ' + customer.since },
    { label: 'Payments', value: count(customer.totals.payments), caption: failed ? failed + ' failed, then retried' : 'None failed' },
    {
      label: 'Average payment',
      value: wholeMoney(customer.totals.payments ? customer.totals.lifetime / customer.totals.payments : 0),
      caption: 'Across every payment',
    },
    { label: 'Next invoice', value: wholeMoney(customer.plan.price), caption: 'Due ' + customer.plan.renews },
  ];
  const root = await frame({ name: 'customer-figures', dir: 'V', w: width, gap: dim('space/16') });
  for (let start = 0; start < values.length; start += perRow) {
    const line = await frame({ name: 'figure-row', dir: 'H', w: width, gap: dim('space/16'), align: 'MIN' });
    for (const value of values.slice(start, start + perRow)) line.appendChild(await stat({ w: tile, ...value }));
    root.appendChild(line);
  }
  return root;
};

const paymentsCard = async function (payments: readonly Payment[], total: number, width: number): Promise<FrameNode> {
  const layout = await card({
    w: width, flush: true, title: 'Payments', name: 'customer-payments',
    description: payments.length
      ? 'The latest ' + Math.min(RECENT_PAYMENTS, payments.length) + ' of ' + count(Math.max(total, payments.length))
      : undefined,
    actions: [await button({ label: 'View all', size: 'sm', variant: 'ghost' })],
  });
  layout.body.appendChild(await paymentTable({
    w: width, label: 'Payments from this customer', payments: payments.slice(0, RECENT_PAYMENTS), customer: false,
  }));
  return layout.frame;
};

const activityCard = async function (customer: Customer, width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Activity', name: 'customer-activity' });
  const events = COFFER.activity.filter((event) => event.customerId === customer.id);
  layout.body.appendChild(events.length
    ? await timeline(events.map((event) => ({
      ...ACTIVITY_LOOK[event.kind], title: event.title, detail: event.detail, time: event.time,
    })), layout.bodyWidth)
    : await emptyState({ w: layout.bodyWidth, icon: 'clock', title: 'Nothing yet', text: 'Invoices, payments and payouts appear here.' }));
  return layout.frame;
};

const planCard = async function (customer: Customer, width: number): Promise<FrameNode> {
  const layout = await card({
    w: width, title: 'Subscription', name: 'customer-plan',
    actions: [await badge({ label: 'Active', tone: 'positive', dot: true })],
  });
  const price = await frame({ name: 'plan-price', dir: 'V', w: layout.bodyWidth, gap: dim('space/2') });
  price.appendChild(await text({ style: 'body/md-medium', text: customer.plan.name, color: 'text/secondary', w: layout.bodyWidth, truncate: true }));
  const amount = await frame({ name: 'plan-amount', dir: 'H', gap: dim('space/4'), align: 'BASELINE' });
  amount.appendChild(await text({ style: 'title/page', text: wholeMoney(customer.plan.price) }));
  amount.appendChild(await text({ style: 'body/md', text: 'a month', color: 'text/tertiary' }));
  price.appendChild(amount);
  layout.body.appendChild(price);
  layout.body.appendChild(await progress({
    w: layout.bodyWidth, label: 'Current period', detail: 'Renews ' + customer.plan.renews, value: customer.plan.progress,
  }));
  return layout.frame;
};

const INVOICE_LOOK: Readonly<Record<Invoice['status'], { readonly label: string; readonly tone: BadgeTone; readonly when: string }>> = Object.freeze({
  open: { label: 'Open', tone: 'warning', when: 'Due ' },
  paid: { label: 'Paid', tone: 'positive', when: 'Paid ' },
  scheduled: { label: 'Scheduled', tone: 'accent', when: 'Sends ' },
});

const invoicesCard = async function (customer: Customer, width: number): Promise<FrameNode> {
  const invoices = COFFER.invoices.filter((invoice) => invoice.customerId === customer.id);
  const layout = await card({
    w: width, title: 'Invoices', name: 'customer-invoices', gap: 'space/8',
    actions: [await button({ label: 'View all', size: 'sm', variant: 'ghost' })],
  });
  if (!invoices.length) {
    layout.body.appendChild(await emptyState({
      w: layout.bodyWidth, icon: 'document-text', title: 'No invoices', text: 'Invoices sent to this customer appear here.',
    }));
    return layout.frame;
  }
  const rows = await frame({ name: 'invoice-list', dir: 'V', w: layout.bodyWidth });
  for (const [index, invoice] of invoices.entries()) {
    const look = INVOICE_LOOK[invoice.status];
    rows.appendChild(await listRow({
      w: layout.bodyWidth, name: 'invoice/' + invoice.id, label: invoice.id, leading: { icon: 'document-text' },
      detail: money(invoice.amount) + ' · ' + look.when + invoice.date,
      badge: { label: look.label, tone: look.tone }, divider: index > 0,
    }));
  }
  layout.body.appendChild(rows);
  return layout.frame;
};

const detailsCard = async function (customer: Customer, payments: readonly Payment[], width: number): Promise<FrameNode> {
  const layout = await card({
    w: width, title: 'Details', name: 'customer-details', gap: 'space/8',
    actions: [await iconButton({ icon: 'pencil-square', label: 'Edit details', size: 'sm' })],
  });
  const method = payments.length ? payments[0].method : null;
  layout.body.appendChild(await descriptionList([
    { label: 'Email', value: customer.email },
    { label: 'Country', value: customer.country },
    { label: 'Tax ID', value: customer.taxId, code: true },
    ...(method ? [{ label: 'Pays with', value: (room: number) => iconCell(methodIcon(method), methodLabel(method))(room) }] : []),
    { label: 'Refunded', value: money(customer.totals.refunded) },
  ], layout.bodyWidth, 96));
  return layout.frame;
};

export const screenCustomer = async function (name: string): Promise<FrameNode> {
  const layout = await appShell(name, 'Customers');
  const width = layout.contentWidth;
  const customer = customerById(COFFER, COFFER.selectedCustomerId);
  if (!customer) {
    layout.content.appendChild(await pageHeader({ w: width, title: 'Customer', breadcrumbs: [{ label: 'Customers' }] }));
    const box = await card({ w: width });
    box.body.appendChild(await emptyState({
      w: box.bodyWidth, icon: 'users', title: 'This customer does not exist',
      text: 'It may have been deleted. Search for it from the customers list.',
    }));
    layout.content.appendChild(box.frame);
    layout.fit();
    return layout.frame;
  }
  const wide = width >= 960;
  const payments = paymentsOf(customer);
  layout.content.appendChild(await pageHeader({
    w: width,
    breadcrumbs: [{ label: 'Customers' }],
    leading: await avatar({ initials: customer.initials, label: customer.name, size: 40 }),
    title: customer.name,
    meta: await badge({ label: 'Good standing', tone: 'positive', icon: 'shield-check' }),
    description: customer.email + ' · Customer since ' + customer.since,
    actions: [
      await button({ label: 'Send invoice', icon: 'document-text' }),
      await button({ label: 'Create payment', icon: 'plus', variant: 'primary' }),
    ],
  }));
  layout.content.appendChild(await figures(customer, payments, width));

  const columns = await frame({ name: 'customer-columns', dir: wide ? 'H' : 'V', w: width, gap: dim('space/24'), align: 'MIN' });
  const mainWidth = wide ? width - SIDE_WIDTH - dim('space/24').value : width;
  const sideWidth = wide ? SIDE_WIDTH : width;
  const main = await frame({ name: 'customer-main', dir: 'V', w: mainWidth, gap: dim('space/24') });
  main.appendChild(await paymentsCard(payments, customer.totals.payments, mainWidth));
  main.appendChild(await activityCard(customer, mainWidth));
  const side = await frame({ name: 'customer-side', dir: 'V', w: sideWidth, gap: dim('space/24') });
  side.appendChild(await planCard(customer, sideWidth));
  side.appendChild(await invoicesCard(customer, sideWidth));
  side.appendChild(await detailsCard(customer, payments, sideWidth));
  columns.appendChild(main);
  columns.appendChild(side);
  layout.content.appendChild(columns);
  layout.fit();
  return layout.frame;
};
