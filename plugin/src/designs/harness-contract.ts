/* The generated document's declared audit contract.
 *
 * Representative signature boundaries, reviewed exceptions and the prototype
 * contract belong to the authored document, not to the tools that exercise
 * them. Page authors own the stress cases (pages/stress-cases.ts); this module
 * stays protected because it can relax an audit. The plugin exposes it through
 * HARNESS_API. */

import {
  MOTION_TRANSITIONS,
  prototypeMotionTransition,
} from '../kit/public.ts';
import { PROTOTYPE_FLOWS } from './flows/index.ts';
import { validateProductFlowContract } from './flows/product-contract.ts';
import { REQUIRED_REACHABLE_KEYS } from './flows/relay-flow-matrix.ts';
import { PROTOTYPE_SCREENS } from './pages/state-matrix.ts';
import { STRESS_CONTRACT } from './pages/stress-cases.ts';
import { START_SCREEN_KEY } from './screens.ts';
import { PAGES, type WorkspacePageKey } from './workspace.ts';

export interface SignatureComponent {
  readonly key: string;
  readonly node: string;
  readonly page: string;
  readonly topLevel: string;
}

/** Representative internal boundaries whose settled structure is accepted separately. */
export const SIGNATURE_COMPONENTS: readonly SignatureComponent[] = Object.freeze([
  { key: 'app-header', page: PAGES.screens, topLevel: '01 · Overview', node: 'App header' },
  { key: 'environments', page: PAGES.screens, topLevel: '01 · Overview', node: 'Environments' },
  { key: 'release-list', page: PAGES.screens, topLevel: '02 · Releases', node: 'Release list' },
  { key: 'release-checks', page: PAGES.screens, topLevel: '03 · Release', node: 'Checks' },
  { key: 'promote-dialog', page: PAGES.screens, topLevel: '04 · Release — promote', node: 'promote-dialog' },
  { key: 'settings-form', page: PAGES.screens, topLevel: '05 · Settings', node: 'Settings form' },
  { key: 'button-matrix', page: PAGES.system, topLevel: 'C1 · Buttons', node: 'row/primary' },
]);

interface AuditedNode {
  cornerRadius?: number;
  getPluginData(key: string): string;
  height: number;
  name: string;
  type: string;
  width: number;
}

export interface RadiusException {
  readonly label: string;
  readonly matches: (node: AuditedNode) => boolean;
  readonly page: WorkspacePageKey;
}

/* Primer nests the toggle knob inside its track: 6 px less the 2 px between them. */
const toggleKnob = function (node: AuditedNode): boolean {
  return node.name === 'toggle-knob' && node.cornerRadius === 4 && node.height <= 28;
};

/** Reviewed corner radii outside the scale. */
export const RADIUS_EXCEPTIONS: readonly RadiusException[] = Object.freeze([
  { label: 'toggle knobs nested in their track', page: 'screens', matches: toggleKnob },
  { label: 'toggle knobs nested in their track', page: 'system', matches: toggleKnob },
]);

/** Nodes that may legitimately stroke with the focus colour outside an outline:
 *  the Colour sheet's chip that shows the token itself. */
export const FOCUS_STROKE_EXEMPTIONS: ReadonlyArray<(node: AuditedNode) => boolean> = Object.freeze([
  (node: AuditedNode) => node.name === 'chip' && node.getPluginData('spec.swatch.token') === 'focus/outline-color',
]);

export const PROTOTYPE_CONTRACT = Object.freeze({
  /** Every top-level frame the prototype may connect, by durable key. */
  frames: Object.freeze(PROTOTYPE_SCREENS.map((screen) => Object.freeze({ key: screen.key, title: screen.title }))),
  startScreenKey: START_SCREEN_KEY,
  /** Frames a person must be able to reach from the start screen. */
  requiredReachableKeys: REQUIRED_REACHABLE_KEYS,
  /** Transition id prefixes that must navigate without animation. */
  instantTransitionPrefixes: Object.freeze(['nav.', 'open.', 'back.']),
  transitions: PROTOTYPE_FLOWS.transitions,
  motion: Object.freeze({
    names: Object.freeze(Object.keys(MOTION_TRANSITIONS)),
    transition: prototypeMotionTransition,
  }),
  validateProductRules: validateProductFlowContract,
});

export const DOCUMENT_AUDIT = Object.freeze({
  focusStrokeExemptions: FOCUS_STROKE_EXEMPTIONS,
  prototype: PROTOTYPE_CONTRACT,
  radiusExceptions: RADIUS_EXCEPTIONS,
  signatureComponents: SIGNATURE_COMPONENTS,
  stress: STRESS_CONTRACT,
});
