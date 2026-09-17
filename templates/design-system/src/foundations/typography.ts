/* Text styles. One family keeps the example simple; design-system.json names
 * the same family so the harness measures text the way Figma draws it. */

export const FONT_FAMILY = 'Noto Sans';

const STYLE_NAMES: Readonly<Record<number, string>> = Object.freeze({ 400: 'Regular', 600: 'SemiBold' });

export interface TextStyleSpec {
  readonly description: string;
  readonly family: string;
  readonly lineHeight: number;
  readonly name: string;
  readonly size: number;
  readonly style: string;
}

const spec = function (name: string, size: number, lineHeight: number, weight: 400 | 600, description: string): TextStyleSpec {
  return Object.freeze({ name, family: FONT_FAMILY, style: STYLE_NAMES[weight], size, lineHeight, description });
};

export const TYPE = Object.freeze([
  spec('title/large', 28, 36, 600, 'Screen titles.'),
  spec('title/small', 18, 26, 600, 'Card and section titles.'),
  spec('body/default', 14, 20, 400, 'Body text.'),
  spec('body/strong', 14, 20, 600, 'Labels, buttons and emphasis.'),
  spec('body/small', 12, 16, 400, 'Captions and metadata.'),
  spec('label/small', 12, 16, 600, 'Badges.'),
] as const);

export type TextStyleName = 'body/default' | 'body/small' | 'body/strong' | 'label/small' | 'title/large' | 'title/small';

/** Every family and style the text styles need, once. */
export const FONTS: readonly FontName[] = Object.freeze(
  [...new Map(TYPE.map((entry) => [entry.style, { family: entry.family, style: entry.style }])).values()],
);

export const lineHeight = function (style: TextStyleName): number {
  const found = TYPE.find((entry) => entry.name === style);
  if (!found) throw new Error('unknown text style ' + style);
  return found.lineHeight;
};
