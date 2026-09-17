/* Representative Coffer layers whose settled structure is accepted on its own,
 * next to the whole-document signature. Changing this list changes what a
 * baseline protects, so it is not part of page authoring. */

import type { SignatureComponentDefinition } from '@figma-harness/contract';

export const SIGNATURE_COMPONENTS: readonly SignatureComponentDefinition[] = Object.freeze([
  { key: 'kpis', page: 'screens', topLevel: '01 · Overview', node: 'kpis' },
  { key: 'payments-list', page: 'screens', topLevel: '02 · Payments', node: 'payments-list' },
  { key: 'payment-breakdown', page: 'screens', topLevel: '03 · Payment', node: 'payment-breakdown' },
  { key: 'refund-dialog', page: 'screens', topLevel: '04 · Payment — refund', node: 'dialog/refund' },
]);
