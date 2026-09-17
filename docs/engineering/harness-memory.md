# Harness memory

The offline harness builds the whole Figma document inside a Node `vm` against a mock Figma API. A document of a few thousand nodes is cheap; the ones this harness was hardened on reached well over a hundred thousand nodes, where every retained object and every duplicated build mattered. This note records the design rules that keep memory bounded, so contributors do not reintroduce the defects they fixed.

## Mock nodes

- **Shared behavior.** Node methods live on shared prototypes. Enum accessors are shared functions whose per-node values are stored under weak keys, and plugin-data maps are allocated only when first written. On a synthetic sample of 5,001 nodes, this cut the additional retained heap from 47.6 MiB to 10.7 MiB.
- **No graveyard.** The node inventory reads live nodes from the ID index, so a removed node and its subtree can be collected. A removed frame that was never attached keeps only a small record of names, so the orphan audit still reports it. After removal and collection, the same sample retained 0.6 MiB instead of 47.7 MiB.
- **Visible surface unchanged.** Signatures read the same enumerable node properties as before; plugin data stays outside the hash.

## Signatures and tests

- **Stream, never materialize.** The design signature writes the canonical JSON of the protected pages straight into SHA-256. It never holds the snapshot tree or its string. Tests compare streamed and materialized serialization byte for byte.
- **One document at a time.** A test that compares two builds captures the first build's digest and counts, removes its frames, and releases its harness before building the second.
- **Assert on scalars.** Compare counts and digests, never arrays of nodes. When an assertion on a node array fails, the runner formats the whole graph: 16 tiny frames already produce a 156,031-character message.
- **No second document.** A tool that only needs installed colour variables installs tokens in a fresh harness without building any page (see `tools/accessibility/cvd-table.ts`). Tree audits reuse one ancestor stack instead of allocating one per node.

## Bounded execution

`npm run isolated -- <task>` runs one task in a transient systemd user service under `app.slice`. It verifies the effective limits before starting and refuses to fall back to unbounded execution.

| Limit | Value |
| --- | --- |
| Memory (whole process group) | 1 GiB, soft limit 768 MiB, no swap, group OOM kill |
| V8 old space | 512 MiB; 640 MiB for `audit:a11y` |
| Tasks | 64 |
| CPU | one core |
| Runtime | 180 s |
| Core dumps | disabled |

The runner also sets one V8 background worker, two libuv workers, `GOMAXPROCS=1`, and `RAYON_NUM_THREADS=1`. Without these caps, esbuild could not create an operating-system thread inside the 64-task limit. The runner prints the memory and task peaks and releases its own service. There is no aggregate `verify` task, and test runs need explicit file selectors.

## Diagnostics

`diagnose:memory` samples allocations and collects garbage explicitly on a bounded fixture. It never writes a heap snapshot.

```bash
npm run isolated -- diagnose:memory nodes renders/memory/nodes.json
npm run isolated -- diagnose:memory assertion renders/memory/assertion.json
npm run isolated -- diagnose:memory document renders/memory/document.json
npm run isolated -- diagnose:memory lab renders/memory/lab.json
```

`nodes` measures live and removed mock nodes, `assertion` measures failure formatting, `document` performs three complete builds and records the heap after each, and `lab` records the Design lab frame signatures. Output stays under the ignored `renders/` directory.
