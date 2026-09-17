/* The Primer tokens this design system installs.
 *
 * Primer Primitives publishes far more tokens than one application needs. The
 * functional colour families are installed whole (minus GitHub's marketing
 * families) because they are the theme's public vocabulary. Component tokens,
 * sizes and shadows are installed only where a kit component consumes them.
 * The generator fails on a name Primer does not publish. */

const statusFamilies = function (prefix: string): string[] {
  return ['neutral', 'accent', 'success', 'open', 'attention', 'severe', 'danger', 'closed', 'draft', 'done']
    .flatMap((family) => [prefix + family + '-muted', prefix + family + '-emphasis']);
};

export const COLOR_TOKENS: readonly string[] = Object.freeze([
  // Foreground
  'fgColor/default', 'fgColor/muted', 'fgColor/onEmphasis', 'fgColor/onInverse', 'fgColor/disabled',
  'fgColor/link', 'fgColor/neutral', 'fgColor/accent', 'fgColor/success', 'fgColor/open',
  'fgColor/attention', 'fgColor/severe', 'fgColor/danger', 'fgColor/closed', 'fgColor/draft', 'fgColor/done',

  // Background
  'bgColor/default', 'bgColor/muted', 'bgColor/inset', 'bgColor/emphasis', 'bgColor/inverse', 'bgColor/disabled',
  ...statusFamilies('bgColor/'),

  // Border and focus
  'borderColor/default', 'borderColor/muted', 'borderColor/emphasis', 'borderColor/disabled', 'borderColor/translucent',
  ...statusFamilies('borderColor/'),
  'focus/outline-color',

  // Controls
  'control/bgColor/rest', 'control/bgColor/hover', 'control/bgColor/active', 'control/bgColor/disabled',
  'control/fgColor/rest', 'control/fgColor/placeholder', 'control/fgColor/disabled',
  'control/borderColor/rest', 'control/borderColor/emphasis', 'control/borderColor/disabled',
  'control/borderColor/success', 'control/borderColor/danger',
  'control/iconColor/rest',
  'control/transparent/bgColor/hover', 'control/transparent/bgColor/active', 'control/transparent/bgColor/selected',
  'control/danger/fgColor/rest', 'control/danger/bgColor/hover',
  'control/checked/bgColor/rest', 'control/checked/bgColor/hover', 'control/checked/bgColor/active',
  'control/checked/bgColor/disabled',
  'control/checked/fgColor/rest', 'control/checked/fgColor/disabled',
  'control/checked/borderColor/rest', 'control/checked/borderColor/disabled',
  'controlTrack/bgColor/rest', 'controlTrack/bgColor/hover', 'controlTrack/bgColor/active',
  'controlTrack/bgColor/disabled',
  'controlTrack/fgColor/rest', 'controlTrack/fgColor/disabled',
  'controlTrack/borderColor/rest', 'controlTrack/borderColor/disabled',
  'controlKnob/bgColor/rest', 'controlKnob/bgColor/disabled', 'controlKnob/bgColor/checked',
  'controlKnob/borderColor/rest', 'controlKnob/borderColor/disabled', 'controlKnob/borderColor/checked',

  // Buttons
  'button/default/fgColor/rest', 'button/default/fgColor/disabled',
  'button/default/bgColor/rest', 'button/default/bgColor/hover', 'button/default/bgColor/active',
  'button/default/bgColor/selected',
  'button/default/borderColor/rest', 'button/default/borderColor/disabled',
  'button/primary/fgColor/rest', 'button/primary/fgColor/disabled',
  'button/primary/bgColor/rest', 'button/primary/bgColor/hover', 'button/primary/bgColor/active',
  'button/primary/bgColor/disabled',
  'button/primary/borderColor/rest', 'button/primary/borderColor/disabled',
  'button/invisible/fgColor/rest', 'button/invisible/fgColor/disabled', 'button/invisible/iconColor/rest',
  'button/invisible/bgColor/hover', 'button/invisible/bgColor/active',
  'button/danger/fgColor/rest', 'button/danger/fgColor/hover', 'button/danger/fgColor/disabled',
  'button/danger/iconColor/rest', 'button/danger/iconColor/hover',
  'button/danger/bgColor/rest', 'button/danger/bgColor/hover', 'button/danger/bgColor/active',
  'button/danger/bgColor/disabled',
  'button/danger/borderColor/rest', 'button/danger/borderColor/hover',
  'button/inactive/fgColor', 'button/inactive/bgColor',
  'buttonCounter/default/bgColor/rest', 'buttonCounter/primary/bgColor/rest',

  // Display components
  'counter/bgColor/muted', 'counter/bgColor/emphasis',
  'avatar/bgColor', 'avatar/borderColor',
  'overlay/bgColor', 'overlay/borderColor', 'overlay/backdrop/bgColor',
  'tooltip/bgColor', 'tooltip/fgColor',
  'underlineNav/borderColor/active', 'underlineNav/borderColor/hover', 'underlineNav/iconColor/rest',
  'progressBar/track/bgColor',
  'timelineBadge/bgColor',
  'skeletonLoader/bgColor',
  'page/header/bgColor',

  // Data visualisation
  ...['blue', 'green', 'orange', 'purple', 'gray'].flatMap((hue) => [
    'data/' + hue + '/color/emphasis',
    'data/' + hue + '/color/muted',
  ]),
]);

/* Words used to describe component tokens, which Primer leaves undescribed. */
export const DESCRIPTION_WORDS: Readonly<Record<string, string>> = Object.freeze({
  bgColor: 'background',
  borderColor: 'border',
  fgColor: 'text',
  iconColor: 'icon',
  color: 'fill',
  rest: 'at rest',
  hover: 'when hovered',
  active: 'when pressed',
  disabled: 'when disabled',
  selected: 'when selected',
  checked: 'when checked',
  placeholder: 'as placeholder',
  success: 'for success',
  danger: 'for danger',
  emphasis: 'emphasis',
  muted: 'muted',
});

export const SIZE_TOKENS: readonly string[] = Object.freeze([
  ...[2, 4, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 64, 80, 96, 112, 128].map((size) => 'base/size/' + size),
  ...['xsmall', 'small', 'medium', 'large', 'xlarge'].map((size) => 'control/' + size + '/size'),
  'control/small/paddingInline/condensed', 'control/medium/paddingInline/condensed',
  'control/medium/paddingInline/normal', 'control/large/paddingInline/spacious',
  'control/small/gap', 'control/medium/gap', 'control/large/gap',
  'stack/padding/condensed', 'stack/padding/normal', 'stack/padding/spacious',
  'stack/gap/condensed', 'stack/gap/normal', 'stack/gap/spacious',
  'overlay/width/xsmall', 'overlay/width/small', 'overlay/width/medium', 'overlay/width/large',
  'overlay/padding/condensed', 'overlay/padding/normal',
  'overlay/borderRadius',
  'borderRadius/small', 'borderRadius/medium', 'borderRadius/large', 'borderRadius/full', 'borderRadius/default',
]);

/** Primer shadows installed as effect styles, by token path. */
export const SHADOW_TOKENS: readonly string[] = Object.freeze([
  'shadow/inset',
  'shadow/resting/xsmall',
  'shadow/resting/small',
  'shadow/resting/medium',
  'shadow/floating/small',
  'shadow/floating/medium',
  'shadow/floating/large',
  'button/default/shadow/resting',
  'button/primary/shadow/selected',
]);

/** Text roles read from Primer's functional typography, by CSS variable stem. */
export const TEXT_ROLES: ReadonlyArray<readonly [role: string, stem: string, family: 'sans' | 'mono']> = Object.freeze([
  ['display', 'text-display', 'sans'],
  ['title/large', 'text-title-{}-large', 'sans'],
  ['title/medium', 'text-title-{}-medium', 'sans'],
  ['title/small', 'text-title-{}-small', 'sans'],
  ['subtitle', 'text-subtitle', 'sans'],
  ['body/large', 'text-body-{}-large', 'sans'],
  ['body/medium', 'text-body-{}-medium', 'sans'],
  ['body/small', 'text-body-{}-small', 'sans'],
  ['caption', 'text-caption', 'sans'],
  ['code/block', 'text-codeBlock', 'mono'],
] as const);

export const MOTION_DURATIONS: readonly string[] = Object.freeze(['micro', 'short', 'medium', 'long']);
export const MOTION_EASINGS: readonly string[] = Object.freeze(['enter', 'exit', 'hover', 'move', 'linear']);
export const MOTION_TRANSITIONS: readonly string[] = Object.freeze(['enter', 'exit', 'hover', 'stateChange']);
