# Contributing

Thank you for helping. This repository generates a Figma document, so a change is judged by two things: whether the checks pass, and whether the generated result is still right when a person looks at it in Figma.

## Set up

Node.js 22.12 or newer and pnpm are required (`corepack enable` provides the pinned pnpm). All commands run from the repository root.

```bash
pnpm install
pnpm build
pnpm verify
```

Import `plugin/manifest.json` in Figma Desktop (**Plugins → Development → Import plugin from manifest**) to see the result. Use a disposable file: the plugin replaces the contents of the pages it owns.

## Find the owner

| Folder                                   | Owns                                                  | Changes                                 |
|------------------------------------------|-------------------------------------------------------|-----------------------------------------|
| `apps/<app>/`                            | Screens, flows, fixtures, stress cases, baselines     | often                                   |
| `design-systems/<name>/`                 | Tokens, icons, components, sheets, audit policy       | when the design system or theme changes |
| `plugin/`                                | Composition, owned pages, screen refresh, harness API | when the document structure changes     |
| `packages/engine/`, `packages/contract/` | Figma mechanics, shared interfaces                    | rarely                                  |
| `templates/`                             | The design system and app templates new ones copy     | when the starting point should improve  |
| `packages/harness/`, `packages/guards/`  | Offline audits, repository rules                      | rarely                                  |
| `packages/cli/`                          | `create:*`, `use` and `each` commands                 | rarely                                  |

Each package keeps its tests in `tests/`. A package declares its role in `package.json`, and the guards derive the dependency rules from it.

## Choose the kind of change

Every change fits one mode from [`docs/ia/README.md`](docs/ia/README.md). The mode decides which paths you may touch, and `pnpm guard:scope` checks it.

| You want to                                               | Mode                     | Start with                                                                                                           |
|-----------------------------------------------------------|--------------------------|----------------------------------------------------------------------------------------------------------------------|
| Add or change a screen, state, or prototype flow          | `PAGE_AUTHORING`         | [Page workflow](docs/ia/PAGE_WORKFLOW.md)                                                                            |
| Create a design system (`pnpm create:design-system`)      | `DESIGN_SYSTEM_CHANGE`   | [Design systems](docs/design-systems.md)                                                                             |
| Create an app (`pnpm create:app`)                         | `STRUCTURAL_MAINTENANCE` | [Page workflow](docs/ia/PAGE_WORKFLOW.md)                                                                            |
| Add a token, icon, component or pattern, or update Primer | `DESIGN_SYSTEM_CHANGE`   | [Design-system workflow](docs/ia/DESIGN_SYSTEM_WORKFLOW.md) and the [Primer README](design-systems/primer/README.md) |
| Try a visual direction                                    | `DESIGN_EXPLORATION`     | The app's `src/lab/` registry                                                                                        |
| Improve tooling, structure, CI, or documentation          | `STRUCTURAL_MAINTENANCE` | [Architecture boundaries](docs/ia/ARCHITECTURE_BOUNDARIES.md)                                                        |

```bash
pnpm guard:scope --mode=PAGE_AUTHORING --base=origin/main
```

Keep a design-system change and the page that motivated it in separate pull requests. Reviewers need to see the new vocabulary on its own.

## Before opening a pull request

```bash
pnpm build
pnpm verify
```

- `plugin/code.js` and the generated files are committed. Regenerate them with their commands; never edit them by hand. `code.js` holds the app `figma-harness.config.json` names; switch it with `pnpm use <app>`.
- A new Primer token or icon is added to its generator catalog and regenerated. A new colour also needs a swatch row and a contrast pair, and a state or data colour needs its family. A new component family needs a sheet specimen and an inventory entry.
- Add focused tests next to the code they test, and stress cases for size-sensitive layout.
- Record a repository-wide decision under `docs/adr/`, and a design-system decision in that package's `docs/adr/`.

On a memory-constrained Linux desktop, run the heavy steps one at a time with `pnpm isolated <task>` (see the [acceptance gates](docs/ia/ACCEPTANCE_GATES.md#bounded-execution-on-a-linux-workstation)).

## When the design changes

If your change alters the generated document, `design:check` or `design:components:check` fails. That is expected, and it is not a problem to fix in code.

1. Print the candidate signatures with `pnpm --silent design:signature` and `pnpm --silent design:components`.
2. In the pull request, describe what changed and which frames a reviewer should open in Figma.
3. A maintainer reviews the generated output in Figma Desktop.
4. Once approved, the files in the app's `baselines/` folder are updated in a separate commit that touches nothing else.

Never change a baseline, an audit threshold, a waiver, or the canonicalization just to make a check pass.

## Working with an AI agent

`AGENTS.md` is written for agents and is imported by `CLAUDE.md`. If an agent prepares your change, make sure it reports the mode it used, the commands it ran, and any candidate signature, and that it did not update a baseline on its own.

## Style

- TypeScript only, with explicit `.ts` import extensions inside a package, and package names across packages.
- Apps import visuals from their design system's package entry and data from their own `src/fixtures/index.ts` only.
- Use tokens and `dim()` references rather than raw colours or numbers.
- Match the surrounding code: comments explain why, not what.
- Write user-facing copy in plain, sentence-case English.
- Keep the examples fictional: no GitHub logo, product name or brand typeface, and keep `design-systems/primer/NOTICE.md` intact.
