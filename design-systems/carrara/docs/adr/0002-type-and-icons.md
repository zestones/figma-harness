# ADR 0002: Inter, JetBrains Mono and Heroicons

- Status: Accepted

## Context

Figures must line up and stay legible at small sizes, identifiers must be easy to copy and compare, and icons must look like one family on 16 and 20 px grids. The harness measures text with the same font files Figma uses, so the fonts must be installable from npm, and the icons must be data the audits can check.

## Decision

- **Inter for the interface.** Twelve text styles in Regular, Medium and SemiBold, from `display/lg` (36/44, the amount at the top of a payment) to `label/overline` (11/16). Weights are part of a style's name, so no page sets a weight by hand.
- **JetBrains Mono for identifiers.** `mono/sm` (12/18) sets identifiers in tables and details, such as payment IDs and tax numbers, whose characters must not be confused.
- **Fonts from npm.** `design-system.json` names `@fontsource/inter` and `@fontsource/jetbrains-mono`, pinned in `package.json`. The harness measures and renders text with those files; the plugin asks Figma for the families by name. No font file is copied into the repository.
- **Heroicons, solid, generated.** `generators/icons/catalog.ts` lists 63 icons by their Heroicons name. `generators/icons/icons.ts` copies their solid paths on the 16 and 20 px grids from the pinned `heroicons` package into `src/primitives/icons.generated.ts`, and fails when a glyph is missing, uses strokes, or is not drawn on its grid. `pnpm check:generated` fails when the module no longer matches the package.
- **Icons are filled and bound.** Every vector of a glyph is filled with one colour role and has no stroke, which the icon audit checks. An icon without a word beside it, such as an icon button, carries an accessible name.

## Consequences

Updating an icon set or a font is a dependency bump followed by `pnpm generate` and the audits. The MIT notice for Heroicons ships in the package's `NOTICE.md`.

## Rejected alternatives

- Outline icons: Heroicons draws them only on its 24 px grid, and the icon audit expects filled glyphs.
- Platform fonts: each reviewer would get different text metrics.
