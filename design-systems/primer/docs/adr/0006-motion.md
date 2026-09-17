# ADR 0006: Motion

- Status: Accepted

## Context

Primer publishes motion as tokens: durations, easing curves, and named transitions that combine them. The prototype should use exactly those values, and the repository's prototype proof ([docs/adr/0002](../../../../docs/adr/0002-motion-and-prototype-proof.md)) checks them after the build.

## Decision

Motion comes from Primer Primitives, through the generated module, and `src/foundations/motion.ts` exposes it.

| Transition | Duration | Easing (cubic-bezier) | Used for |
| --- | ---: | --- | --- |
| `enter` | 300 ms (`medium`) | `enter` (0.3, 0.8, 0.6, 1) | A dialog or a banner appears |
| `exit` | 200 ms (`short`) | `exit` (0.7, 0.1, 0.75, 0.9) | A dialog or a banner leaves |
| `stateChange` | 200 ms (`short`) | `move` (0.6, 0, 0.2, 1) | A control changes state, a draft is discarded |
| `hover` | 100 ms (`micro`) | `hover` (0.25, 0.1, 0.25, 1) | Reserved for hover feedback |

`prototypeMotionTransition()` turns a transition into a Figma Smart Animate action with a `CUSTOM_CUBIC_BEZIER` easing, so the prototype uses Primer's curve rather than the nearest Figma preset. `PRIMER.motion` (in `src/system.ts`) hands the names and the resolver to the plugin.

`prefers-reduced-motion` maps every duration to 0 in the product. The Figma prototype shows the nominal motion, because a presentation cannot read the viewer's preference.

Sheet F5 is generated from the same constants.

## Rejected alternatives

- Figma's easing presets: `EASE_OUT` is not Primer's `enter` curve, and a close match could not be checked.
- One duration for everything: entering, leaving and changing state have different jobs.
