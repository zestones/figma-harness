# Figma Harness

Build a Figma document from TypeScript, verify it offline, and let AI agents work on it within enforced boundaries.

A development plugin generates a design system, application screens and a clickable prototype as real Figma nodes. The same bundle runs in a mock Figma API, where the harness checks layout, accessibility, prototype wiring and visual parity before anyone opens Figma.

> [!NOTE]
> This is design infrastructure, not application code. The plugin is loaded manually in Figma Desktop and has no network access.

## What's inside

- **Plugin**: owns three pages (`01 · Screens`, `02 · Design system`, `03 · Design lab`), and can refresh one selected screen in place or rebuild everything.
- **Design system**: GitHub's open-source [Primer](https://primer.style) in its light theme. Colours, sizes, type, shadows and motion come from `@primer/primitives`, icons from `@primer/octicons`, and 33 Primer React components are rebuilt as Figma layers on 21 sheets.
- **Example app**: *Relay*, a fictional release manager with four pages (Overview, Releases, one Release with its promote dialog, and Settings in three states).
- **Offline harness and audits**: layout, stress sizes, token scopes, prototype reactions, WCAG contrast with translucent colours, focus placement, colour-vision deficiency, theme policy, and design signatures.
- **AI authoring contract**: `AGENTS.md` routes agents to a task mode whose write scope a guard checks.

## Quick start

Requires Node.js 20.19 or newer.

```bash
cd plugin
npm ci
npm run build
npm run verify   # everything, offline
```

In Figma Desktop, open a disposable file, import `plugin/manifest.json` (**Plugins → Development → Import plugin from manifest**), run **Figma Harness** and choose **Rebuild everything**. Present `01 · Overview` to try the prototype.

## How it works

```text
plugin/src/
├── engine/     Figma mechanics
├── kit/        the design system (public.ts is its only API)
├── fixtures/   deterministic sample data
├── designs/    pages, flows, sheets and the document contract
└── plugin/     UI commands, screen refresh, harness API
```

Dependencies flow one way and designs may only use the public facades; guards enforce it. Primer's tokens and Octicons are generated into the kit from pinned packages, and `npm run verify` fails when the generated files drift. Tools never import the source: they read `HARNESS_API.CONTRACT`, so another design system can reuse them by declaring its own contract. Signature baselines are human acceptance records: a visual change is reviewed in Figma before its baseline is recorded.

## Working with AI agents

Agents start from `AGENTS.md` (imported by `CLAUDE.md`) and pick one mode: `PAGE_AUTHORING` (default), `DESIGN_SYSTEM_CHANGE`, `DESIGN_EXPLORATION`, `STRUCTURAL_MAINTENANCE` or `BASELINE_ACCEPTANCE`. `npm run guard:scope` checks the changed files against that mode, and a missing component stops the page work instead of being improvised.

## Documentation

| Topic | Document |
| --- | --- |
| Commands, generated files, what the harness proves | [`plugin/README.md`](plugin/README.md) |
| AI modes, write zones and workflows | [`docs/ia/README.md`](docs/ia/README.md) |
| Gates, Figma review and signatures | [`docs/ia/ACCEPTANCE_GATES.md`](docs/ia/ACCEPTANCE_GATES.md) |
| Primer tokens, updating Primer, adding components | [`docs/design-system.md`](docs/design-system.md) |
| Design decisions | [`docs/adr/README.md`](docs/adr/README.md) |
| Contributing | [`CONTRIBUTING.md`](CONTRIBUTING.md) |

## License

[MIT](LICENSE). Primer Primitives and Octicons are © GitHub Inc. under the MIT license; see [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md). Relay is fictional, and the project is not affiliated with or endorsed by GitHub.
