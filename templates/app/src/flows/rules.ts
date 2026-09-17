/* Invariants specific to this app's prototype. The generic flow validator runs
 * these alongside its own structural checks. */

import { PROTOTYPE_SCREENS, SCREEN_GROUPS } from '../screens.ts';
import { FLOW_TRANSITIONS } from './transitions.ts';

export function validateProductFlowContract(): string[] {
  const issues: string[] = [];
  const screens = SCREEN_GROUPS.flatMap((group) => group.screens);
  if (new Set(screens.map((screen) => screen.key)).size !== screens.length) issues.push('screen keys are not unique');
  if (new Set(screens.map((screen) => screen.title)).size !== screens.length) issues.push('screen titles are not unique');
  for (const screen of PROTOTYPE_SCREENS) {
    if (!FLOW_TRANSITIONS.some((transition) => transition.sources.includes(screen.key))) {
      issues.push(screen.key + ': a prototype screen needs at least one way out');
    }
  }
  return issues;
}
