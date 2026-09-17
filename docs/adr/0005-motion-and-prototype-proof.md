# ADR 0005: Motion and prototype proof

- Status: Accepted

## Context

Timing values written only in prose drift from the prototype, and a prototype whose actions all use `transition: null` cannot show the intended behaviour. Primer publishes motion as tokens, so the prototype can use exactly those values.

## Decision

Motion comes from Primer Primitives, through the generated module.

| Transition | Duration | Easing (cubic-bezier) | Used for |
| --- | ---: | --- | --- |
| `enter` | 300 ms (`medium`) | `enter` (0.3, 0.8, 0.6, 1) | A dialog or a banner appears |
| `exit` | 200 ms (`short`) | `exit` (0.7, 0.1, 0.75, 0.9) | A dialog or a banner leaves |
| `stateChange` | 200 ms (`short`) | `move` (0.6, 0, 0.2, 1) | A checkbox changes, a draft is discarded |
| `hover` | 100 ms (`micro`) | `hover` (0.25, 0.1, 0.25, 1) | Reserved for hover feedback |

`prototypeMotionTransition()` turns a transition into a Figma Smart Animate action with a `CUSTOM_CUBIC_BEZIER` easing, so the prototype uses Primer's curve rather than the nearest Figma preset. Smart Animate keeps matching layers in place, so only the changed state moves or fades.

Page navigation, opening a release and Back stay instant, and so would any server-driven (timeout) transition. `prefers-reduced-motion` maps every duration to 0 in the product; the Figma prototype shows the nominal motion, because a presentation cannot read the viewer's preference.

In Relay, the promote dialog enters and exits; checking a required check and discarding the draft use `stateChange`; the failed-save banner enters on Save and exits when dismissed.

## Enforcement

The static flow guard rejects an unknown transition name, motion on `nav.`, `open.` or `back.` transitions, on native Back, and on timeout transitions. After the build, the runtime audit reads the reactions back from the Figma document and compares trigger, destination, transition type, duration and the exact bezier. It also requires a visible change between the two frames of every animated action: an `enter` must add a visible layer and an `exit` must remove one. Sheet F5 is generated from the same constants.

## Rejected alternatives

- Figma's easing presets: `EASE_OUT` is not Primer's `enter` curve, and a close match would not be checkable.
- Animating page navigation: it suggests spatial relationships the application does not have and slows frequent navigation.
- Ambient or looping motion: a screen left open must not move without a request or an action.
