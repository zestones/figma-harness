/* Load the declared audit contract from a freshly bundled plugin, so static
 * checks always reflect src/ rather than a possibly stale code.js. */
'use strict';

import { bundlePlugin } from './bundle.ts';
import { createHarness } from '../runtime/harness.ts';
import type { HarnessContract } from '@figma-harness/contract';

let cached: HarnessContract | null = null;

export function loadContract(): HarnessContract {
  if (!cached) {
    cached = createHarness({ code: bundlePlugin().code.toString('utf8') }).runtime.CONTRACT;
  }
  return cached;
}
