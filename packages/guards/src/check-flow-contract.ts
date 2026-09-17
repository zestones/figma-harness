'use strict';

import { loadContract } from '@figma-harness/harness/bundle/contract-loader.ts';
import { workspacePackages } from '@figma-harness/harness/core/workspace.ts';
import { validateFlowContract } from './flow-contract.ts';

const { errorMessage } = require('@figma-harness/harness/core/errors.ts');

// Every app, templates included, whichever one is active.
let failed = false;
for (const app of workspacePackages().filter((entry) => entry.role === 'app')) {
  let prototype;
  try {
    prototype = loadContract({ app: app.relative }).document.prototype;
  } catch (error) {
    failed = true;
    console.error('flow contract: ' + app.relative + ' does not build');
    console.error('  ' + String(errorMessage(error)).split('\n').slice(0, 12).join('\n  '));
    continue;
  }
  const issues = validateFlowContract(prototype);
  if (issues.length) {
    failed = true;
    console.error('flow contract: ' + app.relative + ': ' + issues.length + ' violation(s)');
    for (const issue of issues) console.error('  ' + issue);
    continue;
  }
  console.log(
    'flow contract: ' + app.relative + ' clean ('
    + prototype.transitions.length + ' transitions, '
    + prototype.requiredReachableKeys.length + ' reachable frames)',
  );
}
if (failed) process.exit(1);
