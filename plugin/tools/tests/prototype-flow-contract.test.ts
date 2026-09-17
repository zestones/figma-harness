'use strict';

import type { PrototypeContract } from '../runtime/harness/contract.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('Relay screen and transition matrices are complete, frozen, and Figma-free', async () => {
  const {
    ALL_SCREENS,
    PROTOTYPE_SCREENS,
    SCREEN_GROUPS,
  } = await import('../../src/designs/pages/state-matrix.ts');
  const {
    RELAY_FLOW_TRANSITIONS,
    REQUIRED_REACHABLE_KEYS,
    SCREEN_FAMILIES,
  } = await import('../../src/designs/flows/relay-flow-matrix.ts');
  const { validateFlowContract } = await import('../architecture/flow-contract.ts');
  const { loadContract } = await import('../runtime/contract-loader.ts');

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

test('the flow validator rejects broken destinations, BACK misuse, animated navigation and unreachable frames', async () => {
  const { validateFlowContract } = await import('../architecture/flow-contract.ts');
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

test('motion is Primer\'s, frozen, exact, and the prototype uses only its transitions', async () => {
  const {
    MOTION_DURATIONS,
    MOTION_DURATION_ORDER,
    MOTION_EASINGS,
    MOTION_TRANSITIONS,
    prototypeMotionTransition,
  } = await import('../../src/kit/foundations/motion.ts');
  const {
    RELAY_FLOW_TRANSITIONS,
  } = await import('../../src/designs/flows/relay-flow-matrix.ts');

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

test('the Figma mock refuses a custom easing without a valid curve', async () => {
  const { createFigmaMock } = await import('../runtime/harness/figma-mock.ts');
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

test('native prototype readback ignores the deprecated mirror and rejects semantic drift', async () => {
  const {
    verifyPrototypeReactionReadback,
    writePrototypeReactions,
  } = await import('../../src/engine/prototype-reactions.ts');
  const expected = [{
    trigger: { type: 'ON_HOVER' as const },
    actions: [{
      type: 'NODE' as const,
      destinationId: 'hover:1',
      navigation: 'CHANGE_TO' as const,
      transition: {
        type: 'SMART_ANIMATE' as const,
        easing: { type: 'EASE_OUT' as const },
        duration: 0.12,
      },
      preserveScrollPosition: false as const,
    }],
  }];
  const host = {
    reactions: [] as unknown[],
    async setReactionsAsync(reactions: unknown[]): Promise<void> {
      this.reactions = reactions.map((reaction) => {
        const value = reaction as { actions: unknown[] };
        const actions = value.actions.map((action) => {
          const candidate = action as Record<string, unknown>;
          const transition = candidate['transition'] as Record<string, unknown> | null;
          return transition
            ? { ...candidate, transition: { ...transition, duration: 0.1200000001 } }
            : candidate;
        });
        return { ...value, actions, action: actions[0] };
      });
    },
  };

  await writePrototypeReactions(host, expected);
  assert.equal(verifyPrototypeReactionReadback(host, expected), 1);

  const retained = host.reactions[0] as {
    actions: Array<Record<string, unknown>>;
  };
  retained.actions[0] = { ...retained.actions[0], destinationId: 'wrong:2' };
  assert.throws(
    () => verifyPrototypeReactionReadback(host, expected),
    /native reaction readback mismatch/,
  );
});

test('native prototype readback preserves contextual BACK actions', async () => {
  const {
    verifyPrototypeReactionReadback,
    writePrototypeReactions,
  } = await import('../../src/engine/prototype-reactions.ts');
  const expected = [{
    trigger: { type: 'ON_CLICK' as const },
    actions: [{ type: 'BACK' as const }],
  }];
  const host = {
    reactions: [] as unknown[],
    async setReactionsAsync(reactions: unknown[]): Promise<void> {
      this.reactions = reactions.map((reaction) => {
        const value = reaction as { actions: unknown[] };
        return { ...value, actions: [...value.actions], action: value.actions[0] };
      });
    },
  };

  await writePrototypeReactions(host, expected);
  assert.equal(verifyPrototypeReactionReadback(host, expected), 1);

  const retained = host.reactions[0] as { actions: Array<Record<string, unknown>> };
  retained.actions[0] = { type: 'NODE', destinationId: 'wrong:1' };
  assert.throws(
    () => verifyPrototypeReactionReadback(host, expected),
    /native reaction readback mismatch/,
  );
});
