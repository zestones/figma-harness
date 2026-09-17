/* Colour tokens: Carrara's palette and the roles components paint with.
 * Cool greys, an indigo accent, three state colours that stay apart under
 * simulated colour-vision deficiency, and an inverse set for the dark sidebar
 * (ADR 0001). Add a role only when a component needs one, and give it the
 * Figma scopes it may be painted with. */

export type ColorScope = 'FRAME_FILL' | 'SHAPE_FILL' | 'STROKE_COLOR' | 'TEXT_FILL';

/** Raw colours. A palette entry used by several roles is a shared value. */
export const PALETTE = Object.freeze({
  'white': '#FFFFFF',
  'gray/25': '#F9FAFB',
  'gray/50': '#F7F8FA',
  'gray/100': '#F2F4F7',
  'gray/150': '#EAECF1',
  'gray/200': '#E3E6EC',
  'gray/400': '#9EA5B0',
  'gray/500': '#868C99',
  'gray/600': '#616977',
  'gray/700': '#4A5362',
  'gray/900': '#111825',
  'ink/950': '#0B0F18',
  'ink/950-scrim': '#0B0F1880',
  'ink/850': '#1F2530',
  'ink/800': '#1C2128',
  'ink/500': '#8E949F',
  'ink/200': '#D2D6DE',
  'indigo/50': '#EEF0FF',
  'indigo/100': '#EAEDFF',
  'indigo/500': '#6366F1',
  'indigo/600': '#4F46E5',
  'indigo/700': '#4338CA',
  'green/50': '#EDFBF1',
  'green/700': '#156F41',
  'amber/50': '#FFF5E7',
  'amber/700': '#835A00',
  'red/50': '#FFF4F3',
  'red/600': '#C1253B',
  'red/700': '#A01F33',
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
const MARK: readonly ColorScope[] = Object.freeze(['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR']);
const LINE: readonly ColorScope[] = Object.freeze(['SHAPE_FILL', 'STROKE_COLOR']);
const INK_EDGE: readonly ColorScope[] = Object.freeze(['SHAPE_FILL', 'STROKE_COLOR', 'TEXT_FILL']);

const ROLES = {
  'bg/canvas': { palette: 'gray/50', scopes: SURFACE, description: 'The page behind cards and tables.' },
  'bg/surface': { palette: 'white', scopes: SURFACE, description: 'Cards, tables, inputs and dialogs.' },
  'bg/subtle': { palette: 'gray/100', scopes: SURFACE, description: 'Table headers, hovered rows and quiet areas.' },
  'bg/muted': { palette: 'gray/150', scopes: SURFACE, description: 'Tracks, selected segments and placeholders.' },
  'bg/overlay': { palette: 'ink/950-scrim', scopes: SURFACE, description: 'The scrim behind a dialog.' },
  'bg/inverse': { palette: 'ink/950', scopes: SURFACE, description: 'The sidebar.' },
  'bg/inverse-raised': { palette: 'ink/850', scopes: SURFACE, description: 'The current item and chips in the sidebar.' },
  'text/primary': { palette: 'gray/900', scopes: INK, description: 'Titles, values and body text.' },
  'text/secondary': { palette: 'gray/700', scopes: INK, description: 'Labels and supporting text.' },
  'text/tertiary': { palette: 'gray/600', scopes: INK, description: 'Captions, axes and metadata.' },
  'text/disabled': { palette: 'gray/400', scopes: INK, description: 'Text of an unavailable control.' },
  'text/on-accent': { palette: 'white', scopes: INK, description: 'Text on an accent or danger fill.' },
  'text/inverse': { palette: 'ink/200', scopes: INK, description: 'Text and icons in the sidebar.' },
  'text/inverse-muted': { palette: 'ink/500', scopes: INK, description: 'Section labels in the sidebar.' },
  'text/inverse-strong': { palette: 'white', scopes: INK, description: 'The current item in the sidebar.' },
  'border/default': { palette: 'gray/200', scopes: EDGE, description: 'Card, table and divider edges.' },
  'border/control': { palette: 'gray/500', scopes: EDGE, description: 'Edges of buttons and fields, at least 3:1.' },
  'border/inverse': { palette: 'ink/800', scopes: EDGE, description: 'Dividers in the sidebar.' },
  'control/track': { palette: 'gray/500', scopes: SURFACE, description: 'An unselected switch track, at least 3:1.' },
  'accent/solid': { palette: 'indigo/600', scopes: MARK, description: 'Primary actions, selection and current tabs.' },
  'accent/solid-hover': { palette: 'indigo/700', scopes: SURFACE, description: 'A primary action, hovered.' },
  'accent/text': { palette: 'indigo/700', scopes: INK, description: 'Links and accent labels.' },
  'accent/subtle': { palette: 'indigo/50', scopes: SURFACE, description: 'Selected rows, avatars and quiet emphasis.' },
  'focus/ring': { palette: 'indigo/500', scopes: EDGE, description: 'The focus outline, on light and dark grounds.' },
  'status/positive': { palette: 'green/700', scopes: INK, description: 'Succeeded, paid and rising.' },
  'status/positive-subtle': { palette: 'green/50', scopes: SURFACE, description: 'The ground of a positive badge.' },
  'status/warning': { palette: 'amber/700', scopes: INK, description: 'Pending, at risk and needing a response.' },
  'status/warning-subtle': { palette: 'amber/50', scopes: SURFACE, description: 'The ground of a warning badge.' },
  'status/critical': { palette: 'red/600', scopes: INK_EDGE, description: 'Failed, disputed and falling; the edge of a field in error.' },
  'status/critical-subtle': { palette: 'red/50', scopes: SURFACE, description: 'The ground of a critical badge.' },
  'status/critical-solid': { palette: 'red/600', scopes: SURFACE, description: 'Destructive actions.' },
  'status/critical-solid-hover': { palette: 'red/700', scopes: SURFACE, description: 'A destructive action, hovered.' },
  'status/neutral': { palette: 'gray/700', scopes: INK, description: 'Drafts, refunds and other settled states.' },
  'status/neutral-subtle': { palette: 'gray/100', scopes: SURFACE, description: 'The ground of a neutral badge.' },
  'chart/primary': { palette: 'indigo/600', scopes: LINE, description: 'The main series of a chart.' },
  'chart/primary-area': { palette: 'indigo/100', scopes: LINE, description: 'The area under the main series.' },
  'chart/secondary': { palette: 'gray/500', scopes: LINE, description: 'A comparison series, drawn dashed.' },
  'chart/grid': { palette: 'gray/150', scopes: LINE, description: 'Gridlines and bar tracks.' },
} as const satisfies Record<string, RoleSpec>;

export type ColorToken = keyof typeof ROLES;

const NAMES = Object.keys(ROLES) as ColorToken[];

/** [name, #RRGGBB(AA), description]. Mutable so a harness can preview overrides. */
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
