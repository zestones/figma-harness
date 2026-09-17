'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('motion is Primer\'s, frozen and exact', async () => {
  const {
    MOTION_DURATIONS,
    MOTION_DURATION_ORDER,
    MOTION_EASINGS,
    MOTION_TRANSITIONS,
    prototypeMotionTransition,
  } = await import('../src/foundations/motion.ts');

  assert.deepEqual(MOTION_DURATION_ORDER, ['micro', 'short', 'medium', 'long']);
  assert.deepEqual(
    MOTION_DURATION_ORDER.map((name) => MOTION_DURATIONS[name].milliseconds),
    [100, 200, 300, 500],
  );
  assert.equal(Object.isFrozen(MOTION_DURATIONS), true);
  assert.equal(Object.values(MOTION_DURATIONS).every(Object.isFrozen), true);
  assert.equal(Object.values(MOTION_EASINGS).every(Object.isFrozen), true);
  assert.equal(Object.values(MOTION_TRANSITIONS).every(Object.isFrozen), true);
  assert.deepEqual(Object.keys(MOTION_TRANSITIONS), ['enter', 'exit', 'hover', 'stateChange']);
  assert.deepEqual(prototypeMotionTransition('enter'), {
    type: 'SMART_ANIMATE',
    easing: { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.3, y1: 0.8, x2: 0.6, y2: 1 } },
    duration: 0.3,
  });
  assert.equal(prototypeMotionTransition('exit').duration, 0.2);
  assert.deepEqual(prototypeMotionTransition('stateChange').easing.easingFunctionCubicBezier, { x1: 0.6, y1: 0, x2: 0.2, y2: 1 });
  assert.equal(prototypeMotionTransition('enter', true).duration, 0);
});
