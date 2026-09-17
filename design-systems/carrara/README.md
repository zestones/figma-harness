# Carrara

`@figma-harness/carrara` is a design system for finance and operations software: a light workspace with a near-black sidebar, cool greys, one indigo accent, Inter for the interface and JetBrains Mono for identifiers. It was created with `pnpm create:design-system` and then rebuilt: 38 colour roles, 12 text styles, 63 Heroicons, 29 component families and 9 documentation sheets. [Coffer](../../apps/coffer/README.md), a payments dashboard, is built with it.

## Layout

| Path | Owns | Sheets |
| --- | --- | --- |
| `generators/icons/` | Which Heroicons are installed, and the generator | — |
| `src/primitives/icons.generated.ts` | The generated glyphs; never edited by hand | F3 |
| `src/foundations/colors.ts` | The palette, the colour roles components paint with, and where each role may be painted | A1 |
| `src/foundations/typography.ts` | Text styles | F1 |
| `src/foundations/dimensions.ts`, `elevation.ts` | Spacing, radii, fixed sizes and shadows | F2 |
| `src/foundations/motion.ts`, `focus.ts` | The three prototype transitions and the focus outline | F3 |
| `src/foundations/audit.ts` | What the harness measures: contrast pairs, colour-vision checks, theme rules | A2 |
| `src/foundations/cvd.generated.ts` | How the state colours look with colour-vision deficiency; generated, never edited | A2 |
| `src/primitives/` | Text, icons, avatars, dots and rules, the focus outline, sparklines and the area chart | C3, F3 |
| `src/components/` | Buttons, fields, choices, tabs, badges, cards, stats, tables, pagination, alerts, toasts, progress, timelines, description lists, fact strips, menus, dialogs, list rows and empty states | C1–C4 |
| `src/patterns/` | The sidebar, the top bar, the page header, the shell every screen shares, and `starter`, the vocabulary the app template is written in | C2 |
| `src/sheets/` | The Design system page and its page chrome | all |
| `src/index.ts` | The vocabulary apps import | — |
| `src/system.ts` | `designSystem`, the definition the plugin builds | — |
| `design-system.json` | The fonts and the generated table, for the harness | — |
| `docs/adr/` | [Carrara's decisions](docs/adr/README.md) | — |

Apps import only `@figma-harness/carrara`. Only the plugin imports `@figma-harness/carrara/system`.

## At a glance

- **Colour.** White cards on a pale grey page, a near-black sidebar, and one indigo accent for primary actions, selection and the main chart series. Positive, warning and critical stay apart under simulated colour-vision deficiency, and every state is also written as a word ([ADR 0001](docs/adr/0001-light-workspace-dark-sidebar.md)).
- **Type.** Inter in Regular, Medium and SemiBold, from 36 px amounts down to 11 px overlines, and JetBrains Mono for payment IDs and tax numbers ([ADR 0002](docs/adr/0002-type-and-icons.md)).
- **Surfaces.** Cards, tables and dialogs keep a 1 px border; shadows only suggest height.
- **Data.** Stats with a trend and a sparkline, an area chart with gridlines, a dashed comparison and a tooltip, bar lists, and tables whose cells are built by helpers (`personCell`, `amountCell`, `badgeCell`, `stackedCell` and others).
- **Motion.** `enter` for a dialog, `exit` when it leaves, `stateChange` for a change in place. Moving between pages is instant.
- **Focus.** A 2 px indigo outline, 2 px outside the control: at least 3:1 on every ground a control sits on, and 4:1 on the page, cards, table headers and the sidebar, under every simulated vision.
- **Width.** Below 1024 px the shell folds the sidebar into the top bar. Page headers stack their actions, and fact strips wrap, when a row runs out of room.

## Sizes

Every size is a variable in `Carrara / Size`, bound by the layers that use it.

| Role | Values | Variables |
| --- | --- | --- |
| Spacing, for gaps and paddings | 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64 px | `space/*` |
| Radii | 4, 6, 8, 12 px, full | `radius/{xs,sm,md,lg,full}` |
| Control heights | 32, 36 px | `control/{sm,md}` |
| Shell | a 248 px sidebar, a 64 px top bar | `sidebar/width`, `topbar/height` |
| Dialog width | 480 px | `dialog/width` |

## Updating the icons

1. Pin the new `heroicons` version in this package's `package.json`, then run `pnpm install` at the root.
2. Regenerate and check:

   ```bash
   pnpm generate
   pnpm check:generated
   ```

3. An icon is added by listing its Heroicons name in `generators/icons/catalog.ts`. The generator fails when a name has no solid glyph on both the 16 and 20 px grids.

## Adding a colour or a component

A colour: add the palette entry and the role in `src/foundations/colors.ts`, give the role the Figma scopes it may be painted with, show it on the A1 sheet, and add a pair to `src/foundations/audit.ts` if it carries text or a control edge. A new state colour also goes into the categorical list; then regenerate the colour-vision table:

```bash
pnpm cvd:generate design-systems/carrara
```

A component:

1. Write the brief from `docs/ia/templates/DESIGN_SYSTEM_CHANGE.md`, with at least two consumers.
2. Build it under `src/components/` from existing tokens, export it from `src/index.ts`, and name its root layer so `src/components/inventory.ts` recognises it. Create a layer only when it is used, and refuse an empty list: Figma leaves every new layer on the page and keeps an empty auto-layout frame 100 px tall, and the audits reject both.
3. Show it on a sheet, with its states.
4. Run `pnpm verify`, or its steps through `pnpm isolated <task>`, with `FIGMA_HARNESS_APP=apps/coffer` for the checks that build an app.

`starter` in `src/patterns/starter.ts` draws the screens of any app created from the app template. Keep it working when components change.

## Licences

The icon paths are copied from Heroicons under the MIT licence; Inter and JetBrains Mono are installed from npm under the SIL Open Font License and are not copied into the repository. See [`NOTICE.md`](NOTICE.md).
