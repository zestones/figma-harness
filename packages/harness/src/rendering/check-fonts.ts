'use strict';

import { bundledFamilies } from '../core/bundled-fonts.ts';

const { assertFontFamilies, useBundledFonts } = require('./fonts.ts');

const environment = useBundledFonts();
try {
  const families = Object.keys(bundledFamilies());
  assertFontFamilies(families);
  console.log('fonts: bundled ' + families.join(' and ') + ' resolve exactly');
} finally {
  environment.cleanup();
}
