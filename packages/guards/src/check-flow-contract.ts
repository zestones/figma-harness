'use strict';

import { loadContract } from '@figma-harness/harness/bundle/contract-loader.ts';
import { validateFlowContract } from './flow-contract.ts';

const prototype = loadContract().document.prototype;
const issues = validateFlowContract(prototype);
if (issues.length) {
  console.error('flow contract: ' + issues.length + ' violation(s)');
  for (const issue of issues) console.error('  ' + issue);
  process.exit(1);
}

console.log(
  'flow contract: clean ('
  + prototype.transitions.length + ' transitions, '
  + prototype.requiredReachableKeys.length + ' reachable frames)',
);
