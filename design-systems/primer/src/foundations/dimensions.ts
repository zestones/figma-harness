/* Size tokens: Primer's functional sizes, plus the few shell roles Primer
 * leaves to the product. Values are installed as Figma variables and bound
 * natively. Decision: docs/adr/0003-dimension-variables-and-native-bindings.md */
import { dimensionReference, type DimensionReference } from '@figma-harness/engine';
import { PRIMER_SIZES } from './primer.generated.ts';

type VariableScopeName = 'CORNER_RADIUS' | 'GAP' | 'WIDTH_HEIGHT';

/* Primer's PageLayout sets these in CSS rather than as tokens. */
const APP_SIZES = Object.freeze({
  'app/header/height': { value: 64, scopes: ['WIDTH_HEIGHT'], description: 'Global header: medium controls inside a 16 px padding.' },
  'app/pane/width': { value: 296, scopes: ['WIDTH_HEIGHT'], description: 'PageLayout pane, medium width on wide viewports.' },
  'app/content/maxWidth': { value: 1280, scopes: ['WIDTH_HEIGHT'], description: 'PageLayout content, xlarge container width.' },
} as const);

export type PrimerSizeName = typeof PRIMER_SIZES[number][0];
export type DimensionName = PrimerSizeName | keyof typeof APP_SIZES;

export interface DimensionToken {
  readonly description: string;
  readonly name: DimensionName;
  readonly scopes: readonly VariableScopeName[];
  readonly value: number;
}

export const DIMS: readonly DimensionToken[] = Object.freeze([
  ...PRIMER_SIZES.map(([name, value, scopes]) => Object.freeze({
    name, value, scopes: scopes as readonly VariableScopeName[], description: '',
  })),
  ...(Object.keys(APP_SIZES) as Array<keyof typeof APP_SIZES>).map((name) => Object.freeze({
    name, ...APP_SIZES[name],
  })),
]);

const VALUES = new Map<DimensionName, DimensionToken>(DIMS.map((token) => [token.name, token]));

/** A declared size, by name. */
export const sizeToken = function (name: DimensionName): number {
  const token = VALUES.get(name);
  if (!token) throw new Error('unknown size token ' + name);
  return token.value;
};

/** The spacing scale: every Primer base size. Gaps and paddings stay on it. */
export const SPACING = Object.freeze([0, ...PRIMER_SIZES
  .filter(([name]) => name.startsWith('base/size/'))
  .map(([, value]) => value as number)]);

export const RADII = Object.freeze({
  small: sizeToken('borderRadius/small'),
  medium: sizeToken('borderRadius/medium'),
  large: sizeToken('borderRadius/large'),
  full: sizeToken('borderRadius/full'),
});

export const CONTROL_SIZES = Object.freeze({
  xsmall: sizeToken('control/xsmall/size'),
  small: sizeToken('control/small/size'),
  medium: sizeToken('control/medium/size'),
  large: sizeToken('control/large/size'),
  xlarge: sizeToken('control/xlarge/size'),
});

export type ControlSize = 'small' | 'medium' | 'large';

export const STACK = Object.freeze({
  condensed: sizeToken('stack/gap/condensed'),
  normal: sizeToken('stack/gap/normal'),
  spacious: sizeToken('stack/gap/spacious'),
});

export const OVERLAY_WIDTHS = Object.freeze({
  xsmall: sizeToken('overlay/width/xsmall'),
  small: sizeToken('overlay/width/small'),
  medium: sizeToken('overlay/width/medium'),
  large: sizeToken('overlay/width/large'),
});

/** Primer's viewport ranges, for artboard sizes. */
export const BREAKPOINTS = Object.freeze({ small: 544, medium: 768, large: 1012, xlarge: 1280, xxlarge: 1400 });

/* The application shell: a global header over a PageLayout. */
export const SHELL_DIMENSIONS = Object.freeze({
  header: sizeToken('app/header/height'),
  localNav: sizeToken('control/xlarge/size'),
  pane: sizeToken('app/pane/width'),
  contentMax: sizeToken('app/content/maxWidth'),
  pagePadding: sizeToken('stack/padding/spacious'),
  columnGap: sizeToken('stack/gap/spacious'),
});

const references = new Map<DimensionName, DimensionReference>();

/** Use in f({ pad: dim('stack/padding/normal'), gap: dim('stack/gap/condensed') }).
 *  Figma's scopes decide which properties a size may own. Arithmetic uses .value. */
export function dim(name: DimensionName): DimensionReference {
  const token = VALUES.get(name);
  if (!token) throw new Error('unknown dimension ' + name);
  let reference = references.get(name);
  if (!reference) {
    reference = dimensionReference(name, token.value, token.scopes);
    references.set(name, reference);
  }
  return reference;
}
