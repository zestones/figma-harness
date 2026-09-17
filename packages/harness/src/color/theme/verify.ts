'use strict';

import type { DesignSystemContract } from '@figma-harness/contract';
import { verifyAccent } from './verification/accent.ts';
import {
  createVerificationContext,
  type TokenValues,
} from './verification/context.ts';
import { verifyFocusGrounds, verifyNeutrals } from './verification/neutrals.ts';

/** Check the shipped tokens against the design system's theme policy. Returns the failure count. */
export function verifyTheme(designSystem: DesignSystemContract, tokens: TokenValues): number {
  const context = createVerificationContext(tokens);
  verifyNeutrals(context, designSystem.theme);
  verifyFocusGrounds(context, designSystem.focus.token, designSystem.surfaceContrast.focusGrounds);
  verifyAccent(context, designSystem.theme);
  const failures = context.failureCount();
  console.log('\n' + (failures ? failures + ' FAILURE(S)' : 'every theme rule holds') + '\n');
  return failures;
}
