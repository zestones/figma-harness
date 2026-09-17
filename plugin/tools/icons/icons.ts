/* Generate the pinned Octicons source, or verify that it is current.
 *
 *   npm run icons:generate
 *   npm run icons:check */
'use strict';

import { formatIconModule, loadOcticons } from './generate.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

const PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const PACKAGE_ROOT = path.join(PLUGIN_ROOT, 'node_modules', '@primer', 'octicons');
const OUTPUT = path.join(PLUGIN_ROOT, 'src', 'kit', 'primitives', 'icons.generated.ts');

if (!fs.existsSync(PACKAGE_ROOT)) {
  console.error('@primer/octicons is not installed. Run: npm ci');
  process.exit(1);
}
const generation = loadOcticons(PACKAGE_ROOT);
const source = formatIconModule(generation);
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (current !== source) {
    console.error('src/kit/primitives/icons.generated.ts is stale. Run: npm run icons:generate');
    process.exit(1);
  }
  console.log('octicons: generated module is current (' + Object.keys(generation.icons).length + ' icons)');
} else {
  const temporary = OUTPUT + '.tmp';
  fs.writeFileSync(temporary, source);
  fs.renameSync(temporary, OUTPUT);
  console.log('wrote src/kit/primitives/icons.generated.ts — '
    + Object.keys(generation.icons).length + ' icons from @primer/octicons v' + generation.version);
}
