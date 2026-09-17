/* Focus: Primer's 2 px outline in focus/outline-color, placed where each
 * Primer component places it. The ring is an empty layer stroked inside, whose
 * box extends past the control by outline-offset + outline-width.
 * Decision: design-systems/primer/docs/adr/0003-focus-outlines.md */

const WIDTH = 2;

/** CSS outline-offset, per placement, as Primer's components set it. */
export const FOCUS_OFFSETS = Object.freeze({
  /** Buttons, pagination and underline navigation: over the control's own edge. */
  inset: -2,
  /** Text inputs: across the 1 px border, which turns accent as well. */
  edge: -1,
  /** Action and navigation list items: against the item's edge. */
  flush: 0,
  /** Checkboxes, radios, breadcrumbs and links: 2 px of ground between. */
  outset: 2,
  /** The toggle switch: 3 px of ground between. */
  toggle: 3,
});

export type FocusPlacement = keyof typeof FOCUS_OFFSETS;

export const FOCUS = Object.freeze({
  width: WIDTH,
  token: 'focus/outline-color',
  offsets: FOCUS_OFFSETS,
  /** Primer's inset band on emphasis fills: 3 px of fgColor/onEmphasis under the ring. */
  band: Object.freeze({ token: 'fgColor/onEmphasis', width: 3 }),
  /** Names of the empty layers drawn for a focused control. */
  ringName: 'focus-ring',
  bandName: 'focus-band',
  /** Accessibility annotation carried by those layers. */
  ringRoleKey: 'aria.role',
  ringRole: 'presentation',
  /** Plugin data marking a control rendered in its focused state, and where its ring sits. */
  specimenKey: 'spec.focus',
  specimenValue: 'visible',
  placementKey: 'spec.focus.placement',
  /** The colour token of a control's edge when it is not focused, if focus changes it. */
  restEdgeKey: 'spec.focus.rest-edge',
});

/** How far a ring's box extends past its control on every side. */
export const focusExtent = function (placement: FocusPlacement): number {
  return FOCUS_OFFSETS[placement] + WIDTH;
};
