# Harness

`@figma-harness/harness` is the offline Figma: it bundles the plugin, runs the bundle against a mock Figma API, audits the result, renders it, and signs it. It never imports a design system, an app or the plugin. It reads:

- `figma-harness.config.json` at the repository root, which names the plugin and the design system;
- the design system's `design-system.json`, for its fonts and its generated colour-vision table;
- `HARNESS_API.CONTRACT` from the evaluated bundle, typed by `@figma-harness/contract`.

Run every command from the repository root. `pnpm verify` is read-only: it checks that generated files are current but never regenerates them.

## What `pnpm verify` proves

| Evidence | Checks |
| --- | --- |
| Sources | The package graph and layers, write scopes, tooling hygiene, the bundle, and generated design-system modules that match their pinned packages |
| Structure | Page ownership, attached frames, unique names, colour and component inventories, every colour painted where its Figma scope allows, valid prototype destinations |
| Geometry | Auto-layout resolution with text measured and wrapped using the design system's fonts, fixed text boxes that would spill, the spacing and radius scales, artboard containment, icons on their own grid, and every declared stress size and data extreme |
| Prototype | Every declared transition, reaction readback, the design system's motion curves, and an observable change between animated frames |
| Accessibility | Declared contrast pairs with translucent colours composited, every text against its real backdrop, words beside state colours, colour-vision separation, focus outlines where the design system places them, elevation boundaries, and every reviewed waiver printed |
| Theme | Neutral chroma and hue, the surface ladder, the ink ramp, and the accent and primary action |
| Parity | Canonical Screens and Design system structure, variables and styles, the plugin UI and manifest, and representative component boundaries |

The harness provides measurable evidence, not aesthetic approval: a person still reviews hierarchy, clarity and intent in Figma. Local PNG inspection resolves the design system's Fontsource fonts through an isolated Fontconfig, and a font substitution is a hard failure. Shadows are not rendered; the effect styles are checked in the audits and reviewed in Figma.

## Commands

| Goal | Command | Repository writes |
| --- | --- | --- |
| Build the Figma runtime | `pnpm build` | `plugin/code.js` |
| Check the bundle without writing | `pnpm build:check` | None |
| Validate layout, names, inventories, stress, and prototypes | `pnpm audit` | None |
| Audit WCAG contrast and APCA | `pnpm audit:contrast` | None |
| Audit rendered-tree accessibility | `pnpm audit:a11y` | None |
| Validate theme policy | `pnpm audit:theme` | None |
| Compare the document with its baseline | `pnpm design:check` | None |
| Print a fresh document signature | `pnpm design:signature` | None |
| Compare or print component signatures | `pnpm design:components:check`, `pnpm design:components` | None |
| Regenerate the colour-vision table | `pnpm cvd:generate` | The file `design-system.json` names |
| Check the bundled inspection fonts | `pnpm render:fonts:check` | None |
| Render frames to SVG | `pnpm render:svg <page or all> <dir>` | The chosen directory, or `renders/` |
| Rasterize rendered SVG files | `pnpm render:png <dir> <scale>` | A PNG beside each SVG |
| Run one task under memory limits | `pnpm isolated <task>` | None |
| Sample harness memory | `pnpm isolated diagnose:memory <mode> <file>` | The chosen file under `renders/` |

Paths given on the command line are read from the repository root.

## Layout

```text
src/
├── core/            workspace layout, bundled fonts, errors, canvas colour
├── bundle/          esbuild bundling, the build command, the contract loader
├── runtime/         the harness, the Figma mock, layout and text metrics, audit rules, stress runner
├── accessibility/   contrast, colour-vision table, rendered-tree audits
├── color/           colour maths (WCAG, CVD simulation, OKLCH), token adapters, theme policy
├── rendering/       SVG and PNG inspection with the bundled fonts
├── signatures/      document and component signatures
└── bounded/         the systemd-bounded runner and memory diagnostics
tests/               tests of the harness itself
```

## How it works

`core/workspace.ts` finds the repository root and every workspace package with its declared role. `bundle/bundle.ts` bundles `plugin/src/entry.ts` and fails when a module of a bundled package is unreachable from it. `bundle/contract-loader.ts` gives static tools the contract without building a document: it evaluates a fresh in-memory bundle and returns `HARNESS_API.CONTRACT`.

The mock measures text with the advance widths of the design system's Fontsource fonts (`runtime/font-metrics.ts`) and wraps it word by word, like Figma. It also reproduces Figma's shared state between `textAutoResize` and `textTruncation`: a fixed text box whose truncation was switched off spills its extra lines, and the layout lint reports it.

The accessibility split is intentional. `accessibility/contrast.ts` checks the declared token pairs, compositing a translucent background over its declared ground and a translucent ink over that; `accessibility/a11y/tree-audits.ts` derives adjacency, text backgrounds, state companions, focus outlines and elevation boundaries from the built document. The focus audit reads each control's declared placement, compares the outline with every pixel it replaces, including a field's resting edge, and requires the design system's band on emphasis fills. Text of a control marked `aria.disabled` is exempt from 1.4.3, as WCAG allows, and counted. Colours with no declared ground are flattened over the design system's `pageGround`.

The `token-scope` rule compares every bound paint with the Figma scopes the design system declares for its token, and prints its reviewed exceptions. The `flow-contract` rule compares the declared prototype with every generated reaction: trigger, destination, navigation and the exact cubic-bezier curve. For every animated pair it also requires an observable layer delta: an `enter` adds a layer, an `exit` removes one.

Inside Figma, `packages/engine/src/prototype-reactions.ts` is the native boundary: it awaits every reaction write, reads it back, and compares triggers, actions, navigation, destinations, transition types, durations and easing curves. The plugin's prototype-link total comes only from this readback.

Colour previews pass token overrides to an isolated harness instance through `FIGMA_HARNESS_COLOR_OVERRIDES`. They never rewrite a generated module or `code.js`.

## Bounded runs

`pnpm isolated <task>` runs one task in a transient systemd user service with a 1 GiB memory cap, no swap, one CPU, a 64-task limit and a three-minute timeout. It needs a systemd user manager and cgroup v2, and never falls back to unbounded execution. There is no aggregate `verify` task, and test runs need explicit files, for example `pnpm isolated test plugin/tests/plugin-workflow.test.ts`. [Harness memory](../../docs/engineering/harness-memory.md) explains the limits.
