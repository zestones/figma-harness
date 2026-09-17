/* The documentation sheets, in page order, and the groups they appear in. */

import { sheetActions } from './actions.ts';
import { sheetColours, sheetStates } from './colors.ts';
import { sheetData } from './data.ts';
import { sheetFeedback } from './feedback.ts';
import { sheetIcons, sheetLayout, sheetTypography } from './foundations.ts';
import { sheetNavigation } from './navigation.ts';

const catalog = [
  sheetColours, sheetStates,
  sheetTypography, sheetLayout, sheetIcons,
  sheetActions, sheetNavigation, sheetData, sheetFeedback,
];

if (new Set(catalog.map((definition) => definition.code)).size !== catalog.length) {
  throw new Error('two sheets share a code');
}

export const SHEETS = Object.freeze(catalog);

export const SHEET_GROUPS = Object.freeze([
  Object.freeze({ name: 'Colour', note: 'The roles components paint with, how states read, and what the audits measure.' }),
  Object.freeze({ name: 'Foundations', note: 'Type, space, corners, shadows, icons, motion and focus.' }),
  Object.freeze({ name: 'Components', note: 'Every component in its states, from buttons to dialogs.' }),
]);
