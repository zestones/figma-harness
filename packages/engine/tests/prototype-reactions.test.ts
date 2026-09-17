'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('native prototype readback ignores the deprecated mirror and rejects semantic drift', async () => {
  const {
    verifyPrototypeReactionReadback,
    writePrototypeReactions,
  } = await import('../src/prototype-reactions.ts');
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
  } = await import('../src/prototype-reactions.ts');
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
