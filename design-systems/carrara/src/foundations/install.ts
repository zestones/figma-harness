/* Install the variables, text styles and shadows, and load the fonts they use. */

import { installTokens, loadFonts, type TokenSet } from '@figma-harness/engine';
import { COLORS, COLOR_SCOPES } from './colors.ts';
import { TOKEN_COLLECTIONS } from './collections.ts';
import { DIMS } from './dimensions.ts';
import { ELEVATION } from './elevation.ts';
import { FONTS, TYPE } from './typography.ts';

const TOKENS: TokenSet = Object.freeze({
  collections: TOKEN_COLLECTIONS,
  colors: COLORS,
  colorScopes: COLOR_SCOPES,
  effectStyles: ELEVATION,
  fonts: FONTS,
  sizes: DIMS,
  textStyles: TYPE,
});

export const loadDesignFonts = function (): Promise<void> {
  return loadFonts(FONTS);
};

export const installDesignTokens = function (): Promise<void> {
  return installTokens(TOKENS);
};
