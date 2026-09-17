# ADR 0002: Colour roles, scopes and waivers

- Status: Accepted

## Context

A palette that mixes decoration, meaning and chart series invites three failures: a re-theme that silently changes what a colour means, a state that only colour carries, and a chart series mistaken for a state. Primer already separates these roles. The kit must keep that separation, and the audits must state plainly where Primer's light theme falls short of a stricter rule.

## Decision

Every installed colour keeps its Primer role.

| Role | Tokens | Rule |
| --- | --- | --- |
| Neutral UI | `fgColor/default`, `muted`, `onEmphasis`, `disabled`, `link`; `bgColor/default`, `muted`, `inset`, `emphasis`; `borderColor/default`, `muted`, `emphasis` | Ink, surfaces and edges; nothing depends on their hue |
| Component | `button/*`, `control/*`, `controlTrack/*`, `counter/*`, `overlay/*`, `underlineNav/*` and the like | Used only by the component they name |
| State | `neutral`, `accent`, `success`, `attention`, `severe`, `danger`, `done` families, each with an ink, a muted and an emphasis surface, and two borders | Always paired with a word, and with an Octicon where Primer draws one |
| Data | `data/{blue,green,orange,purple}/color/*`, `data/gray` for "Other" | Assigned by position and named in a legend beside the swatch |

- **Aliased families.** `open`, `closed` and `draft` resolve to the values of `success`, `danger` and `neutral` under their own names, so a state can change colour in another theme without changing meaning. The audits measure the source families once.
- **Accent is a choice, not an outcome.** Accent marks links, the current item and selection; the focus outline has its own token with the same value. Components paint with their own tokens: the primary button uses `button/primary/*`, which Primer links to the success emphasis.
- **A state is a word first.** StateLabel, Banner, Timeline and validation messages pair their colour with text and an icon (WCAG 1.4.1).
- **Scopes.** Each variable carries Primer's Figma scopes: ink paints text and shapes, surfaces paint frames and shapes, borders paint strokes. A paint outside its token's scope fails, unless `COLOR_SCOPE_EXCEPTIONS` lists it with a reason. The only exception is the focus band ([ADR 0003](./0003-focus-outlines.md)): a box-shadow in CSS, drawn as a stroke in Figma.
- **Shared values.** Many roles resolve to the same Primer base colour. `COLOR_TOKEN_OWNERSHIP` records the source of each token, and `COLOR_SHARING_DECISIONS` says whether roles that share it are linked aliases or independent meanings. An exact shared value without a common source fails.
- **Translucency.** Translucent tokens are measured after flattening over the ground they are declared on, never as if opaque.

## Waivers

Primer's light theme does not keep every colour separable under simulated colour-vision deficiency, and a few control edges stay under 3:1. These are reviewed waivers in `kit/foundations/audit.ts`. They are reported as warnings with their reason, never hidden:

- state colours that meet on one screen, because each carries its word and icon (readers who need separated hues use Primer's colour-blind themes, which this project does not install);
- a state colour beside a chart series, because both are named in words;
- the resting text-input edge, because a visible label always names the field;
- the resting toggle track, because the switch states On or Off in words;
- the segmented-control track, because the selected segment is also raised and set in semibold;
- the current underline tab, because it is also semibold and marked `aria-current`.

## Enforcement

`kit/foundations/audit.ts` declares the policy, and the tools measure it:

- `audit:contrast` checks every declared pair, including state inks on their tints and labels on emphasis surfaces;
- `audit:a11y` checks every rendered text against its real backdrop, with translucent layers composited and disabled controls reported but exempt from 1.4.3, requires a word or texture near every state-painted mark, and measures categorical separation under simulated protanopia, deuteranopia and tritanopia;
- `audit:theme` checks neutral chroma and hue drift, the surface ladder, the ink ramp, and the accent's readability;
- the `color-inventory` rule requires a swatch row for every token, and the `token-scope` rule enforces the scopes.

## Rejected alternatives

- Re-tuning Primer's values until every simulation passes: the theme would stop being Primer.
- More than four data series: every extra hue must be told apart from every other colour; the rest is grouped as "Other".
- Treating a waiver as a pass: a waived pair stays visible in every audit report, so a later theme can remove it.
