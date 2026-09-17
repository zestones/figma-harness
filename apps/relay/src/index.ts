/* Relay, the example app, as the plugin sees it. */

import type { AppDefinition } from '@figma-harness/contract';
import type { MotionTransitionName } from '@figma-harness/primer';
import { validateProductFlowContract } from './flows/rules.ts';
import { REQUIRED_REACHABLE_KEYS, RELAY_FLOW_TRANSITIONS } from './flows/transitions.ts';
import { LAB_EXPERIMENTS } from './lab/index.ts';
import { CATALOG_VERSION, SCREEN_GROUPS, START_SCREEN } from './screens.ts';
import { SIGNATURE_COMPONENTS } from './signatures.ts';
import { STRESS_CONTRACT } from './stress-cases.ts';

export const RELAY_APP: AppDefinition<MotionTransitionName> = Object.freeze({
  name: 'Relay',
  catalogVersion: CATALOG_VERSION,
  lab: LAB_EXPERIMENTS,
  prototype: Object.freeze({
    requiredReachableKeys: REQUIRED_REACHABLE_KEYS,
    instantTransitionPrefixes: Object.freeze(['nav.', 'open.', 'back.']),
    transitions: RELAY_FLOW_TRANSITIONS,
    validateProductRules: validateProductFlowContract,
  }),
  radiusExceptions: Object.freeze([]),
  screenGroups: SCREEN_GROUPS,
  signatureComponents: SIGNATURE_COMPONENTS,
  startScreenKey: START_SCREEN,
  stress: STRESS_CONTRACT,
});
