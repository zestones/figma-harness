/* Declarative prototype flows, shared by apps, the plugin and the guards.
 * Figma-free: a matrix names screens by key and layers by name. */

export type FlowNavigation = 'BACK' | 'NAVIGATE';
export type FlowTrigger = 'AFTER_TIMEOUT' | 'ON_CLICK';

export interface FlowSelector {
  readonly ancestor?: string;
  readonly kind: 'frame' | 'name' | 'prefix';
  readonly value?: string;
}

/** One declared prototype transition. `Motion` is the design system's transition names. */
export interface FlowTransition<Motion extends string = string> {
  readonly cardinality: 'many' | 'one';
  readonly destination: string | null;
  readonly id: string;
  readonly motion?: Motion;
  readonly navigation: FlowNavigation;
  readonly selector: FlowSelector;
  readonly sources: readonly string[];
  readonly timeoutSeconds?: number;
  readonly trigger: FlowTrigger;
}

/** Everything prototype wiring consumes for one document. */
export interface PrototypeFlows<Motion extends string = string> {
  readonly transitions: readonly FlowTransition<Motion>[];
}

/** Figma's Smart Animate transition, as a prototype action writes it. */
export interface PrototypeEasing {
  easingFunctionCubicBezier?: { x1: number; x2: number; y1: number; y2: number };
  type: 'CUSTOM_CUBIC_BEZIER' | 'EASE_IN' | 'EASE_IN_AND_OUT' | 'EASE_OUT' | 'LINEAR';
}

export interface PrototypeTransition {
  duration: number;
  easing: PrototypeEasing;
  type: 'SMART_ANIMATE';
}

/** A frozen copy of a transition, so a matrix cannot change after it is declared. */
export const defineFlowTransition = function <Motion extends string>(
  definition: FlowTransition<Motion>,
): FlowTransition<Motion> {
  return Object.freeze({
    ...definition,
    selector: Object.freeze({ ...definition.selector }),
    sources: Object.freeze([...definition.sources]),
  });
};
