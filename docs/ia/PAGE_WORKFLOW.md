# Page authoring workflow

Paths below are inside the app, for example `apps/relay/`.

## 1. Turn intent into a brief

Create or update a brief in `docs/briefs/` from [`templates/PAGE_BRIEF.md`](templates/PAGE_BRIEF.md). Record the question the page answers, its data and context assumptions, states, required interactions, and acceptance evidence. A page name alone is not a sufficient specification.

## 2. Check the vocabulary

Inspect the design system's package entry (`design-systems/primer/src/index.ts`) and the existing files under `src/pages/`. Compose only exported vocabulary. If a reusable capability is absent, record the gap and request a separate `DESIGN_SYSTEM_CHANGE`; do not implement it locally.

## 3. Author in the write zone

- Put page composition in `src/pages/<page>.ts`, or in a `<page>/` directory once one file stops being readable. Build every screen inside `shell()` from `src/pages/frame.ts` so it shares the app header, the local navigation and the PageLayout.
- Put deterministic scenario data in `src/fixtures/` and export the supported portion from `src/fixtures/index.ts`.
- Import visuals only from `@figma-harness/primer` and data only from the fixture entry, by relative path.
- Register each screen in `SCREEN_GROUPS` (`src/screens.ts`) with a durable key and a unique visible title. Set `prototype: true` on groups that take part in the clickable prototype.
- Add the page to the local navigation in `src/app.ts` when it is a destination.
- Declare its transitions in `src/flows/`, add its keys to a screen family, and keep every prototype screen reachable from the start screen and able to leave it.
- Add its size-sensitive blocks and screens to `src/stress-cases.ts`.
- Bump `CATALOG_VERSION` in `src/screens.ts` whenever screen keys or the prototype matrix change, so documents built from an older version are rewired completely on their next refresh.

Do not place tokens, generic components, or Figma runtime mechanics in a page.

## 4. Prove behaviour and scope

Add focused tests under `tests/` for pure normalization, model, and layout logic. Then run, from the repository root:

```bash
pnpm build
pnpm guard:scope --mode=PAGE_AUTHORING --base=HEAD
pnpm verify
```

Use the actual task base ref instead of `HEAD` when validating a branch range. A new page changes the document, so `design:check` fails until a person reviews the candidate and approves a separate `BASELINE_ACCEPTANCE` task. Report the candidate signature; do not update a baseline yourself.
