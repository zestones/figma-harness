/* ============================================================================
 * APCA — Accessible Perceptual Contrast Algorithm (APCA-W3 0.1.9).
 *
 * WCAG 2.x reduces two colours to a luminance ratio, and that model is known to
 * misjudge exactly one case: dark text on a SATURATED mid-light fill. The ratio
 * says legal; the eye says squint. It is the reason WCAG 3 is replacing the
 * ratio with this.
 *
 * This does not replace tools/accessibility/contrast.ts — the product still has to pass 1.4.3,
 * and that is the law. It sits beside it so a pair that is legal-but-thin can be
 * SEEN as thin instead of argued about.
 *
 * Thresholds (APCA-W3 readability, absolute Lc):
 *   Lc 90  the maximum, body text at any weight
 *   Lc 75  the minimum for body text at 15-16 px normal weight
 *   Lc 60  the minimum for content text, 14 px+ at 500-600 weight
 *   Lc 45  large text, 24 px+ or 16 px bold
 *   Lc 30  the absolute floor for any text; below this is decoration
 * ==========================================================================*/
'use strict';
import {
  hex,
  type Color,
} from '../color/core/color.ts';

const Ys = (c: Color): number => {
  const f = (v: number): number => Math.pow(v / 255, 2.4);
  return 0.2126729 * f(c.r) + 0.7151522 * f(c.g) + 0.0721750 * f(c.b);
};
const clampBlack = (y: number): number =>
  (y < 0.022 ? y + Math.pow(0.022 - y, 1.414) : y);

/** Lc for text on background. Sign carries polarity; callers usually want |Lc|. */
function apca(textHex: string | Color, bgHex: string | Color): number {
  const Ytxt = clampBlack(Ys(typeof textHex === 'string' ? hex(textHex) : textHex));
  const Ybg = clampBlack(Ys(typeof bgHex === 'string' ? hex(bgHex) : bgHex));
  let S, Lc;
  if (Ybg > Ytxt) {                       // dark text on a light ground
    S = (Math.pow(Ybg, 0.56) - Math.pow(Ytxt, 0.57)) * 1.14;
    Lc = S < 0.1 ? 0 : (S - 0.027) * 100;
  } else {                                // light text on a dark ground
    S = (Math.pow(Ybg, 0.65) - Math.pow(Ytxt, 0.62)) * 1.14;
    Lc = S > -0.1 ? 0 : (S + 0.027) * 100;
  }
  return Lc;
}
/** The smallest use each Lc supports, in words. */
const verdict = (lc: number): string => {
  const a = Math.abs(lc);
  if (a >= 90) return 'any text, any weight';
  if (a >= 75) return 'body text, 15 px normal';
  if (a >= 60) return 'content text, 14 px semibold';
  if (a >= 45) return 'large only, 24 px or 16 px bold';
  if (a >= 30) return 'the floor — non-body only';
  return 'not text';
};
export { apca, verdict };
