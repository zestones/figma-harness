# Tooling

Run commands from `plugin/`. Everything here is Node-side TypeScript that builds, measures, and renders the generated document. Tools never import `src/` (tests excepted): they evaluate the bundle and read what they need from `HARNESS_API.CONTRACT`.

## Standard validation

```bash
npm ci
npm run verify
```

The aggregate command is read-only. It checks that generated files are current but never regenerates them.

## Find the right tool

| Goal | Command | Repository writes |
|---|---|---|
| Build the Figma runtime | `npm run build` | `code.js` |
| Check the bundle without writing | `npm run build:check` | None |
| Validate source, authoring, flows, and tooling hygiene | `npm run guard` | None |
| Validate the authored screen and interaction matrix | `npm run guard:flows` | None |
| Validate changed paths for a task mode | `npm run guard:scope -- --mode=<MODE> --base=<ref>` | None |
| Validate layout, names, inventories, stress, and prototypes | `npm run audit` | None |
| Audit WCAG contrast and APCA | `npm run audit:contrast` | None |
| Audit rendered-tree accessibility | `npm run audit:a11y` | None |
| Validate theme policy | `npm run audit:theme` | None |
| Compare the document with its baseline | `npm run design:check` | None |
| Print a fresh document signature | `npm run design:signature` | None |
| Compare or print component signatures | `npm run design:components:check`, `npm run design:components` | None |
| Regenerate the CVD table | `npm run cvd:generate` | `src/kit/foundations/cvd.generated.ts` |
| Regenerate or check Primer tokens | `npm run tokens:generate`, `npm run tokens:check` | `src/kit/foundations/primer.generated.ts` |
| Regenerate or check Octicons | `npm run icons:generate`, `npm run icons:check` | `src/kit/primitives/icons.generated.ts` |
| Render frames to SVG | `npm run render:svg -- <page or all> <dir>` | The chosen directory, or `renders/` |
| Rasterize rendered SVG files | `npm run render:png -- <dir> <scale>` | A PNG beside each SVG |
| Run one task under memory limits | `npm run isolated -- <task>` | None |
| Sample harness memory | `npm run isolated -- diagnose:memory <mode> <file>` | The chosen file under `renders/` |

## Domains

```text
tools/
├── architecture/        dependency, instruction, flow, hygiene, and scope guards
├── accessibility/       contrast, CVD table, rendered-tree audits
├── color/
│   ├── core/            colour math (WCAG, CVD simulation, OKLCH) and token adapters
│   └── theme/           theme policy verification
├── core/                shared error, canvas, and bundled-font helpers
├── runtime/             bundle, harness, mock Figma API, audit rules, signatures, isolated runner
├── icons/               Octicons selection and generation
├── tokens/              Primer Primitives selection and generation
├── rendering/           SVG and PNG inspection with bundled fonts
└── tests/               Node tests
```

`runtime/contract-loader.ts` gives static tools the contract without building a document: it evaluates a fresh in-memory bundle and returns `HARNESS_API.CONTRACT`. `runtime/harness/contract.ts` types it.

The mock measures text with the advance widths of the bundled Noto Sans and Noto Sans Mono fonts (`runtime/harness/font-metrics.ts`) and wraps it word by word, like Figma. It also reproduces Figma's shared state between `textAutoResize` and `textTruncation`: a fixed text box whose truncation was switched off spills its extra lines, and the layout lint reports it.

`tokens/catalog.ts` lists the Primer tokens the kit installs and `tokens/generate.ts` reads them from `@primer/primitives`: colours with their alpha, description, Figma scopes and the Primer source they resolve to (which records who owns a shared value), sizes, text roles, shadows and motion. `icons/catalog.ts` lists the Octicons the kit ships; GitHub's marks are refused. Both generators fail on a name the pinned package does not publish, and their `--check` mode fails when the committed module is stale.

The accessibility split is intentional: `contrast.ts` checks the declared token pairs, compositing a translucent background over its declared ground and a translucent ink over that, while `a11y/tree-audits.ts` derives adjacency, text backgrounds, state companions, focus outlines, and elevation boundaries from the built document. The focus audit reads each control's declared placement (Primer's outline offset), compares the outline with every pixel it replaces, including the resting edge a field declares, and requires Primer's inset band on emphasis fills. Text of a control marked `aria.disabled` is exempt from 1.4.3, as WCAG allows, and counted.

`token-scope` compares every bound paint with the Figma scopes Primer declares for its token: border tokens stroke, ink fills text and glyphs, backgrounds fill frames and shapes. The design system's reviewed exceptions are printed, never hidden.

`guard:hygiene` traces every tool from the package scripts and tests, plus any documented script under `color/experiments/`. It rejects orphan tools, dependency cycles, exact duplicate non-trivial function bodies, and tools that import product source.

`guard:flows` validates the Figma-free screen, transition and motion contracts. The runtime `flow-contract` audit then compares that intent with every generated reaction: trigger, destination, navigation and the exact cubic-bezier curve of Primer's transition. For every animated source and destination pair it also requires an observable layer delta: an `enter` adds a layer, an `exit` removes one.

Inside Figma, `src/engine/prototype-reactions.ts` is the native API boundary. It awaits every reaction write, then reads it back and compares triggers, actions, navigation modes, destinations, transition types, normalized durations, and easing curves. The plugin's prototype-link total comes only from this readback, and a partial write is a build error.

Colour previews pass token overrides to an isolated harness instance through `FIGMA_HARNESS_COLOR_OVERRIDES`. They never rewrite the generated token module or `code.js`.
