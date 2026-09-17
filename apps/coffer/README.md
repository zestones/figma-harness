# Coffer

`@figma-harness/coffer` is the second example app: Coffer, a fictional payments dashboard built with the [Carrara](../../design-systems/carrara/README.md) design system. It was created with `pnpm create:app coffer --design-system carrara`, and its template screens were then replaced. Its brief is [`docs/briefs/coffer.md`](docs/briefs/coffer.md).

| Path | Owns | Page authors may change it |
| --- | --- | --- |
| `src/app.ts` | Product name, the sidebar's sections, the signed-in person | yes |
| `src/screens.ts` | Screen groups, start screen, catalog version | yes |
| `src/pages/` | The six screens, the payments table they share, money and state formatting, and the artboard size | yes |
| `src/flows/` | The prototype's transitions and product rules | yes |
| `src/fixtures/` | Deterministic data; `index.ts` is its public entry | yes |
| `src/stress-cases.ts` | Sizes and data extremes the harness builds | yes |
| `src/lab/` | Design lab experiments under review | exploration only |
| `src/signatures.ts` | Representative layers the baseline protects | no |
| `src/index.ts` | `app`, the definition the plugin builds | no |
| `tests/` | Formatting, fixtures, and the prototype's matrix and motion | yes |

Pages import visuals only from `@figma-harness/carrara` and data only from `src/fixtures/index.ts`. When the vocabulary is missing something, the page change stops and a `DESIGN_SYSTEM_CHANGE` starts (see [`AGENTS.md`](../../AGENTS.md)).

To check or preview it while Relay is the active app, prefix a command with the app, or switch to it:

```bash
FIGMA_HARNESS_APP=apps/coffer pnpm isolated audit
FIGMA_HARNESS_APP=apps/coffer pnpm isolated render:svg all renders/coffer
pnpm use coffer
```

Coffer has no approved design yet, so `pnpm design:check` reports a missing baseline until a person has reviewed it in Figma (see the [acceptance gates](../../docs/ia/ACCEPTANCE_GATES.md)).
