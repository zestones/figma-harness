# Design system template

`@figma-harness/template-design-system` is the design system template: a small, complete design system with a palette and its colour roles, six text styles in Noto Sans, a spacing scale, a focus outline, three transitions, four components and three documentation sheets. It passes every harness check, so a design system created from it starts clean.

## Layout

| Path | Owns | Sheet |
| --- | --- | --- |
| `src/foundations/colors.ts` | The palette, the colour roles components paint with, and where each role may be painted | A1 |
| `src/foundations/typography.ts` | Text styles | F1 |
| `src/foundations/dimensions.ts` | Spacing, radii and fixed sizes, installed as Figma variables | F1 |
| `src/foundations/motion.ts`, `focus.ts` | Prototype transitions and the focus outline | F1, C1 |
| `src/foundations/audit.ts` | What the harness measures: contrast pairs, colour-vision checks, theme rules | — |
| `src/foundations/cvd.generated.ts` | How the state colours look with colour-vision deficiency; generated, never edited | A1 |
| `src/primitives/`, `src/components/`, `src/patterns/` | Text and focus; Button, Badge, Card, ListRow; the screen layout and `starter`, the vocabulary the app template is written in | C1 |
| `src/sheets/` | The Design system page and its page chrome | all |
| `src/index.ts` | The vocabulary apps import | — |
| `src/system.ts` | The definition the plugin builds | — |
| `design-system.json` | The fonts and the generated table, for the harness | — |

Apps import only this package's main entry. Only the plugin imports its `/system` entry.

## Making it yours

1. Change the palette in `src/foundations/colors.ts`. Keep the roles: the audits say which pair loses contrast.
2. To change the font, update `src/foundations/typography.ts` and `design-system.json`, and add the font's Fontsource package to `package.json`.
3. Add a component under `src/components/`, export it from `src/index.ts`, show it on a sheet, and register its layer name in `src/components/inventory.ts`.
4. Regenerate the colour-vision table and run the checks:

   ```bash
   pnpm cvd:generate templates/design-system
   pnpm verify
   ```

`starter` in `src/patterns/starter.ts` draws the screens of every app created from the app template, and names the motion they animate a change of state with. Keep it working when components change.
