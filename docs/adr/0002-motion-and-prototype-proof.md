# ADR 0002: Motion and prototype proof

- Status: Accepted

## Context

Timing values written only in prose drift from the prototype, and a prototype whose actions all use `transition: null` cannot show the intended behaviour. The motion values belong to the design system; how they reach the prototype, and how that is proven, belongs to the repository.

## Decision

- **The design system owns motion.** Its `DesignSystemDefinition.motion` publishes transition names and a resolver that returns a Figma Smart Animate transition with an exact easing curve. Primer's values are in [its ADR](../../design-systems/primer/docs/adr/0006-motion.md).
- **The app owns intent.** Its flow matrix (`AppDefinition.prototype`) names, per transition, the source screens, the layer selector, the destination and an optional motion name. The plugin's `composition.ts` joins the two, and `document/prototype.ts` writes the reactions.
- **Navigation stays instant.** Transitions whose id starts with an instant prefix the app declares (Relay: `nav.`, `open.`, `back.`) carry no motion, and neither do native Back and server-driven (timeout) transitions.
- **Smart Animate everywhere.** Matching layers stay in place, so only the changed state moves or fades.

In Relay, the promote dialog enters and exits, checking a required check and discarding the draft change state, and the failed-save banner enters on Save and leaves when dismissed.

## Enforcement

The static flow guard rejects an unknown transition name, motion on an instant prefix, on native Back and on timeout transitions, unknown screens, and unreachable frames. After the build, the runtime audit reads the reactions back from the Figma document and compares trigger, destination, transition type, duration and the exact cubic-bezier. It also requires a visible change between the two frames of every animated action: an `enter` must add a visible layer and an `exit` must remove one.

## Rejected alternatives

- Keeping timings on the motion sheet only: an inventory cannot prevent prototype drift.
- Animating page navigation: it suggests spatial relationships the application does not have and slows frequent navigation.
- Ambient or looping motion: a screen left open must not move without a request or an action.
