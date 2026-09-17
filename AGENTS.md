<!-- FIGMA_HARNESS_AUTHORING_CONTRACT_V1 -->
# Agent instructions

This repository builds a Figma document from TypeScript and verifies it offline. Before planning or editing, read [`docs/ia/README.md`](docs/ia/README.md) completely and follow the route for the task mode.

The default mode is `PAGE_AUTHORING`. Do not infer permission to change the design system from a request for a page, flow, state, or screen. In that mode:

- write page composition only under `apps/<app>/src/pages/` and flows under `apps/<app>/src/flows/`;
- consume visual vocabulary only through the package entry of the app's design system (for Relay, `@figma-harness/primer`);
- consume deterministic scenarios only through the app's `src/fixtures/index.ts`;
- update the app's navigation (`src/app.ts`), its screen registry (`src/screens.ts`), its stress cases, fixtures, briefs, and focused tests only when the task requires them;
- treat `packages/`, `design-systems/`, `templates/`, `plugin/`, the app's `src/index.ts` and `src/signatures.ts`, tooling, ADRs, and signature baselines as protected.

If the design system cannot express the requested design, stop the page change and propose a separate `DESIGN_SYSTEM_CHANGE`. Never hide a reusable component or a new token inside a page.

Never update a design or component signature baseline merely to make a check pass. An agent may produce the candidate signature and explain its delta; only an explicitly approved `BASELINE_ACCEPTANCE` task may change a baseline.

Checks run on the active app, the one `figma-harness.config.json` names. Prefix a command with `FIGMA_HARNESS_APP=apps/<app>` to check another app, or switch with `pnpm use <app>`.

Run commands from the repository root with pnpm. Before handoff, run the scope check for the active mode and the acceptance gates listed in `docs/ia/ACCEPTANCE_GATES.md`. The executable architecture guards are authoritative when prose and code disagree.
