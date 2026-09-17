# Design systems

A design system is a workspace package under `design-systems/` with the role `design-system`. Every app depends on exactly one, and the plugin builds the active app with the design system it depends on. The repository ships two: [Primer](../design-systems/primer/README.md), GitHub's open-source system in its light theme, and [Carrara](../design-systems/carrara/README.md), a design system for finance software created from the design system template.

## What a design system provides

| File                               | Purpose                                                                                                                                                                | Read by                         |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| `src/index.ts`                     | The authoring vocabulary: tokens, primitives, components, patterns, the engine calls authors need, and `starter`, the vocabulary the app template is written in        | apps                            |
| `src/system.ts`                    | A `DesignSystemDefinition` (`@figma-harness/contract`): installation, fonts, sheets, page chrome, motion, audit policy, reviewed exceptions, representative components | the plugin                      |
| `design-system.json`               | The Fontsource families text is measured with, and where the colour-vision table lives                                                                                 | the harness                     |
| `src/sheets/`                      | The `02 · Design system` page                                                                                                                                          | the plugin, through `system.ts` |
| `tests/`, `docs/adr/`, `README.md` | Its own evidence and decisions                                                                                                                                         | people and `pnpm test`          |
| `NOTICE.md`                        | The licences of third-party material it copies, when it copies any                                                                                                     | people                          |

Inside `src/`, the guards enforce the layers: foundations, then primitives, then components, then patterns, then the `index.ts` facade. Those layers may use the engine; sheets use the facade like any app; every layer may use the contract.

The audit policy (`DesignSystemContract`) is what the harness measures: colour tokens and their scopes, contrast pairs, categorical colours and waivers, the theme's neutral ladder and ink ramp, focus geometry, spacing and radius scales, icon grids, the page ground, the component inventory, and the colour-vision table. Nothing in the harness names a token.

## Creating a design system

```bash
pnpm create:design-system <name>
```

The command copies the design system template (`templates/design-system/`) to `design-systems/<name>/`, names the package `@figma-harness/<name>`, and links it into the workspace. The copy already passes every check. Then make it yours, as a `DESIGN_SYSTEM_CHANGE`:

1. Change the palette in `src/foundations/colors.ts`, the text styles in `typography.ts`, and the sizes in `dimensions.ts`. A new font goes in `design-system.json` and, as a Fontsource package, in `package.json`.
2. Add or change components, show each one on a sheet, and register its layer name in `src/components/inventory.ts`. Keep `starter` working.
3. Regenerate the colour-vision table: `pnpm cvd:generate design-systems/<name>`.
4. Check it with the app template, without switching anything: `FIGMA_HARNESS_APP=templates/app FIGMA_HARNESS_DESIGN_SYSTEM=<name> pnpm run audit`, or run `pnpm verify`, which does this for every design system.

A theme change inside one design system (Primer's dark theme, for example) stays inside that package.

## Using it in an app

A new app is created on a design system:

```bash
pnpm create:app <name> --design-system <design system>
pnpm use <name>
```

The app starts with the template's three screens, written in the `starter` vocabulary, so it builds on any design system; its pages then grow with that design system's components. To move an existing app to another design system, change its dependency in `package.json` and its imports, then rebuild its pages against the new vocabulary. That is a `STRUCTURAL_MAINTENANCE` change, and the app's baselines need a new review in Figma.

The engine, the harness, the guards and the plugin shell never change for any of this.

## Changing a design system

A change to a design system is a `DESIGN_SYSTEM_CHANGE` task: its write scope is the `design-systems/` folder, the lockfile, app fixtures and tests, and the regenerated bundle. See the [design-system workflow](ia/DESIGN_SYSTEM_WORKFLOW.md).
