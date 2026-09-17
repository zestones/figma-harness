'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');

test('the prototype is frozen, valid, and reaches every prototype screen', async () => {
  const { PROTOTYPE_SCREENS, SCREEN_GROUPS } = await import('../src/screens.ts');
  const { FLOW_TRANSITIONS, REQUIRED_REACHABLE_KEYS } = await import('../src/flows/transitions.ts');
  const { validateFlowContract } = await import('@figma-harness/guards/flow-contract.ts');
  const { loadContract } = await import('@figma-harness/harness/bundle/contract-loader.ts');
  const { repositoryRoot } = await import('@figma-harness/harness/core/workspace.ts');
  // This app, wherever it was created.
  const app = path.relative(repositoryRoot(), path.resolve(__dirname, '..'));

  assert.equal(Object.isFrozen(SCREEN_GROUPS), true);
  assert.equal(SCREEN_GROUPS.every((group) => Object.isFrozen(group) && Object.isFrozen(group.screens)), true);
  assert.equal(FLOW_TRANSITIONS.every((transition) =>
    Object.isFrozen(transition) && Object.isFrozen(transition.sources) && Object.isFrozen(transition.selector)), true);
  assert.deepEqual([...REQUIRED_REACHABLE_KEYS], PROTOTYPE_SCREENS.map((screen) => screen.key));
  assert.deepEqual(validateFlowContract(loadContract({ app }).document.prototype), []);
});
