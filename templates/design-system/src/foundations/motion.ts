/* Motion: the transitions the prototype may use, with exact easing curves. */

import type { PrototypeTransition } from '@figma-harness/contract';

export const MOTION = Object.freeze({
  enter: Object.freeze({ duration: 250, bezier: [0.2, 0, 0, 1] as const, use: 'Something appears.' }),
  exit: Object.freeze({ duration: 150, bezier: [0.4, 0, 1, 1] as const, use: 'Something leaves.' }),
  stateChange: Object.freeze({ duration: 200, bezier: [0.4, 0, 0.2, 1] as const, use: 'A control changes state.' }),
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
