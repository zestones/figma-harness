# ADR 0004: A selectable app, and templates for new apps and design systems

- Status: Accepted
- Supersedes: the composition point of [ADR 0001](./0001-workspace-packages.md)

## Context

ADR 0001 made the design system swappable, but switching still meant editing `plugin/src/composition.ts`, the plugin's dependencies and `figma-harness.config.json`, and nothing helped start a new design system or app except copying Primer or Relay. Agents need to create and switch packages without touching the plugin, and a second app must never break because another one is active.

## Decision

- **The config names the app.** `figma-harness.config.json` names the active app. Its single design-system dependency decides the design system, so the two cannot disagree. `pnpm use <app>` rebuilds `plugin/code.js` and then switches the config. The first line of `code.js` names the app and design system it holds, and the harness refuses a `code.js` that does not match the config.
- **The plugin imports aliases.** `plugin/src/composition.ts` imports `@figma-harness/active-app` and `@figma-harness/active-design-system`. The build resolves them to the active app's entry and its design system's `system` entry. The plugin depends on no app and no design system; the architecture guard checks the aliases as imports of the files they resolve to.
- **One command, any composition.** `FIGMA_HARNESS_APP` selects another app and `FIGMA_HARNESS_DESIGN_SYSTEM` builds it with another design system, for one command. A command that names its app, such as the flow guard or a test, ignores both. Such builds happen in memory, under the same reachability rule as `pnpm build`; `code.js` always holds the configured app, and `pnpm build` refuses to run while either variable selects something else.
- **Baselines belong to the app.** Each app keeps `baselines/design.json` and `baselines/components.json`. Templates, and substituted compositions, have none; their signatures are still built, so every selector is checked, but not compared. The app template names no representative layers of its own: an app chooses them once it has screens, in the structural task that prepares its first review.
- **Templates.** `templates/design-system` and `templates/app` are complete, audited packages marked `"template": true`. `pnpm create:design-system <name>` and `pnpm create:app <name> --design-system <name>` copy them and rename the copy.
- **A shared starter vocabulary.** Every design system exports `starter` (`StarterVocabulary` in the contract): one call that draws a complete screen with its own components, and the name of its motion for a change of state. The app template is written only in that vocabulary, so it builds and animates on every design system.
- **Every composition is checked.** `pnpm each <check>` runs a check once per app, and once for the app template on every other design system. `pnpm verify` runs the audits, fonts and signatures that way.

## Consequences

Adding a design system or an app needs no change outside the new package, the lockfile and, to make it active, the config. Page tasks may switch the active app. The harness and plugin tests use the app template, so they pass whichever app is active. Two packages created from the same template start as copies of each other, so the clone check allows the same function body in two apps, or in two design systems, and nowhere else.

## Rejected alternatives

- Generating `composition.ts` from the config: a generated source file in the plugin would change on every switch and blur its ownership.
- Keeping the design system in the config next to the app: the two could disagree.
- A scaffolding framework or a registry package: two templates copied with a checked list of edits are enough, and a test fails when a template drifts from the edits.
