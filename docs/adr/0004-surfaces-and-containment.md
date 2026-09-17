# ADR 0004: Surfaces and containment

- Status: Accepted

## Context

A surface language that repeats fill, radius, border and shadow at every nested level makes a container's contents look like smaller copies of the container. Primer's product UI avoids that: the page is white, content sits in bordered boxes, and shadows are kept for controls and for layers that float above the page.

## Decision

- **Page and header.** The page is `bgColor/default`. The global header uses `page/header/bgColor` with a bottom border, and panes and navigation sit on the page itself.
- **Boxes contain.** A list, a table, a check summary or a danger zone is a `box()`: `borderColor/default` on a 6 px radius, an optional `bgColor/muted` header, and `borderColor/muted` dividers between rows. A danger zone swaps the edge for `borderColor/danger-emphasis`. Rows inside a box are never boxes themselves.
- **Borders, not shadows, separate content.** A box has no shadow. A region inside a box uses a heading and a divider, not another box.
- **Shadows keep their Primer roles.** They are effect styles named by their token path:

| Effect style | Used by |
| --- | --- |
| `button/default/shadow/resting` | Default and danger buttons at rest |
| `shadow/resting/small` | Primary buttons, and danger buttons when hovered |
| `button/primary/shadow/selected` | Pressed primary buttons |
| `shadow/inset` | Text inputs and selects |
| `shadow/floating/small` | Dialogs, over `overlay/backdrop/bgColor` |
| Other resting and floating shadows | Shown on sheet F3 and available to new components |

- **Radii follow the component.** `borderRadius/small` (3 px) for checkboxes, breadcrumb links, progress bars and skeletons; `medium` (6 px) for buttons, inputs, boxes, banners, list items and tooltips; `large` (12 px) for dialogs; `full` for avatars, radios, labels, counters and timeline badges. Flat regions use 0.

## Enforcement

The `radius-scale` rule checks the Screens and Design system pages, including nested regions and rectangle marks. It accepts the scale, geometry rounded on its shorter side, a focus outline whose radius follows its control ([ADR 0003](./0003-focus-outlines.md)), and the exceptions in `RADIUS_EXCEPTIONS` (`designs/harness-contract.ts`). The only exception is the toggle knob: 4 px, Primer's 6 px track radius less the 2 px between them. The Design lab is exempt. The accessibility audit fails an elevated node that sits on its own fill without a border, and reports each shadow's darkest layer against the page.

## Rejected alternatives

- Cards with a shadow for every group: Primer's product pages use borders, and a shadow on the page would read as a floating layer.
- A tinted canvas behind white boxes: it is not Primer's light theme, and the border already carries containment.
- Rounding the toggle knob to the scale: 3 or 6 px would not be concentric with its track.
