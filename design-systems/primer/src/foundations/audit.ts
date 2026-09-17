/* The design system's declared audit contract.
 *
 * The offline tools measure; this module states WHAT they must measure for
 * Primer's light theme, and where Primer knowingly departs from a stricter
 * rule. It is exposed to them through the plugin's HARNESS_API, so the tooling
 * never needs to know where a token or a scale lives.
 * Decision: design-systems/primer/docs/adr/0002-colour-roles.md */

import {
  COLORS,
  COLOR_SCOPES,
  COLOR_SHARING_DECISIONS,
  COLOR_TOKEN_OWNERSHIP,
  type ColorToken,
} from './colors.ts';
import { RADII, SPACING } from './dimensions.ts';
import { ELEVATION } from './elevation.ts';
import { FOCUS } from './focus.ts';
import { DATA_OTHER, DATA_TOKENS, STATUS, type StatusKind } from './semantics.ts';

/** [foreground, background, required ratio, what the pair is, opaque ground under a translucent layer]. */
export type ContrastPair = readonly [
  foreground: ColorToken, background: ColorToken, required: number, purpose: string, ground?: ColorToken,
];

export interface CategoricalWaiver {
  /** Count every matching pair, or only pairs that meet on one artboard. */
  readonly counts: 'always' | 'adjacent';
  /** Appended to every matching finding after '. WAIVED: '. */
  readonly detail: string;
  readonly label: string;
  readonly matches: (first: string, second: string) => boolean;
  readonly summary: (count: number) => string;
}

export interface SurfaceControl {
  readonly edge: ColorToken;
  /** An interactive control's edge must reach 3:1; a region separator is only reported. */
  readonly interactive: boolean;
  readonly outside: ColorToken;
  readonly subject: string;
  /** A reviewed reason the edge may stay under 3:1. It is reported, never hidden. */
  readonly waiver?: string;
}

export interface NeutralLadder {
  /** Adjacent entries must differ by at least this contrast ratio. */
  readonly minimumStep: number;
  readonly tokens: readonly ColorToken[];
}

export const SPACING_SCALE: readonly number[] = Object.freeze([...SPACING]);

/** Octicons are drawn on these square grids. */
export const ICON_SIZES: readonly number[] = Object.freeze([12, 16, 24]);

export const RADIUS_SCALE: readonly number[] = Object.freeze([0, ...Object.values(RADII)]);

/* The families whose emphasis colours tell states apart. open, closed and
   draft alias success, danger and neutral, so they are not measured twice. */
const STATE_FAMILIES: readonly StatusKind[] = Object.freeze(['neutral', 'accent', 'success', 'attention', 'severe', 'danger', 'done']);
const EMPHASIS = STATE_FAMILIES.map((kind) => STATUS[kind].emphasis);

const familyPairs = function (): ContrastPair[] {
  const pairs: ContrastPair[] = [];
  for (const kind of Object.keys(STATUS) as StatusKind[]) {
    const family = STATUS[kind];
    pairs.push([family.fg, 'bgColor/default', 4.5, kind + ' text on the page']);
    pairs.push([family.fg, family.muted, 4.5, kind + ' text on its tint', 'bgColor/default']);
    pairs.push(['fgColor/default', family.muted, 4.5, 'body text in a ' + kind + ' banner', 'bgColor/default']);
    pairs.push(['fgColor/onEmphasis', family.emphasis, 4.5, kind + ' state label']);
  }
  return pairs;
};

export const CONTRAST_PAIRS: readonly ContrastPair[] = Object.freeze([
  ['fgColor/default', 'bgColor/default', 4.5, 'body text'],
  ['fgColor/default', 'bgColor/muted', 4.5, 'body text on a muted surface'],
  ['fgColor/default', 'bgColor/inset', 4.5, 'body text in an inset'],
  ['fgColor/default', 'page/header/bgColor', 4.5, 'header text'],
  ['fgColor/muted', 'bgColor/default', 4.5, 'secondary text'],
  ['fgColor/muted', 'bgColor/muted', 4.5, 'secondary text on a muted surface'],
  ['fgColor/muted', 'page/header/bgColor', 4.5, 'secondary text in the header'],
  ['fgColor/muted', 'bgColor/neutral-muted', 4.5, 'token and counter text', 'bgColor/default'],
  ['fgColor/link', 'bgColor/default', 4.5, 'link'],
  ['fgColor/link', 'bgColor/accent-muted', 4.5, 'branch name'],
  ['control/fgColor/placeholder', 'bgColor/default', 4.5, 'placeholder text'],
  ['fgColor/default', 'counter/bgColor/muted', 4.5, 'secondary counter', 'bgColor/default'],
  ['fgColor/onEmphasis', 'counter/bgColor/emphasis', 4.5, 'primary counter'],
  ['tooltip/fgColor', 'tooltip/bgColor', 4.5, 'tooltip'],
  ['fgColor/default', 'control/transparent/bgColor/selected', 4.5, 'current navigation item', 'bgColor/default'],

  ['button/default/fgColor/rest', 'button/default/bgColor/rest', 4.5, 'default button'],
  ['button/default/fgColor/rest', 'button/default/bgColor/hover', 4.5, 'default button, hovered'],
  ['button/default/fgColor/rest', 'button/default/bgColor/active', 4.5, 'default button, pressed'],
  ['button/primary/fgColor/rest', 'button/primary/bgColor/rest', 4.5, 'primary button'],
  ['button/primary/fgColor/rest', 'button/primary/bgColor/hover', 4.5, 'primary button, hovered'],
  ['button/primary/fgColor/rest', 'button/primary/bgColor/active', 4.5, 'primary button, pressed'],
  ['button/danger/fgColor/rest', 'button/danger/bgColor/rest', 4.5, 'danger button'],
  ['button/danger/fgColor/hover', 'button/danger/bgColor/hover', 4.5, 'danger button, hovered'],
  ['button/danger/fgColor/hover', 'button/danger/bgColor/active', 4.5, 'danger button, pressed'],
  ['button/invisible/fgColor/rest', 'button/invisible/bgColor/hover', 4.5, 'invisible button, hovered', 'bgColor/default'],
  ['button/inactive/fgColor', 'button/inactive/bgColor', 4.5, 'inactive button'],

  ...familyPairs(),

  ['control/borderColor/emphasis', 'bgColor/default', 3, 'checkbox and radio edge'],
  ['control/checked/bgColor/rest', 'bgColor/default', 3, 'checked control'],
  ['control/checked/fgColor/rest', 'control/checked/bgColor/rest', 3, 'checkmark'],
  ['control/borderColor/danger', 'bgColor/default', 3, 'invalid field edge'],
  ['fgColor/muted', 'bgColor/default', 3, 'icon'],
  ...EMPHASIS.map((token): ContrastPair => [token, 'progressBar/track/bgColor', 3, 'progress on its track']),
  ...DATA_TOKENS.map((token, index): ContrastPair => [token, 'bgColor/default', 3, 'data series ' + (index + 1)]),
] satisfies readonly ContrastPair[]);

export const CATEGORICAL_AUDIT = Object.freeze({
  /** Colours that must stay apart under every simulated deficiency. */
  tokens: Object.freeze([...EMPHASIS, ...DATA_TOKENS, DATA_OTHER.emphasis] as string[]),
  /** Ramps whose members always carry a label beside the swatch. */
  rampPrefixes: Object.freeze(['data/']),
  /** Families whose members are never compared with each other. */
  sameFamilyPrefixes: Object.freeze([] as string[]),
  waivers: Object.freeze([
    {
      label: 'Primer light: state colours carry an icon and a word',
      detail: 'StateLabel, Banner and Timeline always pair the colour with an Octicon and a label; readers who need separated hues use Primer\'s colorblind themes.',
      counts: 'adjacent',
      matches: (first: string, second: string) => EMPHASIS.includes(first as ColorToken) && EMPHASIS.includes(second as ColorToken),
      summary: (count: number) => count + ' state colour pair(s) meet on a screen, each with its icon and word',
    },
    {
      label: 'State colours beside chart series',
      detail: 'A chart series is named by its legend and a state by its word and icon; neither is told apart by hue alone.',
      counts: 'adjacent',
      matches: (first: string, second: string) => {
        const state = (token: string) => EMPHASIS.includes(token as ColorToken);
        const series = (token: string) => token.startsWith('data/');
        return (state(first) && series(second)) || (series(first) && state(second));
      },
      summary: (count: number) => count + ' state and series pair(s) meet on a screen, each named in words',
    },
  ] as CategoricalWaiver[]),
});

export const SURFACE_CONTRAST_AUDIT = Object.freeze({
  controls: Object.freeze([
    { subject: 'checkbox and radio edge', edge: 'control/borderColor/emphasis', outside: 'bgColor/default', interactive: true },
    { subject: 'checked control', edge: 'control/checked/borderColor/rest', outside: 'bgColor/default', interactive: true },
    { subject: 'invalid field', edge: 'control/borderColor/danger', outside: 'bgColor/default', interactive: true },
    {
      subject: 'text input edge', edge: 'control/borderColor/rest', outside: 'bgColor/default', interactive: true,
      waiver: 'Primer draws fields with the default border. A visible label always names the field, and the high-contrast theme darkens the edge.',
    },
    {
      subject: 'toggle switch at rest', edge: 'controlTrack/borderColor/rest', outside: 'bgColor/default', interactive: true,
      waiver: 'The switch always states On or Off in words beside the track.',
    },
    {
      subject: 'segmented control track', edge: 'controlTrack/bgColor/rest', outside: 'bgColor/default', interactive: true,
      waiver: 'The selected segment is also raised on a bordered knob and set in semibold.',
    },
    {
      subject: 'current underline tab', edge: 'underlineNav/borderColor/active', outside: 'bgColor/default', interactive: true,
      waiver: 'The current tab is also set in semibold and marked aria-current.',
    },
    { subject: 'box and table edge', edge: 'borderColor/default', outside: 'bgColor/default', interactive: false },
    { subject: 'row divider', edge: 'borderColor/muted', outside: 'bgColor/default', interactive: false },
  ] as const satisfies readonly SurfaceControl[]),
  /** Every ground a focus outline may meet, beside or under it. */
  focusGrounds: Object.freeze([
    'bgColor/default',
    'bgColor/muted',
    'page/header/bgColor',
    'button/default/bgColor/rest',
    'controlTrack/bgColor/rest',
  ] as const satisfies readonly ColorToken[]),
  /** [effect style, darkest layer alpha, ground]. */
  shadows: Object.freeze(ELEVATION.filter((style) => style.name.startsWith('shadow/'))
    .map((style) => [
      style.name,
      Math.max(...style.effects.map((effect) => ('color' in effect ? effect.color.a : 0))),
      'bgColor/default',
    ] as const)),
  /** [ink, ground] pairs used for body text, measured again under simulated vision. */
  textPairs: Object.freeze([
    ['fgColor/muted', 'bgColor/muted'],
    ['fgColor/attention', 'bgColor/attention-muted'],
    ['fgColor/severe', 'bgColor/severe-muted'],
    ['button/primary/fgColor/rest', 'button/primary/bgColor/rest'],
  ] as const),
  /** Disabled states use their own tokens; exempt from 1.4.3 but reported. */
  disabled: Object.freeze({
    pairs: Object.freeze([
      ['control/fgColor/disabled', 'control/bgColor/disabled'],
      ['button/primary/fgColor/disabled', 'button/primary/bgColor/disabled'],
      ['button/danger/fgColor/disabled', 'button/danger/bgColor/disabled'],
    ] as const),
  }),
});

/** State colours that may never be the only carrier of their meaning (WCAG 1.4.1). */
export const STATUS_COLOR_TOKENS: readonly string[] = Object.freeze([
  ...EMPHASIS.filter((token) => token !== 'bgColor/neutral-emphasis' && token !== 'bgColor/accent-emphasis'),
  'fgColor/success', 'fgColor/attention', 'fgColor/severe', 'fgColor/danger', 'fgColor/done',
]);

/** Token families whose co-presence on one artboard is recorded for CVD review. */
export const ADJACENCY_PREFIXES: readonly string[] = Object.freeze(['bgColor/', 'data/']);

/** What the generated CVD table simulates and which ratios sheets may quote. */
export const CVD_TABLE = Object.freeze({
  show: Object.freeze([...EMPHASIS]),
  quoted: Object.freeze([
    ['fgColor/default', 'bgColor/default'],
    ['fgColor/muted', 'bgColor/default'],
    ['fgColor/muted', 'bgColor/muted'],
    ['fgColor/link', 'bgColor/default'],
    ['focus/outline-color', 'bgColor/default'],
    ['focus/outline-color', 'button/default/bgColor/rest'],
    ['focus/outline-color', 'fgColor/onEmphasis'],
    ['control/borderColor/emphasis', 'bgColor/default'],
    ['control/borderColor/rest', 'bgColor/default'],
    ['underlineNav/borderColor/active', 'bgColor/default'],
    ['button/primary/fgColor/rest', 'button/primary/bgColor/rest'],
    ['bgColor/default', 'bgColor/muted'],
    ['bgColor/muted', 'control/bgColor/hover'],
    ['control/bgColor/hover', 'control/bgColor/active'],
    ['control/bgColor/active', 'controlTrack/bgColor/hover'],
    ['controlTrack/bgColor/hover', 'controlTrack/bgColor/active'],
    ['controlTrack/bgColor/active', 'borderColor/default'],
  ] as const),
});

/** Theme policy: Primer's neutral family, its surface ladder and its ink ramp. */
export const THEME_AUDIT = Object.freeze({
  /** Neutral tokens stay grey: OKLCH chroma ceiling and maximum hue drift. */
  neutralTokens: Object.freeze([
    'fgColor/default', 'fgColor/muted', 'fgColor/disabled',
    'bgColor/muted', 'bgColor/emphasis', 'bgColor/disabled',
    'borderColor/default', 'borderColor/emphasis',
    'control/bgColor/hover', 'control/bgColor/active',
    'controlTrack/bgColor/hover', 'controlTrack/bgColor/active',
  ] as const satisfies readonly ColorToken[]),
  maximumNeutralChroma: 0.03,
  maximumNeutralHueDrift: 12,
  ladders: Object.freeze([
    {
      tokens: Object.freeze([
        'bgColor/default', 'bgColor/muted', 'control/bgColor/hover', 'control/bgColor/active',
        'controlTrack/bgColor/hover', 'controlTrack/bgColor/active', 'borderColor/default',
      ] as const),
      minimumStep: 1.04,
    },
  ] satisfies readonly NeutralLadder[]),
  /** Ink ramp, darkest first; neighbours differ by at least this OKLCH lightness. */
  inkRamp: Object.freeze(['fgColor/default', 'fgColor/muted'] as const),
  minimumInkStep: 0.15,
  /** Every ink in the ramp must reach 4.5:1 on each of these grounds. */
  inkGrounds: Object.freeze([
    'bgColor/default', 'bgColor/muted', 'page/header/bgColor', 'control/bgColor/rest', 'control/bgColor/hover',
  ] as const),
  accent: Object.freeze({
    /** [ink, ground, purpose] that must reach 4.5:1. */
    readable: Object.freeze([
      ['button/primary/fgColor/rest', 'button/primary/bgColor/rest', 'label on the primary action'],
      ['fgColor/accent', 'bgColor/default', 'accent ink on the page'],
      ['fgColor/accent', 'bgColor/accent-muted', 'accent ink on the accent tint'],
      ['fgColor/default', 'bgColor/accent-muted', 'body text on the accent tint'],
    ] as const),
    /** [mark, ground, purpose] that must reach 3:1. */
    marks: Object.freeze([
      ['bgColor/accent-emphasis', 'bgColor/default', 'current item bar and selected page'],
      ['focus/outline-color', 'bgColor/default', 'focus outline on the page'],
      ['button/primary/bgColor/rest', 'bgColor/default', 'primary action on the page'],
    ] as const),
    /** [tint, surface, minimum ratio]: a tint must read against the page. */
    tints: Object.freeze([
      ['bgColor/accent-muted', 'bgColor/default', 1.1],
    ] as const),
  }),
});

export interface ColorScopeException {
  /** Exact name of the layers the exception covers. */
  readonly node: string;
  readonly reason: string;
  readonly scope: 'FRAME_FILL' | 'SHAPE_FILL' | 'STROKE_COLOR' | 'TEXT_FILL';
  readonly token: ColorToken;
}

/** Reviewed paints outside a token's Figma scope. They are reported, never hidden. */
export const COLOR_SCOPE_EXCEPTIONS: readonly ColorScopeException[] = Object.freeze([
  {
    token: 'fgColor/onEmphasis', scope: 'STROKE_COLOR', node: FOCUS.bandName,
    reason: 'Primer paints the focus band as an inset box-shadow in fgColor-onEmphasis; a Figma layer draws that band as a stroke.',
  },
]);

interface ExceptionNode {
  readonly cornerRadius?: number;
  getPluginData(key: string): string;
  readonly height: number;
  readonly name: string;
}

/* Primer nests the toggle knob inside its track: 6 px less the 2 px between them. */
const toggleKnob = function (node: ExceptionNode): boolean {
  return node.name === 'toggle-knob' && node.cornerRadius === 4 && node.height <= 28;
};

/** Reviewed corner radii outside the scale, by workspace page. */
export const RADIUS_EXCEPTIONS = Object.freeze([
  Object.freeze({ label: 'toggle knobs nested in their track', page: 'screens', matches: toggleKnob }),
  Object.freeze({ label: 'toggle knobs nested in their track', page: 'system', matches: toggleKnob }),
] as const);

/** Nodes that may stroke with the focus colour outside an outline: the Colour
 *  sheet's chip that shows the token itself. */
export const FOCUS_STROKE_EXEMPTIONS = Object.freeze([
  (node: ExceptionNode) => node.name === 'chip' && node.getPluginData('spec.swatch.token') === FOCUS.token,
]);

export const DESIGN_SYSTEM_AUDIT = Object.freeze({
  adjacencyPrefixes: ADJACENCY_PREFIXES,
  categorical: CATEGORICAL_AUDIT,
  colorOwnership: COLOR_TOKEN_OWNERSHIP,
  colorScopeExceptions: COLOR_SCOPE_EXCEPTIONS,
  colorScopes: COLOR_SCOPES,
  colorSharingDecisions: COLOR_SHARING_DECISIONS,
  colors: COLORS,
  contrastPairs: CONTRAST_PAIRS,
  cvd: CVD_TABLE,
  focus: FOCUS,
  iconSizes: ICON_SIZES,
  pageGround: 'bgColor/default' satisfies ColorToken,
  radiusScale: RADIUS_SCALE,
  spacingScale: SPACING_SCALE,
  statusColorTokens: STATUS_COLOR_TOKENS,
  surfaceContrast: SURFACE_CONTRAST_AUDIT,
  theme: THEME_AUDIT,
});
