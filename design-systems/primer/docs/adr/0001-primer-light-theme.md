# ADR 0001: Primer light theme

- Status: Accepted

## Context

The harness needs a design system that is complete enough for real application screens, credible to reviewers, and published as data, so its values are generated rather than copied by hand. A home-grown palette drifts, and it has no outside reference to check it against.

## Decision

The design system is GitHub's open-source [Primer](https://primer.style), in its light theme only.

- **Pinned sources.** Tokens come from `@primer/primitives` 11.10.0 and icons from `@primer/octicons` 19.37.0. Components follow the CSS of Primer React 38 and are rebuilt by the kit as Figma layers, because a Figma file has no React runtime.
- **Generated, never copied.** `generators/tokens/tokens.ts` writes `src/foundations/primer.generated.ts` from Primer's Figma export and its documentation JSON (type, shadows, motion). `generators/icons/icons.ts` writes `src/primitives/icons.generated.ts` from the Octicons outlines on their 12, 16 and 24 px grids. `pnpm verify` runs both in `--check` mode and fails when a generated file no longer matches its package.
- **An explicit subset.** `generators/tokens/catalog.ts` and `generators/icons/catalog.ts` list what is installed: every functional colour family (GitHub's marketing families excepted), and component tokens, sizes and shadows only where a kit component uses them. The generator fails on a name Primer does not publish.
- **Primer's names and values.** Nothing is re-tuned. A value that fails an audit gets a reviewed waiver ([ADR 0002](./0002-colour-roles.md)) or is not used for that purpose.
- **Figma resources.** Colours and sizes are installed as variables in `Primer / Color (light)` and `Primer / Size`, with Primer's descriptions and Figma scopes. Translucent colours keep their alpha (`#RRGGBBAA`). Text roles become text styles, and shadows become effect styles named by their token path.
- **Noto Sans.** Primer's font stack resolves differently on every platform, and its first member, Mona Sans, is GitHub's brand typeface. The kit sets text in Noto Sans, a member of the same stack that Figma offers everywhere, and code in Noto Sans Mono (Primer's monospace stack is platform fonts only). `design-system.json` lists both Fontsource packages, so the harness measures text with the same fonts. The weights Primer's components set on a role become named variants (`body/medium-600`, `label/small`), so no page sets a weight by hand.
- **No GitHub identity.** The example application is fictional. It uses no GitHub logo, product name or brand typeface, and Primer's and Octicons' MIT notices ship in the package's `NOTICE.md`.

## Consequences

Updating Primer is a dependency bump followed by `pnpm generate`, which regenerates the tokens and the icons, then the audits, whose findings show what the new values changed. A token the kit needs is added to the catalog, never typed into a foundation. Dark and high-contrast themes are out of scope: the audits and waivers describe the light theme only.

## Rejected alternatives

- Keeping a custom palette and type scale: every value would need its own justification and its own maintenance.
- Copying Primer's values into hand-written modules: they would drift silently from the pinned release.
- Installing every Primer token: most would be unused, and every installed colour enlarges the contrast and colour-vision checks.
- Mona Sans or the platform UI font: the first is GitHub's brand, and the second would give each reviewer different text metrics.
