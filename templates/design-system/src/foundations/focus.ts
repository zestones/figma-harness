/* Focus: a 2 px outline, 2 px outside the control, drawn as its own layer so
 * the control keeps its size, fill and border. */

export const FOCUS = Object.freeze({
  width: 2,
  token: 'focus/ring',
  /** CSS outline-offset per placement; this design system uses one. */
  offsets: Object.freeze({ outset: 2 }),
  /** Only drawn under an inset outline, which this design system does not use. */
  band: Object.freeze({ token: 'text/on-accent', width: 3 }),
  ringName: 'focus-ring',
  bandName: 'focus-band',
  ringRoleKey: 'aria.role',
  ringRole: 'presentation',
  specimenKey: 'spec.focus',
  specimenValue: 'visible',
  placementKey: 'spec.focus.placement',
  restEdgeKey: 'spec.focus.rest-edge',
});

/** How far the outline's box extends past its control on every side. */
export const FOCUS_EXTENT = FOCUS.offsets.outset + FOCUS.width;
