/* Representative Relay boundaries whose settled structure is accepted on its
 * own, next to the whole-document signature. Changing this list changes what a
 * baseline protects, so it is not part of page authoring. */

import type { SignatureComponentDefinition } from '@figma-harness/contract';

export const SIGNATURE_COMPONENTS: readonly SignatureComponentDefinition[] = Object.freeze([
  { key: 'app-header', page: 'screens', topLevel: '01 · Overview', node: 'App header' },
  { key: 'environments', page: 'screens', topLevel: '01 · Overview', node: 'Environments' },
  { key: 'release-list', page: 'screens', topLevel: '02 · Releases', node: 'Release list' },
  { key: 'release-checks', page: 'screens', topLevel: '03 · Release', node: 'Checks' },
  { key: 'promote-dialog', page: 'screens', topLevel: '04 · Release — promote', node: 'promote-dialog' },
  { key: 'settings-form', page: 'screens', topLevel: '05 · Settings', node: 'Settings form' },
]);
