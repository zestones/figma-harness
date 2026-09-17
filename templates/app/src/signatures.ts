/* Representative layers whose settled structure is accepted on its own, next
 * to the whole-document signature. Changing this list changes what a baseline
 * protects, so it is not part of page authoring.
 *
 * None yet: once the app has screens of its own, name the layers that stand
 * for them here, in the task that prepares its first review. The design
 * system's own representative components are always signed. */

import type { SignatureComponentDefinition } from '@figma-harness/contract';

export const SIGNATURE_COMPONENTS: readonly SignatureComponentDefinition[] = Object.freeze([]);
