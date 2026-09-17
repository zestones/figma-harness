'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const runtimeGlobal = global as typeof global & { figma?: unknown };

test('document catalog is import-safe, complete, frozen, and uniquely named', async () => {
  delete runtimeGlobal.figma;
  const { BUILDERS, PAGES } = await import('../src/document/builders.ts');
  assert.equal(runtimeGlobal.figma, undefined);
  assert.equal(Object.isFrozen(BUILDERS), true);
  assert.equal(Object.isFrozen(PAGES), true);
  assert.deepEqual(Object.keys(BUILDERS).sort(), ['screens', 'states', 'system']);
  assert.deepEqual(Object.keys(PAGES).sort(), ['screens', 'states', 'system']);
  assert.equal(new Set(Object.values(PAGES)).size, Object.values(PAGES).length);
  assert.equal(Object.values(BUILDERS).every((builder) => typeof builder === 'function'), true);
});

test('the document contract joins the app and the design system without renaming anything', async () => {
  const { DOCUMENT_AUDIT } = await import('../src/document/contract.ts');
  const { APP, DESIGN_SYSTEM } = await import('../src/composition.ts');
  assert.deepEqual(
    DOCUMENT_AUDIT.signatureComponents.map((component) => component.key),
    [...APP.signatureComponents, ...DESIGN_SYSTEM.signatureComponents].map((component) => component.key),
  );
  assert.deepEqual(
    [...new Set(DOCUMENT_AUDIT.signatureComponents.map((component) => component.page))],
    ['01 · Screens', '02 · Design system'],
  );
  assert.deepEqual([...DOCUMENT_AUDIT.prototype.motion.names], [...DESIGN_SYSTEM.motion.names]);
  assert.equal(DOCUMENT_AUDIT.prototype.startScreenKey, APP.startScreenKey);
  assert.equal(
    DOCUMENT_AUDIT.radiusExceptions.length,
    DESIGN_SYSTEM.radiusExceptions.length + APP.radiusExceptions.length,
  );
});
