/* ============================================================================
 * OKLCH <-> sRGB.
 *
 * A theme is a LIGHTNESS ladder with a hue and a chroma policy on top. Hex
 * hides all three, which is why the neutrals in this palette had drifted to a
 * warm yellow-grey while the brand moved twice. In OKLCH the ladder is the
 * numbers you type, so a surface step is a decision instead of an accident.
 *
 * Gamut handling: chroma is reduced until the colour is representable, rather
 * than clipping the channels, which would shift the hue.
 * ==========================================================================*/
'use strict';

type LinearRgb = readonly [number, number, number];

function oklchToLinear(L: number, C: number, hDeg: number): LinearRgb {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}
const enc = (v: number): number => (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055);
const dec = (v: number): number => (v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));

/** True when every linear channel lands inside [0,1] with a hair of tolerance. */
const inGamut = (rgb: readonly number[]): boolean => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/** OKLCH -> #RRGGBB, reducing chroma (never clipping channels) to stay in gamut. */
export function oklch(L: number, inputChroma: number, h: number): string {
  let C = inputChroma;
  let lo = 0, hi = C;
  if (!inGamut(oklchToLinear(L, C, h))) {
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, h))) lo = mid; else hi = mid;
    }
    C = lo;
  }
  const lin = oklchToLinear(L, C, h);
  return '#' + lin.map((v) => {
    const n = Math.round(Math.min(1, Math.max(0, enc(Math.min(1, Math.max(0, v))))) * 255);
    return n.toString(16).padStart(2, '0').toUpperCase();
  }).join('');
}

/** #RRGGBB -> {L, C, h} */
export interface Oklch {
  C: number;
  L: number;
  h: number;
}

export function toOklch(hex: string): Oklch {
  const r = dec(parseInt(hex.slice(1, 3), 16) / 255);
  const g = dec(parseInt(hex.slice(3, 5), 16) / 255);
  const b = dec(parseInt(hex.slice(5, 7), 16) / 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return { L, C: Math.hypot(A, B), h: ((Math.atan2(B, A) * 180 / Math.PI) + 360) % 360 };
}
