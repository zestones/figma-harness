/* Invariants specific to Relay's prototype. The generic flow validator runs
 * these alongside its own structural checks. */

import { PROTOTYPE_SCREENS, SCREEN_GROUPS } from '../pages/state-matrix.ts';
import {
  RELAY_FLOW_TRANSITIONS,
  SCREEN_FAMILIES,
} from './relay-flow-matrix.ts';

export function validateProductFlowContract(): string[] {
  const issues: string[] = [];
  const allKeys = SCREEN_GROUPS.flatMap((group) => group.screens.map((screen) => screen.key));
  const allTitles = SCREEN_GROUPS.flatMap((group) => group.screens.map((screen) => screen.title));
  if (new Set(allKeys).size !== allKeys.length) issues.push('screen keys are not unique across groups');
  if (new Set(allTitles).size !== allTitles.length) issues.push('screen titles are not unique across groups');

  const prototypeKeys = PROTOTYPE_SCREENS.map((screen) => screen.key);
  const familyKeys = Object.values(SCREEN_FAMILIES).flat();
  if (JSON.stringify([...familyKeys].sort()) !== JSON.stringify([...prototypeKeys].sort())) {
    issues.push('every prototype screen must belong to exactly one screen family');
  }

  for (const key of prototypeKeys) {
    const leaves = RELAY_FLOW_TRANSITIONS.some((transition) => transition.sources.includes(key));
    if (!leaves) issues.push(key + ': a prototype screen needs at least one way out');
  }
  return issues;
}
