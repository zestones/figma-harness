# Page authoring workflow

## 1. Turn intent into a brief

Create or update a brief from `templates/PAGE_BRIEF.md`. Record the question the page answers, its data and context assumptions, states, required interactions, and acceptance evidence. A page name alone is not a sufficient specification.

## 2. Check the public vocabulary

Inspect `plugin/src/kit/public.ts` and the existing files under `designs/pages/`. Compose only exported vocabulary. If a reusable capability is absent, record the gap and request a separate `DESIGN_SYSTEM_CHANGE`; do not implement it locally.

## 3. Author in the write zone

- Put page composition in `plugin/src/designs/pages/<page>.ts`, or in a `<page>/` directory once one file stops being readable. Build every screen inside `shell()` from `pages/frame.ts` so it shares the app header, the local navigation and the PageLayout.
- Put deterministic scenario data in `plugin/src/fixtures/` and export the supported portion from `fixtures/public.ts`.
- Import kit vocabulary only from `../../kit/public.ts` and fixtures only from `../../fixtures/public.ts`, adjusting the relative depth.
- Register each screen in `SCREEN_GROUPS` (`pages/state-matrix.ts`) with a durable key and a unique visible title. Set `prototype: true` on groups that take part in the clickable prototype.
- Add the page to the local navigation in `designs/app.ts` when it is a destination.
- Declare its transitions in `designs/flows/`, add its keys to a screen family, and keep every prototype screen reachable from the start screen and able to leave it.
- Add its size-sensitive blocks and screens to `pages/stress-cases.ts`.
- Bump `SCREEN_CATALOG_VERSION` in `designs/screens.ts` whenever screen keys or the prototype matrix change, so documents built from an older version are rewired completely on their next refresh.

Do not place tokens, generic components, or Figma runtime mechanics in a page.

## 4. Prove behavior and scope

Add focused tests for pure normalization, model, and layout logic. Then run, from `plugin/`:

```bash
npm run build
npm run guard:scope -- --mode=PAGE_AUTHORING --base=HEAD
npm run verify
```

Use the actual task base ref instead of `HEAD` when validating a branch range. A new page changes the document, so `design:check` fails until a human reviews the candidate and approves a separate `BASELINE_ACCEPTANCE` task. Report the candidate signature; do not update a baseline yourself.
