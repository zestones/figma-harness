/* ============================================================================
 * Colour maths — ONE copy.
 *
 * There were briefly two: the audit's, and a search script's. They disagreed —
 * the search reported a palette at ΔE 19.5 that the audit measured at 5.9, and
 * "improved" a pair from 4.7 down to 2.5. A second implementation of the same
 * physics is not a convenience, it is a way of being confidently wrong, so the
 * audit and anything that proposes colours to it now read from this file.
 * ==========================================================================*/
'use strict';

export interface Color {
  b: number;
  g: number;
  r: number;
}

/** A colour that may be translucent; channels 0–255, alpha 0–1. */
export interface ColorAlpha extends Color {
  a: number;
}

export type ColorVisionDeficiency = 'deuteranopia' | 'protanopia' | 'tritanopia';
type Vector3 = readonly [number, number, number];
type Matrix3 = readonly [Vector3, Vector3, Vector3];

const OPAQUE_HEX = /^#[0-9A-Fa-f]{6}$/;
const ALPHA_HEX = /^#[0-9A-Fa-f]{8}$/;

/** An opaque #RRGGBB colour. A translucent one must be composited first: see rgba(). */
export const hex = (value: string): Color => {
  if (!OPAQUE_HEX.test(value)) {
    throw new Error(ALPHA_HEX.test(value)
      ? 'translucent colour ' + value + ' needs a ground: composite it with rgba() and over()'
      : 'invalid colour ' + value);
  }
  return {
    r: parseInt(value.slice(1, 3), 16),
    g: parseInt(value.slice(3, 5), 16),
    b: parseInt(value.slice(5, 7), 16),
  };
};

/** #RRGGBB or #RRGGBBAA, with its alpha. */
export const rgba = (value: string): ColorAlpha => {
  if (OPAQUE_HEX.test(value)) return { ...hex(value), a: 1 };
  if (!ALPHA_HEX.test(value)) throw new Error('invalid colour ' + value);
  return {
    ...hex(value.slice(0, 7)),
    a: parseInt(value.slice(7, 9), 16) / 255,
  };
};
export const toHex = (color: Color): string => '#'
  + [color.r, color.g, color.b]
    .map((value) => Math.round(Math.max(0, Math.min(255, value)))
      .toString(16).padStart(2, '0'))
    .join('').toUpperCase();
export const srgb = (value: number, breakpoint?: number): number => {
  let v = value;
  v /= 255;
  const threshold = breakpoint == null ? 0.04045 : breakpoint;
  return v <= threshold ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
export const lum = (color: Color, breakpoint?: number): number =>
  0.2126 * srgb(color.r, breakpoint)
  + 0.7152 * srgb(color.g, breakpoint)
  + 0.0722 * srgb(color.b, breakpoint);
export const ratio = (a: Color, b: Color, breakpoint?: number): number => {
  const l1 = lum(a, breakpoint), l2 = lum(b, breakpoint);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
};
/** Composite a colour with alpha over an opaque backdrop. */
export const over = (foreground: Color, alpha: number, background: Color): Color => ({
  r: foreground.r * alpha + background.r * (1 - alpha),
  g: foreground.g * alpha + background.g * (1 - alpha),
  b: foreground.b * alpha + background.b * (1 - alpha),
});

/** What a possibly translucent colour looks like on an opaque ground. */
export const flatten = (color: Color & { a?: number }, ground: Color): Color =>
  over(color, color.a == null ? 1 : color.a, ground);

/* --- colour-vision deficiency, Viénot/Brettel/Mollon 1999 ------------------ */
const LMS: Matrix3 = [[17.8824, 43.5161, 4.11935], [3.45565, 27.1554, 3.86714], [0.0299566, 0.184309, 1.46709]];
const LMS_INV: Matrix3 = [[0.0809444479, -0.130504409, 0.116721066], [-0.0102485335, 0.0540193266, -0.113614708], [-0.000365296938, -0.00412161469, 0.693511405]];
const SIM: Record<ColorVisionDeficiency, Matrix3> = {
  protanopia: [[0, 2.02344, -2.52581], [0, 1, 0], [0, 0, 1]],
  deuteranopia: [[1, 0, 0], [0.494207, 0, 1.24827], [0, 0, 1]],
  tritanopia: [[1, 0, 0], [0, 1, 0], [-0.395913, 0.801109, 0]],
};
const mul = (m: Matrix3, v: Vector3): Vector3 => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
export function simulate(c: Color, kind: ColorVisionDeficiency): Color {
  const lin = [srgb(c.r) * 255, srgb(c.g) * 255, srgb(c.b) * 255] as const;
  const lms = mul(LMS, lin);
  const sim = mul(SIM[kind], lms);
  const back = mul(LMS_INV, sim);
  const enc = (v: number): number => {
    let x = v / 255;
    x = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055;
    return Math.max(0, Math.min(255, x * 255));
  };
  return { r: enc(back[0]), g: enc(back[1]), b: enc(back[2]) };
}
/* CIE76 in Lab — crude, but enough to say "these two are now the same colour". */
export function lab(c: Color): Vector3 {
  const f = (t: number): number => t > 0.008856 ? Math.cbrt(t) : (7.787 * t + 16 / 116);
  const R = srgb(c.r), G = srgb(c.g), B = srgb(c.b);
  const X = (0.4124 * R + 0.3576 * G + 0.1805 * B) / 0.95047;
  const Y = (0.2126 * R + 0.7152 * G + 0.0722 * B);
  const Z = (0.0193 * R + 0.1192 * G + 0.9505 * B) / 1.08883;
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
export const dE = (a: Color, b: Color): number => {
  const first = lab(a);
  const second = lab(b);
  return Math.hypot(
    first[0] - second[0],
    first[1] - second[1],
    first[2] - second[2],
  );
};
