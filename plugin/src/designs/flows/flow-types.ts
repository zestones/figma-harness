/* Shared, Figma-free contracts for declarative product-flow matrices. */

import type {
  MotionTransitionName,
} from '../../kit/public.ts';

export type FlowNavigation = 'BACK' | 'NAVIGATE';
export type FlowMotion = MotionTransitionName;
export type FlowTrigger = 'AFTER_TIMEOUT' | 'ON_CLICK';

export interface FlowSelector {
  ancestor?: string;
  kind: 'frame' | 'name' | 'prefix';
  value?: string;
}

export interface FlowTransition {
  cardinality: 'many' | 'one';
  destination: string | null;
  id: string;
  navigation: FlowNavigation;
  motion?: FlowMotion;
  selector: Readonly<FlowSelector>;
  sources: readonly string[];
  timeoutSeconds?: number;
  trigger: FlowTrigger;
}

/** Everything the prototype wiring consumes for one document. */
export interface PrototypeFlows {
  readonly transitions: readonly FlowTransition[];
}

export const defineFlowTransition = function (
  definition: FlowTransition,
): FlowTransition {
  return Object.freeze({
    ...definition,
    selector: Object.freeze({ ...definition.selector }),
    sources: Object.freeze([...definition.sources]),
  });
};
