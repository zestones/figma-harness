/* Declarative, ordered design-system sheet catalog, and the groups the
 * Design system page shows them in. */

import { sheetF7 } from './accessibility.ts';
import { sheetA1, sheetA2, sheetA3, sheetA4, sheetA5, sheetA6 } from './colors.ts';
import { sheetC1, sheetC2, sheetC3, sheetC4 } from './components.ts';
import { sheetF1, sheetF2, sheetF3, sheetF4, sheetF5, sheetF6 } from './foundations.ts';
import { sheetC5, sheetC6, sheetC7, sheetC8 } from './patterns.ts';
import type { SheetDefinition } from './support.ts';

const catalog: SheetDefinition[] = [
  sheetA1, sheetA2, sheetA3, sheetA4, sheetA5, sheetA6,
  sheetF1, sheetF2, sheetF3, sheetF4, sheetF5, sheetF6, sheetF7,
  sheetC1, sheetC2, sheetC3, sheetC4, sheetC5, sheetC6, sheetC7, sheetC8,
];

const codes = new Set<string>();
for (const definition of catalog) {
  if (codes.has(definition.code)) {
    throw new Error('Duplicate sheet code: ' + definition.code);
  }
  codes.add(definition.code);
}

export const SHEETS = Object.freeze(catalog);

/* Groups appear in this order. Colour first, because it is the sheet anyone
   re-theming the interface opens before any other. */
export const SHEET_GROUPS = Object.freeze([
  Object.freeze({
    name: 'Colour',
    note: 'Primer\'s light theme as installed variables: surfaces and ink, the state families, controls, buttons, and the data series.',
  }),
  Object.freeze({
    name: 'Foundations',
    note: 'Type, size, shadows, layout, motion and Octicons, each read from Primer Primitives, and the accessibility evidence behind them.',
  }),
  Object.freeze({
    name: 'Components',
    note: 'Primer React\'s components rebuilt as Figma layers, with the states and the rule each one exists to enforce.',
  }),
]);
