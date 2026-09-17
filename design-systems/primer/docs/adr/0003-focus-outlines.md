# ADR 0003: Focus outlines

- Status: Accepted

## Context

Primer does not draw one universal focus ring. Each component sets its own `outline-offset`: a button's outline covers its own edge, a text input's crosses its border, a checkbox's stands off the control. A single generic ring would contradict the components it claims to reproduce, and a focus state that changes a control's border or layout moves the control when it gains focus.

## Decision

A focused control keeps its layout, fill, border and content. `withFocus()` adds an empty, absolutely positioned `focus-ring` layer: a 2 px inside stroke bound to `focus/outline-color`. Its box extends past the control by the offset plus the outline width, so its corner radius is the control's radius plus that extent, as a CSS outline follows its border radius.

| Placement | Offset | Extent | Used by |
| --- | ---: | ---: | --- |
| `inset` | −2 px | 0 | Buttons, icon buttons, pagination pages, underline navigation tabs |
| `edge` | −1 px | 1 px | Text inputs, selects, segmented controls |
| `flush` | 0 | 2 px | Action list and navigation list items |
| `outset` | 2 px | 4 px | Checkboxes, radios, breadcrumb links |
| `toggle` | 3 px | 5 px | The toggle switch |

- **Emphasis fills.** Primer draws a 3 px inset band in `fgColor/onEmphasis` under the outline of a primary button and of the current pagination page, so the outline stays visible against the fill. The kit draws it as a `focus-band` layer below the ring, only with an `inset` placement.
- **Resting edge.** A text input's border turns accent when focused. The control records its resting border token (`spec.focus.rest-edge`), so the audit measures the outline against the edge it replaces, not the focused one.
- **Contract.** `src/foundations/focus.ts` owns the width, token, offsets, band and layer names, and the placement is recorded on each control (`spec.focus.placement`). The rendered layer is marked `aria.role = presentation`.
- **Specimens.** The component sheets C1–C4 and the accessibility sheet F7 render every placement in its focused state. On the screens, only the promote dialog shows focus, on its confirm button, as Primer's confirmation dialog does when it opens.

## Verification

The accessibility audit (`audit:a11y`, WCAG 2.4.13) fails a focused control whose outline is missing or duplicated, hidden, moved, resized, filled, recoloured, part of the auto layout, clipped by the control or any ancestor, or whose radius no longer follows the control. It measures the outline against every pixel it replaces (the ground outside, the control's edge, its fill or the band, by extent) at 3:1, under normal vision and simulated protanopia, deuteranopia and tritanopia. A control stroked directly with the focus colour fails, except for the colour sheet's own swatch of the token. The radius rule accepts an outline's radius only while it sits where its placement puts it.

## Rejected alternatives

- One ring with a fixed 2 px gap for every control: it is not what Primer's components draw.
- Changing the control's own stroke to show focus: it hides the resting edge and cannot express an outset outline.
- Drawing the band as an inner shadow on the control: it would change the control itself, and a separate layer is checked exactly like the ring.
