'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('Relay screen and transition matrices are complete, frozen, and Figma-free', async () => {
  const {
    ALL_SCREENS,
    PROTOTYPE_SCREENS,
    SCREEN_GROUPS,
  } = await import('../src/screens.ts');
  const {
    RELAY_FLOW_TRANSITIONS,
    REQUIRED_REACHABLE_KEYS,
    SCREEN_FAMILIES,
  } = await import('../src/flows/transitions.ts');
  const { validateFlowContract } = await import('@figma-harness/guards/flow-contract.ts');
  const { loadContract } = await import('@figma-harness/harness/bundle/contract-loader.ts');

  assert.equal(Object.isFrozen(SCREEN_GROUPS), true);
  assert.equal(SCREEN_GROUPS.every((group) => Object.isFrozen(group) && Object.isFrozen(group.screens)), true);
  assert.equal(Object.isFrozen(RELAY_FLOW_TRANSITIONS), true);
  assert.equal(RELAY_FLOW_TRANSITIONS.every((transition) =>
    Object.isFrozen(transition)
    && Object.isFrozen(transition.sources)
    && Object.isFrozen(transition.selector)), true);
  assert.deepEqual(validateFlowContract(loadContract().document.prototype), []);

  assert.deepEqual(SCREEN_GROUPS.map((group) => [group.letter, group.prototype, group.screens.length]), [
    ['A', true, 2], ['B', true, 2], ['C', true, 3],
  ]);
  assert.equal(ALL_SCREENS.length, 7);
  assert.deepEqual(PROTOTYPE_SCREENS.map((screen) => screen.key), [
    'overview', 'releases',
    'release', 'releasePromote',
    'settings', 'settingsChanged', 'settingsFailed',
  ]);
  assert.deepEqual(
    Object.values(SCREEN_FAMILIES).flat().sort(),
    PROTOTYPE_SCREENS.map((screen) => screen.key).sort(),
  );
  assert.deepEqual([...REQUIRED_REACHABLE_KEYS], PROTOTYPE_SCREENS.map((screen) => screen.key));

  assert.deepEqual(
    RELAY_FLOW_TRANSITIONS
      .filter((transition) => transition.navigation === 'BACK')
      .map((transition) => [transition.id, [...transition.sources], transition.selector.value,
        transition.destination, transition.trigger, transition.motion]),
    [['back.release', ['release'], 'crumb/Releases', null, 'ON_CLICK', undefined]],
  );
  assert.equal(RELAY_FLOW_TRANSITIONS.every((transition) => transition.trigger === 'ON_CLICK'), true);
  const save = RELAY_FLOW_TRANSITIONS.find((transition) => transition.id === 'settings.save');
  assert.deepEqual(
    [[...(save?.sources || [])], save?.selector.value, save?.destination, save?.motion],
    [['settingsChanged'], 'button/Save changes', 'settingsFailed', 'enter'],
  );
  const rows = RELAY_FLOW_TRANSITIONS.find((transition) => transition.id === 'open.release');
  assert.equal(rows?.cardinality, 'many');
  assert.deepEqual({ ...rows?.selector }, { kind: 'prefix', value: 'release-row/' });
  // A modal dialog covers the page, so no page navigation is wired from behind it.
  assert.equal(RELAY_FLOW_TRANSITIONS
    .filter((transition) => transition.id.startsWith('nav.'))
    .every((transition) => !transition.sources.includes('releasePromote')), true);
});

test('Relay animates only with the design system\'s transitions and keeps navigation instant', async () => {
  const { MOTION_TRANSITIONS } = await import('@figma-harness/primer');
  const { RELAY_FLOW_TRANSITIONS } = await import('../src/flows/transitions.ts');
  const names = new Set(Object.keys(MOTION_TRANSITIONS));
  assert.equal(RELAY_FLOW_TRANSITIONS.every((transition) =>
    transition.motion === undefined || names.has(transition.motion)), true);
  assert.equal(
    RELAY_FLOW_TRANSITIONS
      .filter((transition) => /^(nav|open|back)\./.test(transition.id))
      .every((transition) => transition.motion === undefined),
    true,
  );
});
