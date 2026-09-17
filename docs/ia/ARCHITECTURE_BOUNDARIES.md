# Architecture boundaries

The repository is a pnpm workspace. Each package declares its role in `package.json` (`"figmaHarness": { "role": … }`), and `pnpm guard:architecture` derives every rule below from those roles, so a new design system or app is checked without changing the guards. The decision is recorded in [ADR 0001](../adr/0001-workspace-packages.md).

## Packages

```text
contract ◄── engine ◄── design system ◄── app
    ▲           ▲            ▲             ▲
    └───────────┴──── plugin ┴─────────────┘

contract ◄── harness ◄── guards        (tooling: reads the bundle, never the product)
```

| Role | Packages | May import at runtime |
| --- | --- | --- |
| `contract` | `packages/contract` | nothing |
| `engine` | `packages/engine` | `contract` |
| `design-system` | `design-systems/*` | `engine`, `contract` |
| `app` | `apps/*` | a design system's main entry, `contract` |
| `plugin` | `plugin` | `contract`, `engine`, a design system's `system` entry, an app's entry |
| `tooling` | `packages/harness`, `packages/guards` | `contract`, other tooling |

Across packages, code imports a package name and only what that package's `exports` publishes; a relative import never leaves its package. A product package may import only the workspace packages listed in its `dependencies`, and never tooling, npm packages or Node built-ins.

## Layers inside a package

| Package | Layer | Files | May import in its package |
| --- | --- | --- | --- |
| design system | foundation | `src/foundations/**` | foundations |
| | primitive | `src/primitives/**` | foundations, primitives |
| | component | `src/components/**` | foundations, primitives, components |
| | pattern | `src/patterns/**` | foundations, primitives, components, patterns |
| | facade | `src/index.ts` | foundations, primitives, components, patterns |
| | sheet | `src/sheets/**` | the facade, sheets |
| | system | `src/system.ts` | everything in the package |
| app | fixture | `src/fixtures/**` | fixtures |
| | fixture facade | `src/fixtures/index.ts` | fixtures |
| | design | every other file under `src/` | designs, the fixture facade |
| | app entry | `src/index.ts` | designs, the fixture facade |

Foundations, primitives, components, patterns, the facade and the system may use the engine; every layer may use the contract. Apps (designs and fixtures) must not touch the global `figma`: they compose the design system's vocabulary. Product source is TypeScript only, uses explicit `.ts` extensions, has no `require()` or computed dynamic import, and has no dependency cycle. The only JavaScript in the runtime workflow is the generated `plugin/code.js`, and every module of a bundled package must be reachable from `plugin/src/entry.ts`.

## Ownership

- `packages/contract/` owns the interfaces: `DesignSystemDefinition`, `AppDefinition`, `HarnessContract`, and the flow types.
- `packages/engine/` owns Figma mechanics: node factory, resources, token installation, fonts, layout arithmetic and lint, dimension bindings, prototype reaction writes, page lifecycle, frame reuse.
- `design-systems/<name>/` owns its tokens and generators, semantics, primitives, components, patterns, its sheets and page chrome, its audit policy, and its decisions.
- `apps/<name>/` owns deterministic scenarios, screens, flows, stress cases, representative components, Design lab experiments, and briefs.
- `plugin/` owns the composition, UI commands, the three owned pages, targeted screen refresh, prototype wiring, the document audit contract, and the harness API.
- `packages/harness/` owns the offline runtime, audits, rendering, signatures and the bounded runner; `packages/guards/` owns the repository rules.

## Offline harness edge

`plugin/src/harness-api.ts` exposes only what the offline tools exercise: the page builders, colour tokens, token and font installation, the layout linter, the screen-refresh entry points, and `CONTRACT`.

`CONTRACT` is how product knowledge reaches the tools. It is typed by `HarnessContract` and has three parts:

| Part | Declared in | Consumed by |
| --- | --- | --- |
| `workspace` | `plugin/src/document/workspace.ts` | page selection for signatures and audits |
| `designSystem` | the design system's `src/foundations/audit.ts` and `src/components/inventory.ts` | contrast, accessibility, theme, spacing, radius, scope and inventory rules |
| `document` | `plugin/src/document/contract.ts`, from the app and the design system | stress cases, reviewed exceptions, component signatures, and the prototype contract |

Tooling never imports product source; only tests may. Static tools that need the contract without a Figma document call `loadContract()`, which evaluates a fresh in-memory bundle. For what cannot come from the bundle, the harness reads `figma-harness.config.json` and the design system's `design-system.json`. Product modules never import the harness API; adding an export to it requires an actual harness consumer and is an integration-boundary change.
