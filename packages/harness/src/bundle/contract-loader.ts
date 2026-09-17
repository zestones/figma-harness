/* Load the declared audit contract from a freshly bundled plugin, so static
 * checks always reflect the sources rather than a possibly stale code.js. */
'use strict';

import { bundlePlugin } from './bundle.ts';
import { createHarness } from '../runtime/harness.ts';
import { activeComposition } from '../core/workspace.ts';
import type { HarnessContract } from '@figma-harness/contract';

export interface ContractOptions {
  /** The app to compose; the active app by default. */
  app?: string;
  /** Build the app with this design system instead of the one it depends on. */
  designSystem?: string;
}

const cached = new Map<string, HarnessContract>();

export function loadContract(options: ContractOptions = {}): HarnessContract {
  const composition = activeComposition(undefined, options.app, options.designSystem);
  const app = composition.app.relative;
  const designSystem = composition.designSystem.relative;
  const key = app + '|' + designSystem;
  let contract = cached.get(key);
  if (!contract) {
    const bundle = bundlePlugin({ app, designSystem });
    if (bundle.unreachable.length) {
      throw new Error(app + ': source module(s) unreachable from the plugin entry: ' + bundle.unreachable.join(', '));
    }
    contract = createHarness({ app, designSystem, code: bundle.code.toString('utf8') }).runtime.CONTRACT;
    cached.set(key, contract);
  }
  return contract;
}
