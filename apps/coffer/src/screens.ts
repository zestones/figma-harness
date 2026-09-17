/* Every generated screen, grouped as it is laid out on the Screens page, and
 * where a prototype presentation starts. */

import type { ScreenDefinition, ScreenGroup } from '@figma-harness/contract';
import { screenCustomer } from './pages/customer.ts';
import { screenOverview } from './pages/overview.ts';
import { screenPayment } from './pages/payment.ts';
import { screenPayments } from './pages/payments.ts';

/** Bump whenever screen keys or the prototype matrix change: a document built
 *  from another version is rewired completely on its next refresh. */
export const CATALOG_VERSION = 'coffer-v1';

/** The frame a prototype presentation starts from. */
export const START_SCREEN = 'overview';

const defineScreen = function (key: string, title: string, build: (name: string) => Promise<FrameNode>): ScreenDefinition {
  return Object.freeze({ key, title, build: () => build(title) });
};

export const SCREEN_GROUPS: readonly ScreenGroup[] = Object.freeze([
  Object.freeze({
    letter: 'A',
    title: 'Money in',
    body: 'How the month is going, and every payment behind it.',
    prototype: true,
    screens: Object.freeze([
      defineScreen('overview', '01 · Overview', screenOverview),
      defineScreen('payments', '02 · Payments', screenPayments),
    ]),
  }),
  Object.freeze({
    letter: 'B',
    title: 'Payment',
    body: 'One payment, the refund dialog over it, and the payment once refunded.',
    prototype: true,
    screens: Object.freeze([
      defineScreen('payment', '03 · Payment', (name) => screenPayment({ name })),
      defineScreen('paymentRefund', '04 · Payment — refund', (name) => screenPayment({ name, refund: 'dialog' })),
      defineScreen('paymentRefunded', '05 · Payment — refunded', (name) => screenPayment({ name, refund: 'done' })),
    ]),
  }),
  Object.freeze({
    letter: 'C',
    title: 'Customer',
    body: 'Who pays, what they pay for, and what happened lately.',
    prototype: true,
    screens: Object.freeze([
      defineScreen('customer', '06 · Customer', screenCustomer),
    ]),
  }),
]);

/** Every screen, in canvas order. */
export const ALL_SCREENS: readonly ScreenDefinition[] = Object.freeze(
  SCREEN_GROUPS.flatMap((group) => group.screens),
);

/** Screens wired into the clickable prototype. */
export const PROTOTYPE_SCREENS: readonly ScreenDefinition[] = Object.freeze(
  SCREEN_GROUPS.filter((group) => group.prototype).flatMap((group) => group.screens),
);
