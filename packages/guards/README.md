# Guards

`@figma-harness/guards` checks the repository rather than the document. Run them from the root with `pnpm guard` (all four) or one by one.

| Command | Checks |
| --- | --- |
| `pnpm guard:architecture` | Package roles and dependencies, layers inside design systems and apps, package entry points, no relative import leaving a package, no cycles, TypeScript only, no global `figma` in apps |
| `pnpm guard:authoring` | `AGENTS.md`, the IA docs, the authoring policy, the files each package role must provide, the root scripts and CI |
| `pnpm guard:flows` | The app's declared prototype: screens, destinations, Back, instant navigation, reachability, product rules |
| `pnpm guard:hygiene` | Every tool reachable from a script or a test, no tool importing product code, no cycle, no duplicated non-trivial function |
| `pnpm guard:scope --mode=<MODE> --base=<ref>` | The changed files against the write scope of a task mode (`docs/ia/authoring-policy.json`) |

Rules come from each package's declared role (`figmaHarness.role` in its `package.json`), so a new design system or app is checked without changing the guards.
