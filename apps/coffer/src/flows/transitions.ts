/* The prototype: which layer leads to which screen. The plugin wires it; the
 * flow guard and the harness verify it. */

import {
  defineFlowTransition,
  type FlowSelector,
  type FlowTransition as GenericFlowTransition,
} from '@figma-harness/contract';
import type { MotionName } from '@figma-harness/carrara';
import { PROTOTYPE_SCREENS } from '../screens.ts';

type FlowTransition = GenericFlowTransition<MotionName>;

/* The dialog covers the page, so nothing under it is wired. */
const PAGE_KEYS = PROTOTYPE_SCREENS.map((screen) => screen.key).filter((key) => key !== 'paymentRefund');

const byName = function (value: string): FlowSelector {
  return { kind: 'name', value };
};

const go = function (
  id: string,
  sources: readonly string[],
  selector: FlowSelector,
  destination: string,
  motion?: MotionName,
): FlowTransition {
  return defineFlowTransition<MotionName>({
    id,
    sources,
    selector,
    trigger: 'ON_CLICK',
    destination,
    navigation: 'NAVIGATE',
    cardinality: selector.kind === 'prefix' ? 'many' : 'one',
    motion,
  });
};

const section = function (label: string, destination: string): FlowTransition {
  return go('nav.' + destination, PAGE_KEYS.filter((key) => key !== destination), byName('nav/' + label), destination);
};

export const FLOW_TRANSITIONS: readonly FlowTransition[] = Object.freeze([
  // Moving between pages is instant.
  section('Overview', 'overview'),
  section('Payments', 'payments'),
  go('open.payment', ['overview', 'payments', 'customer'], { kind: 'prefix', value: 'payment-row/' }, 'payment'),
  go('open.payments', ['overview'], byName('button/View all payments'), 'payments'),
  go('open.customer', ['payment', 'paymentRefunded'], byName('button/View customer'), 'customer'),
  go('back.payments', ['payment', 'paymentRefunded'], byName('crumb/Payments'), 'payments'),
  defineFlowTransition<MotionName>({
    id: 'back.customer',
    sources: ['customer'],
    selector: byName('crumb/Customers'),
    trigger: 'ON_CLICK',
    destination: null,
    navigation: 'BACK',
    cardinality: 'one',
  }),

  // The refund dialog enters and leaves; confirming it changes the payment in place.
  go('refund.open', ['payment'], byName('button/Refund'), 'paymentRefund', 'enter'),
  go('refund.close', ['paymentRefund'], byName('refund-dialog/close'), 'payment', 'exit'),
  go('refund.cancel', ['paymentRefund'], byName('button/Cancel'), 'payment', 'exit'),
  go('refund.confirm', ['paymentRefund'], byName('button/Refund payment'), 'paymentRefunded', 'exit'),
]);

/** Frames a person must be able to reach from the start screen. */
export const REQUIRED_REACHABLE_KEYS: readonly string[] = Object.freeze(PROTOTYPE_SCREENS.map((screen) => screen.key));
