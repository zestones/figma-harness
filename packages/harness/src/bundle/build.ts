/* Write or verify the committed Figma bundle. It always holds the app
 * figma-harness.config.json names; `pnpm use` switches it. */
'use strict';

import {
  bundleFile,
  bundlePlugin,
  writeBundle,
  type PluginBundle,
} from './bundle.ts';
import {
  APP_ENVIRONMENT_VARIABLE,
  DESIGN_SYSTEM_ENVIRONMENT_VARIABLE,
  activeComposition,
  configuredComposition,
} from '../core/workspace.ts';

const crypto = require('node:crypto') as typeof import('node:crypto');
const fs = require('node:fs') as typeof import('node:fs');

const CHECK = process.argv.includes('--check');

function fail(message: string): never {
  console.error('build: ' + message);
  process.exit(1);
}

let bundle: PluginBundle;
try {
  const configured = configuredComposition();
  const requested = activeComposition();
  if (requested.app.dir !== configured.app.dir || requested.substituted) {
    const variables = [APP_ENVIRONMENT_VARIABLE, DESIGN_SYSTEM_ENVIRONMENT_VARIABLE].filter((name) => process.env[name]);
    fail('code.js always holds the configured app, ' + configured.app.relative + ' with its own design system, but '
      + variables.join(' and ') + (variables.length > 1 ? ' select' : ' selects') + ' another build. Unset '
      + (variables.length > 1 ? 'them' : 'it')
      + ', or switch the configured app with pnpm use <app>.');
  }
  bundle = bundlePlugin({ app: configured.app.relative });
} catch (error: unknown) {
  fail(error instanceof Error ? error.message : String(error));
}
if (bundle.unreachable.length) {
  fail('source module(s) unreachable from the plugin entry: ' + bundle.unreachable.join(', '));
}

const digest = (value: import('node:crypto').BinaryLike): string =>
  crypto.createHash('sha256').update(value).digest('hex');
const BUNDLE_FILE = bundleFile();
if (CHECK) {
  if (!fs.existsSync(BUNDLE_FILE)) fail('code.js is missing; run pnpm build');
  const current = fs.readFileSync(BUNDLE_FILE);
  if (!current.equals(bundle.code)) {
    fail('code.js is stale (expected ' + digest(bundle.code) + ', found ' + digest(current) + ')');
  }
  console.log('build: code.js is current (' + bundle.modules.length + ' modules, sha256 ' + digest(bundle.code) + ')');
} else {
  writeBundle(bundle);
  console.log('built code.js (' + bundle.modules.length + ' modules, sha256 ' + digest(bundle.code) + ')');
}
