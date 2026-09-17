# Relay

`@figma-harness/relay` is the example app: Relay, a fictional release manager built with the Primer design system. Its brief is [`docs/briefs/relay.md`](docs/briefs/relay.md).

| Path | Owns | Page authors may change it |
| --- | --- | --- |
| `src/app.ts` | Product name, local navigation, signed-in person | yes |
| `src/screens.ts` | Screen groups, start screen, catalog version | yes |
| `src/pages/` | The seven screens and their shared frame | yes |
| `src/flows/` | The prototype's transitions and product rules | yes |
| `src/fixtures/` | Deterministic data; `index.ts` is its public entry | yes |
| `src/stress-cases.ts` | Sizes and data extremes the harness builds | yes |
| `src/lab/` | Design lab experiments under review | exploration only |
| `src/signatures.ts` | Representative components the baseline protects | no |
| `src/index.ts` | `RELAY_APP`, the definition the plugin composes | no |
| `tests/` | The flow matrix and its motion | yes |

Pages import visuals only from `@figma-harness/primer` and data only from `src/fixtures/index.ts`. When the vocabulary is missing something, the page change stops and a `DESIGN_SYSTEM_CHANGE` starts (see [`AGENTS.md`](../../AGENTS.md)).
