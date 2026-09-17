import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultFamily, useDesignSystemFonts } from '../src/core/bundled-fonts.ts';
import { templatePackage } from '../src/core/workspace.ts';
import type { MockTextStyle } from '../src/runtime/figma-mock/types.ts';
import { layoutText, measure, wrapLines } from '../src/runtime/text-metrics.ts';

// The design system template's fonts, whichever app is active.
useDesignSystemFonts(templatePackage('design-system').dir);

const BODY: MockTextStyle = {
  id: 'S1',
  name: 'body/sm',
  fontName: { family: defaultFamily(), style: 'Regular' },
  fontSize: 12,
  lineHeight: { unit: 'PIXELS', value: 16 },
  letterSpacing: { unit: 'PERCENT', value: 0 },
  textCase: 'ORIGINAL',
};

test('text is measured with the design system\'s bundled fonts, with a fallback', () => {
  const family = defaultFamily();
  const regular = measure('Releases', 24, family, 0, false, 'Regular');
  const semiBold = measure('Releases', 24, family, 0, false, 'SemiBold');
  assert.ok(semiBold > regular, 'a heavier weight is wider');
  assert.equal(measure('Releases', 24, 'Unknown Family'), measure('Releases', 24, family), 'unknown families measure as the default family');
  assert.equal(measure('AB', 10, family, 2), measure('AB', 10, family) + 4);
  assert.equal(measure('ab', 10, family, 0, true), measure('AB', 10, family));
  assert.equal(measure('\u{1F9EA}', 10, family), 6, 'a character no subset contains falls back to 0.6 em');
});

test('fixed-width text breaks at words, and a word wider than its box spans lines', () => {
  const width = (line: string): number => line.length * 10;
  assert.deepEqual(wrapLines('alpha beta gamma', 100, width), ['alpha beta', 'gamma']);
  assert.deepEqual(wrapLines('one\ntwo three', 1000, width), ['one', 'two three']);
  assert.equal(layoutText('a '.repeat(80), BODY, 60).lines > 1, true);
  const long = layoutText('x'.repeat(60), BODY, 100);
  assert.equal(long.lines, Math.ceil(measure('x'.repeat(60), 12, defaultFamily()) / 100));
  const auto = layoutText('short\nlonger line', BODY, null);
  assert.equal(auto.lines, 2);
  assert.equal(auto.w, measure('longer line', 12, defaultFamily()));
});
