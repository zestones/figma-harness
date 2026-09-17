'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');
const vm: typeof import('node:vm') = require('node:vm');
const { BUNDLE_GLOBAL_NAME, bundlePlugin } = require('@figma-harness/harness/bundle/bundle.ts') as
  typeof import('@figma-harness/harness/bundle/bundle.ts');

/* The plugin is exercised with the starter app, whichever app is active. The
   composition is resolved at build time, so a module is bundled and loaded
   in a context that has no Figma global. */
const load = function (relative: string): Record<string, unknown> {
  const entry = path.resolve(__dirname, '..', 'src', relative);
  const code = bundlePlugin({ app: 'templates/app', entry }).code.toString('utf8');
  const context = vm.createContext({ console }) as Record<string, unknown>;
  vm.runInContext(code, context, { filename: relative });
  return context[BUNDLE_GLOBAL_NAME] as Record<string, unknown>;
};

interface Keyed {
  readonly key: string;
  readonly page: string;
}

test('document catalog is import-safe, complete, frozen, and uniquely named', () => {
  const { BUILDERS, PAGES } = load('document/builders.ts') as {
    BUILDERS: Record<string, unknown>;
    PAGES: Record<string, string>;
  };
  assert.equal(Object.isFrozen(BUILDERS), true);
  assert.equal(Object.isFrozen(PAGES), true);
  assert.deepEqual(Object.keys(BUILDERS).sort(), ['screens', 'states', 'system']);
  assert.deepEqual(Object.keys(PAGES).sort(), ['screens', 'states', 'system']);
  assert.equal(new Set(Object.values(PAGES)).size, Object.values(PAGES).length);
  assert.equal(Object.values(BUILDERS).every((builder) => typeof builder === 'function'), true);
});

test('the document contract joins the app and the design system without renaming anything', () => {
  const { DOCUMENT_AUDIT } = load('document/contract.ts') as {
    DOCUMENT_AUDIT: {
      prototype: { motion: { names: readonly string[] }; startScreenKey: string };
      radiusExceptions: readonly unknown[];
      signatureComponents: readonly Keyed[];
    };
  };
  const { PAGES } = load('document/builders.ts') as { PAGES: Record<string, string> };
  const { APP, DESIGN_SYSTEM } = load('composition.ts') as {
    APP: { radiusExceptions: readonly unknown[]; signatureComponents: readonly Keyed[]; startScreenKey: string };
    DESIGN_SYSTEM: {
      motion: { names: readonly string[] };
      radiusExceptions: readonly unknown[];
      signatureComponents: readonly Keyed[];
    };
  };
  // The app's representative layers first, then the design system's, each with its page's name.
  const declared = [...APP.signatureComponents, ...DESIGN_SYSTEM.signatureComponents];
  assert.ok(declared.length > 0);
  assert.equal(
    JSON.stringify(DOCUMENT_AUDIT.signatureComponents.map((component) => [component.key, component.page])),
    JSON.stringify(declared.map((component) => [component.key, PAGES[component.page]])),
  );
  assert.equal(PAGES['system'], '02 · Design system');
  assert.deepEqual([...DOCUMENT_AUDIT.prototype.motion.names], [...DESIGN_SYSTEM.motion.names]);
  assert.equal(DOCUMENT_AUDIT.prototype.startScreenKey, APP.startScreenKey);
  assert.equal(
    DOCUMENT_AUDIT.radiusExceptions.length,
    DESIGN_SYSTEM.radiusExceptions.length + APP.radiusExceptions.length,
  );
});
