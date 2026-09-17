/* The generated document's audit contract, assembled from the design system
 * and the app this plugin builds. Reviewed exceptions and representative
 * boundaries can relax an audit, so this module stays protected. The plugin
 * exposes it through HARNESS_API. */

import type { DocumentContract } from '@figma-harness/contract';
import { APP, DESIGN_SYSTEM, PROTOTYPE } from '../composition.ts';
import { PAGES } from './workspace.ts';

const prototypeScreens = APP.screenGroups
  .filter((group) => group.prototype)
  .flatMap((group) => group.screens);

export const DOCUMENT_AUDIT: DocumentContract = Object.freeze({
  focusStrokeExemptions: Object.freeze([...DESIGN_SYSTEM.focusStrokeExemptions]),
  prototype: Object.freeze({
    /** Every top-level frame the prototype may connect, by durable key. */
    frames: Object.freeze(prototypeScreens.map((screen) => Object.freeze({ key: screen.key, title: screen.title }))),
    startScreenKey: APP.startScreenKey,
    requiredReachableKeys: APP.prototype.requiredReachableKeys,
    instantTransitionPrefixes: APP.prototype.instantTransitionPrefixes,
    transitions: APP.prototype.transitions,
    motion: Object.freeze({
      names: DESIGN_SYSTEM.motion.names,
      transition: PROTOTYPE.motion,
    }),
    validateProductRules: APP.prototype.validateProductRules,
  }),
  radiusExceptions: Object.freeze([...DESIGN_SYSTEM.radiusExceptions, ...APP.radiusExceptions]),
  /** The app's representative boundaries first, then the design system's. */
  signatureComponents: Object.freeze([...APP.signatureComponents, ...DESIGN_SYSTEM.signatureComponents]
    .map((component) => Object.freeze({
      key: component.key,
      page: PAGES[component.page],
      topLevel: component.topLevel,
      node: component.node,
    }))),
  stress: APP.stress,
});
