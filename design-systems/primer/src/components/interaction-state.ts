/** States shared by interactive kit components and their design specimens. */
export const INTERACTION_STATES = Object.freeze([
  'rest',
  'hover',
  'active',
  'focus',
  'disabled',
  'loading',
] as const);

export type InteractionState = typeof INTERACTION_STATES[number];
