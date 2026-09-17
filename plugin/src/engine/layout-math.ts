/* Runtime: deterministic layout arithmetic. */



/* --- layout arithmetic ---------------------------------------------------- *
 * These are the only places a width is divided. Every caller uses them, so a
 * rounding remainder is always absorbed rather than silently overflowing.
 * ------------------------------------------------------------------------- */

/** Inner width of a box after horizontal padding. */
export const inner = function (w: number, padL: number, padR?: number): number {
  return Math.max(0, w - padL - (padR == null ? padL : padR));
};

/** What is left of `total` once `chrome` is taken off it, never below zero.
 *  Every card in this system computes its body as `o.h - header - padding`,
 *  and every one of those subtractions goes negative at some box size. Figma
 *  rejects a negative height outright and stops the whole build mid-page, so
 *  the clamp belongs in one place rather than at twelve call sites that each
 *  have to remember it. Zero is honest here: a body with no room shows
 *  nothing, which is visible, where a crash is not. */
export const below = function (total: number, chrome: number): number {
  return Math.max(0, total - chrome);
};

/** Split `available` into `n` equal columns separated by `gap`.
 *  The last column absorbs the rounding remainder, so the sum is exact. */
export const cols = function (available: number, n: number, gap: number): number[] {
  var usable = available - gap * (n - 1);
  var base = Math.floor(usable / n);
  var out: number[] = [];
  var acc = 0;
  for (var i = 0; i < n - 1; i++) { out.push(base); acc += base; }
  out.push(usable - acc);
  return out;
};

/** Split `available` by weights, gap-separated. Exact sum, remainder on the last. */
export const split = function (available: number, weights: readonly number[], gap: number): number[] {
  var usable = available - gap * (weights.length - 1);
  var total = 0;
  for (var i = 0; i < weights.length; i++) total += weights[i];
  var out: number[] = [];
  var acc = 0;
  for (var j = 0; j < weights.length - 1; j++) {
    var w = Math.floor((usable * weights[j]) / total);
    out.push(w); acc += w;
  }
  out.push(usable - acc);
  return out;
};

/** The 12-column grid. At a 1600 frame the content is 1280 wide, which is
 *  twelve 92 px columns with 16 px gaps. Only a preset set of spans is legal,
 *  because preset spans produce aligned pages a non-designer cannot break and a
 *  free canvas always degrades into mush. The mirrors are legal too: 4/8 is
 *  8/4 read the other way round, and a page whose narrow column comes first —
 *  a verdict beside its evidence — is an ordinary shape, not a violation.
 *  Spans must sum to 12; the last column absorbs the rounding remainder. */
export const LEGAL_SPANS = ['12', '8,4', '4,8', '6,6', '7,5', '5,7', '4,4,4'];
export const span = function (available: number, spans: readonly number[], gap?: number): number[] {
  var g = gap == null ? 16 : gap;
  var key = spans.join(',');
  if (LEGAL_SPANS.indexOf(key) < 0) throw new Error('Illegal column span: ' + key);
  var col = (available - 11 * g) / 12;
  var out: number[] = [];
  var acc = 0;
  for (var i = 0; i < spans.length - 1; i++) {
    var w = Math.floor(spans[i] * col + (spans[i] - 1) * g);
    out.push(w);
    acc += w + g;
  }
  out.push(available - acc);
  return out;
};
