/* 03–05 · Payment: one payment, what happened to it, and who paid. The refund
 * dialog covers it, and a confirmed refund changes it in place. */

import {
  abs,
  avatar,
  badge,
  button,
  card,
  checkbox,
  descriptionList,
  dialog,
  dim,
  emptyState,
  f as frame,
  factStrip,
  field,
  iconButton,
  iconCell,
  listRow,
  pageHeader,
  scrim,
  segmented,
  select,
  text,
  timeline,
  toast,
  type BadgeTone,
  type IconName,
  type TimelineEvent,
} from '@figma-harness/carrara';
import { appShell } from '../app.ts';
import {
  COFFER,
  customerById,
  paymentById,
  type Payment,
  type PaymentEvent,
  type PaymentMethod,
} from '../fixtures/index.ts';
import { FRAME_H } from './frame.ts';
import { methodIcon, methodLabel, money, STATUS, wholeMoney } from './format.ts';

export interface PaymentScreenOptions {
  name: string;
  /** The refund dialog is open, or the refund is done. */
  refund?: 'dialog' | 'done';
}

const SIDE_WIDTH = 360;
const TOAST_WIDTH = 380;

const EVENT_LOOK: Readonly<Record<PaymentEvent['kind'], { readonly icon: IconName; readonly tone: BadgeTone }>> = Object.freeze({
  check: { icon: 'shield-check', tone: 'accent' },
  invoice: { icon: 'document-text', tone: 'neutral' },
  payout: { icon: 'banknotes', tone: 'neutral' },
  refund: { icon: 'arrow-uturn-left', tone: 'neutral' },
  started: { icon: 'document-text', tone: 'neutral' },
  succeeded: { icon: 'check-circle', tone: 'positive' },
});

const events = function (payment: Payment, refunded: boolean): TimelineEvent[] {
  const history = [...(refunded ? [COFFER.refund.event] : []), ...(payment.events || [])];
  return history.map((event) => ({ ...EVENT_LOOK[event.kind], title: event.title, detail: event.detail, time: event.time }));
};

const FEE_LABELS: Readonly<Record<PaymentMethod['kind'], string>> = Object.freeze({
  bank: 'Bank transfer',
  card: 'Card processing',
  wallet: 'Wallet processing',
});

const percent = function (part: number, whole: number): string {
  return whole ? (Math.round((part / whole) * 1000) / 10) + '%' : '0%';
};

const activityCard = async function (payment: Payment, refunded: boolean, width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Activity', name: 'payment-activity' });
  const history = events(payment, refunded);
  layout.body.appendChild(history.length
    ? await timeline(history, layout.bodyWidth)
    : await emptyState({ w: layout.bodyWidth, icon: 'clock', title: 'No activity yet', text: 'Events appear here as the payment moves.' }));
  return layout.frame;
};

const breakdownCard = async function (payment: Payment, refunded: boolean, width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Breakdown', name: 'payment-breakdown', gap: 'space/8' });
  const rows = [
    { label: 'Amount', detail: payment.description, value: money(payment.amount) },
    { label: 'Coffer fee', detail: FEE_LABELS[payment.method.kind] + ', ' + percent(payment.fee, payment.amount), value: money(-payment.fee) },
    ...(refunded ? [{ label: 'Refunded', detail: 'To ' + methodLabel(payment.method), value: money(-payment.amount) }] : []),
  ];
  const net = payment.amount - payment.fee - (refunded ? payment.amount : 0);
  const lines = await frame({ name: 'breakdown-lines', dir: 'V', w: layout.bodyWidth });
  for (const [index, row] of rows.entries()) {
    lines.appendChild(await listRow({
      w: layout.bodyWidth, label: row.label, detail: row.detail, value: { text: row.value }, divider: index > 0,
      name: 'breakdown/' + row.label,
    }));
  }
  const total = await frame({
    name: 'breakdown/Net', dir: 'H', w: layout.bodyWidth, align: 'CENTER', justify: 'SPACE_BETWEEN',
    pad: [dim('space/16'), 0, 0, 0], stroke: 'border/default', strokeSide: 'Top', strokeW: 1,
  });
  total.appendChild(await text({ style: 'title/card', text: 'Net amount' }));
  total.appendChild(await text({ style: 'title/card', text: money(net) }));
  lines.appendChild(total);
  layout.body.appendChild(lines);
  layout.body.appendChild(await text({
    style: 'body/sm', color: 'text/tertiary', w: layout.bodyWidth,
    text: refunded
      ? 'Coffer keeps its fee on a refund, so ' + money(-net).replace('−', '') + ' comes out of your next payout.'
      : 'Included in the payout that reaches ' + COFFER.payout.bank + ' on ' + COFFER.payout.arrives + '.',
  }));
  return layout.frame;
};

const detailsCard = async function (payment: Payment, width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Details', name: 'payment-details', gap: 'space/8' });
  layout.body.appendChild(await descriptionList([
    { label: 'Payment ID', value: payment.id, code: true },
    ...(payment.invoice ? [{ label: 'Invoice', value: payment.invoice, code: true }] : []),
    { label: 'Statement', value: COFFER.workspace.name.toUpperCase(), code: true },
    { label: 'Created', value: payment.created },
  ], layout.bodyWidth, 160));
  return layout.frame;
};

const customerCard = async function (payment: Payment, width: number): Promise<FrameNode> {
  const customer = customerById(COFFER, payment.customerId);
  const layout = await card({ w: width, title: 'Customer', name: 'payment-customer' });
  const inner = layout.bodyWidth;
  const who = await frame({ name: 'customer-identity', dir: 'H', w: inner, gap: dim('space/12'), align: 'CENTER' });
  who.appendChild(await avatar({ initials: customer ? customer.initials : '?', label: customer ? customer.name : 'Unknown customer', size: 40 }));
  const room = inner - 40 - who.itemSpacing;
  const words = await frame({ name: 'customer-name', dir: 'V', w: room });
  words.appendChild(await text({ style: 'body/md-strong', text: customer ? customer.name : 'Unknown customer', w: room, truncate: true }));
  words.appendChild(await text({ style: 'body/sm', text: customer ? customer.email : payment.customerId, color: 'text/tertiary', w: room, truncate: true }));
  who.appendChild(words);
  layout.body.appendChild(who);
  if (customer) {
    layout.body.appendChild(await descriptionList([
      { label: 'Country', value: customer.country },
      { label: 'Customer since', value: customer.since },
      { label: 'Lifetime value', value: wholeMoney(customer.totals.lifetime) },
    ], inner, 128));
  }
  layout.body.appendChild(await button({ label: 'View customer', iconAfter: 'arrow-right', size: 'sm', name: 'button/View customer' }));
  return layout.frame;
};

const methodCard = async function (payment: Payment, width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Payment method', name: 'payment-method', gap: 'space/8' });
  const onCard = payment.method.kind === 'card';
  const passed = (): Promise<FrameNode> => badge({ label: 'Passed', tone: 'positive', icon: 'check' });
  layout.body.appendChild(await descriptionList([
    { label: 'Number', value: (room) => iconCell(methodIcon(payment.method), methodLabel(payment.method))(room) },
    ...(payment.method.expires ? [{ label: 'Expires', value: payment.method.expires }] : []),
    ...(onCard ? [
      { label: 'Security code', value: passed },
      { label: 'Postal code', value: passed },
    ] : []),
  ], layout.bodyWidth, 128));
  return layout.frame;
};

const refundDialog = function (payment: Payment): Promise<FrameNode> {
  const customer = customerById(COFFER, payment.customerId);
  return dialog({
    name: 'dialog/refund',
    closeName: 'refund-dialog/close',
    title: 'Refund payment',
    description: 'The money reaches ' + methodLabel(payment.method) + ' in ' + COFFER.refund.arrives
      + '. Coffer keeps its ' + money(payment.fee) + ' fee.',
    body: async (width) => [
      await segmented([{ label: 'Full refund', current: true }, { label: 'Partial refund' }], 'Refund type'),
      await field({ w: width, label: 'Amount', prefix: '$', value: money(payment.amount).slice(1), suffix: payment.currency, name: 'field/Refund amount' }),
      await select({ w: width, label: 'Reason', value: COFFER.refund.reason, name: 'field/Refund reason' }),
      await checkbox({
        w: width, checked: true, name: 'checkbox/Email a receipt', label: 'Email a receipt',
        description: customer ? 'Sent to ' + customer.email : 'Sent to the customer',
      }),
    ],
    secondary: { label: 'Cancel', name: 'button/Cancel' },
    primary: { label: 'Refund ' + money(payment.amount), name: 'button/Refund payment' },
  });
};

const missing = async function (name: string): Promise<FrameNode> {
  const layout = await appShell(name, 'Payments');
  layout.content.appendChild(await pageHeader({ w: layout.contentWidth, title: 'Payment', breadcrumbs: [{ label: 'Payments' }] }));
  const box = await card({ w: layout.contentWidth });
  box.body.appendChild(await emptyState({
    w: box.bodyWidth, icon: 'magnifying-glass', title: 'This payment does not exist',
    text: 'It may belong to another account. Search for it from the payments list.',
  }));
  layout.content.appendChild(box.frame);
  layout.fit();
  return layout.frame;
};

export const screenPayment = async function (options: PaymentScreenOptions): Promise<FrameNode> {
  const payment = paymentById(COFFER, COFFER.selectedPaymentId);
  if (!payment) return missing(options.name);
  const refunded = options.refund === 'done';
  const status = refunded ? STATUS.refunded : STATUS[payment.status];
  const customer = customerById(COFFER, payment.customerId);
  const layout = await appShell(options.name, 'Payments');
  const width = layout.contentWidth;
  const wide = width >= 960;

  const meta = await frame({ name: 'payment-state', dir: 'H', gap: dim('space/12'), align: 'CENTER' });
  meta.appendChild(await text({ style: 'title/card', text: payment.currency, color: 'text/tertiary' }));
  meta.appendChild(await badge(status));
  layout.content.appendChild(await pageHeader({
    w: width,
    breadcrumbs: [{ label: 'Payments' }],
    title: money(payment.amount),
    titleStyle: 'display/lg',
    meta,
    description: payment.description,
    details: (room) => factStrip([
      { label: 'Date', value: payment.created, icon: 'calendar' },
      { label: 'Customer', value: customer ? customer.name : 'Unknown customer', icon: 'building-office-2' },
      { label: 'Method', value: methodLabel(payment.method), icon: methodIcon(payment.method) },
      { label: 'Risk', value: 'Normal', icon: 'shield-check' },
    ], room),
    actions: [
      await button({ label: 'Refund', icon: 'receipt-refund', name: 'button/Refund', state: refunded ? 'disabled' : 'rest' }),
      await button({ label: 'Send receipt', icon: 'envelope' }),
      await iconButton({ icon: 'ellipsis-horizontal', label: 'More actions', name: 'button/More actions', variant: 'secondary' }),
    ],
  }));

  const columns = await frame({ name: 'payment-columns', dir: wide ? 'H' : 'V', w: width, gap: dim('space/24'), align: 'MIN' });
  const mainWidth = wide ? width - SIDE_WIDTH - dim('space/24').value : width;
  const sideWidth = wide ? SIDE_WIDTH : width;
  const main = await frame({ name: 'payment-main', dir: 'V', w: mainWidth, gap: dim('space/24') });
  main.appendChild(await activityCard(payment, refunded, mainWidth));
  main.appendChild(await breakdownCard(payment, refunded, mainWidth));
  main.appendChild(await detailsCard(payment, mainWidth));
  const side = await frame({ name: 'payment-side', dir: 'V', w: sideWidth, gap: dim('space/24') });
  side.appendChild(await customerCard(payment, sideWidth));
  side.appendChild(await methodCard(payment, sideWidth));
  columns.appendChild(main);
  columns.appendChild(side);
  layout.content.appendChild(columns);
  layout.fit();

  const screen = layout.frame;
  if (options.refund === 'dialog') await scrim(screen, await refundDialog(payment));
  if (refunded) {
    const note = await toast({
      w: Math.min(TOAST_WIDTH, screen.width - dim('space/32').value * 2),
      title: 'Refund issued',
      text: money(payment.amount) + ' is on its way to ' + methodLabel(payment.method) + '.',
    });
    abs(screen, note, screen.width - note.width - dim('space/32').value, FRAME_H - note.height - dim('space/32').value);
  }
  return screen;
};
