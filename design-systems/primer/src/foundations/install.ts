/* Tokens: Primer's variables, text styles and effect styles, installed by the
 * engine's idempotent installer. */

import { installTokens, loadFonts, type TokenSet } from '@figma-harness/engine';
import { COLORS, COLOR_SCOPES } from './colors.ts';
import { TOKEN_COLLECTIONS } from './collections.ts';
import { DIMS } from './dimensions.ts';
import { ELEVATION } from './elevation.ts';
import { FONTS, TYPE } from './typography.ts';

const PRIMER_TOKENS: TokenSet = Object.freeze({
  collections: TOKEN_COLLECTIONS,
  colors: COLORS,
  colorScopes: COLOR_SCOPES,
  effectStyles: ELEVATION,
  fonts: FONTS,
  sizes: DIMS,
  textStyles: TYPE,
});

/** Load every font the text styles use. Call before ensureTokens(). */
export const loadDesignFonts = function (): Promise<void> {
  return loadFonts(FONTS);
};

export const ensureTokens = function (): Promise<void> {
  return installTokens(PRIMER_TOKENS);
};
