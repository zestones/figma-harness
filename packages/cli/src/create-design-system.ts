/* pnpm create:design-system <name> [--title "Display name"]
 * Copies the design system template to design-systems/<name>. */
'use strict';

import { parseArguments, reportFailure } from './arguments.ts';
import { installWorkspace, reportInstall } from './install.ts';
import { createDesignSystem } from './scaffold.ts';

try {
  const { options, positional } = parseArguments(process.argv.slice(2), ['title']);
  if (positional.length !== 1) throw new Error('usage: pnpm create:design-system <name> [--title "Display name"]');
  const created = createDesignSystem({ name: positional[0], title: options['title'] });
  const problem = installWorkspace();
  reportInstall(created.directory, problem);
  if (!problem) console.log([
    '',
    'Created ' + created.directory + ' (' + created.packageName + '), a copy of the design system template.',
    '',
    'Next:',
    '  1. Make it yours: start with src/foundations/colors.ts and typography.ts (see its README).',
    '  2. Refresh its colour-vision table after changing colours: pnpm cvd:generate ' + created.directory,
    '  3. Build an app with it: pnpm create:app <name> --design-system ' + positional[0],
  ].join('\n'));
} catch (error) {
  reportFailure(error);
}
