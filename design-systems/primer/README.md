# Primer design system

`@figma-harness/primer` is [Primer](https://primer.style)'s light theme as a Figma design system: tokens and Octicons generated from pinned packages, 33 Primer React components rebuilt as Figma layers, and the 21 sheets of the `02 · Design system` page ([ADR 0001](docs/adr/0001-primer-light-theme.md)).

## Layout

| Path | Owns | Sheets |
| --- | --- | --- |
| `generators/tokens/`, `generators/icons/` | Which Primer tokens and Octicons are installed, and the generators | — |
| `src/foundations/primer.generated.ts`, `src/primitives/icons.generated.ts` | Generated data; never edited by hand | — |
| `src/foundations/colors.ts`, `semantics.ts` | Colour tokens, their sources and scopes, state families, data series | A1–A6 |
| `src/foundations/typography.ts` | Text styles in Noto Sans | F1 |
| `src/foundations/dimensions.ts` | Sizes, spacing, radii, shell | F2, F4 |
| `src/foundations/elevation.ts`, `motion.ts`, `focus.ts` | Shadows, motion, focus outlines | F3, F5, F7 |
| `src/foundations/audit.ts` | The audit policy, waivers and reviewed exceptions | F7 |
| `src/primitives/`, `src/components/`, `src/patterns/` | Text, icons, charts; components; app header, PageLayout, PageHeader, DataTable, and `starter`, the vocabulary the app template is written in | C1–C8 |
| `src/sheets/` | The Design system page and its page chrome | all |
| `src/index.ts` | The authoring vocabulary apps import | — |
| `src/system.ts` | `designSystem`, the definition the plugin builds | — |
| `design-system.json` | What the harness needs without importing code: fonts and the generated colour-vision table | — |
| `docs/adr/` | [Primer's decisions](docs/adr/README.md) | — |

Apps import only `@figma-harness/primer`. Only the plugin imports `@figma-harness/primer/system`.

## At a glance

- **Colour.** 170 of Primer's light tokens: neutral ink, surfaces and borders, ten state families, component tokens, and five data hues. Translucent tokens keep their alpha ([ADR 0002](docs/adr/0002-colour-roles.md)).
- **Type.** Primer's text roles in Noto Sans, code in Noto Sans Mono, plus the weights Primer's components set on a role (`body/medium-600`, `label/small`).
- **Surfaces.** White page, bordered boxes, and shadows only on controls and dialogs ([ADR 0004](docs/adr/0004-surfaces-and-containment.md)).
- **Motion.** Primer's `enter`, `exit`, `hover` and `stateChange` transitions with their exact curves ([ADR 0006](docs/adr/0006-motion.md)).
- **Focus.** Primer's 2 px outline, placed per component ([ADR 0003](docs/adr/0003-focus-outlines.md)).

## Sizes

Every size is a variable in `Primer / Size`, bound natively by the layers that use it ([repository ADR 0003](../../docs/adr/0003-dimension-variables-and-native-bindings.md)).

| Role | Values | Variables |
| --- | --- | --- |
| Base scale, used for gaps and paddings | 2 to 128 px | `base/size/*` |
| Control heights | 24, 28, 32, 40, 48 px | `control/{xsmall,small,medium,large,xlarge}/size` |
| Control padding and gaps | 8, 12, 16 px and 4, 8 px | `control/*/paddingInline/*`, `control/*/gap` |
| Stack padding and gaps | 8, 16, 24 px | `stack/padding/*`, `stack/gap/*` |
| Overlay widths and padding | 192, 320, 480, 640 px and 8, 16 px | `overlay/width/*`, `overlay/padding/*` |
| Radii | 3, 6, 12 px, full | `borderRadius/*`, `overlay/borderRadius` |
| Global header, pane, content width | 64, 296, 1280 px | `app/header/height`, `app/pane/width`, `app/content/maxWidth` |

The `app/*` sizes are the only ones this package adds: Primer's PageLayout sets them in CSS rather than as tokens.

## Updating Primer

1. Pin the new version of `@primer/primitives` or `@primer/octicons` in this package's `package.json`, then run `pnpm install` at the root.
2. Regenerate, rebuild, and refresh the colour-vision table:

   ```bash
   pnpm generate
   pnpm build
   pnpm cvd:generate design-systems/primer
   pnpm build
   ```

3. Run `pnpm verify` (or its steps through `pnpm isolated <task>`). A renamed or removed token fails the generator; a changed value shows up in the audits and in the design signature, which a person reviews in Figma before accepting it.
4. Update the versions named in [ADR 0001](docs/adr/0001-primer-light-theme.md), and [`NOTICE.md`](NOTICE.md) if a licence notice changed.

## Adding a token, an icon or a component

A token or an icon: add its Primer name to `generators/tokens/catalog.ts` or `generators/icons/catalog.ts` and regenerate. Never type a Primer value into a foundation. A new colour also needs a swatch row on one of the A sheets (the `color-inventory` rule), and, if it carries text or a control edge, a pair in `src/foundations/audit.ts`.

A component:

1. Write the brief from `docs/ia/templates/DESIGN_SYSTEM_CHANGE.md`, with at least two consumers.
2. Follow the Primer React component's CSS: its tokens, sizes, radii, focus placement and states.
3. Implement it in the lowest layer that can own it, with tokens and `dim()` references only, and export it from `src/index.ts`.
4. Add a specimen to the relevant sheet under `src/sheets/`, and register its node-name pattern in `src/components/inventory.ts`.
5. Add stress cases in the app when its layout depends on size or content, and focused tests in `tests/`.
6. Run the full gate. The design signature changes, so a person reviews the result in Figma before the baseline is accepted.

To preview other colours without editing source, render with in-memory overrides:

```bash
FIGMA_HARNESS_COLOR_OVERRIDES='{"fgColor/accent":"#8250DF"}' pnpm render:svg "Design system" renders/preview
pnpm render:png renders/preview 0.5
```

## Licences

Primer Primitives and Octicons are © GitHub Inc. under the MIT license, reproduced in [`NOTICE.md`](NOTICE.md). Relay, the example app built with it, is fictional and uses no GitHub logo, product name or brand typeface.
