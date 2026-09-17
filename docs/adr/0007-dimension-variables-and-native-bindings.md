# ADR 0007: Dimension variables and native bindings

- Status: Accepted

## Context

A size that is installed as a Figma variable but typed as a number in every layer does not own anything: editing the variable changes nothing. Binding by value is no better, because equal numbers do not mean equal roles.

## Decision

Foundations own every reusable dimension, Figma variables expose them, and the layers that use them bind them natively. Each role keeps its own variable, even when two roles share a number.

| Role | Values | Variables |
| --- | --- | --- |
| Base scale, used for gaps and paddings | 2 to 128 px | `base/size/*` |
| Control heights | 24, 28, 32, 40, 48 px | `control/{xsmall,small,medium,large,xlarge}/size` |
| Control padding and gaps | 8, 12, 16 px and 4, 8 px | `control/*/paddingInline/*`, `control/*/gap` |
| Stack padding and gaps | 8, 16, 24 px | `stack/padding/*`, `stack/gap/*` |
| Overlay widths and padding | 192, 320, 480, 640 px and 8, 16 px | `overlay/width/*`, `overlay/padding/*` |
| Radii | 3, 6, 12 px, full | `borderRadius/*`, `overlay/borderRadius` |
| Global header, pane, content width | 64, 296, 1280 px | `app/header/height`, `app/pane/width`, `app/content/maxWidth` |

The `app/*` sizes are the only ones the kit adds: Primer's PageLayout sets them in CSS rather than as tokens. Everything else is Primer's, with Primer's Figma scopes.

## Ownership and authoring

`kit/foundations/dimensions.ts` owns the installed inventory, the shell dimensions and the typed `dim()` references. Figma mechanics stay in `engine/dimension-bindings.ts` and the frame factory.

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

Installation reconciles values, scopes and descriptions on every run, including for variables an earlier build installed, and keeps their identity. It only reads and writes the `Primer / Size` and `Primer / Color (light)` collections, so a variable with the same name in another collection is never overwritten or bound by accident.

Editing a variable in Figma updates every bound property. Calculated widths and remaining heights are still computed from source, so a token edit is not a relayout engine. Durable changes belong in the repository and need a rebuild; nothing syncs editor edits back.

Figma documents the mechanism in [Working with variables](https://developers.figma.com/docs/plugins/working-with-variables/) and the picker-only meaning of scopes in [Variable scopes](https://developers.figma.com/docs/plugins/api/properties/Variable-scopes/).

## Verification

`tools/tests/dimension-bindings.test.ts` covers scoped and idempotent installation, identity preservation, scope repair, native binding calls, cloned bindings, variable edits, explicit unbinding, rejection of a property outside a variable's scope, every generated shell, and the resolved value of every bound property. The design and component signatures include the bindings.

## Rejected alternatives

- Installing variables without binding the layers: the tokens would not own the properties they appear to control.
- Binding every equal number to one variable: it confuses a role with a value.
- One page-padding token for every inset: Primer already separates stack, control and overlay spacing.
