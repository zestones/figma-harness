/* pnpm create:app <name> --design-system <design system> [--title "Display name"]
 * Copies the app template to apps/<name>, built with that design system. */
'use strict';

import { activeComposition } from '@figma-harness/harness/core/workspace.ts';
import { parseArguments, reportFailure } from './arguments.ts';
import { installWorkspace, reportInstall } from './install.ts';
import { createApp } from './scaffold.ts';

try {
  const { options, positional } = parseArguments(process.argv.slice(2), ['design-system', 'title']);
  if (positional.length !== 1) {
    throw new Error('usage: pnpm create:app <name> [--design-system <design system>] [--title "Display name"]');
  }
  // Without a choice, the app uses the design system of the active app.
  const designSystem = options['design-system'] || activeComposition().designSystem.relative;
  const created = createApp({ name: positional[0], designSystem, title: options['title'] });
  const problem = installWorkspace();
  reportInstall(created.directory, problem);
  if (!problem) console.log([
    '',
    'Created ' + created.directory + ' (' + created.packageName + '), built with ' + created.designSystem + '.',
    '',
    'Next:',
    '  1. Make it the app the plugin builds: pnpm use ' + positional[0],
    '  2. Replace the template screens under ' + created.directory + '/src/pages/ (see its README).',
    '  3. Check it: FIGMA_HARNESS_APP=' + created.directory + ' pnpm run audit',
  ].join('\n'));
} catch (error) {
  reportFailure(error);
}
