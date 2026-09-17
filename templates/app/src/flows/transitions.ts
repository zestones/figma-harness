/* The prototype: which layer leads to which screen. The plugin wires it; the
 * flow guard and the harness verify it. */

import {
  defineFlowTransition,
  type FlowSelector,
  type FlowTransition,
} from '@figma-harness/contract';
import { starter } from '@figma-harness/template-design-system';
import { PROTOTYPE_SCREENS } from '../screens.ts';

const byName = function (value: string): FlowSelector {
  return { kind: 'name', value };
};

export const FLOW_TRANSITIONS: readonly FlowTransition[] = Object.freeze([
  // Opening a project and going back are page navigation, so they are instant.
  defineFlowTransition({
    id: 'open.project',
    sources: ['projects'],
    selector: { kind: 'prefix', value: 'project/' },
    trigger: 'ON_CLICK',
    destination: 'project',
    navigation: 'NAVIGATE',
    cardinality: 'many',
  }),
  defineFlowTransition({
    id: 'back.project',
    sources: ['project', 'projectComplete'],
    selector: byName('button/Back'),
    trigger: 'ON_CLICK',
    destination: null,
    navigation: 'BACK',
    cardinality: 'one',
  }),

  // Completing a project changes it in place, with the design system's motion.
  defineFlowTransition({
    id: 'project.complete',
    sources: ['project'],
    selector: byName('button/Mark complete'),
    trigger: 'ON_CLICK',
    destination: 'projectComplete',
    navigation: 'NAVIGATE',
    cardinality: 'one',
    motion: starter.stateMotion,
  }),
  defineFlowTransition({
    id: 'project.reopen',
    sources: ['projectComplete'],
    selector: byName('button/Reopen'),
    trigger: 'ON_CLICK',
    destination: 'project',
    navigation: 'NAVIGATE',
    cardinality: 'one',
    motion: starter.stateMotion,
  }),
]);

/** Frames a person must be able to reach from the start screen. */
export const REQUIRED_REACHABLE_KEYS: readonly string[] = Object.freeze(PROTOTYPE_SCREENS.map((screen) => screen.key));
