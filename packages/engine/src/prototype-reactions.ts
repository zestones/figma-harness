/* Native Figma reaction writer and semantic readback verification. */

import type { PrototypeTransition } from '@figma-harness/contract';

export type { PrototypeEasing, PrototypeTransition } from '@figma-harness/contract';

export interface PrototypeNodeAction {
  destinationId: string;
  navigation: 'CHANGE_TO' | 'NAVIGATE';
  preserveScrollPosition: false;
  transition: PrototypeTransition | null;
  type: 'NODE';
}

export interface PrototypeBackAction {
  type: 'BACK';
}

export type PrototypeAction = PrototypeBackAction | PrototypeNodeAction;

export interface PrototypeReaction {
  actions: PrototypeAction[];
  trigger:
    | { type: 'AFTER_TIMEOUT'; timeout: number }
    | { type: 'ON_CLICK' | 'ON_HOVER' };
}

interface ReactionHost {
  readonly reactions: readonly unknown[];
  setReactionsAsync(reactions: PrototypeReaction[]): Promise<void>;
}

const objectValue = function (value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object'
    ? value as Record<string, unknown>
    : null;
};

const stableNumber = function (value: unknown): unknown {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  return Math.round(value * 1_000_000) / 1_000_000;
};

const semanticTrigger = function (value: unknown): Record<string, unknown> {
  const trigger = objectValue(value);
  if (!trigger) return { type: null };
  if (trigger['type'] === 'AFTER_TIMEOUT') {
    return { type: trigger['type'], timeout: stableNumber(trigger['timeout']) };
  }
  return { type: trigger['type'] };
};

const bezierValue = function (value: unknown): unknown {
  const bezier = objectValue(value);
  if (!bezier) return null;
  return ['x1', 'y1', 'x2', 'y2'].map((key) => stableNumber(bezier[key]));
};

const semanticAction = function (value: unknown): Record<string, unknown> {
  const action = objectValue(value);
  if (!action) return { type: null };
  if (action['type'] !== 'NODE') return { type: action['type'] };
  const transition = objectValue(action['transition']);
  const easing = transition ? objectValue(transition['easing']) : null;
  return {
    type: action['type'],
    destinationId: action['destinationId'],
    navigation: action['navigation'],
    transition: transition ? {
      type: transition['type'],
      duration: stableNumber(transition['duration']),
      easing: easing ? {
        type: easing['type'],
        bezier: bezierValue(easing['easingFunctionCubicBezier']),
      } : null,
    } : null,
    preserveScrollPosition: action['preserveScrollPosition'] === true,
    overlayRelativePosition: action['overlayRelativePosition'] ?? null,
  };
};

const semanticReaction = function (value: unknown): Record<string, unknown> {
  const reaction = objectValue(value);
  if (!reaction) return { trigger: null, actions: null };
  return {
    trigger: semanticTrigger(reaction['trigger']),
    actions: Array.isArray(reaction['actions'])
      ? reaction['actions'].map(semanticAction)
      : null,
  };
};

const semanticReactions = function (values: readonly unknown[]): Record<string, unknown>[] {
  return values.map(semanticReaction).sort(function (left, right) {
    return JSON.stringify(left).localeCompare(JSON.stringify(right));
  });
};

const hostFor = function (node: unknown): ReactionHost {
  const host = node as Partial<ReactionHost>;
  if (!host || typeof host.setReactionsAsync !== 'function') {
    throw new Error('node does not expose setReactionsAsync()');
  }
  return host as ReactionHost;
};

const cloneReactions = function (
  reactions: readonly PrototypeReaction[],
): PrototypeReaction[] {
  return reactions.map(function (reaction) {
    return {
      trigger: { ...reaction.trigger },
      actions: reaction.actions.map(function (action) {
        if (action.type === 'BACK') return { type: 'BACK' as const };
        return {
          ...action,
          transition: action.transition ? {
            ...action.transition,
            easing: {
              ...action.transition.easing,
              ...(action.transition.easing.easingFunctionCubicBezier
                ? { easingFunctionCubicBezier: { ...action.transition.easing.easingFunctionCubicBezier } }
                : {}),
            },
          } : null,
        };
      }),
    };
  });
};

export const writePrototypeReactions = async function (
  node: unknown,
  reactions: readonly PrototypeReaction[],
): Promise<void> {
  const host = hostFor(node);
  await host.setReactionsAsync(cloneReactions(reactions));
};

export const verifyPrototypeReactionReadback = function (
  node: unknown,
  expected: readonly PrototypeReaction[],
): number {
  const host = hostFor(node);
  if (!Array.isArray(host.reactions)) {
    throw new Error('Figma did not expose a reaction array after writing');
  }

  const expectedSemantics = semanticReactions(expected);
  const actualSemantics = semanticReactions(host.reactions);
  if (JSON.stringify(actualSemantics) !== JSON.stringify(expectedSemantics)) {
    throw new Error(
      'native reaction readback mismatch; expected '
      + JSON.stringify(expectedSemantics)
      + ' but Figma retained '
      + JSON.stringify(actualSemantics),
    );
  }

  var actions = 0;
  for (const reaction of actualSemantics) {
    const retainedActions = reaction['actions'];
    if (!Array.isArray(retainedActions) || retainedActions.length === 0) {
      throw new Error('native reaction readback contains no action');
    }
    actions += retainedActions.length;
  }
  return actions;
};
