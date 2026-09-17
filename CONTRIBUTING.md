# Contributing

Thank you for helping. This repository generates a Figma document, so a change is judged by two things: whether the checks pass, and whether the generated result is still right when a person looks at it in Figma.

## Set up

Node.js 20.19 or newer is required. All commands run from `plugin/`.

```bash
cd plugin
npm ci
npm run build
npm run verify
```

Import `plugin/manifest.json` in Figma Desktop (**Plugins → Development → Import plugin from manifest**) to see the result. Use a disposable file: the plugin replaces the contents of the pages it owns.

## Choose the kind of change

Every change fits one mode from [`docs/ia/README.md`](docs/ia/README.md). The mode decides which paths you may touch, and `npm run guard:scope` checks it.

| You want to | Mode | Start with |
| --- | --- | --- |
| Add or change a screen, state, or prototype flow | `PAGE_AUTHORING` | [Page workflow](docs/ia/PAGE_WORKFLOW.md) |
| Add a Primer token, icon, component or pattern, or update Primer | `DESIGN_SYSTEM_CHANGE` | [Design-system workflow](docs/ia/DESIGN_SYSTEM_WORKFLOW.md) and the [design-system guide](docs/design-system.md) |
| Try a visual direction | `DESIGN_EXPLORATION` | The Design lab slot in `plugin/src/designs/catalog.ts` |
| Improve tooling, structure, CI, or documentation | `STRUCTURAL_MAINTENANCE` | [Architecture boundaries](docs/ia/ARCHITECTURE_BOUNDARIES.md) |

```bash
npm run guard:scope -- --mode=PAGE_AUTHORING --base=origin/main
```

Keep a design-system change and the page that motivated it in separate pull requests. Reviewers need to see the new vocabulary on its own.

## Before opening a pull request

```bash
npm run build
npm run verify
```

- `code.js` and the generated files are committed. Regenerate them with their commands; never edit them by hand.
- A new Primer token or icon is added to its generator catalog and regenerated. A new colour also needs a swatch row and a contrast pair, and a state or data colour needs its family. A new component family needs a sheet specimen and an inventory entry.
- Add focused tests for pure logic and stress cases for size-sensitive layout.
- Record a cross-cutting decision as an ADR under `docs/adr/`.

On a memory-constrained Linux desktop, run the heavy steps one at a time with `npm run isolated -- <task>` (see the [acceptance gates](docs/ia/ACCEPTANCE_GATES.md#bounded-execution-on-a-linux-workstation)).

## When the design changes

If your change alters the generated document, `design:check` or `design:components:check` fails. That is expected, and it is not a problem to fix in code.

1. Print the candidate signatures with `npm run --silent design:signature` and `npm run --silent design:components`.
2. In the pull request, describe what changed and which frames a reviewer should open in Figma.
3. A maintainer reviews the generated output in Figma Desktop.
4. Once approved, the baseline files are updated in a separate commit that touches nothing else.

Never change a baseline, an audit threshold, a waiver, or the canonicalization just to make a check pass.

## Working with an AI agent

`AGENTS.md` is written for agents and is imported by `CLAUDE.md`. If an agent prepares your change, make sure it reports the mode it used, the commands it ran, and any candidate signature, and that it did not update a baseline on its own.

## Style

- TypeScript only, with explicit `.ts` import extensions.
- Designs import from `kit/public.ts` and `fixtures/public.ts` only.
- Use tokens and `dim()` references rather than raw colours or numbers.
- Match the surrounding code: comments explain why, not what.
- Write user-facing copy in plain, sentence-case English.
- Keep the example fictional: no GitHub logo, product name or brand typeface, and keep the third-party notices intact.
