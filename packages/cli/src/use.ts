/* pnpm use <app>: make an app the one the plugin builds, and rebuild code.js.
 * pnpm use: list the apps and show which one is active. */
'use strict';

import { bundlePlugin, writeBundle } from '@figma-harness/harness/bundle/bundle.ts';
import {
  CONFIG_FILE,
  appDesignSystem,
  findPackage,
  readConfig,
  repositoryRoot,
  workspacePackages,
  type WorkspacePackage,
} from '@figma-harness/harness/core/workspace.ts';
import { parseArguments, reportFailure } from './arguments.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

export interface Selection {
  readonly app: WorkspacePackage;
  readonly designSystem: WorkspacePackage;
}

/** Rebuild the bundle for an app, then name it in figma-harness.config.json. */
export function useApp(reference: string): Selection {
  const root = repositoryRoot();
  const app = findPackage(reference, 'app', root);
  const designSystem = appDesignSystem(app, root);
  // A composition that does not build leaves both files alone.
  const bundle = bundlePlugin({ app: app.relative, designSystem: designSystem.relative });
  if (bundle.unreachable.length) {
    throw new Error('source module(s) unreachable from the plugin entry: ' + bundle.unreachable.join(', '));
  }
  // The bundle names the app it holds, so a config written after it can be checked against it.
  writeBundle(bundle);
  const file = path.join(root, CONFIG_FILE);
  const config = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, unknown>;
  config['app'] = app.relative;
  fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
  return { app, designSystem };
}

const list = function (root: string): void {
  const active = readConfig(root).app;
  const apps = workspacePackages(root).filter((entry) => entry.role === 'app');
  const width = Math.max(...apps.map((entry) => entry.relative.length));
  console.log('Apps (* is the one the plugin builds):');
  for (const app of apps) {
    console.log('  ' + (app.relative === active ? '*' : ' ') + ' ' + app.relative.padEnd(width)
      + '  with ' + appDesignSystem(app, root).relative + (app.template ? '  (template)' : ''));
  }
  console.log('\nSwitch with: pnpm use <app>');
};

if (require.main === module) {
  try {
    const { positional } = parseArguments(process.argv.slice(2), []);
    if (positional.length > 1) throw new Error('usage: pnpm use [<app>]');
    if (!positional.length) {
      list(repositoryRoot());
    } else {
      const selection = useApp(positional[0]);
      console.log('The plugin now builds ' + selection.app.relative + ' with ' + selection.designSystem.relative
        + '. code.js is rebuilt: run the plugin again in Figma.');
    }
  } catch (error) {
    reportFailure(error);
  }
}
