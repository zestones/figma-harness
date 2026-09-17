/* What the harness measures for Carrara. Every pair, ladder and grid here is
 * checked on every build; change them with the tokens. */

import type { ContrastPairContract, DesignSystemContract } from '@figma-harness/contract';
import {
  COLORS,
  COLOR_SCOPES,
  COLOR_SHARING_DECISIONS,
  COLOR_TOKEN_OWNERSHIP,
  type ColorToken,
} from './colors.ts';
import { RADII, SPACING } from './dimensions.ts';
import { SHADOW_ALPHAS } from './elevation.ts';
import { FOCUS } from './focus.ts';

type Pair = readonly [ColorToken, ColorToken, number, string, ColorToken?];

const GROUNDS = ['bg/surface', 'bg/canvas', 'bg/subtle'] as const;
const STATES = ['positive', 'warning', 'critical', 'neutral'] as const;

const onEveryGround = function (ink: ColorToken, purpose: string): Pair[] {
  return GROUNDS.map((ground): Pair => [ink, ground, 4.5, purpose + ' on ' + ground]);
};

const statePairs = STATES.flatMap((state): Pair[] => [
  ['status/' + state as ColorToken, 'bg/surface', 4.5, state + ' text in a table'],
  ['status/' + state as ColorToken, 'status/' + state + '-subtle' as ColorToken, 4.5, state + ' badge'],
  ['text/primary', 'status/' + state + '-subtle' as ColorToken, 4.5, 'body text on a ' + state + ' callout'],
]);

const CONTRAST_PAIRS: readonly ContrastPairContract[] = Object.freeze([
  ...onEveryGround('text/primary', 'body text'),
  ...onEveryGround('text/secondary', 'labels'),
  ...onEveryGround('text/tertiary', 'captions'),
  ['text/primary', 'accent/subtle', 4.5, 'body text on a selected row'],
  ['accent/text', 'bg/surface', 4.5, 'links'],
  ['accent/text', 'bg/canvas', 4.5, 'links on the page'],
  ['accent/text', 'accent/subtle', 4.5, 'accent badge and avatar initials'],
  ['text/on-accent', 'accent/solid', 4.5, 'primary button'],
  ['text/on-accent', 'accent/solid-hover', 4.5, 'primary button, hovered'],
  ['text/on-accent', 'status/critical-solid', 4.5, 'destructive button'],
  ['text/on-accent', 'status/critical-solid-hover', 4.5, 'destructive button, hovered'],
  ['text/inverse', 'bg/inverse', 4.5, 'sidebar items'],
  ['text/inverse', 'bg/inverse-raised', 4.5, 'sidebar counts'],
  ['text/inverse-muted', 'bg/inverse', 4.5, 'sidebar section labels'],
  ['text/inverse-strong', 'bg/inverse-raised', 4.5, 'current sidebar item'],
  ['border/control', 'bg/surface', 3, 'button and field edges'],
  ['border/control', 'bg/canvas', 3, 'button and field edges on the page'],
  ['control/track', 'bg/surface', 3, 'switch track'],
  ['focus/ring', 'bg/surface', 3, 'focus outline'],
  ['focus/ring', 'bg/inverse', 3, 'focus outline in the sidebar'],
  ['accent/solid', 'bg/surface', 3, 'current tab and checked controls'],
  ['chart/primary', 'bg/surface', 3, 'main chart series'],
  ['chart/secondary', 'bg/surface', 3, 'comparison chart series'],
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

const NEUTRALS: readonly ColorToken[] = Object.freeze([
  'bg/canvas', 'bg/subtle', 'bg/muted', 'bg/inverse', 'bg/inverse-raised',
  'text/primary', 'text/secondary', 'text/tertiary', 'text/disabled', 'text/inverse', 'text/inverse-muted',
  'border/default', 'border/control', 'border/inverse', 'chart/secondary', 'chart/grid',
]);

export const DESIGN_SYSTEM_AUDIT: Omit<DesignSystemContract, 'componentInventory'> = Object.freeze({
  adjacencyPrefixes: Object.freeze(['status/', 'accent/', 'chart/']),
  categorical: Object.freeze({
    tokens: Object.freeze([...STATE_MARKS, 'accent/solid', 'chart/primary', 'chart/secondary']),
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
    show: Object.freeze([...STATE_MARKS, 'accent/solid', 'chart/secondary']),
    quoted: Object.freeze([
      ['text/primary', 'bg/surface'],
      ['text/secondary', 'bg/surface'],
      ['text/tertiary', 'bg/subtle'],
      ['border/control', 'bg/canvas'],
      ['focus/ring', 'bg/surface'],
      ['focus/ring', 'bg/inverse'],
      ['text/inverse', 'bg/inverse'],
    ] as const),
  }),
  focus: FOCUS,
  iconSizes: Object.freeze([16, 20]),
  pageGround: 'bg/canvas',
  radiusScale: Object.freeze([0, RADII.xs, RADII.sm, RADII.md, RADII.lg, RADII.full]),
  spacingScale: SPACING,
  statusColorTokens: STATE_MARKS,
  surfaceContrast: Object.freeze({
    controls: Object.freeze([
      { subject: 'secondary button edge', edge: 'border/control', outside: 'bg/surface', interactive: true },
      { subject: 'secondary button edge on the page', edge: 'border/control', outside: 'bg/canvas', interactive: true },
      { subject: 'field edge', edge: 'border/control', outside: 'bg/surface', interactive: true },
      { subject: 'card edge', edge: 'border/default', outside: 'bg/canvas', interactive: false },
      { subject: 'sidebar divider', edge: 'border/inverse', outside: 'bg/inverse', interactive: false },
    ]),
    disabled: Object.freeze({
      pairs: Object.freeze([['text/disabled', 'bg/subtle'], ['text/disabled', 'bg/surface']] as const),
    }),
    // Every ground a focused control can sit on, the segmented track and the current sidebar item included.
    focusGrounds: Object.freeze(['bg/surface', 'bg/canvas', 'bg/subtle', 'bg/muted', 'bg/inverse', 'bg/inverse-raised']),
    shadows: Object.freeze(SHADOW_ALPHAS.map(([name, alpha]) => Object.freeze([name, alpha, 'bg/canvas'] as const))),
    textPairs: Object.freeze([
      ['text/tertiary', 'bg/subtle'],
      ['text/inverse-muted', 'bg/inverse'],
      ['text/on-accent', 'accent/solid'],
      ['text/on-accent', 'status/critical-solid'],
    ] as const),
  }),
  theme: Object.freeze({
    neutralTokens: NEUTRALS,
    maximumNeutralChroma: 0.03,
    maximumNeutralHueDrift: 12,
    ladders: Object.freeze([
      { tokens: Object.freeze(['bg/surface', 'bg/canvas']), minimumStep: 1.04 },
      { tokens: Object.freeze(['bg/canvas', 'bg/subtle', 'border/default']), minimumStep: 1.03 },
      { tokens: Object.freeze(['bg/inverse', 'bg/inverse-raised']), minimumStep: 1.04 },
    ]),
    inkRamp: Object.freeze(['text/primary', 'text/secondary']),
    minimumInkStep: 0.15,
    inkGrounds: Object.freeze(GROUNDS),
    accent: Object.freeze({
      readable: Object.freeze([
        ['text/on-accent', 'accent/solid', 'label on the primary action'],
        ['accent/text', 'bg/surface', 'links'],
        ['accent/text', 'accent/subtle', 'accent text on a selected row'],
      ] as const),
      marks: Object.freeze([
        ['accent/solid', 'bg/surface', 'primary action and current tab'],
        ['focus/ring', 'bg/surface', 'focus outline on a card'],
        ['focus/ring', 'bg/inverse', 'focus outline in the sidebar'],
      ] as const),
      tints: Object.freeze([['accent/subtle', 'bg/surface', 1.1]] as const),
    }),
  }),
});
