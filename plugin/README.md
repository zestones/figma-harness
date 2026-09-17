# Figma Harness plugin

This package builds and audits the generated Figma workspace. The reviewed Figma document is the visual source of truth; this package is the deterministic source and the evidence needed to rebuild it safely.

## Invariants

- `src/plugin/entry.ts` is the sole bundle entry point.
- Designs import visual vocabulary only from `src/kit/public.ts` and scenarios only from `src/fixtures/public.ts`.
- Tools never import `src/` (tests excepted); they read `HARNESS_API.CONTRACT`.
- `code.js` is generated. Never edit it by hand.
- `tools/runtime/design-baseline.json` and `component-baseline.json` are reviewed acceptance records. A structural refactor must pass both signature checks without updating them.
- `ui.html` and `manifest.json` are part of the document signature.
- `renders/` is disposable local inspection output.

See the [architecture boundaries](../docs/ia/ARCHITECTURE_BOUNDARIES.md), the [AI authoring router](../docs/ia/README.md), and the [decision log](../docs/adr/README.md).

## Set up and verify

Node.js 20.19 or newer is required.

```bash
npm ci
npm run build
npm run verify
```

`verify` runs the guards, checks the committed bundle, lint, TypeScript and the unit tests, then evaluates the generated document:

| Evidence | Checks |
| --- | --- |
| Sources | The Primer token module and the Octicons module match the pinned packages |
| Structure | Page ownership, attached frames, unique names, colour and component inventories, every colour painted where its Figma scope allows, valid prototype destinations |
| Geometry | Auto-layout resolution with text measured and wrapped using the bundled fonts, fixed text boxes that would spill, the spacing and radius scales, artboard containment, filled Octicons on their own grid, and every declared stress size and data extreme |
| Prototype | Every declared transition, reaction readback, Primer's motion curves, and an observable change between animated frames |
| Accessibility | Declared contrast pairs with translucent colours composited, every text against its real backdrop, words beside state colours, colour-vision separation, focus outlines where Primer places them, elevation boundaries, and every reviewed waiver printed |
| Theme | Neutral chroma and hue, the surface ladder, the ink ramp, and the accent and primary action |
| Parity | Canonical Screens and Design system structure, variables and styles, the plugin UI and manifest, and representative component boundaries |

The harness provides measurable evidence, not aesthetic approval: a human still reviews hierarchy, clarity and intent in Figma.

| Goal | Command |
| --- | --- |
| Validate dependency, authoring, flow, and tooling contracts | `npm run guard` |
| Check changed paths for a task mode | `npm run guard:scope -- --mode=<MODE> --base=<ref>` |
| Rebuild the bundle | `npm run build` (or `./build.sh`) |
| Check that `code.js` is current | `npm run build:check` |
| Run the offline Figma and layout audit | `npm run audit` |
| Run contrast checks | `npm run audit:contrast` |
| Run rendered-tree accessibility checks | `npm run audit:a11y` |
| Validate theme policy | `npm run audit:theme` |
| Compare the document with its baseline | `npm run design:check` |
| Compare representative components with their baseline | `npm run design:components:check` |
| Print candidate signatures | `npm run design:signature`, `npm run design:components` |
| Check the bundled inspection fonts | `npm run render:fonts:check` |
| Run the pre-Figma checks | `npm run smoke:figma:preflight` |
| Render SVG or PNG inspections | `npm run render:svg -- <page> <dir>`, then `npm run render:png -- <dir> <scale>` |
| Regenerate the colour-vision table | `npm run cvd:generate` |
| Regenerate or check the Primer token module | `npm run tokens:generate`, `npm run tokens:check` |
| Regenerate or check the Octicons module | `npm run icons:generate`, `npm run icons:check` |

### Bounded Linux workstation checks

`npm run isolated -- <task>` runs one task in a transient systemd user service with a 1 GiB memory cap, no swap, one CPU, a 64-task limit, and a three-minute timeout. It requires a systemd user manager and cgroup v2, and it never falls back to unbounded execution. There is no aggregate `verify` task, and test runs need explicit files:

```bash
npm run isolated -- preflight
npm run isolated -- audit
npm run isolated -- test tools/tests/plugin-workflow.test.ts
```

A failure inside the runner is a failure; do not raise its limits or retry outside it. [Harness memory](../docs/engineering/harness-memory.md) explains the limits.

## Source layout

```text
src/
├── engine/                 Figma mechanics (protected)
├── kit/
│   ├── foundations/        Primer tokens (generated), families, sizes, motion, audit policy
│   ├── primitives/         text, shapes, Octicons (generated), charts
│   ├── components/         Primer components: buttons, labels, inputs, lists, navigation, feedback, overlays
│   ├── patterns/           app header, PageLayout, PageHeader, DataTable
│   └── public.ts           supported design-authoring API
├── fixtures/
│   ├── relay.ts            deterministic example data
│   └── public.ts           supported scenario API
├── designs/                authored output
│   ├── app.ts              product identity, navigation, signed-in person
│   ├── pages/              screens, screen registry, stress cases
│   ├── flows/              prototype transitions
│   ├── sheets/             design-system sheets
│   ├── catalog.ts          page builders and layout
│   ├── screens.ts          start screen and catalog version
│   ├── workspace.ts        owned page names
│   └── harness-contract.ts the document's audit contract
├── plugin/
│   ├── main.ts             UI command bridge
│   ├── screen-refresh.ts   selected-screen refresh and prototype repair
│   ├── harness-api.ts      offline harness surface and CONTRACT
│   └── entry.ts            composition root
└── package.json            marks the source as ESM
```

No module may live directly under `src/`. The architecture guard enforces the dependency direction, the two public facades, the absence of cycles, explicit `.ts` extensions, and no direct Figma access from designs or fixtures. The build rejects any module unreachable from `src/plugin/entry.ts`. Every file under `src/` and `tools/` is strictly typechecked by one `tsconfig.json`.

## Generated document

- `01 · Screens`: Relay's seven screens, grouped by page, wired as a clickable prototype.
- `02 · Design system`: 21 sheets for Primer's colours, foundations and components.
- `03 · Design lab`: an empty slot between disposable experiments.

The document signature protects Screens, Design system, shared variables and styles, the plugin UI, and the manifest, and requires all three page names in order. It excludes Design lab contents, which the audits still traverse.

## In Figma

Run `npm run build`, then import `manifest.json` as a development plugin in Figma Desktop. The plugin has no network access. Release validation follows the [native Figma Desktop gate](../docs/ia/ACCEPTANCE_GATES.md#native-figma-desktop-gate).

For normal iteration, select a generated screen or one of its layers and use **Refresh selected screen**. It keeps the top-level frame ID, regenerates only its contents, rewires and reads back only the interactions that screen owns, and checks that frame. The page actions replace one owned page; **Rebuild everything** is the complete integration check. A Screens build clones reaction-free repeated subtrees and closes the reuse session before attaching prototype reactions. The status reports the total duration, the native clone duration, and, when content already existed, the number and removal time of cleared top-level nodes.

## Generated and derived files

| Path | Generator |
| --- | --- |
| `code.js` | `npm run build` |
| `src/kit/foundations/primer.generated.ts` | `npm run tokens:generate`, from pinned `@primer/primitives` |
| `src/kit/primitives/icons.generated.ts` | `npm run icons:generate`, from pinned `@primer/octicons` |
| `src/kit/foundations/cvd.generated.ts` | `npm run cvd:generate` |
| `tools/runtime/*-baseline.json` | Explicit human acceptance only |
| `renders/` | Local rendering tools; ignored |

Local PNG inspection resolves the pinned Fontsource copies of Noto Sans and Noto Sans Mono through an isolated Fontconfig; font substitution is a hard failure. Shadows are not rendered; the effect styles are checked in the audits and reviewed in Figma. Colour previews use in-memory token overrides (`FIGMA_HARNESS_COLOR_OVERRIDES`) and never rewrite tracked source.
