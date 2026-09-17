/* Motion: Primer's durations, easings and semantic transitions, applied to
 * prototype reactions as exact cubic-bezier curves.
 * Decision: docs/adr/0005-motion-and-prototype-proof.md */

import { PRIMER_MOTION } from './primer.generated.ts';

export type MotionDurationName = typeof PRIMER_MOTION.durations[number][0];
export type MotionEasingName = typeof PRIMER_MOTION.easings[number][0];
export type MotionTransitionName = typeof PRIMER_MOTION.transitions[number][0];

export interface MotionDuration {
  readonly milliseconds: number;
  readonly use: string;
}

export interface MotionEasing {
  readonly bezier: readonly [x1: number, y1: number, x2: number, y2: number];
  readonly use: string;
}

export interface MotionTransition {
  readonly duration: MotionDurationName;
  readonly easing: MotionEasingName;
  readonly use: string;
}

export const MOTION_DURATIONS = Object.freeze(Object.fromEntries(PRIMER_MOTION.durations.map(([name, milliseconds, use]) => [
  name, Object.freeze({ milliseconds, use }),
])) as Record<MotionDurationName, MotionDuration>);

export const MOTION_EASINGS = Object.freeze(Object.fromEntries(PRIMER_MOTION.easings.map(([name, bezier, use]) => [
  name, Object.freeze({ bezier: Object.freeze([...bezier]) as unknown as MotionEasing['bezier'], use }),
])) as Record<MotionEasingName, MotionEasing>);

export const MOTION_TRANSITIONS = Object.freeze(Object.fromEntries(PRIMER_MOTION.transitions.map(([name, duration, easing, use]) => [
  name, Object.freeze({ duration, easing, use }),
])) as Record<MotionTransitionName, MotionTransition>);

/** In Primer's order: shortest first. */
export const MOTION_DURATION_ORDER = Object.freeze(PRIMER_MOTION.durations.map(([name]) => name));
export const MOTION_EASING_ORDER = Object.freeze(PRIMER_MOTION.easings.map(([name]) => name));
export const MOTION_TRANSITION_ORDER = Object.freeze(PRIMER_MOTION.transitions.map(([name]) => name));

export interface MotionPrototypeTransition {
  duration: number;
  easing: {
    easingFunctionCubicBezier: { x1: number; x2: number; y1: number; y2: number };
    type: 'CUSTOM_CUBIC_BEZIER';
  };
  type: 'SMART_ANIMATE';
}

export const prototypeMotionTransition = function (
  name: MotionTransitionName,
  reducedMotion = false,
): MotionPrototypeTransition {
  const transition = MOTION_TRANSITIONS[name];
  if (!transition) throw new Error('unknown motion transition ' + name);
  const [x1, y1, x2, y2] = MOTION_EASINGS[transition.easing].bezier;
  return {
    type: 'SMART_ANIMATE',
    easing: { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1, y1, x2, y2 } },
    duration: reducedMotion ? 0 : MOTION_DURATIONS[transition.duration].milliseconds / 1000,
  };
};
