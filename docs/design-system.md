# Design system guide

The design system is [Primer](https://primer.style)'s light theme, generated from pinned packages and rebuilt as Figma layers ([ADR 0001](adr/0001-primer-light-theme.md)). This guide says where each part lives and how to change it. The `02 · Design system` page in Figma shows the same decisions on 21 sheets.

## Where things live

| Concern | Source | Sheets |
| --- | --- | --- |
| Which Primer tokens are installed | `plugin/tools/tokens/catalog.ts` → `kit/foundations/primer.generated.ts` | — |
| Colour tokens, their sources and Figma scopes | `plugin/src/kit/foundations/colors.ts` | A1–A6 |
| State families and data series | `plugin/src/kit/foundations/semantics.ts` | A2, A6 |
| Text styles (Noto Sans) | `plugin/src/kit/foundations/typography.ts` | F1 Typography |
| Sizes, spacing, radii, shell | `plugin/src/kit/foundations/dimensions.ts` | F2 Size and space, F4 Layout |
| Shadows | `plugin/src/kit/foundations/elevation.ts` | F3 Shadows |
| Motion | `plugin/src/kit/foundations/motion.ts` | F5 Motion |
| Octicons | `plugin/tools/icons/catalog.ts` → `kit/primitives/icons.generated.ts` | F6 Octicons |
| Focus outlines | `plugin/src/kit/foundations/focus.ts` | F7 Accessibility, C1–C4 |
| Audit policy and waivers | `plugin/src/kit/foundations/audit.ts` | F7 |
| Components | `plugin/src/kit/components/` | C1–C7 |
| App header, PageLayout, PageHeader, DataTable | `plugin/src/kit/patterns/` | C8 Page patterns |

Designs use all of it through `plugin/src/kit/public.ts`. Anything not exported there is not part of the authoring API.

## At a glance

- **Colour.** 170 of Primer's light tokens: neutral ink, surfaces and borders, ten state families, component tokens, and five data hues. Translucent tokens keep their alpha ([ADR 0002](adr/0002-colour-roles.md)).
- **Type.** Primer's text roles in Noto Sans, code in Noto Sans Mono, plus the weights Primer's components set on a role (`body/medium-600`, `label/small`).
- **Size.** Primer's base scale for gaps and paddings, control heights from 24 to 48 px, stack and overlay spacing, and radii of 3, 6 and 12 px or fully rounded ([ADR 0007](adr/0007-dimension-variables-and-native-bindings.md)).
- **Shell.** A 64 px global header over a PageLayout with 24 px padding, a 296 px pane, and content capped at 1280 px.
- **Surfaces.** White page, bordered boxes, and shadows only on controls and dialogs ([ADR 0004](adr/0004-surfaces-and-containment.md)).
- **Motion.** Primer's `enter`, `exit`, `hover` and `stateChange` transitions with their exact curves ([ADR 0005](adr/0005-motion-and-prototype-proof.md)).
- **Focus.** Primer's 2 px outline, placed per component ([ADR 0003](adr/0003-focus-outlines.md)).

## Updating Primer

1. Pin the new version of `@primer/primitives` or `@primer/octicons` in `plugin/package.json` and run `npm install`.
2. Regenerate, rebuild, and refresh the colour-vision table:

   ```bash
   cd plugin
   npm run tokens:generate
   npm run icons:generate
   npm run build
   npm run cvd:generate
   npm run build
   ```

3. Run `npm run verify` (or its steps through `npm run isolated -- <task>`). A renamed or removed token fails the generator; a changed value shows up in the audits and in the design signature, which a person reviews in Figma before accepting it.
4. Update the pinned versions named in ADR 0001, and `THIRD_PARTY_NOTICES.md` if a notice changed.

## Adding a token or an icon

Add its Primer name to `plugin/tools/tokens/catalog.ts` or `plugin/tools/icons/catalog.ts` and regenerate. Never type a Primer value into a foundation. A new colour also needs a swatch row on one of the A sheets (the `color-inventory` rule) and, if it carries text or a control edge, a pair in `audit.ts`.

To preview other colours without editing source, render with in-memory overrides:

```bash
FIGMA_HARNESS_COLOR_OVERRIDES='{"fgColor/accent":"#8250DF"}' npm run render:svg -- "Design system" renders/preview
npm run render:png -- renders/preview 0.5
```

## Adding a component

1. Write the brief from `docs/ia/templates/DESIGN_SYSTEM_CHANGE.md`, with at least two consumers.
2. Follow the Primer React component's CSS: its tokens, sizes, radii, focus placement and states.
3. Implement it in the lowest layer that can own it, with tokens and `dim()` references only, and export it from `kit/public.ts`.
4. Add a specimen to the relevant sheet under `designs/sheets/`, and register its node-name pattern in `kit/components/inventory.ts`.
5. Add stress cases when its layout depends on size or content, and focused tests for its pure logic.
6. Run the full gate. The design signature changes, so a person reviews the result in Figma before the baseline is accepted.
