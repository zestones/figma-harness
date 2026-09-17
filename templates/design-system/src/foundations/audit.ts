/* What the harness measures for this design system. Every pair, ladder and
 * grid here is checked on every build; change them with the tokens. */

import type { ContrastPairContract, DesignSystemContract } from '@figma-harness/contract';
import {
  COLORS,
  COLOR_SCOPES,
  COLOR_SHARING_DECISIONS,
  COLOR_TOKEN_OWNERSHIP,
  type ColorToken,
} from './colors.ts';
import { FOCUS } from './focus.ts';
import { RADII, SPACING } from './dimensions.ts';

type Pair = readonly [ColorToken, ColorToken, number, string, ColorToken?];

const STATES = ['positive', 'warning', 'critical', 'neutral'] as const;

const statePairs = STATES.flatMap((state): Pair[] => [
  ['status/' + state as ColorToken, 'surface/page', 4.5, state + ' text on the page'],
  ['status/' + state as ColorToken, 'status/' + state + '-subtle' as ColorToken, 4.5, state + ' badge'],
  ['text/default', 'status/' + state + '-subtle' as ColorToken, 4.5, 'body text on a ' + state + ' fill'],
]);

const CONTRAST_PAIRS: readonly ContrastPairContract[] = Object.freeze([
  ['text/default', 'surface/page', 4.5, 'body text'],
  ['text/default', 'surface/subtle', 4.5, 'body text on a subtle surface'],
  ['text/muted', 'surface/page', 4.5, 'secondary text'],
  ['text/muted', 'surface/subtle', 4.5, 'secondary text on a subtle surface'],
  ['text/on-accent', 'accent/default', 4.5, 'primary button'],
  ['text/on-accent', 'accent/hover', 4.5, 'primary button, hovered'],
  ['accent/text', 'surface/page', 4.5, 'link'],
  ['accent/text', 'accent/subtle', 4.5, 'selected text'],
  ['text/default', 'accent/subtle', 4.5, 'body text on a selected row'],
  ['border/control', 'surface/page', 3, 'control edge'],
  ['focus/ring', 'surface/page', 3, 'focus outline'],
  ['accent/default', 'surface/page', 3, 'primary button on the page'],
  ...statePairs,
] satisfies readonly Pair[]);

const STATE_MARKS: readonly ColorToken[] = Object.freeze(['status/positive', 'status/warning', 'status/critical']);

interface ExceptionNode {
  getPluginData(key: string): string;
  readonly name: string;
}

/** The Colour sheet's swatch of the focus token strokes with it on purpose. */
export const FOCUS_STROKE_EXEMPTIONS = Object.freeze([
  (node: ExceptionNode) => node.name === 'chip' && node.getPluginData('spec.swatch.token') === FOCUS.token,
]);

export const DESIGN_SYSTEM_AUDIT: Omit<DesignSystemContract, 'componentInventory'> = Object.freeze({
  adjacencyPrefixes: Object.freeze(['status/', 'accent/']),
  categorical: Object.freeze({
    tokens: Object.freeze([...STATE_MARKS, 'accent/default']),
    rampPrefixes: Object.freeze([]),
    sameFamilyPrefixes: Object.freeze([]),
    waivers: Object.freeze([]),
  }),
  colorOwnership: COLOR_TOKEN_OWNERSHIP,
  colorScopeExceptions: Object.freeze([]),
  colorScopes: COLOR_SCOPES,
  colorSharingDecisions: COLOR_SHARING_DECISIONS,
  colors: COLORS,
  contrastPairs: CONTRAST_PAIRS,
  cvd: Object.freeze({
    show: Object.freeze([...STATE_MARKS, 'accent/default']),
    quoted: Object.freeze([
      ['text/default', 'surface/page'],
      ['text/muted', 'surface/page'],
      ['focus/ring', 'surface/page'],
      ['border/control', 'surface/page'],
    ] as const),
  }),
  focus: FOCUS,
  iconSizes: Object.freeze([16]),
  pageGround: 'surface/page',
  radiusScale: Object.freeze([0, RADII.small, RADII.medium, RADII.full]),
  spacingScale: SPACING,
  statusColorTokens: STATE_MARKS,
  surfaceContrast: Object.freeze({
    controls: Object.freeze([
      { subject: 'secondary button edge', edge: 'border/control', outside: 'surface/page', interactive: true },
      { subject: 'card edge', edge: 'border/default', outside: 'surface/page', interactive: false },
    ]),
    disabled: Object.freeze({
      pairs: Object.freeze([['text/disabled', 'surface/disabled']] as const),
    }),
    focusGrounds: Object.freeze(['surface/page', 'surface/subtle']),
    shadows: Object.freeze([]),
    textPairs: Object.freeze([
      ['text/muted', 'surface/subtle'],
      ['text/on-accent', 'accent/default'],
    ] as const),
  }),
  theme: Object.freeze({
    neutralTokens: Object.freeze([
      'surface/subtle', 'surface/disabled', 'border/default', 'border/control', 'text/default', 'text/muted', 'text/disabled',
    ]),
    maximumNeutralChroma: 0.03,
    maximumNeutralHueDrift: 12,
    ladders: Object.freeze([
      { tokens: Object.freeze(['surface/page', 'surface/subtle', 'border/default']), minimumStep: 1.04 },
    ]),
    inkRamp: Object.freeze(['text/default', 'text/muted']),
    minimumInkStep: 0.15,
    inkGrounds: Object.freeze(['surface/page', 'surface/subtle']),
    accent: Object.freeze({
      readable: Object.freeze([
        ['text/on-accent', 'accent/default', 'label on the primary action'],
        ['accent/text', 'surface/page', 'accent text on the page'],
        ['accent/text', 'accent/subtle', 'accent text on a selected row'],
      ] as const),
      marks: Object.freeze([
        ['accent/default', 'surface/page', 'primary action on the page'],
        ['focus/ring', 'surface/page', 'focus outline on the page'],
      ] as const),
      tints: Object.freeze([['accent/subtle', 'surface/page', 1.1]] as const),
    }),
  }),
});
