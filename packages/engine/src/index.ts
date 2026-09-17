/* Figma mechanics shared by every design system. Nothing here knows a token
 * name, a component or an app. */

export {
  bindDimension,
  bindDimensions,
  dimensionValue,
  setDimension,
} from './dimension-bindings.ts';
export type { DimensionField, DimensionReference, DimensionValue } from './dimension-bindings.ts';
export {
  ES,
  P,
  Pa,
  TS,
  V,
  hex,
  loadTokens,
  solid,
} from './figma-resources.ts';
export type { TokenCollectionNames } from './figma-resources.ts';
export { fontName, fontsLoaded, loadFonts } from './font-loader.ts';
export { lint } from './layout-lint.ts';
export type { LayoutLintIssue, LayoutLintOptions, LayoutLintReport } from './layout-lint.ts';
export {
  LEGAL_SPANS,
  below,
  cols,
  inner,
  span,
  split,
} from './layout-math.ts';
export {
  abs,
  add,
  f,
  size,
  strut,
} from './node-factory.ts';
export type { FrameOptions } from './node-factory.ts';
export {
  clearPage,
  focusViewport,
  getPage,
  pageLimitHit,
  resetPageLimit,
} from './pages.ts';
export type { PageClearStats } from './pages.ts';
export {
  verifyPrototypeReactionReadback,
  writePrototypeReactions,
} from './prototype-reactions.ts';
export type {
  PrototypeAction,
  PrototypeBackAction,
  PrototypeEasing,
  PrototypeNodeAction,
  PrototypeReaction,
  PrototypeTransition,
} from './prototype-reactions.ts';
export {
  beginScreenMaterialization,
  endScreenMaterialization,
  frameReuseKey,
  reuseFrame,
} from './render-cache.ts';
export type { ScreenMaterializationStats } from './render-cache.ts';
export { spread, strutForCol, strutForRow } from './struts.ts';
export { installTokens } from './token-installer.ts';
export type {
  EffectStyleTokenSpec,
  SizeTokenSpec,
  TextStyleTokenSpec,
  TokenSet,
} from './token-installer.ts';
