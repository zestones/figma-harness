'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('the Figma mock refuses a custom easing without a valid curve', async () => {
  const { createFigmaMock } = await import('../src/runtime/figma-mock.ts');
  const { figma } = createFigmaMock();
  const source = figma.createFrame();
  const destination = figma.createFrame();
  const reaction = (easing: Record<string, unknown>) => [{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE', destinationId: destination.id, navigation: 'NAVIGATE', preserveScrollPosition: false,
      transition: { type: 'SMART_ANIMATE', duration: 0.3, easing },
    }],
  }];
  await source.setReactionsAsync(reaction({
    type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.3, y1: 0.8, x2: 0.6, y2: 1 },
  }));
  await assert.rejects(source.setReactionsAsync(reaction({ type: 'CUSTOM_CUBIC_BEZIER' })), /cubic-bezier/);
  await assert.rejects(source.setReactionsAsync(reaction({
    type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 1.4, y1: 0, x2: 0.2, y2: 1 },
  })), /cubic-bezier/);
});
