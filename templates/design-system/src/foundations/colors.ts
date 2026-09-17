/* Colour tokens: a small palette and the roles components paint with.
 * Re-theme by changing the palette; add a role only when a component needs
 * one, and give it the Figma scopes it may be painted with. */

export type ColorScope = 'FRAME_FILL' | 'SHAPE_FILL' | 'STROKE_COLOR' | 'TEXT_FILL';

/** Raw colours. A palette entry used by several roles is a shared value. */
export const PALETTE = Object.freeze({
  'white': '#FFFFFF',
  'slate/50': '#F6F7F9',
  'slate/100': '#EDEFF3',
  'slate/300': '#D3D8DF',
  'slate/400': '#8C94A2',
  'slate/500': '#7C8594',
  'slate/600': '#5A6373',
  'slate/900': '#1C2230',
  'blue/50': '#EAF0FC',
  'blue/600': '#2D5BD0',
  'blue/650': '#2651C4',
  'blue/700': '#2349AE',
  'teal/50': '#EDF7F5',
  'teal/700': '#0D7466',
  'amber/50': '#FBF0DC',
  'amber/700': '#8A5A0B',
  'crimson/50': '#FDF0F4',
  'crimson/600': '#C2285A',
});

export type PaletteName = keyof typeof PALETTE;

interface RoleSpec {
  readonly description: string;
  readonly palette: PaletteName;
  readonly scopes: readonly ColorScope[];
}

const INK: readonly ColorScope[] = Object.freeze(['SHAPE_FILL', 'TEXT_FILL']);
const SURFACE: readonly ColorScope[] = Object.freeze(['FRAME_FILL', 'SHAPE_FILL']);
const EDGE: readonly ColorScope[] = Object.freeze(['STROKE_COLOR']);

const ROLES = {
  'surface/page': { palette: 'white', scopes: SURFACE, description: 'The page and default surfaces.' },
  'surface/subtle': { palette: 'slate/50', scopes: SURFACE, description: 'Headers and quiet areas.' },
  'surface/disabled': { palette: 'slate/100', scopes: SURFACE, description: 'The fill of an unavailable control.' },
  'text/default': { palette: 'slate/900', scopes: INK, description: 'Body text and titles.' },
  'text/muted': { palette: 'slate/600', scopes: INK, description: 'Secondary text.' },
  'text/disabled': { palette: 'slate/400', scopes: INK, description: 'Text of an unavailable control.' },
  'text/on-accent': { palette: 'white', scopes: INK, description: 'Text on an accent fill.' },
  'border/default': { palette: 'slate/300', scopes: EDGE, description: 'Card and divider edges.' },
  'border/control': { palette: 'slate/500', scopes: EDGE, description: 'Control edges, at least 3:1 on the page.' },
  'accent/default': { palette: 'blue/600', scopes: SURFACE, description: 'The primary action.' },
  'accent/hover': { palette: 'blue/700', scopes: SURFACE, description: 'The primary action, hovered.' },
  'accent/text': { palette: 'blue/650', scopes: INK, description: 'Links and selected text.' },
  'accent/subtle': { palette: 'blue/50', scopes: SURFACE, description: 'Selected rows and quiet emphasis.' },
  'focus/ring': { palette: 'blue/600', scopes: EDGE, description: 'The focus outline.' },
  'status/neutral': { palette: 'slate/600', scopes: INK, description: 'Neutral state text.' },
  'status/neutral-subtle': { palette: 'slate/100', scopes: SURFACE, description: 'Neutral state fill.' },
  'status/positive': { palette: 'teal/700', scopes: INK, description: 'Positive state text.' },
  'status/positive-subtle': { palette: 'teal/50', scopes: SURFACE, description: 'Positive state fill.' },
  'status/warning': { palette: 'amber/700', scopes: INK, description: 'Warning state text.' },
  'status/warning-subtle': { palette: 'amber/50', scopes: SURFACE, description: 'Warning state fill.' },
  'status/critical': { palette: 'crimson/600', scopes: INK, description: 'Critical state text.' },
  'status/critical-subtle': { palette: 'crimson/50', scopes: SURFACE, description: 'Critical state fill.' },
} as const satisfies Record<string, RoleSpec>;

export type ColorToken = keyof typeof ROLES;

const NAMES = Object.keys(ROLES) as ColorToken[];

/** [name, #RRGGBB, description]. Mutable so a harness can preview overrides. */
export const COLORS: Array<[string, string, string]> = NAMES.map(
  (name): [string, string, string] => [name, PALETTE[ROLES[name].palette], ROLES[name].description],
);

/** The palette entry each role resolves to. */
export const COLOR_TOKEN_OWNERSHIP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(NAMES.map((name) => [name, 'palette/' + ROLES[name].palette])),
);

/* Roles that share a palette entry keep their own meaning: either may move to
   another entry without the other. */
export const COLOR_SHARING_DECISIONS = Object.freeze(Object.fromEntries(
  (Object.keys(PALETTE) as PaletteName[])
    .map((entry) => [entry, NAMES.filter((name) => ROLES[name].palette === entry)] as const)
    .filter(([, users]) => users.length > 1)
    .map(([entry, users]) => ['palette/' + entry, Object.freeze({
      policy: 'independent-semantics' as const,
      rationale: users.join(' and ') + ' share ' + entry + '; each may change on its own.',
    })]),
));

/** Where Figma lets each token be painted. */
export const COLOR_SCOPES: Readonly<Record<string, readonly ColorScope[]>> = Object.freeze(
  Object.fromEntries(NAMES.map((name) => [name, ROLES[name].scopes])),
);
