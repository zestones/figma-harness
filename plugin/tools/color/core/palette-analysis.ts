/* Shared palette-analysis primitives used by exploratory colour searches. */

import {
  dE,
  simulate,
  type Color,
  type ColorVisionDeficiency,
} from './color.ts';

export const CVD_KINDS: readonly ColorVisionDeficiency[] = Object.freeze([
  'protanopia',
  'deuteranopia',
  'tritanopia',
]);

/** The pair distance that survives normal vision and every supported CVD model. */
export function minimumVisionDistance(first: Color, second: Color): number {
  let minimum = dE(first, second);
  for (const kind of CVD_KINDS) {
    minimum = Math.min(
      minimum,
      dE(simulate(first, kind), simulate(second, kind)),
    );
  }
  return minimum;
}
