# Acceptance gates

Run commands from the repository root.

## Every task

```bash
pnpm guard
pnpm lint
pnpm typecheck
pnpm test
```

`guard:architecture` validates package roles and dependencies, layers, and package entry points. `guard:authoring` validates the instruction and policy wiring. `guard:flows` validates the declarative screen and interaction matrix before the runtime harness independently compares it with the generated Figma reactions. `guard:hygiene` rejects unreachable tools, dependency cycles, duplicated function bodies, and tools that import product source.

The task-specific scope check is separate because CI cannot infer a branch's authoring mode:

```bash
pnpm guard:scope --mode=<MODE> --base=<git-ref>
```

## Any source or document-output change

Run the complete gate:

```bash
pnpm build
pnpm verify
```

`verify` checks the static guards, the bundle, the generated Primer tokens and Octicons against their pinned packages, lint, TypeScript, the inspection fonts, unit tests, the harness rules, contrast, rendered-tree accessibility, theme policy, the stable-document signature, and representative component signatures.

### Bounded execution on a Linux workstation

The full gate builds the document many times. On a memory-constrained Linux desktop, run each heavy step in a bounded transient systemd service instead:

```bash
pnpm isolated preflight
pnpm isolated audit
pnpm isolated test plugin/tests/plugin-workflow.test.ts
```

The runner requires a systemd user manager and cgroup v2. It caps the process group at 1 GiB with no swap, constrains worker pools, reports memory and task peaks, and refuses to fall back to unbounded execution. Test runs require explicit file selectors. A failure inside the runner is a failure; do not raise the limits or retry outside it.

## Native Figma Desktop gate

The offline harness proves determinism and most layout invariants, but it cannot certify native font availability, Figma API behavior, viewport navigation, or clickable prototype playback. Complete this gate in Figma Desktop before accepting a release of the workspace.

> [!CAUTION]
> Use a disposable Figma file. The plugin replaces the contents of the three pages it owns.

Run the native preflight, import `plugin/manifest.json` through **Plugins → Development → Import plugin from manifest**, open the plugin, then choose **Rebuild everything**.

```bash
pnpm install --frozen-lockfile
pnpm smoke:figma:preflight
```

| Check | Expected evidence |
| --- | --- |
| Build | The plugin finishes without a font or API error and reports zero layout issues |
| Performance | Record the elapsed time of the first and second complete builds; the final text reports reused repeated subtrees and native clone time, and the second run also reports the cleanup count and time |
| Document | Exactly `01 · Screens`, `02 · Design system`, and `03 · Design lab` are owned, in order; the first two are populated and the lab may be empty |
| Prototype | Presenting `01 · Overview`: the Overview, Releases and Settings tabs and the release rows navigate instantly, and the Releases breadcrumb goes back; on the release, **Promote to 100%** opens the dialog, and its close, **Cancel** and **Promote** buttons dismiss it; in Settings, ticking Visual regression enables **Save changes** and **Discard**; Save shows the failed-save banner, whose Dismiss button removes it, and Discard restores the form. The dialog and the banner visibly enter and exit, and the checkbox change animates, while page navigation stays instant |
| Fast refresh | Select `01 · Overview` or one of its layers, copy its Figma link, run **Refresh selected screen**, and copy the link again; both links keep the same `node-id`, the status reports one clean frame plus a smaller rewired-action count, and prototype playback still works |
| Typography | Noto Sans Regular, Medium and SemiBold, and Noto Sans Mono Regular, show no missing-font warning or substitution |
| Idempotence | Running **Rebuild everything** a second time replaces owned content without adding a page or duplicating a top-level frame |

The full-build prototype-link total is computed from native readback after every `setReactionsAsync()` call has completed, and is stored on the generated Screens page. Fast refresh preserves that total while writing and reading back only the actions owned by the replaced screen. A missing, extra, redirected, or rejected reaction in either scope is a build error; a partial count is never presented as a complete rebuild. The total counts every navigation action individually. Readback also compares the transition type, the duration and the exact cubic-bezier with Primer's transition.

Record the Figma version, operating system, date, both complete-build times, the fast-refresh time, the final plugin status text, and pass or fail for every check in the review handoff. A local PNG is inspection evidence, not a substitute for this gate.

## Interpreting signatures

- The document signature protects Screens, Design system, shared variables and styles, the plugin UI and manifest, and the existence and order of all three workspace pages. Design lab contents are excluded from parity but remain inside the structural and rendered-tree accessibility audits.
- Structural maintenance must retain both accepted signatures exactly.
- Intentional visual work may produce a candidate delta, but a failing signature remains a failed gate until a human reviews the output.
- Updating a baseline is permitted only in an explicitly authorized `BASELINE_ACCEPTANCE` task. Never edit audit thresholds or canonicalization to disguise a delta.

To prepare a candidate for review, print it without writing anything:

```bash
pnpm --silent design:signature
pnpm --silent design:components
```

After a human approves the reviewed output, the acceptance task writes exactly that output to `plugin/baselines/design.json` and `plugin/baselines/components.json`, and nothing else.

## Handoff evidence

Report the active mode, changed write zones, commands run, signature result, and any warnings or proposed design-system gaps. Do not claim completion from a partial gate.
