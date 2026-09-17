# ADR 0001: One package per concern, and a swappable design system

- Status: Accepted

## Context

Everything used to live in one `plugin/` package: the Figma mechanics, the design system, the example app, the plugin shell, and the offline harness and its guards. They change at different rates and for different reasons, yet shared one dependency list, one test folder, and paths anchored by position. Replacing the design system meant editing files spread across the kit, the document catalog, the audit contract and the tools.

## Decision

The repository is a pnpm workspace. Each package declares its role in `package.json` (`figmaHarness.role`), and the guards derive the dependency rules from those roles.

| Role | Package | May depend on |
| --- | --- | --- |
| `contract` | `packages/contract` | nothing |
| `engine` | `packages/engine` | `contract` |
| `design-system` | `design-systems/<name>` | `engine`, `contract` |
| `app` | `apps/<name>` | one design system's public entry, `contract` |
| `plugin` | `plugin` | everything above |
| `tooling` | `packages/harness`, `packages/guards` | `contract`, other tooling |

- **Interfaces in one place.** `@figma-harness/contract` declares what a design system (`DesignSystemDefinition`), an app (`AppDefinition`) and the harness (`HarnessContract`) exchange. The plugin's `HARNESS_API.CONTRACT` is type-checked against it.
- **One composition point.** `plugin/src/composition.ts` names the design system and the app the plugin builds. `figma-harness.config.json` names the same design system for the harness, which reads its `design-system.json` manifest (fonts, generated files) instead of importing it.
- **Tooling never imports product code.** The harness evaluates the plugin bundle; only tests may import product source.
- **Package entry points are the boundary.** Across packages, code imports a package name and only what its `exports` publishes; relative imports never leave a package. An app imports visuals from its design system's main entry only; only the plugin imports a design system's `system` entry.
- **Tests and docs live with their owner.** Each package keeps its tests, and a design system keeps its own decisions under `docs/adr/`.

## Consequences

Swapping the design system is adding a package that implements `DesignSystemDefinition`, pointing the composition and the config at it, and rebuilding the app's pages against its vocabulary; the engine, harness, guards and plugin shell do not change. The restructuring kept the generated document byte-identical: the candidate signatures before and after it are the same.

## Rejected alternatives

- Keeping one package and only renaming folders: dependencies and tests would still be shared, and nothing would enforce ownership.
- Publishing packages to a registry: nothing here is meant to be consumed outside the repository.
- Letting the harness import the design system for its fonts and tables: tooling would change whenever the design system does.
