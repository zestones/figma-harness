/* How Coffer writes money, states and payment methods, on every screen. */

import type { BadgeOptions, IconName } from '@figma-harness/carrara';
import type { PaymentMethod, PaymentStatus } from '../fixtures/index.ts';

/* Figma's plugin runtime has no Intl, so digits are grouped by hand. */
const group = function (digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/** $2,400.00, or −$84.00 for a negative amount. */
export const money = function (amount: number): string {
  const [units, cents] = Math.abs(amount).toFixed(2).split('.');
  return (amount < 0 ? '−$' : '$') + group(units) + '.' + cents;
};

/** $86,420 */
export const wholeMoney = function (amount: number): string {
  return '$' + group(String(Math.round(amount)));
};

/** 12,845 */
export const count = function (value: number): string {
  return group(String(Math.round(value)));
};

/** $60k on a chart axis, or $48.7k with a decimal in a tooltip. */
export const thousands = function (value: number, decimals = 0): string {
  const [units, fraction] = value.toFixed(decimals).split('.');
  return '$' + group(units) + (fraction ? '.' + fraction : '') + 'k';
};

export const STATUS: Readonly<Record<PaymentStatus, BadgeOptions & { readonly icon: IconName }>> = Object.freeze({
  succeeded: { label: 'Succeeded', tone: 'positive', icon: 'check-circle' },
  processing: { label: 'Processing', tone: 'accent', icon: 'clock' },
  refunded: { label: 'Refunded', tone: 'neutral', icon: 'arrow-uturn-left' },
  disputed: { label: 'Needs response', tone: 'warning', icon: 'exclamation-triangle' },
  failed: { label: 'Failed', tone: 'critical', icon: 'x-circle' },
});

/** A status as a badge with a dot, for dense tables. */
export const statusBadge = function (status: PaymentStatus): BadgeOptions {
  return { label: STATUS[status].label, tone: STATUS[status].tone, dot: true };
};

const METHOD_ICONS: Readonly<Record<PaymentMethod['kind'], IconName>> = Object.freeze({
  card: 'credit-card',
  bank: 'building-library',
  wallet: 'wallet',
});

export const methodIcon = function (method: PaymentMethod): IconName {
  return METHOD_ICONS[method.kind];
};

/** Visa ···· 4242 */
export const methodLabel = function (method: PaymentMethod): string {
  return method.brand + ' ···· ' + method.last4;
};
