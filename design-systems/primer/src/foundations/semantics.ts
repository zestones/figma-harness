/* Primer's functional colour families, data series and deterministic samples. */

import type { ColorToken } from './colors.ts';

/* --- functional families --------------------------------------------------- */

export interface ColorFamily {
  /** Emphasised surfaces: solid badges, progress, state labels. */
  readonly emphasis: ColorToken;
  /** Border of an emphasised element. */
  readonly emphasisBorder: ColorToken;
  /** Ink on the default and muted surfaces. */
  readonly fg: ColorToken;
  readonly label: string;
  /** Tinted surfaces: banners, flashes, subtle labels. */
  readonly muted: ColorToken;
  readonly mutedBorder: ColorToken;
}

const family = function (name: string, label: string, fg: string): ColorFamily {
  return Object.freeze({
    label,
    fg: fg as ColorToken,
    emphasis: ('bgColor/' + name + '-emphasis') as ColorToken,
    muted: ('bgColor/' + name + '-muted') as ColorToken,
    emphasisBorder: ('borderColor/' + name + '-emphasis') as ColorToken,
    mutedBorder: ('borderColor/' + name + '-muted') as ColorToken,
  });
};

/** Primer's families. open, closed and draft alias success, danger and neutral
 *  so a state can change colour without changing its meaning. */
export const STATUS = Object.freeze({
  neutral: family('neutral', 'Neutral', 'fgColor/neutral'),
  accent: family('accent', 'Accent', 'fgColor/accent'),
  success: family('success', 'Success', 'fgColor/success'),
  attention: family('attention', 'Attention', 'fgColor/attention'),
  severe: family('severe', 'Severe', 'fgColor/severe'),
  danger: family('danger', 'Danger', 'fgColor/danger'),
  done: family('done', 'Done', 'fgColor/done'),
  open: family('open', 'Open', 'fgColor/open'),
  closed: family('closed', 'Closed', 'fgColor/closed'),
  draft: family('draft', 'Draft', 'fgColor/draft'),
});

export type StatusKind = keyof typeof STATUS;
export type StatusTokenRole = 'emphasis' | 'emphasisBorder' | 'fg' | 'muted' | 'mutedBorder';

export const STATUS_KINDS = Object.freeze(Object.keys(STATUS) as StatusKind[]);

/** Resolve a family role; an unknown kind reads as neutral, never as success. */
export const statusToken = function (kind: string, role: StatusTokenRole = 'emphasis'): ColorToken {
  const semantic = STATUS[kind as StatusKind] || STATUS.neutral;
  return semantic[role];
};

/* --- data series ----------------------------------------------------------- */

export const DATA_HUES = Object.freeze(['blue', 'green', 'orange', 'purple'] as const);

export type DataHue = typeof DATA_HUES[number];

export const DATA_TOKENS = Object.freeze(DATA_HUES.map((hue) => ('data/' + hue + '/color/emphasis') as ColorToken));

export const DATA_MUTED_TOKENS = Object.freeze(DATA_HUES.map((hue) => ('data/' + hue + '/color/muted') as ColorToken));

/** The series that stands for "everything else"; never one of the ranked series. */
export const DATA_OTHER = Object.freeze({
  emphasis: 'data/gray/color/emphasis' as ColorToken,
  muted: 'data/gray/color/muted' as ColorToken,
});

/** The series colour for a zero-based index; the ramp repeats past its end. */
export const dataToken = function (index: number, role: 'emphasis' | 'muted' = 'emphasis'): ColorToken {
  const tokens = role === 'muted' ? DATA_MUTED_TOKENS : DATA_TOKENS;
  const count = tokens.length;
  return tokens[((Math.floor(index) % count) + count) % count];
};

/* --- deterministic series generator --------------------------------------- *
 * Sample data must be stable across rebuilds, so no Math.random anywhere.
 * ------------------------------------------------------------------------- */
export const series = function (
  seed: number,
  count: number,
  base: number,
  spread: number,
  nullsAt?: readonly number[],
): (number | null)[] {
  const output: (number | null)[] = [];
  let state = seed * 9301 + 49297;
  for (let index = 0; index < count; index++) {
    state = (state * 9301 + 49297) % 233280;
    const random = state / 233280;
    const value = base + (random - 0.5) * spread
      + Math.sin((index + seed) / 2.7) * spread * 0.3;
    output.push(Math.max(0.04, Math.min(0.99, value)));
  }
  if (nullsAt) for (const index of nullsAt) output[index] = null;
  return output;
};
