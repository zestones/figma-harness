# Design systems

A design system is a workspace package under `design-systems/` with the role `design-system`. The plugin builds with exactly one, named in `plugin/src/composition.ts` and in `figma-harness.config.json`. Primer's light theme is the one this repository ships: see [its README](../design-systems/primer/README.md).

## What a design system provides

| File                               | Purpose                                                                                                                                                                | Read by                         |
|------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| `src/index.ts`                     | The authoring vocabulary: tokens, primitives, components, patterns, and the engine calls authors need                                                                  | apps                            |
| `src/system.ts`                    | A `DesignSystemDefinition` (`@figma-harness/contract`): installation, fonts, sheets, page chrome, motion, audit policy, reviewed exceptions, representative components | the plugin                      |
| `design-system.json`               | The Fontsource families text is measured with, and where the colour-vision table lives                                                                                 | the harness                     |
| `src/sheets/`                      | The `02 · Design system` page                                                                                                                                          | the plugin, through `system.ts` |
| `tests/`, `docs/adr/`, `README.md` | Its own evidence and decisions                                                                                                                                         | people and `pnpm test`          |
| `NOTICE.md`                        | The licences of third-party material it copies, when it copies any                                                                                                     | people                          |

Inside `src/`, the guards enforce the layers: foundations, then primitives, then components, then patterns, then the `index.ts` facade. Those layers may use the engine; sheets use the facade like any app; every layer may use the contract.

The audit policy (`DesignSystemContract`) is what the harness measures: colour tokens and their scopes, contrast pairs, categorical colours and waivers, the theme's neutral ladder and ink ramp, focus geometry, spacing and radius scales, the page ground, the component inventory, and the colour-vision table. Nothing in the harness names a token.

## Replacing Primer

1. Add `design-systems/<name>/` with the files above and `"figmaHarness": { "role": "design-system" }` in its `package.json`, then run `pnpm install`.
2. Point `plugin/src/composition.ts`, the dependencies in `plugin/package.json`, and `designSystem` in `figma-harness.config.json` at it.
3. Rebuild the app's pages against the new vocabulary, or add a new app under `apps/` and compose that one.
4. Run `pnpm cvd:generate`, `pnpm build` and `pnpm verify`. The document changes, so the signature baselines need a new review in Figma.

The engine, the harness, the guards and the plugin shell stay as they are. A theme change inside one design system (Primer's dark theme, for example) stays inside that package.

## Changing a design system

A change to a design system is a `DESIGN_SYSTEM_CHANGE` task: its write scope is the `design-systems/` folder, the lockfile, app fixtures and tests, and the regenerated bundle. See the [design-system workflow](ia/DESIGN_SYSTEM_WORKFLOW.md).
