# ADR 0001: A light workspace with a dark sidebar

- Status: Accepted

## Context

Carrara is for software where people read figures all day: payments, balances, disputes. The screens are dense, so the palette must keep text readable on every surface, tell states apart without relying on hue, and leave one colour free to mark what can be acted on. The harness measures all of this on every build, so each value below is a measured choice rather than a taste.

## Decision

- **A light workspace.** Cards, tables and dialogs are white (`bg/surface`) on a pale page (`bg/canvas`, `#F7F8FA`), with `bg/subtle` for table headers. Each step is at least 1.03:1 from the next, so regions separate without heavy borders; cards still keep a 1 px `border/default`.
- **A near-black sidebar.** The sidebar (`bg/inverse`, `#0B0F18`) frames the workspace and keeps navigation apart from content. Its own ink roles keep every label at 4.5:1 or more, and the current item takes `bg/inverse-raised`.
- **Cool neutral greys.** Every grey shares a hue near 263°, with chroma under 0.03, so no surface reads as tinted. `text/primary` reaches 17.8:1 on white and `text/secondary` 7.8:1; `text/tertiary` is kept for captions and still passes 4.5:1 on every light ground.
- **One accent.** Indigo 600 (`#4F46E5`) marks primary actions, selection, the current tab and the main chart series, at 6.3:1 against white. Links use indigo 700. The only other use is the pale tint behind avatar initials.
- **States that survive colour-vision deficiency.** Positive (`#156F41`), warning (`#835A00`) and critical (`#C1253B`) were chosen together with the accent and the comparison grey: the closest pair, warning and critical under deuteranopia, stays 14.7 ΔE apart, above the 12 the audit asks for. Every badge, trend and timeline mark also carries a word, so colour is never the only signal.
- **Controls at 3:1.** Button and field edges use grey 500, at 3.4:1 on white and 3.2:1 on the page. The focus outline is indigo 500, 2 px wide and 2 px outside the control. Under every simulated vision it keeps 4:1 or more on the page, cards, table headers and the sidebar, and at least 3.4:1 on the segmented track and the current sidebar item.
- **Scoped roles.** Each role lists where Figma may paint it: surfaces fill frames, edges only stroke, ink only fills text and shapes. The scope audit rejects any other use.

## Consequences

A new colour starts as a role with a purpose and scopes, then a contrast pair or a place in the categorical list; the audits decide whether it can ship. Dark mode is out of scope: the ladders, pairs and colour-vision table describe the light workspace only.

## Rejected alternatives

- A dark workspace: dense tables and charts read less well, and the ink ramp the theme audit checks assumes light grounds.
- A light sidebar: navigation and content blur together on wide screens.
- A green accent: it would compete with the positive state on every table.
- Brighter state colours: as badge and table text they would fall under 4.5:1 on white.
