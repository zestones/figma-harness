'use strict';

const { REQUIRED_FILES, validateAuthoringContract } = require('./authoring-contract.ts');

const issues = validateAuthoringContract();
if (issues.length) {
  console.error('authoring contract: ' + issues.length + ' violation(s)');
  for (const issue of issues) console.error('  ' + issue);
  process.exit(1);
}

console.log('authoring contract: clean (' + REQUIRED_FILES.length + ' required artifacts wired)');
