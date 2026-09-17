import assert from 'node:assert/strict';
import path from 'node:path';
import test from 'node:test';
import { bundledFamilies, useDesignSystemFonts } from '@figma-harness/harness/core/bundled-fonts.ts';
import { COLORS, COLOR_SCOPES } from '../src/foundations/colors.ts';
import { DIMS, SPACING } from '../src/foundations/dimensions.ts';
import { FONTS } from '../src/foundations/typography.ts';

test('every text style is measured with a bundled font', () => {
  useDesignSystemFonts(path.resolve(__dirname, '..'));
  const families = bundledFamilies();
  for (const font of FONTS) assert.ok(families[font.family], font.family + ' is bundled for measurement');
});

test('every colour says where it may be painted, and every size is unique', () => {
  for (const [name, value, description] of COLORS) {
    assert.ok(COLOR_SCOPES[name]?.length, name + ' has no scope');
    assert.match(value, /^#[0-9A-F]{6}$/, name);
    assert.ok(description, name + ' has no description');
  }
  const names = DIMS.map((token) => token.name);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual([...SPACING], [...SPACING].sort((a, b) => a - b));
});
