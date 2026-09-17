/*
 * The authoring vocabulary: the only module an app imports visuals from.
 *
 * It re-exports the engine calls authors need, so a page never reaches into
 * the engine or into this package's internals.
 */

export {
  P,
  V,
  abs,
  add,
  f,
  frameReuseKey,
  reuseFrame,
  spread,
  strut,
  strutForCol,
  strutForRow,
} from '@figma-harness/engine';
export type { FrameOptions } from '@figma-harness/engine';

export { COLORS, COLOR_SCOPES, PALETTE } from './foundations/colors.ts';
export type { ColorScope, ColorToken, PaletteName } from './foundations/colors.ts';
export { CVD, R } from './foundations/cvd.generated.ts';
export { DIMS, RADII, SPACING, dim } from './foundations/dimensions.ts';
export type { DimensionName } from './foundations/dimensions.ts';
export { FOCUS, FOCUS_EXTENT } from './foundations/focus.ts';
export { MOTION, MOTION_NAMES, motionTransition } from './foundations/motion.ts';
export type { MotionName } from './foundations/motion.ts';
export { FONT_FAMILY, TYPE, lineHeight } from './foundations/typography.ts';
export type { TextStyleName, TextStyleSpec } from './foundations/typography.ts';

export { withFocus } from './primitives/focus.ts';
export { text } from './primitives/text.ts';
export type { TextOptions } from './primitives/text.ts';

export { BADGE_TONES, badge } from './components/badge.ts';
export type { BadgeTone } from './components/badge.ts';
export { BUTTON_STATES, button } from './components/button.ts';
export type { ButtonOptions, ButtonState, ButtonVariant } from './components/button.ts';
export { card } from './components/card.ts';
export type { CardOptions } from './components/card.ts';
export { listRow } from './components/list-row.ts';
export type { ListRowOptions } from './components/list-row.ts';

export { screen } from './patterns/screen.ts';
export type { ScreenLayout, ScreenOptions } from './patterns/screen.ts';
export { starter } from './patterns/starter.ts';
