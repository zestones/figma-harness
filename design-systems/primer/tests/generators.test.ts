'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('the generated Primer modules match the pinned packages', () => {
  const { formatTokenModule } = require('../generators/tokens/tokens.ts') as typeof import('../generators/tokens/tokens.ts');
  const { generateTokens } = require('../generators/tokens/generate.ts') as typeof import('../generators/tokens/generate.ts');
  const { formatIconModule, loadOcticons } = require('../generators/icons/generate.ts') as typeof import('../generators/icons/generate.ts');
  const fs: typeof import('node:fs') = require('node:fs');
  const path: typeof import('node:path') = require('node:path');
  const root = path.resolve(__dirname, '..');
  assert.equal(
    fs.readFileSync(path.join(root, 'src', 'foundations', 'primer.generated.ts'), 'utf8'),
    formatTokenModule(generateTokens()),
  );
  assert.equal(
    fs.readFileSync(path.join(root, 'src', 'primitives', 'icons.generated.ts'), 'utf8'),
    formatIconModule(loadOcticons(path.join(root, 'node_modules', '@primer', 'octicons'))),
  );
});

test('the token generator refuses what Primer does not publish and describes component roles', () => {
  const { colorHex, describeComponentToken } = require('../generators/tokens/generate.ts') as typeof import('../generators/tokens/generate.ts');
  const { glyphPaths } = require('../generators/icons/generate.ts') as typeof import('../generators/icons/generate.ts');
  assert.equal(colorHex({ r: 209 / 255, g: 217 / 255, b: 224 / 255, a: 0.7 }), '#D1D9E0B3');
  assert.equal(colorHex({ r: 1, g: 1, b: 1 }), '#FFFFFF');
  assert.equal(describeComponentToken('control/checked/bgColor/hover'), 'Checked control background when hovered');
  assert.equal(describeComponentToken('controlTrack/bgColor/rest'), 'Control track background at rest');
  assert.throws(() => glyphPaths('<svg viewBox="0 0 16 16"><circle r="3"/></svg>', 'dot'), /contains/);
  assert.throws(() => glyphPaths('<svg viewBox="0 0 16 16"><path d="M0 0" stroke="red"/></svg>', 'stroke'), /attribute stroke/);
});
