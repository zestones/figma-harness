/* Write or verify the committed Figma bundle. */
'use strict';

import {
  BUNDLE_FILE,
  bundlePlugin,
  type PluginBundle,
} from './bundle.ts';

const crypto = require('node:crypto') as typeof import('node:crypto');
const fs = require('node:fs') as typeof import('node:fs');

const CHECK = process.argv.includes('--check');

function fail(message: string): never {
  console.error('build: ' + message);
  process.exit(1);
}

let bundle: PluginBundle;
try {
  bundle = bundlePlugin();
} catch (error: unknown) {
  fail(error instanceof Error ? error.message : String(error));
}
if (bundle.unreachable.length) {
  fail('source module(s) unreachable from src/plugin/entry.ts: ' + bundle.unreachable.join(', '));
}

const digest = (value: import('node:crypto').BinaryLike): string =>
  crypto.createHash('sha256').update(value).digest('hex');
if (CHECK) {
  if (!fs.existsSync(BUNDLE_FILE)) fail('code.js is missing; run npm run build');
  const current = fs.readFileSync(BUNDLE_FILE);
  if (!current.equals(bundle.code)) {
    fail('code.js is stale (expected ' + digest(bundle.code) + ', found ' + digest(current) + ')');
  }
  console.log('build: code.js is current (' + bundle.modules.length + ' modules, sha256 ' + digest(bundle.code) + ')');
} else {
  const temporary = BUNDLE_FILE + '.tmp';
  fs.writeFileSync(temporary, bundle.code);
  fs.renameSync(temporary, BUNDLE_FILE);
  console.log('built code.js (' + bundle.modules.length + ' modules, sha256 ' + digest(bundle.code) + ')');
}
