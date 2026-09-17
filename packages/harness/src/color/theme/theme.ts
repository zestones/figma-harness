/* ============================================================================
 * Theme policy audit.
 *
 * Verifies the shipped colour tokens against the theme policy the design
 * system declares (the theme section of its audit contract): neutral
 * chroma and hue, surface ladders, the ink ramp, the focus ring and the brand
 * family. Read-only; exits non-zero when any rule fails.
 * ==========================================================================*/
'use strict';

import { loadContract } from '../../bundle/contract-loader.ts';
import { readProjectColorTokens } from '../core/token-source.ts';
import { verifyTheme } from './verify.ts';

if (require.main === module) {
  const designSystem = loadContract().designSystem;
  const failures = verifyTheme(designSystem, readProjectColorTokens(designSystem));
  process.exitCode = failures ? 1 : 0;
}
