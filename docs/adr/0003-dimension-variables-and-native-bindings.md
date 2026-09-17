# ADR 0003: Dimension variables and native bindings

- Status: Accepted

## Context

A size that is installed as a Figma variable but typed as a number in every layer does not own anything: editing the variable changes nothing. Binding by value is no better, because equal numbers do not mean equal roles.

## Decision

The design system owns every reusable dimension, Figma variables expose them, and the layers that use them bind them natively. Each role keeps its own variable, even when two roles share a number. A design system lists its sizes with their Figma scopes; Primer's inventory is in its [README](../../design-systems/primer/README.md#sizes).

## Ownership and authoring

The design system's foundations own the installed inventory, the shell dimensions and the typed `dim()` references (Primer: `design-systems/primer/src/foundations/dimensions.ts`). Figma mechanics stay in the engine: `packages/engine/src/dimension-bindings.ts`, the frame factory, and the token installer.

```ts
const content = await f({
  name: 'content', dir: 'V', w: contentWidth,
  gap: dim('stack/gap/normal'),
  pad: dim('stack/padding/spacious'),
});
```

A `dim()` reference carries the number and the variable's identity. The variable's Figma scopes decide which properties it may own: `WIDTH_HEIGHT` for width and height, `GAP` for gaps and paddings, `CORNER_RADIUS` for radii. The frame factory calls the native `setBoundVariable()` after it sets the literal geometry. Plain numbers stay valid for calculated widths, proportional chart geometry and zero insets; a matching number never selects a variable on its own.

Use `bindDimensions()` for a component whose geometry is already calculated, and `setDimension()` when a later state changes a dimension. Replacing a bound value with a calculated number clears the old binding, so a stale binding never keeps naming a previous size.

## Installation and editing

Installation reconciles values, scopes and descriptions on every run, including for variables an earlier build installed, and keeps their identity. It only reads and writes the design system's two collections (Primer: `Primer / Size` and `Primer / Color (light)`), so a variable with the same name in another collection is never overwritten or bound by accident.

Editing a variable in Figma updates every bound property. Calculated widths and remaining heights are still computed from source, so a token edit is not a relayout engine. Durable changes belong in the repository and need a rebuild; nothing syncs editor edits back.

Figma documents the mechanism in [Working with variables](https://developers.figma.com/docs/plugins/working-with-variables/) and the picker-only meaning of scopes in [Variable scopes](https://developers.figma.com/docs/plugins/api/properties/Variable-scopes/).

## Verification

`design-systems/primer/tests/dimension-bindings.test.ts` covers scoped and idempotent installation, identity preservation, scope repair, native binding calls, cloned bindings, variable edits, explicit unbinding, rejection of a property outside a variable's scope, every generated shell, and the resolved value of every bound property. The design and component signatures include the bindings.

## Rejected alternatives

- Installing variables without binding the layers: the tokens would not own the properties they appear to control.
- Binding every equal number to one variable: it confuses a role with a value.
- One page-padding token for every inset: it hides independent roles, as Primer's separate stack, control and overlay spacing show.
