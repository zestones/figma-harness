'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const {
  analyzeProjectColorOwnership,
  readProjectColorTokens,
} = require('@figma-harness/harness/color/core/token-source.ts') as
  typeof import('@figma-harness/harness/color/core/token-source.ts');

test('Primer\'s colours keep their values and their recorded ownership', () => {
  const tokens = readProjectColorTokens();
  assert.equal(Object.keys(tokens).length, 170);
  assert.equal(tokens['fgColor/accent'], '#0969DA');
  assert.equal(tokens['button/primary/bgColor/rest'], '#1F883D');
  assert.equal(tokens['borderColor/muted'], '#D1D9E0B3');
  assert.equal(tokens['focus/outline-color'], tokens['fgColor/accent']);

  const report = analyzeProjectColorOwnership();
  assert.deepEqual(report.issues, []);
  const bySource = new Map(report.groups.map((group) => [group.source, group]));
  assert.deepEqual(
    [bySource.get('bgColor/success-emphasis')?.policy, bySource.get('bgColor/success-emphasis')?.tokens],
    ['linked-aliases', ['bgColor/success-emphasis', 'bgColor/open-emphasis', 'button/primary/bgColor/rest']],
  );
  assert.equal(bySource.get('base/blue/5')?.policy, 'independent-semantics');
  assert.equal(bySource.get('base/blue/5')?.tokens.includes('focus/outline-color'), true);
  // The same base colour at another alpha is another source, not an alias.
  assert.notEqual(bySource.get('base/neutral/6')?.hex, bySource.get('base/neutral/6 at 70%')?.hex);
});
