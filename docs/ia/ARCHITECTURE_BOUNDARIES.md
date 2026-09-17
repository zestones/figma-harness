# Architecture boundaries

## Runtime dependency direction

```text
engine
  ↓
kit/foundations → kit/primitives → kit/components → kit/patterns
  ↓                    ↓                  ↓               ↓
fixtures/public ──────────────────────────────────────────┘
  ↓
kit/public + fixtures/public
  ↓
designs/{pages,flows,sheets,experiments} → designs/catalog
  ↓
plugin/{main,screen-refresh,harness-api,entry}
```

The diagram shows allowed capability flow, not a requirement that every layer import every earlier layer. The executable rule set is stricter:

| Importer | May import |
| --- | --- |
| `engine` | `engine` |
| `kit/foundations` | `engine`, `kit/foundations` |
| `kit/primitives` | `engine`, foundations, primitives |
| `kit/components` | `engine`, foundations, primitives, components |
| `kit/patterns` | earlier kit layers, other patterns, and `fixtures/public.ts` |
| `fixtures` | foundations and other fixture modules |
| `kit/public.ts` | supported engine and kit modules solely to re-export them |
| `designs` | `kit/public.ts`, `fixtures/public.ts`, and other design modules |
| `plugin` | any source layer as the composition and runtime edge |

Browser source is TypeScript-only and no source module may live directly under `src/`; every module declares its architectural owner through its directory. The only JavaScript file in the runtime workflow is the generated `plugin/code.js`, which Figma loads from `manifest.json`. Type-only modules count as dependencies too, and every module must be reachable from `src/plugin/entry.ts`.

## Ownership

- `engine/` owns Figma mechanics: resources, node factories, layout arithmetic, dimension bindings, prototype reaction writes, page lifecycle, fonts, and tree linting.
- `kit/foundations/` owns the generated Primer module and the tokens projected from it, semantics, installation, the generated CVD table, and the design system's audit contract (`audit.ts`).
- `kit/primitives/` owns text, shapes, the generated Octicons, focus outlines, and small visualizations.
- `kit/components/` owns Primer's components: buttons, labels, form controls, navigation, feedback, lists, timeline, and overlays.
- `kit/patterns/` owns the application shell (app header, page layout) and page blocks (page header, data table).
- `fixtures/` owns deterministic API-shaped scenarios, not rendering.
- `designs/` owns authored document output, prototype wiring, and the document's audit contract (`harness-contract.ts`).
- `plugin/` owns Figma UI commands, the bundle composition root, targeted screen refresh, and the explicit offline harness API.

`kit/patterns` may use fixture defaults only through `fixtures/public.ts`. This is an explicit preview seam; primitives and components must remain fixture-free.

## Offline harness edge

`plugin/harness-api.ts` exposes only the capabilities the offline tools exercise: the page builders, colour tokens, token and font installation, the layout linter, the screen-refresh entry points, and `CONTRACT`.

`CONTRACT` is how product knowledge reaches the tools. It has three parts:

| Part | Declared in | Consumed by |
| --- | --- | --- |
| `workspace` | `designs/workspace.ts` | page selection for signatures and audits |
| `designSystem` | `kit/foundations/audit.ts` and `kit/components/inventory.ts` | contrast, accessibility, theme, spacing, radius, and inventory rules |
| `document` | `designs/harness-contract.ts` | stress cases, reviewed exceptions, component signatures, and the prototype contract |

Tools under `plugin/tools/` never import `src/`, except tests. Static tools that need the contract without a Figma document call `loadContract()`, which evaluates a fresh in-memory bundle. `guard:hygiene` rejects a tool that imports product source. Product modules never import the harness API; adding an export to it requires an actual harness consumer and is an integration-boundary change.
