# Design decisions

These ADRs keep the reasoning and the rejected alternatives behind the repository's structure and mechanisms. Decisions that belong to a design system live in that package, for example [Primer's](../../design-systems/primer/docs/adr/README.md). Code states only the invariant it enforces and links here.

| ADR | Decision |
| --- | --- |
| [0001](./0001-workspace-packages.md) | One package per concern, and a swappable design system |
| [0002](./0002-motion-and-prototype-proof.md) | Motion and prototype proof |
| [0003](./0003-dimension-variables-and-native-bindings.md) | Dimension variables and native bindings |
| [0004](./0004-selectable-apps-and-templates.md) | A selectable app, and templates for new apps and design systems |

Changing an accepted invariant needs a new ADR that supersedes the old one, and a visual review before any signature baseline changes. A source-only refactor leaves the signatures unchanged.
