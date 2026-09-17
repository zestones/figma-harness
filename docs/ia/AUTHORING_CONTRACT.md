# Authoring contract

## The separation

An agent has two deliberately different relationships with this workspace:

1. It **uses** the protected engine and visual kit through stable public facades.
2. It **authors** designs, flows, fixtures, and their registrations in the write zone selected by the task mode.

The file boundary is part of the design-system contract, not merely a naming convention. `npm run guard:architecture` rejects imports that bypass it.

## Default write zone: `PAGE_AUTHORING`

Allowed when required by the page brief:

- `docs/briefs/**`
- `plugin/src/designs/pages/**`, including the screen registry (`state-matrix.ts`) and the stress cases (`stress-cases.ts`)
- `plugin/src/designs/flows/**`
- `plugin/src/designs/catalog.ts`
- `plugin/src/designs/app.ts` (product name, navigation, signed-in user)
- `plugin/src/designs/screens.ts` (start screen and catalog version)
- `plugin/src/fixtures/**`
- focused files under `plugin/tools/tests/**`
- regenerated `plugin/code.js`

Everything else is outside the default scope. In particular, these paths are protected:

- `plugin/src/engine/**`
- `plugin/src/kit/**`, including `kit/public.ts`
- `plugin/src/plugin/**`
- `plugin/src/designs/sheets/**` and `plugin/src/designs/experiments/**`
- `plugin/src/designs/harness-contract.ts` and `plugin/src/designs/workspace.ts`
- architecture, accessibility, colour, token, icon, rendering, and runtime tooling, and the pinned Primer packages
- `docs/adr/**` and `docs/ia/**`
- design and component baseline JSON files

The audit contract is protected because it can relax an audit: reviewed radius exceptions, focus-stroke exemptions, and the representative signature boundaries live there. Stress cases only add coverage, so page authors own them.

## Escalation rule

A page may compose exported primitives, components, and patterns. It may not:

- reproduce a missing component locally;
- introduce raw colours, type styles, spacing scales, or icon paths;
- deep-import kit or engine internals;
- change the public facade as a side effect of page work;
- loosen a guard, audit, type check, or signature to admit its output.

When the current API is insufficient, document the exact missing capability and its reuse case in the brief, then propose a separate `DESIGN_SYSTEM_CHANGE`. Complete that reviewed change first; page authoring can resume afterwards.

## Human decision requests

Before asking a human for approval, a choice, a manual check, or missing input, the agent must make the request self-contained. It must explain in plain language:

- the current change and why human input is needed now;
- what the requested term or action means;
- the exact files, generated document, visual output, or policy the answer will authorize;
- what the human should inspect, where to inspect it, and what result is expected;
- what the agent will do after approval and what remains unchanged.

An internal mode, guard name, acronym, issue number, hash, or authorization phrase must never be presented as if it were self-explanatory. When an exact reply is useful, provide it only after the context and state explicitly what saying it authorizes. A visual-review request must identify the relevant Figma page or frame and distinguish the intended change from regressions to check.

## Baseline rule

`design-baseline.json` and `component-baseline.json` are acceptance records. A failing signature means either the output changed or the refactor is incorrect. An agent must report the delta and may generate review material, but must not self-approve the new hash. Baseline mutation requires an explicit `BASELINE_ACCEPTANCE` task after visual review. Before requesting that task, the agent must apply the human-decision rule above and report the candidate delta, the protected output it represents, and the concrete review evidence needed.

## Definition of done

A task is complete only when its scope guard passes, the appropriate acceptance gates pass, the catalog remains deterministic, and no protected boundary was bypassed. "It builds" is necessary but not sufficient.
