'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const runtimeGlobal = global as typeof global & { figma?: unknown };

test('sheet catalog is declarative, ordered, unique, and Figma-free at import', async () => {
  delete runtimeGlobal.figma;
  const { SHEETS } = await import('../src/sheets/catalog.ts');
  assert.equal(runtimeGlobal.figma, undefined);
  assert.equal(Object.isFrozen(SHEETS), true);
  assert.deepEqual(SHEETS.map((definition) => definition.code), [
    'A1', 'A2', 'A3', 'A4', 'A5', 'A6',
    'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7',
    'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8',
  ]);
  assert.equal(new Set(SHEETS.map((definition) => definition.code)).size, SHEETS.length);
  assert.equal(SHEETS.every((definition) =>
    Object.isFrozen(definition) && typeof definition.build === 'function'), true);
});

test('sheet groups cover every sheet, in the order the page shows them', async () => {
  const { SHEETS, SHEET_GROUPS } = await import('../src/sheets/catalog.ts');
  assert.deepEqual(SHEET_GROUPS.map((group) => group.name), ['Colour', 'Foundations', 'Components']);
  assert.equal(SHEETS.every((sheet) => SHEET_GROUPS.some((group) => group.name === sheet.group)), true);
  assert.equal(SHEET_GROUPS.every((group) => group.note.length > 0), true);
});
