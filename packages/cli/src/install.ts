/* Link a newly created package into the workspace. */
'use strict';

import { packageManager, packageManagerCommand } from '@figma-harness/harness/core/package-manager.ts';
import { repositoryRoot } from '@figma-harness/harness/core/workspace.ts';

const { spawnSync } = require('node:child_process') as typeof import('node:child_process');

/** Install the workspace; returns an explanation when it fails. The new package
 *  changes the lockfile, which CI would otherwise refuse. */
export function installWorkspace(): string | null {
  const [executable, args] = packageManagerCommand(packageManager(), ['install', '--prefer-offline', '--no-frozen-lockfile']);
  const result = spawnSync(executable, args, { cwd: repositoryRoot(), stdio: 'inherit' });
  if (result.error) return result.error.message;
  return result.status === 0 ? null : 'pnpm install exited with status ' + result.status;
}

/** Tell the person what is in place when the install did not finish. */
export function reportInstall(directory: string, problem: string | null): void {
  if (!problem) return;
  console.error('\n' + directory + ' was created, but linking it failed: ' + problem + '.\n'
    + 'Fix the cause, then run pnpm install. Delete ' + directory + ' instead to start over.');
  process.exitCode = 1;
}
