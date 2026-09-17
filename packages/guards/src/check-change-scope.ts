'use strict';

const {
  changedPaths,
  loadPolicy,
  normalizePath,
  validateChangedPaths,
  validatePolicy,
} = require('./authoring-policy.ts');
const { commandError } = require('@figma-harness/harness/core/errors.ts');

function argument(name: string, fallback: string): string {
  const exact = '--' + name;
  const inline = process.argv.find((value) => value.startsWith(exact + '='));
  if (inline) return inline.slice(exact.length + 1);
  const index = process.argv.indexOf(exact);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const policy = loadPolicy();
const policyIssues = validatePolicy(policy);
if (policyIssues.length) {
  console.error('scope: invalid authoring policy\n  ' + policyIssues.join('\n  '));
  process.exit(1);
}

const mode = argument('mode', policy.defaultMode).toUpperCase();
const base = argument('base', 'HEAD');
let files;
try {
  files = changedPaths(base);
} catch (error) {
  console.error('scope: could not compare against ' + base + '\n' + commandError(error));
  process.exit(1);
}

const issues = validateChangedPaths(files, mode, policy);
if (issues.length) {
  console.error('scope: ' + issues.length + ' violation(s) for ' + mode);
  for (const issue of issues) console.error('  ' + issue);
  process.exit(1);
}

console.log(
  'scope: clean (' + mode + ', ' + files.length + ' changed path(s) against ' + base + ')',
);
if (process.argv.includes('--verbose')) {
  for (const filename of files) console.log('  ' + normalizePath(filename));
}
