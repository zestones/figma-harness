/* pnpm each <check> [arguments]: run a check once for every composition the
 * workspace builds. That is every app with its own design system, then the
 * app template with every other design system, since new apps start from it
 * on whichever design system they choose. */
'use strict';

import { packageManager, packageManagerCommand } from '@figma-harness/harness/core/package-manager.ts';
import {
  APP_ENVIRONMENT_VARIABLE,
  DESIGN_SYSTEM_ENVIRONMENT_VARIABLE,
  appDesignSystem,
  repositoryRoot,
  templatePackage,
  workspacePackages,
  type Composition,
} from '@figma-harness/harness/core/workspace.ts';
import { reportFailure } from './arguments.ts';

const { spawnSync } = require('node:child_process') as typeof import('node:child_process');

/** Checks that read the selected composition. The others run once for the workspace. */
export const PER_COMPOSITION_CHECKS = Object.freeze([
  'audit', 'audit:a11y', 'audit:contrast', 'audit:theme',
  'design:check', 'design:components:check', 'render:fonts:check',
]);

export function compositions(root: string = repositoryRoot()): Composition[] {
  const packages = workspacePackages(root);
  const result: Composition[] = packages
    .filter((entry) => entry.role === 'app')
    .map((app) => Object.freeze({ app, designSystem: appDesignSystem(app, root), substituted: false }));
  const template = templatePackage('app', root);
  const own = appDesignSystem(template, root);
  for (const designSystem of packages) {
    if (designSystem.role !== 'design-system' || designSystem.dir === own.dir || designSystem.template) continue;
    result.push(Object.freeze({ app: template, designSystem, substituted: true }));
  }
  return result;
}

if (require.main === module) {
  try {
    const [check, ...args] = process.argv.slice(2);
    if (!check || !PER_COMPOSITION_CHECKS.includes(check)) {
      throw new Error('usage: pnpm each <check> [arguments], where <check> is one of '
        + PER_COMPOSITION_CHECKS.join(', '));
    }
    const failed: string[] = [];
    const all = compositions();
    for (const composition of all) {
      const label = composition.app.relative + ' with ' + composition.designSystem.relative;
      console.log('\n=== ' + check + ': ' + label);
      const environment: NodeJS.ProcessEnv = { ...process.env, [APP_ENVIRONMENT_VARIABLE]: composition.app.relative };
      delete environment[DESIGN_SYSTEM_ENVIRONMENT_VARIABLE];
      if (composition.substituted) environment[DESIGN_SYSTEM_ENVIRONMENT_VARIABLE] = composition.designSystem.relative;
      const [executable, command] = packageManagerCommand(packageManager(), ['run', '--silent', check, ...args]);
      const result = spawnSync(executable, command, { cwd: repositoryRoot(), env: environment, stdio: 'inherit' });
      if (result.error) throw result.error;
      if (result.status !== 0) failed.push(label);
    }
    console.log('\neach ' + check + ': ' + all.length + ' composition(s), '
      + (failed.length ? failed.length + ' failed: ' + failed.join('; ') : 'all passed'));
    if (failed.length) process.exitCode = 1;
  } catch (error) {
    reportFailure(error);
  }
}
