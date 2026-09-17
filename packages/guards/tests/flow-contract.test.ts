'use strict';

import type { PrototypeContract } from '@figma-harness/contract';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('the flow validator rejects broken destinations, BACK misuse, animated navigation and unreachable frames', async () => {
  const { validateFlowContract } = await import('../src/flow-contract.ts');
  const base: PrototypeContract = {
    frames: [
      { key: 'home', title: 'Home' },
      { key: 'detail', title: 'Detail' },
      { key: 'orphan', title: 'Orphan' },
    ],
    startScreenKey: 'home',
    requiredReachableKeys: ['detail'],
    instantTransitionPrefixes: ['nav.'],
    transitions: [
      {
        id: 'nav.detail', sources: ['home'], selector: { kind: 'name', value: 'nav/Detail' },
        trigger: 'ON_CLICK', destination: 'detail', navigation: 'NAVIGATE', cardinality: 'one',
      },
      {
        id: 'panel.open', sources: ['detail'], selector: { kind: 'name', value: 'button/Open' },
        trigger: 'ON_CLICK', destination: 'home', navigation: 'NAVIGATE', cardinality: 'one',
        motion: 'enter',
      },
    ],
    motion: {
      names: ['enter'],
      transition: () => ({ type: 'SMART_ANIMATE', duration: 0.3, easing: { type: 'EASE_OUT' } }),
    },
    validateProductRules: () => [],
  };
  assert.deepEqual(validateFlowContract(base), []);

  const broken: PrototypeContract = {
    ...base,
    requiredReachableKeys: ['detail', 'orphan'],
    transitions: [
      { ...base.transitions[0], motion: 'enter' },
      { ...base.transitions[1], destination: 'missing' },
      {
        id: 'back.home', sources: ['detail'], selector: { kind: 'name', value: 'btn/back' },
        trigger: 'AFTER_TIMEOUT', timeoutSeconds: 1, destination: 'home', navigation: 'BACK', cardinality: 'one',
      },
      {
        id: 'rows.open', sources: ['home'], selector: { kind: 'name', value: 'row' },
        trigger: 'ON_CLICK', destination: 'detail', navigation: 'NAVIGATE', cardinality: 'many',
      },
    ],
  };
  assert.deepEqual(validateFlowContract(broken), [
    'back.home: BACK navigation cannot declare a destination',
    'back.home: BACK navigation must be an explicit click',
    'back.home: timeout transitions must originate on the frame',
    'human-flow frame is unreachable from home: orphan',
    'nav.detail: page navigation must remain instant',
    'panel.open: unknown destination key missing',
    'rows.open: many-cardinality contracts must use a prefix selector',
  ]);
});
