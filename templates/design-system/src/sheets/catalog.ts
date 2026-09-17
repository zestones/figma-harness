/* The documentation sheets, in page order, and the groups they appear in. */

import { sheetColours } from './colors.ts';
import { sheetComponents } from './components.ts';
import { sheetFoundations } from './foundations.ts';

export const SHEETS = Object.freeze([sheetColours, sheetFoundations, sheetComponents]);

export const SHEET_GROUPS = Object.freeze([
  Object.freeze({ name: 'Colour', note: 'The palette and the roles components paint with.' }),
  Object.freeze({ name: 'Foundations', note: 'Text styles, spacing and motion.' }),
  Object.freeze({ name: 'Components', note: 'Every component, in each of its states.' }),
]);
