'use strict';

import type {
  FlowSelector,
  PrototypeContract,
} from '../runtime/harness/contract.ts';

const validateSelector = function (
  issues: string[],
  owner: string,
  selector: Readonly<FlowSelector>,
  cardinality: 'many' | 'one',
): void {
  if (selector.kind !== 'frame' && !selector.value) {
    issues.push(owner + ': named/prefix selector requires a value');
  }
  if (selector.ancestor !== undefined && !selector.ancestor) {
    issues.push(owner + ': ancestor selector cannot be empty');
  }
  if (cardinality === 'many' && selector.kind !== 'prefix') {
    issues.push(owner + ': many-cardinality contracts must use a prefix selector');
  }
};

/** Figma-free validation of the declarative prototype, before any build. */
export function validateFlowContract(contract: PrototypeContract): string[] {
  const issues: string[] = [...contract.validateProductRules()];
  const frameKeys = new Set(contract.frames.map((frame) => frame.key));
  const frameTitles = contract.frames.map((frame) => frame.title);
  if (frameKeys.size !== contract.frames.length) issues.push('prototype frame keys are not unique');
  if (new Set(frameTitles).size !== frameTitles.length) issues.push('prototype frame titles are not unique');
  if (!frameKeys.has(contract.startScreenKey)) {
    issues.push('the start screen is not a prototype frame: ' + contract.startScreenKey);
  }

  const transitionIds = contract.transitions.map((transition) => transition.id);
  if (new Set(transitionIds).size !== transitionIds.length) {
    issues.push('flow transition ids are not unique');
  }

  for (const transition of contract.transitions) {
    if (transition.navigation === 'NAVIGATE') {
      if (!transition.destination || !frameKeys.has(transition.destination)) {
        issues.push(transition.id + ': unknown destination key ' + transition.destination);
      }
    } else {
      if (transition.destination !== null) {
        issues.push(transition.id + ': BACK navigation cannot declare a destination');
      }
      if (transition.trigger !== 'ON_CLICK') {
        issues.push(transition.id + ': BACK navigation must be an explicit click');
      }
      if (transition.motion) {
        issues.push(transition.id + ': native BACK navigation cannot declare motion');
      }
    }
    validateSelector(issues, transition.id, transition.selector, transition.cardinality);
    if (transition.trigger === 'AFTER_TIMEOUT' && transition.selector.kind !== 'frame') {
      issues.push(transition.id + ': timeout transitions must originate on the frame');
    }
    if (transition.trigger === 'AFTER_TIMEOUT'
      && (!transition.timeoutSeconds || transition.timeoutSeconds <= 0)) {
      issues.push(transition.id + ': timeout transitions require a positive duration');
    }
    if (transition.trigger !== 'AFTER_TIMEOUT' && transition.timeoutSeconds !== undefined) {
      issues.push(transition.id + ': only timeout transitions may declare a duration');
    }
    if (transition.motion && !contract.motion.names.includes(transition.motion)) {
      issues.push(transition.id + ': unknown motion transition ' + transition.motion);
    }
    if (transition.trigger === 'AFTER_TIMEOUT' && transition.motion) {
      issues.push(transition.id + ': server-driven loading completion must remain instant');
    }
    if (contract.instantTransitionPrefixes.some((prefix) => transition.id.startsWith(prefix))
      && transition.motion) {
      issues.push(transition.id + ': page navigation must remain instant');
    }
    for (const source of transition.sources) {
      if (!frameKeys.has(source)) issues.push(transition.id + ': unknown source key ' + source);
      if (transition.destination && source === transition.destination) {
        issues.push(transition.id + ': self-transition is forbidden');
      }
    }
  }

  const reachable = new Set<string>([contract.startScreenKey]);
  var changed = true;
  while (changed) {
    changed = false;
    for (const transition of contract.transitions) {
      if (!transition.sources.some((source) => reachable.has(source))) continue;
      if (transition.destination && !reachable.has(transition.destination)) {
        reachable.add(transition.destination);
        changed = true;
      }
    }
  }
  for (const frame of contract.requiredReachableKeys) {
    if (!reachable.has(frame)) {
      issues.push('human-flow frame is unreachable from ' + contract.startScreenKey + ': ' + frame);
    }
  }

  return issues.sort();
}
