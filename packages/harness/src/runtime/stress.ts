'use strict';

import type { HarnessContract } from '@figma-harness/contract';

const { errorMessage } = require('../core/errors.ts') as {
  errorMessage(error: unknown): string;
};

type BuildResult = Promise<unknown> | unknown;

export interface StressRuntime {
  readonly CONTRACT: HarnessContract;
}

/** What is wrong with a built result, if anything. */
export type StressInspector = (result: unknown) => readonly string[];

/** Exercise every declared size-sensitive capability and data extreme. Each
 *  result must build, and pass `inspect` when one is given. */
export async function stress(runtime: StressRuntime, inspect?: StressInspector): Promise<number> {
  const contract = runtime.CONTRACT.document.stress;
  const failures: string[] = [];
  const attempt = async (label: string, action: () => BuildResult): Promise<void> => {
    try {
      const result = await action();
      for (const issue of inspect ? inspect(result) : []) failures.push(label + ' -> ' + issue);
      if (result && typeof result === 'object' && 'remove' in result
        && typeof (result as { remove?: unknown }).remove === 'function') {
        (result as { remove(): void }).remove();
      }
    } catch (error: unknown) {
      failures.push(label + ' -> ' + errorMessage(error));
    }
  };

  for (const box of contract.boxes) {
    for (const width of box.widths) {
      for (const height of box.heights) {
        await attempt(box.name + ' ' + width + 'x' + height, () => box.build(width, height));
      }
    }
  }

  const [initialWidth, initialHeight] = contract.frameSize();
  for (const [frameWidth, frameHeight] of contract.frameSizes) {
    contract.setFrameSize(frameWidth, frameHeight);
    for (const screen of contract.screens) {
      await attempt(screen.name + ' @ ' + frameWidth + 'x' + frameHeight, () => screen.build());
    }
  }
  contract.setFrameSize(initialWidth, initialHeight);

  const { mutations, restore } = contract.prepareMutations();
  let mutationCases = 0;
  for (const [label, mutate] of mutations) {
    restore();
    mutate();
    for (const screen of contract.screens) {
      mutationCases++;
      await attempt(screen.name + ' [' + label + ']', () => screen.build());
    }
    for (const box of contract.boxes) {
      mutationCases++;
      await attempt(box.name + ' [' + label + ']', () => box.build(box.widths[0], box.heights[0]));
    }
  }
  restore();

  const cases = contract.boxes.reduce(
    (count, box) => count + box.widths.length * box.heights.length,
    0,
  ) + contract.frameSizes.length * contract.screens.length + mutationCases;
  console.log('\n--- stress ---');
  if (!failures.length) {
    console.log('  ' + cases + ' size combinations, every one built' + (inspect ? ' and laid out cleanly' : ''));
  } else {
    console.log('  ' + failures.length + ' FAILED of ' + cases + ':');
    const seen = new Set<string>();
    for (const failure of failures) {
      const key = failure.replace(/\d+x\d+|@ \d+x\d+/, '*');
      if (seen.has(key) && seen.size > 24) continue;
      seen.add(key);
      console.log('   - ' + failure);
    }
  }
  return failures.length;
}
