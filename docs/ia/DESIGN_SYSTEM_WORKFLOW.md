# Design-system change workflow

A design-system change is a separate task because it changes the vocabulary every future page can use.

## Required sequence

1. State the missing reusable capability and at least two credible consumers.
2. Check existing ADRs and add or amend an ADR when the change alters a cross-cutting visual, interaction, accessibility, or semantic decision.
3. Choose the smallest owning layer: foundation, primitive, component, or pattern. Do not put Figma mechanics outside `engine/`.
4. Add the supported export to `kit/public.ts` only when page authors should use it. Internal helpers stay private.
5. Demonstrate the capability on the appropriate design-system sheet and add focused tests or audits. A new component family is added to `kit/components/inventory.ts` so the inventory audit requires a specimen.
6. Keep the audit contract in step with the tokens (see below).
7. Run the `DESIGN_SYSTEM_CHANGE` scope guard and all acceptance gates.
8. If the generated document changes, present the signature and render delta for review. Baseline acceptance remains a separate, explicit step.

Do not combine a kit change and the page that motivated it into one opaque diff. Keeping them separately reviewable makes the new contract, and its consumers, visible.

## Primer tokens and colour changes

Tokens and icons are Primer's. List a new one in `plugin/tools/tokens/catalog.ts` or `plugin/tools/icons/catalog.ts` and regenerate it; never type a Primer value by hand. Every colour token must appear as a `c/<token>` row on the Colour sheets (A1–A6), and the colour-inventory audit fails on a missing or unknown row. When you add or remove a colour, or update Primer:

- declare the pairs it must pass in `CONTRAST_PAIRS` (`kit/foundations/audit.ts`);
- give a state or data colour its family in `kit/foundations/semantics.ts`, so `CATEGORICAL_AUDIT` checks its separation under simulated colour-vision deficiency;
- keep neutral tokens inside the `THEME_AUDIT` chroma and hue policy, and keep the surface ladder and ink ramp in order;
- let the generator record which roles share a Primer source (`COLOR_SHARING_DECISIONS`); an exact shared value without a common source fails;
- paint each token only where its Figma scopes allow, or add a reviewed entry to `COLOR_SCOPE_EXCEPTIONS`;
- regenerate with `npm run tokens:generate`, rebuild, run `npm run cvd:generate`, then rebuild again.

A waiver belongs in `CATEGORICAL_AUDIT.waivers` or on a `SURFACE_CONTRAST_AUDIT` control, with its reason, and in [ADR 0002](../adr/0002-colour-roles.md). It is a reviewed decision that stays visible in every report, not a way to silence a failing audit.
