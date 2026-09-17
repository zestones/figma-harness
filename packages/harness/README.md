# Harness

`@figma-harness/harness` is the offline Figma: it bundles the plugin, runs the bundle against a mock Figma API, audits the result, renders it, and signs it. It never imports a design system, an app or the plugin. It reads:

- `figma-harness.config.json` at the repository root, which names the plugin and the active app, whose one design-system dependency is the design system;
- the design system's `design-system.json`, for its fonts and its generated colour-vision table;
- `HARNESS_API.CONTRACT` from the evaluated bundle, typed by `@figma-harness/contract`.

Run every command from the repository root. `pnpm verify` is read-only: it checks that generated files are current but never regenerates them.

Every command works on the active app. For one command, `FIGMA_HARNESS_APP=apps/<app>` selects another app, and `FIGMA_HARNESS_DESIGN_SYSTEM=design-systems/<name>` builds the app with another design system; both are bundled in memory, since `plugin/code.js` holds the active app only. A command that names its app, such as the flow guard, ignores them. `pnpm each <check>` runs a check for every app, and for the app template on every other design system.

## What `pnpm verify` proves

| Evidence | Checks |
| --- | --- |
| Sources | The package graph and layers, write scopes, tooling hygiene, the bundle, and generated design-system modules that match their pinned packages |
| Structure | Page ownership, attached frames, unique names, colour and component inventories, every colour painted where its Figma scope allows, valid prototype destinations |
| Geometry | Auto-layout resolution with text measured and wrapped using the design system's fonts, fixed text boxes that would spill, the spacing and radius scales, artboard containment, icons on their own grid, and every declared stress size and data extreme, each laid out and checked like a page |
| Prototype | Every declared transition, reaction readback, the design system's motion curves, and an observable change between animated frames |
| Accessibility | Declared contrast pairs with translucent colours composited, every text against its real backdrop, words beside state colours, colour-vision separation, focus outlines where the design system places them, elevation boundaries, and every reviewed waiver printed |
| Theme | Neutral chroma and hue, the surface ladder, the ink ramp, and the accent and primary action |
| Parity | Canonical Screens and Design system structure, variables and styles, the plugin UI and manifest, and representative component boundaries |

The harness provides measurable evidence, not aesthetic approval: a person still reviews hierarchy, clarity and intent in Figma. Local PNG inspection resolves the design system's Fontsource fonts through an isolated Fontconfig, and a font substitution is a hard failure. The renderer reads neither WOFF nor WOFF2, so each font is unwrapped to a plain font file, declared at its weight, and matched with English as the default language, which the bundled Latin subsets cover. Shadows are not rendered; the effect styles are checked in the audits and reviewed in Figma.

## Commands

| Goal | Command | Repository writes |
| --- | --- | --- |
| Build the Figma runtime | `pnpm build` | `plugin/code.js` |
| Check the bundle without writing | `pnpm build:check` | None |
| Validate layout, names, inventories, stress, and prototypes | `pnpm run audit` (`pnpm audit` is pnpm's own security audit) | None |
| Audit WCAG contrast and APCA | `pnpm audit:contrast` | None |
| Audit rendered-tree accessibility | `pnpm audit:a11y` | None |
| Validate theme policy | `pnpm audit:theme` | None |
| Compare the document with its baseline | `pnpm design:check` | None |
| Print a fresh document signature | `pnpm design:signature` | None |
| Compare or print component signatures | `pnpm design:components:check`, `pnpm design:components` | None |
| Regenerate the colour-vision table | `pnpm cvd:generate [design system]` | The file that design system's `design-system.json` names |
| Run a check on every app, and the app template on every design system | `pnpm each <check>` | None |
| Check the bundled inspection fonts | `pnpm render:fonts:check` | None |
| Render frames to SVG | `pnpm render:svg <page or all> <dir>` | The chosen directory, or `renders/` |
| Rasterize rendered SVG files | `pnpm render:png <dir> <scale>` | A PNG beside each SVG |
| Run one task under memory limits | `pnpm isolated <task>` | None |
| Sample harness memory | `pnpm isolated diagnose:memory <mode> <file>` | The chosen file under `renders/` |

Paths given on the command line are read from the repository root.

## Layout

```text
src/
├── core/            workspace layout, bundled fonts and WOFF reading, errors, canvas colour, pnpm launcher
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

`core/workspace.ts` finds the repository root, every workspace package with its declared role, and the composition a command works on: the app, its design system, and whether that design system was substituted. `bundle/bundle.ts` bundles `plugin/src/entry.ts`, resolving `@figma-harness/active-app` and `@figma-harness/active-design-system` to that composition, and fails when a module of a bundled package is unreachable from it. The first line of the bundle names the app and design system it holds, and the harness refuses to audit a `code.js` that does not match the config. `bundle/contract-loader.ts` gives static tools the contract without building a document: it evaluates a fresh in-memory bundle and returns `HARNESS_API.CONTRACT`.

The mock measures text with the advance widths of the design system's Fontsource fonts (`runtime/font-metrics.ts`) and wraps it word by word, like Figma. It also reproduces Figma's shared state between `textAutoResize` and `textTruncation`: a fixed text box whose truncation was switched off spills its extra lines, and the layout lint reports it.

Auto-layout frames hug their children as Figma does: a wrapping row grows by every line it holds, and a frame with nothing in its flow keeps the size it has, 100 × 100 px for a new frame, which the layout lint reports as `empty-hug`. Figma also places every new node on the current page, so the `orphans` rule reports any node the build created and never appended, empty or not. It runs after the stress run, which lays out each stress result and checks it like a page: the layout lint, and no layer outside its frame.

The accessibility split is intentional. `accessibility/contrast.ts` checks the declared token pairs, compositing a translucent background over its declared ground and a translucent ink over that; `accessibility/a11y/tree-audits.ts` derives adjacency, text backgrounds, state companions, focus outlines and elevation boundaries from the built document. The focus audit reads each control's declared placement, compares the outline with every pixel it replaces, including a field's resting edge, and requires the design system's band on emphasis fills. Text of a control marked `aria.disabled` is exempt from 1.4.3, as WCAG allows, and counted. Colours with no declared ground are flattened over the design system's `pageGround`.

The `token-scope` rule compares every bound paint with the Figma scopes the design system declares for its token, and prints its reviewed exceptions. The `flow-contract` rule compares the declared prototype with every generated reaction: trigger, destination, navigation and the exact cubic-bezier curve. For every animated pair it also requires an observable layer delta: an `enter` adds a layer, an `exit` removes one.

Inside Figma, `packages/engine/src/prototype-reactions.ts` is the native boundary: it awaits every reaction write, reads it back, and compares triggers, actions, navigation, destinations, transition types, durations and easing curves. The plugin's prototype-link total comes only from this readback.

Colour previews pass token overrides to an isolated harness instance through `FIGMA_HARNESS_COLOR_OVERRIDES`. They never rewrite a generated module or `code.js`.

## Bounded runs

`pnpm isolated <task>` runs one task in a transient systemd user service with a 1 GiB memory cap, no swap, one CPU, a 64-task limit and a three-minute timeout (fifteen minutes for `each`). It passes the `FIGMA_HARNESS_*` variables on to the service. It needs a systemd user manager and cgroup v2, and never falls back to unbounded execution. There is no aggregate `verify` task, and test runs need explicit files, for example `pnpm isolated test plugin/tests/plugin-workflow.test.ts`. [Harness memory](../../docs/engineering/harness-memory.md) explains the limits.
