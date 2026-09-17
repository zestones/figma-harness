/* Generate src/primitives/icons.generated.ts from the pinned Heroicons
 * package, or verify that the committed module is current.
 * `pnpm generate` and `pnpm check:generated` run it. */
'use strict';

import { formatIconModule, loadHeroicons } from './generate.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

const PACKAGE = path.resolve(__dirname, '..', '..');
const OUTPUT = path.join(PACKAGE, 'src', 'primitives', 'icons.generated.ts');
const SOURCE = path.join(PACKAGE, 'node_modules', 'heroicons');

if (!fs.existsSync(SOURCE)) {
  console.error('heroicons is not installed. Run: pnpm install');
  process.exit(1);
}
const set = loadHeroicons(fs.realpathSync(SOURCE));
const source = formatIconModule(set);
if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUTPUT) ? fs.readFileSync(OUTPUT, 'utf8') : '';
  if (current !== source) {
    console.error('design-systems/carrara/src/primitives/icons.generated.ts is stale. Run: pnpm generate');
    process.exit(1);
  }
  console.log('heroicons: generated module is current (' + Object.keys(set.icons).length + ' icons)');
} else {
  const temporary = OUTPUT + '.tmp';
  fs.writeFileSync(temporary, source);
  fs.renameSync(temporary, OUTPUT);
  console.log('wrote design-systems/carrara/src/primitives/icons.generated.ts — '
    + Object.keys(set.icons).length + ' icons from heroicons v' + set.version);
}
