import assert from 'node:assert/strict';
import test from 'node:test';
import { bundledFamilies, defaultFamily } from '@figma-harness/harness/core/bundled-fonts.ts';
import { measure } from '@figma-harness/harness/runtime/text-metrics.ts';
import { FONTS } from '../src/foundations/typography.ts';

test('Primer\'s text is measured with Noto Sans and Noto Sans Mono', () => {
  assert.equal(defaultFamily(), 'Noto Sans');
  const families = bundledFamilies();
  for (const font of FONTS) {
    assert.ok(families[font.family], font.family + ' is bundled for measurement');
  }
  const semiBold = measure('Releases', 24, 'Noto Sans', 0, false, 'SemiBold');
  assert.ok(semiBold > 95 && semiBold < 115, 'Noto Sans SemiBold at 24 px measures ' + semiBold);
  assert.equal(measure('0123456789', 10, 'Noto Sans Mono'), 60);
});
