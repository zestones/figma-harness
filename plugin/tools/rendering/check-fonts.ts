'use strict';

import { BUNDLED_FAMILIES } from '../core/bundled-fonts.ts';

const { assertFontFamilies, useBundledFonts } = require('./fonts.ts');

const environment = useBundledFonts();
try {
  const families = Object.keys(BUNDLED_FAMILIES);
  assertFontFamilies(families);
  console.log('fonts: bundled ' + families.join(' and ') + ' resolve exactly');
} finally {
  environment.cleanup();
}
