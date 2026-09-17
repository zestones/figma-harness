/* Motion: the transitions the prototype may use, with exact easing curves.
 * Things arrive quickly and settle; they leave faster than they came. */

import type { PrototypeTransition } from '@figma-harness/contract';

export const MOTION = Object.freeze({
  enter: Object.freeze({ duration: 220, bezier: [0.16, 1, 0.3, 1] as const, use: 'A dialog or a panel appears.' }),
  exit: Object.freeze({ duration: 160, bezier: [0.7, 0, 0.84, 0] as const, use: 'A dialog or a panel leaves.' }),
  stateChange: Object.freeze({ duration: 200, bezier: [0.65, 0, 0.35, 1] as const, use: 'Something changes in place.' }),
});

export type MotionName = keyof typeof MOTION;

export const MOTION_NAMES = Object.freeze(Object.keys(MOTION) as MotionName[]);

/** A Smart Animate transition; reduced motion keeps the change and drops the movement. */
export const motionTransition = function (name: string, reducedMotion = false): PrototypeTransition {
  const motion = MOTION[name as MotionName];
  if (!motion) throw new Error('unknown motion ' + name);
  const [x1, y1, x2, y2] = motion.bezier;
  return {
    type: 'SMART_ANIMATE',
    easing: { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1, y1, x2, y2 } },
    duration: reducedMotion ? 0 : motion.duration / 1000,
  };
};
