# Engine

`@figma-harness/engine` holds the Figma mechanics every design system shares. It knows no token name, component or app.

| Module | Owns |
| --- | --- |
| `node-factory.ts` | `f()` frames with auto layout, sizing, bound fills and strokes, effect styles; `abs()`, `add()`, `strut()` |
| `figma-resources.ts` | Installed variables and styles by name, bound paints, colour parsing |
| `token-installer.ts` | Idempotent installation of a design system's variables, text styles and effect styles |
| `font-loader.ts` | Font loading and the style names each platform uses |
| `dimension-bindings.ts` | Native variable bindings for sizes, gaps, paddings and radii |
| `layout-math.ts`, `struts.ts` | Column spans, and the space left in a row or column |
| `layout-lint.ts` | Overflow, clipping and spilled-text checks run after a build |
| `pages.ts` | The owned pages, clearing them, focusing the viewport |
| `prototype-reactions.ts` | Writing reactions and reading them back |
| `render-cache.ts` | Cloning repeated, reaction-free subtrees during one screen build |

Design systems import it directly; apps reach it through their design system's facade. Its tests use the harness's Figma mock.
