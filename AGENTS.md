<!-- FIGMA_HARNESS_AUTHORING_CONTRACT_V1 -->
# Agent instructions

This repository builds a Figma document from TypeScript and verifies it offline. Before planning or editing, read [`docs/ia/README.md`](docs/ia/README.md) completely and follow the route for the task mode.

The default mode is `PAGE_AUTHORING`. Do not infer permission to change the design system from a request for a page, flow, state, or screen. In that mode:

- write page composition only under `plugin/src/designs/pages/` and flows under `plugin/src/designs/flows/`;
- consume visual vocabulary only through `plugin/src/kit/public.ts`;
- consume deterministic scenarios only through `plugin/src/fixtures/public.ts`;
- update the app navigation (`plugin/src/designs/app.ts`), the screen registry (`plugin/src/designs/screens.ts`), the document catalog, fixtures, briefs, and focused tests only when the task requires them;
- treat `plugin/src/engine/`, `plugin/src/kit/`, `plugin/src/plugin/`, the design-system sheets, the audit contract, tooling, ADRs, and signature baselines as protected.

If the public kit cannot express the requested design, stop the page change and propose a separate `DESIGN_SYSTEM_CHANGE`. Never hide a reusable component or a new token inside a page.

Never update a design or component signature baseline merely to make a check pass. An agent may produce the candidate signature and explain its delta; only an explicitly approved `BASELINE_ACCEPTANCE` task may change a baseline.

Run commands from `plugin/`. Before handoff, run the scope check for the active mode and the acceptance gates listed in `docs/ia/ACCEPTANCE_GATES.md`. The executable architecture guards are authoritative when prose and code disagree.
