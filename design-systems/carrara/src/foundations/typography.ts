/* Text styles: Inter for the interface, JetBrains Mono for identifiers.
 * design-system.json names the same families, so the harness measures text
 * the way Figma draws it. */

export const FONT_FAMILY = 'Inter';
export const MONO_FAMILY = 'JetBrains Mono';

const STYLE_NAMES: Readonly<Record<number, string>> = Object.freeze({ 400: 'Regular', 500: 'Medium', 600: 'SemiBold' });

export interface TextStyleSpec {
  readonly description: string;
  readonly family: string;
  readonly lineHeight: number;
  readonly name: string;
  readonly size: number;
  readonly style: string;
}

const spec = function (
  name: string,
  size: number,
  lineHeight: number,
  weight: 400 | 500 | 600,
  description: string,
  family: string = FONT_FAMILY,
): TextStyleSpec {
  return Object.freeze({ name, family, style: STYLE_NAMES[weight], size, lineHeight, description });
};

export const TYPE = Object.freeze([
  spec('display/lg', 36, 44, 600, 'The amount at the top of a payment.'),
  spec('display/md', 28, 36, 600, 'Key figures.'),
  spec('title/page', 24, 32, 600, 'Page titles.'),
  spec('title/dialog', 18, 28, 600, 'Dialog titles.'),
  spec('title/card', 16, 24, 600, 'Card and section titles.'),
  spec('body/md', 14, 20, 400, 'Body text and table cells.'),
  spec('body/md-medium', 14, 20, 500, 'Buttons, labels and navigation.'),
  spec('body/md-strong', 14, 20, 600, 'Emphasis, amounts and names.'),
  spec('body/sm', 12, 18, 400, 'Captions, axes and metadata.'),
  spec('body/sm-medium', 12, 18, 500, 'Badges, column headers and small labels.'),
  spec('label/overline', 11, 16, 600, 'Section labels, written in capitals.'),
  spec('mono/sm', 12, 18, 400, 'Identifiers such as payment IDs.', MONO_FAMILY),
] as const);

export type TextStyleName = typeof TYPE[number]['name'];

/** Every family and style the text styles need, once. */
export const FONTS: readonly FontName[] = Object.freeze(
  [...new Map(TYPE.map((entry) => [entry.family + '|' + entry.style, { family: entry.family, style: entry.style }])).values()],
);

export const lineHeight = function (style: TextStyleName): number {
  const found = TYPE.find((entry) => entry.name === style);
  if (!found) throw new Error('unknown text style ' + style);
  return found.lineHeight;
};
