# Restructuring plan: a pnpm workspace with one owner per concern

- Status: implemented on 2026-09-17 and committed as `05625cf`. The composition and the baseline location were changed afterwards by the [templates plan](./templates-plan.md) and [ADR 0004](../adr/0004-selectable-apps-and-templates.md); this record keeps the state at that commit.
- Scope: `STRUCTURAL_MAINTENANCE`. The generated Figma document must not change.

## Review findings

1. **One folder, five owners.** `plugin/` holds the Figma mechanics (`src/engine`), the Primer design system (`src/kit`, `tools/tokens`, `tools/icons`, `src/designs/sheets`), the Relay example (`src/fixtures`, `src/designs/pages`, `src/designs/flows`), the plugin shell (`src/plugin`), and the offline harness and guards (`tools/`). They change at different rates but share one `package.json`, one lockfile and one dependency list, so a Primer update and a harness fix look alike.
2. **Design-system knowledge leaks into generic code.** The harness hardcodes the Noto fonts (`tools/core/bundled-fonts.ts`), the generated file locations (`tools/tokens/tokens.ts`, `tools/icons/icons.ts`, `tools/accessibility/cvd-table.ts`, the drift check in `a11y/rules/categorical.ts`) and a white page (`cvd-table.ts`, `a11y/rules/surface-contrast.ts`). The toggle-knob radius exception and the colour-chip focus exemption sit in the document contract (`designs/harness-contract.ts`). The page bands, sheet groups and sheet size sit in the document catalog (`designs/catalog.ts`).
3. **App knowledge leaks into the document layer.** `designs/screens.ts`, `screen-catalog.ts`, `catalog.ts` and `harness-contract.ts` mix generic mechanics with Relay's start screen, catalog version, flows and stress cases, and `src/plugin/screen-refresh.ts` imports Relay's flows directly.
4. **Generic mechanics live in product folders.** Frame reuse (`designs/pages/render-cache.ts`), prototype wiring (`designs/flows/prototype.ts`, `flow-types.ts`), strut arithmetic (`kit/components/layout.ts`) and the token installer (`kit/foundations/install.ts`) know nothing about Primer or Relay.
5. **The harness contract is one-sided.** `tools/runtime/harness/contract.ts` declares what the tools read, but the product never type-checks against it.
6. **Tests are grouped by runner, not by owner.** All eleven files sit in `tools/tests/`, and half of them import product source.
7. **Paths are anchored by position.** Twenty `__dirname` joins assume `plugin/src` and `plugin/tools`; moving a folder would break them without a type error.

## Target layout

```text
figma-harness/
├── package.json               workspace scripts (the only command surface)
├── pnpm-workspace.yaml
├── figma-harness.config.json  which plugin and design system the harness inspects
├── tsconfig.json              one strict typecheck for every package
├── packages/                  stable infrastructure
│   ├── contract/              @figma-harness/contract   types shared by the plugin and the harness
│   ├── engine/                @figma-harness/engine     Figma mechanics, no design system
│   ├── harness/               @figma-harness/harness    offline Figma, audits, renders, signatures
│   └── guards/                @figma-harness/guards     repository guards: boundaries, write scopes, flows
├── design-systems/
│   └── primer/                @figma-harness/primer     Primer light: generators, tokens, components, sheets
├── apps/
│   └── relay/                 @figma-harness/relay      the example app: fixtures, screens, flows
├── plugin/                    @figma-harness/plugin     manifest, UI, commands, document builder, code.js
└── docs/
```

| Package | Owns | May import | Changes when |
| --- | --- | --- | --- |
| `contract` | Interfaces for design systems, apps and the harness | nothing | the harness learns a new check |
| `engine` | Node factory, variables and styles, fonts, layout lint, bindings, prototype I/O, frame reuse, token installer | `contract` | Figma's API changes |
| `primer` | Generated tokens and Octicons, foundations, primitives, components, patterns, sheets, audit policy, fonts | `engine`, `contract` | the design system or its theme changes |
| `relay` | Fixtures, screens, flows, stress cases, representative components | `primer` (public entry only), `contract` | a page changes |
| `plugin` | Composition (one design system, one app), pages, screen refresh, prototype wiring, harness API | everything above | the document structure changes |
| `harness` | Figma mock, layout and text metrics, audits, rendering, bundling, signatures, bounded runner | `contract` | a check is added or fixed |
| `guards` | Architecture, authoring policy, scope, flow validator, tooling hygiene | `contract`, `harness` | the repository rules change |

The harness and the guards never import a product package (the guards use the harness's workspace and contract helpers); they read `HARNESS_API.CONTRACT` from the bundle, `figma-harness.config.json`, and the design system's `design-system.json` manifest (fonts and generated files).

## What moves where

| From (inside `plugin/` unless it starts with `docs/`) | To |
| --- | --- |
| `src/engine/*` | `packages/engine/src/*` |
| `src/designs/pages/render-cache.ts` | `packages/engine/src/render-cache.ts` |
| `src/kit/components/layout.ts` | `packages/engine/src/struts.ts` |
| `src/kit/foundations/install.ts` (generic part) | `packages/engine/src/token-installer.ts` |
| `tools/runtime/harness/contract.ts` | `packages/contract/src/harness.ts` |
| `src/designs/flows/flow-types.ts` | `packages/contract/src/flows.ts` |
| `src/kit/{foundations,primitives,components,patterns}` | `design-systems/primer/src/…` |
| `src/kit/public.ts` | `design-systems/primer/src/index.ts` |
| `src/designs/sheets/*` | `design-systems/primer/src/sheets/*` |
| `tools/tokens/*`, `tools/icons/*` | `design-systems/primer/generators/{tokens,icons}/*` |
| `docs/design-system.md` | `design-systems/primer/README.md` (a generic `docs/design-systems.md` is new) |
| `docs/adr/` Primer decisions | `design-systems/primer/docs/adr/` (the repository keeps its own decisions) |
| `docs/briefs/*` | `apps/relay/docs/briefs/*` |
| `src/fixtures/*` | `apps/relay/src/fixtures/*` |
| `src/designs/app.ts`, `pages/*`, `flows/relay-flow-matrix.ts`, `flows/product-contract.ts` | `apps/relay/src/…` |
| `src/plugin/*` | `plugin/src/*` |
| `src/designs/{catalog,workspace,screen-catalog,harness-contract}.ts`, `flows/prototype.ts` | `plugin/src/document/*` |
| `tools/{runtime,accessibility,color,rendering,core}` | `packages/harness/src/…` |
| `tools/architecture/*` | `packages/guards/src/*` |
| `tools/tests/*.test.ts` | the `tests/` folder of the package each test exercises |
| `tsconfig.json`, `.oxlintrc.json` | repository root |
| `tools/runtime/*-baseline.json` (not recorded yet) | `plugin/baselines/{design,components}.json` |
| `plugin/renders/` (ignored) | `renders/` (ignored) |

Files are moved with `git mv`, so the review shows them as renames.

## Decoupling changes

- **Composition.** `plugin/src/composition.ts` is the one place that names the design system and the app the plugin builds. The document builder, the screen refresh and the harness API read them from there.
- **Design-system definition.** `@figma-harness/primer/system` exports `PRIMER`: font loading, token installation, the sheets and their groups, the page chrome (bands and captions), the motion resolver, the audit policy, the component inventory, and its reviewed exceptions (toggle knobs, the colour chip) and representative components (the button matrix).
- **App definition.** `@figma-harness/relay` exports `RELAY_APP`: screen groups, start screen, catalog version, flow matrix and its product rules, stress cases, representative components, and Design lab experiments.
- **Shared contract.** `@figma-harness/contract` declares both definitions and the harness contract. The plugin's `HARNESS_API.CONTRACT` is checked against it at compile time, and the harness reads the same types.
- **Harness configuration.** `figma-harness.config.json` names the plugin and design-system folders. `design-systems/primer/design-system.json` lists the Fontsource families and the generated colour-vision table. The CVD table and the surface audit flatten colours over the design system's declared page token instead of white.
- **Generators belong to the design system.** Token and icon generation, and their tests, live in `design-systems/primer/generators`.
- **Authoring rule unchanged.** Apps import visual vocabulary only from `@figma-harness/primer` (which still re-exports the engine calls authors need) and scenarios only from their own `fixtures/index.ts`.

## Tooling changes

- pnpm workspace with `workspace:*` links; `pnpm-lock.yaml` replaces `plugin/package-lock.json`. Every command runs from the repository root: `pnpm verify`, `pnpm isolated -- audit`.
- The bounded runner accepts `test <package>/tests/<name>.test.ts` selectors and works under pnpm.
- `guard:architecture` classifies files by workspace package and layer, resolves `@figma-harness/*` imports through each package's `exports`, rejects relative imports that leave their package, and rejects imports of a workspace package that is not a declared dependency.
- `guard:hygiene` collects tool roots from every workspace `package.json`, forbids product imports from the harness and guards, and keeps the clone check across all TypeScript.
- `authoring-policy.json` and `guard:authoring` use the new paths; CI installs with pnpm and runs `pnpm verify`; Dependabot updates the root workspace.

## Swapping the design system after this change

1. Add `design-systems/<name>/` with `src/index.ts` (authoring vocabulary), `src/system.ts` (a `DesignSystemDefinition`), `design-system.json`, sheets, and its own generators.
2. Point `plugin/src/composition.ts`, `plugin/package.json` and `figma-harness.config.json` at it.
3. Rebuild the app's pages against the new vocabulary (or add a new app under `apps/`).
4. Run `pnpm verify`; the harness, guards, engine and plugin shell stay untouched.

A theme change inside Primer (for example dark) stays inside `design-systems/primer`.

## Verification

- `pnpm install --frozen-lockfile` works from a clean checkout.
- Every gate passes through the bounded runner: guards, `build:check`, `tokens:check`, `icons:check`, lint, typecheck, fonts, every test file, `audit`, `audit:contrast`, `audit:a11y`, `audit:theme`.
- The candidate design and component signatures are identical to the ones printed before the move (`designSha256` `766f49a5…`, 5,049 protected nodes, seven component hashes), which proves the document did not change.
- `pnpm guard:scope --mode=STRUCTURAL_MAINTENANCE --base=HEAD` passes, and the leak scan finds nothing new.

## Results

Implemented on 2026-09-17, in the working tree only.

### Verification

| Check | Result |
| --- | --- |
| `pnpm install` | pnpm 12.3.4, lockfile v9; esbuild's install script allowed, Octicons 19.37.0 excluded from the minimum release age |
| `pnpm guard` | architecture clean (91 product modules), authoring contract clean, flow contract clean (14 transitions, 7 frames), tooling hygiene clean (110 tool modules, 617 unique function bodies) |
| `pnpm build:check`, `tokens:check`, `icons:check` | current (86 bundled modules); the regenerated modules differ only in their header comment |
| `pnpm lint`, `pnpm typecheck`, `pnpm render:fonts:check` | clean |
| Tests | 21 files, 61 tests, all passing through `pnpm isolated test …` |
| `pnpm run audit` | clean |
| `pnpm audit:contrast`, `audit:a11y`, `audit:theme` | 82 pairs with 0 failing; 0 failing with the 6 reviewed warnings; every theme rule holds |
| Signatures | `design:signature` and `design:components` print exactly the pre-move candidates: `designSha256` `766f49a5…`, 5,049 protected nodes, the same seven component hashes |
| `design:check`, `design:components:check` | fail as expected, because no baseline has been accepted yet; the message now names `plugin/baselines/design.json` |
| `pnpm guard:scope --mode=STRUCTURAL_MAINTENANCE --base=HEAD` | clean |
| Leak scan | only the known false positive: a number inside an Octicon path |

### Decisions taken during the implementation

- **Package roles.** Each `package.json` declares `figmaHarness.role` (`contract`, `engine`, `design-system`, `app`, `plugin`, `tooling`). The guards and the harness derive their rules and source lists from it, so they name no package. Recorded in [ADR 0001](../adr/0001-workspace-packages.md).
- **Decisions and docs follow their owner.** Primer's ADRs moved into its package (and gained a motion ADR); the repository keeps the workspace, prototype-proof and binding decisions, rewritten without Primer's values. The Relay brief moved into the app.
- **Design lab registry.** Experiments are registered in `apps/<app>/src/lab/index.ts`, the one app file `DESIGN_EXPLORATION` may change besides fixtures, briefs and tests.
- **Page ground.** The design-system contract gained `pageGround`; the colour-vision table and the surface audit flatten over it instead of a hardcoded white. The regenerated table has the same values.
- **Harness tests are design-system agnostic.** Primer-specific assertions (token count and values, fonts, sheet catalog, motion values, generators) moved to `design-systems/primer/tests/`; the radius tests read the configured scale.
- **CommonJS islands.** Product packages are ESM; their `tests/` and `generators/` folders carry a `{"type": "commonjs"}` marker because those files use `require` and `__dirname`.
- **Commands stay at the root.** Root scripts call each package's tool files directly, so relative paths on the command line resolve from the root. pnpm passes arguments without `--`, and the bounded runner starts pnpm as a native executable.
- **Unique export names.** The app's registry constants are `CATALOG_VERSION` and `START_SCREEN`, because the plugin's screen catalog already exports `SCREEN_CATALOG_VERSION` and `START_SCREEN_KEY`.

### Review guide

- `git status` shows 194 staged renames (`git mv`), so VS Code lists every move as a rename; content changes on top of them are unstaged. New files (package manifests, the contract package, `system.ts`, the app definition, READMEs, ADRs, split tests, `pnpm-lock.yaml`) are untracked. Four files are deleted: `plugin/package-lock.json`, `plugin/src/package.json`, and the two registry files folded into the app and the plugin.
- Suggested order: `figma-harness.config.json`, `pnpm-workspace.yaml` and the package manifests; `packages/contract/src/`; `plugin/src/composition.ts` and `plugin/src/document/`; `design-systems/primer/src/system.ts`; `apps/relay/src/index.ts`; `packages/harness/src/core/workspace.ts`; `packages/guards/src/boundaries.ts` and `tooling-hygiene.ts`; then the docs.
- `plugin/code.js` changed only because module paths moved.

### Not done

- The signature baselines still await a review in Figma Desktop (`BASELINE_ACCEPTANCE`), so CI fails at `design:check` until they exist.
- CI now installs with `pnpm/action-setup@v6` and pnpm 12; it has not run yet, because nothing was pushed after the move.
