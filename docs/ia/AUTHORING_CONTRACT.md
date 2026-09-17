# Authoring contract

## The separation

An agent has two deliberately different relationships with this workspace:

1. It **uses** the protected infrastructure and the design system through their package entry points.
2. It **authors** screens, flows, fixtures, and their registrations in the write zone selected by the task mode.

The package boundary is part of the contract, not merely a naming convention. `pnpm guard:architecture` rejects imports that bypass it.

## Default write zone: `PAGE_AUTHORING`

Allowed, in any app under `apps/`, when required by the page brief:

- `docs/briefs/**`
- `src/pages/**`
- `src/flows/**`, the prototype transitions and their product rules
- `src/app.ts` (product name, navigation, signed-in person)
- `src/screens.ts` (screen groups, start screen, catalog version)
- `src/stress-cases.ts`
- `src/fixtures/**`
- `tests/**`
- the regenerated `plugin/code.js`

Everything else is outside the default scope. In particular, these paths are protected:

- `packages/**`: the contract, the engine, the harness and the guards
- `design-systems/**`, including their sheets and audit policy
- `plugin/**` except the regenerated bundle
- an app's `src/index.ts` (its definition) and `src/signatures.ts` (the components a baseline protects)
- `docs/adr/**`, `docs/ia/**`, the root configuration and the lockfile
- `plugin/baselines/*.json`

The audit contract is protected because it can relax an audit: reviewed radius exceptions, focus-stroke exemptions, and the representative signature boundaries come from the design system's audit policy, the app's signatures and the plugin's document contract. Stress cases only add coverage, so page authors own them.

## Escalation rule

A page may compose the primitives, components, and patterns its design system exports. It may not:

- reproduce a missing component locally;
- introduce raw colours, type styles, spacing scales, or icon paths;
- import the engine, another package's internals, or the design system's `system` entry;
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

`plugin/baselines/design.json` and `plugin/baselines/components.json` are acceptance records. A failing signature means either the output changed or the refactor is incorrect. An agent must report the delta and may generate review material, but must not self-approve the new hash. Baseline mutation requires an explicit `BASELINE_ACCEPTANCE` task after visual review. Before requesting that task, the agent must apply the human-decision rule above and report the candidate delta, the protected output it represents, and the concrete review evidence needed.

## Definition of done

A task is complete only when its scope guard passes, the appropriate acceptance gates pass, the catalog remains deterministic, and no protected boundary was bypassed. "It builds" is necessary but not sufficient.
