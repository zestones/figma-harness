/* Typography: Primer's functional text roles, set in Noto Sans.
 *
 * Primer's stack starts with Mona Sans and the platform UI font, which a Figma
 * file cannot rely on everywhere. Noto Sans is the first cross-platform member
 * of that stack and ships with Figma, so every reviewer sees the same metrics.
 * Decision: docs/adr/0001-primer-light-theme.md */

import { PRIMER_TEXT } from './primer.generated.ts';

export const FONT_FAMILIES = Object.freeze({ sans: 'Noto Sans', mono: 'Noto Sans Mono' });

/** Figma style names for the weights Primer uses. */
const WEIGHT_STYLES: Readonly<Record<number, string>> = Object.freeze({
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
});

export interface TextStyleSpec {
  readonly description: string;
  readonly family: string;
  readonly lineHeight: number;
  readonly name: string;
  readonly size: number;
  readonly style: string;
  readonly weight: number;
}

const spec = function (
  name: string,
  family: 'sans' | 'mono',
  size: number,
  lineHeight: number,
  weight: number,
  description: string,
): TextStyleSpec {
  const style = WEIGHT_STYLES[weight];
  if (!style) throw new Error('no Figma style for weight ' + weight);
  return Object.freeze({ name, family: FONT_FAMILIES[family], style, size, lineHeight, weight, description });
};

const role = function (name: string): TextStyleSpec {
  const entry = PRIMER_TEXT.find(([candidate]) => candidate === name);
  if (!entry) throw new Error('Primer publishes no text role ' + name);
  return spec(entry[0], entry[1], entry[2], entry[3], entry[4], entry[5]);
};

/* Primer's components set a weight on a role, or a line height of 1 inside a
 * fixed-height pill. Those combinations are styles too, so no page sets a
 * weight by hand. */
const variant = function (base: string, name: string, weight: number, description: string, lineHeight?: number): TextStyleSpec {
  const source = role(base);
  return spec(name, source.family === FONT_FAMILIES.mono ? 'mono' : 'sans', source.size,
    lineHeight == null ? source.lineHeight : lineHeight, weight, description);
};

export const TYPE: readonly TextStyleSpec[] = Object.freeze([
  ...PRIMER_TEXT.map(([name]) => role(name)),
  variant('body/medium', 'body/medium-500', 500, 'Button, segmented control and other control labels.'),
  variant('body/medium', 'body/medium-600', 600, 'Current navigation item, form label, dialog title, emphasised row.'),
  variant('body/small', 'body/small-500', 500, 'Small control labels.'),
  variant('body/small', 'body/small-600', 600, 'Small state labels and emphasised metadata.'),
  variant('body/small', 'label/small', 500, 'Label: 12 px medium on a line of 1, centred in a 20 or 24 px pill.', 12),
  variant('body/small', 'label/small-600', 600, 'Counter and token: 12 px semibold on a line of 1.', 12),
  spec('code/small', 'mono', 12, 18, 400, 'Versions, hashes and branch names in running UI text.'),
]);

export type TextStyleName = typeof PRIMER_TEXT[number][0]
  | 'body/medium-500' | 'body/medium-600' | 'body/small-500' | 'body/small-600'
  | 'label/small' | 'label/small-600' | 'code/small';

/** Every family and Figma style the text styles need, once. */
export const FONTS: readonly FontName[] = Object.freeze(
  [...new Map(TYPE.map((entry) => [entry.family + '|' + entry.style, { family: entry.family, style: entry.style }])).values()],
);
