# App template

`@figma-harness/template-app` is the app template new apps are created from: three screens (a list of projects, and one project before and after it is marked complete) linked into a clickable prototype, with one animated change of state. It uses only the design system's `starter` vocabulary, so it works with any design system.

| Path | Owns | Page authors may change it |
| --- | --- | --- |
| `src/app.ts` | The product name | yes |
| `src/screens.ts` | Screen groups, start screen, catalog version | yes |
| `src/pages/` | The screens and the artboard size | yes |
| `src/flows/` | The prototype's transitions and product rules | yes |
| `src/fixtures/` | Sample data; `index.ts` is its public entry | yes |
| `src/stress-cases.ts` | Sizes and data extremes the harness builds | yes |
| `src/lab/` | Design lab experiments under review | exploration only |
| `src/signatures.ts` | Representative layers the baseline protects; empty until the app has screens of its own | no |
| `src/index.ts` | `app`, the definition the plugin builds | no |
| `tests/` | The prototype's checks | yes |

Pages import visuals only from the design system's package, and data only from `src/fixtures/index.ts`.

## Growing it

1. Write a brief for the first real page (see `docs/briefs/`).
2. Build the page in `src/pages/` with the design system's components, register it in `src/screens.ts`, and wire it in `src/flows/transitions.ts`. The template's screens can go once they are replaced.
3. Add the page to `src/stress-cases.ts`, then run `pnpm run audit` until it is clean.
4. Before the first review in Figma, name the layers that stand for the app in `src/signatures.ts`. That list decides what a baseline protects, so it changes in a structural task, not a page task.

A new app has no approved design yet, so `pnpm design:check` reports a missing baseline until a person has reviewed it in Figma (see the [acceptance gates](../../docs/ia/ACCEPTANCE_GATES.md)).
