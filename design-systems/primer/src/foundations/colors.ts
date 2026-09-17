/* Colour tokens: Primer's light theme, projected from @primer/primitives by
 * generators/tokens/tokens.ts. Names and values are Primer's; nothing is
 * re-tuned here. Decision: design-systems/primer/docs/adr/0001-primer-light-theme.md */

import { PRIMER_COLORS, PRIMER_COLOR_SHARING } from './primer.generated.ts';

/** Every installed colour token, by name. */
export type ColorToken = typeof PRIMER_COLORS[number][0];

export type ColorSharingPolicy = 'independent-semantics' | 'linked-aliases';

export interface ColorSharingDecision {
  readonly policy: ColorSharingPolicy;
  readonly rationale: string;
}

/** [name, #RRGGBB or #RRGGBBAA, description]. Mutable so a harness can try overrides. */
export const COLORS: Array<[string, string, string]> = PRIMER_COLORS.map(
  ([name, hex, description]): [string, string, string] => [name, hex, description],
);

/** The Primer source each token resolves to; tokens that share one share a value. */
export const COLOR_TOKEN_OWNERSHIP: Readonly<Record<string, string>> = Object.freeze(
  Object.fromEntries(PRIMER_COLORS.map(([name, , , source]) => [name, source])),
);

/* Primer, not this kit, decides which roles share a value: a role that aliases
 * another follows it, and roles that reference the same scale step may part in
 * another theme. The audit rejects a shared value without such a decision. */
export const COLOR_SHARING_DECISIONS: Readonly<Record<string, ColorSharingDecision>> = Object.freeze(
  Object.fromEntries(PRIMER_COLOR_SHARING.map(([source, policy, rationale]) => [
    source,
    Object.freeze({ policy, rationale }),
  ])),
);

export const isColorToken = function (name: string): name is ColorToken {
  return PRIMER_COLORS.some(([token]) => token === name);
};

export type ColorScope = typeof PRIMER_COLORS[number][4][number];

/** Where Figma lets each token be painted, as Primer declares it. */
export const COLOR_SCOPES: Readonly<Record<string, readonly ColorScope[]>> = Object.freeze(
  Object.fromEntries(PRIMER_COLORS.map(([name, , , , scopes]) => [name, scopes])),
);
