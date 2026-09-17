'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const fs: typeof import('node:fs') = require('node:fs');
const os: typeof import('node:os') = require('node:os');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');

const {
  checkName,
  createApp,
  createDesignSystem,
  titleOf,
} = require('../src/scaffold.ts') as typeof import('../src/scaffold.ts');
const { compositions } = require('../src/each.ts') as typeof import('../src/each.ts');
const { appDesignSystem, findPackage, repositoryRoot } = require('@figma-harness/harness/core/workspace.ts') as
  typeof import('@figma-harness/harness/core/workspace.ts');

/* A throwaway workspace holding copies of the two templates. */
const workspace = function (): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'figma-harness-cli-'));
  for (const template of ['templates/app', 'templates/design-system']) {
    fs.cpSync(path.join(repositoryRoot(), template), path.join(root, template), {
      recursive: true,
      filter: (source: string) => path.basename(source) !== 'node_modules',
    });
  }
  fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - design-systems/*\n  - apps/*\n  - templates/*\n');
  fs.writeFileSync(path.join(root, 'figma-harness.config.json'),
    JSON.stringify({ plugin: 'plugin', app: 'templates/app', renders: 'renders' }));
  return root;
};

const read = function (root: string, relative: string): string {
  return fs.readFileSync(path.join(root, relative), 'utf8');
};

const filesUnder = function (directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(absolute) : [absolute];
  });
};

test('names are lowercase words, and titles are derived from them', () => {
  assert.equal(titleOf('field-notes'), 'Field notes');
  assert.equal(checkName('pantry2'), 'pantry2');
  for (const name of ['Field', 'field notes', '-field', 'field-', 'field--notes', '../field', '']) {
    assert.throws(() => checkName(name), /lowercase words/, name);
  }
  assert.throws(() => checkName('active-app'), /reserved/);
});

test('a created design system is the design system template under its own name', () => {
  const root = workspace();
  try {
    const created = createDesignSystem({ root, name: 'field-notes' });
    assert.deepEqual(created, {
      directory: 'design-systems/field-notes',
      packageName: '@figma-harness/field-notes',
      title: 'Field notes',
    });
    const manifest = JSON.parse(read(root, 'design-systems/field-notes/package.json'));
    assert.equal(manifest.name, '@figma-harness/field-notes');
    assert.deepEqual(manifest.figmaHarness, { role: 'design-system' });
    assert.equal(JSON.parse(read(root, 'design-systems/field-notes/design-system.json')).name, 'Field notes');
    assert.match(read(root, 'design-systems/field-notes/src/system.ts'), /name: 'Field notes',/);
    assert.match(read(root, 'design-systems/field-notes/src/foundations/collections.ts'), /'Field notes \/ Color'/);
    assert.match(read(root, 'design-systems/field-notes/README.md'), /^# Field notes\n/);
    assert.doesNotMatch(read(root, 'design-systems/field-notes/README.md'), /template-design-system|templates\//);
    assert.match(read(root, 'design-systems/field-notes/src/foundations/cvd.generated.ts'), /pnpm cvd:generate design-systems\/field-notes/);
    assert.equal(findPackage('field-notes', 'design-system', root).template, false);
    for (const reference of ['@figma-harness/field-notes', 'design-systems/field-notes', './design-systems/field-notes/', path.join(root, 'design-systems/field-notes')]) {
      assert.equal(findPackage(reference, 'design-system', root).relative, 'design-systems/field-notes', reference);
    }
    assert.throws(() => findPackage('field-notes', 'app', root), /no app named/);
    assert.throws(() => findPackage('templates/design-system', 'app', root), /not an app package/);
    assert.throws(() => createDesignSystem({ root, name: 'field-notes' }), /already exists/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('a created app uses the chosen design system wherever the template named its own', () => {
  const root = workspace();
  try {
    createDesignSystem({ root, name: 'field-notes' });
    assert.throws(
      () => createApp({ root, name: 'pantry', designSystem: 'templates/design-system' }),
      /not the template/,
    );
    assert.throws(() => createApp({ root, name: 'pantry', designSystem: 'nothing' }), /no design-system named/);
    assert.equal(fs.existsSync(path.join(root, 'apps/pantry')), false);

    const created = createApp({ root, name: 'pantry', designSystem: 'field-notes', title: 'Pantry\'s list' });
    assert.equal(created.directory, 'apps/pantry');
    assert.equal(created.designSystem, 'design-systems/field-notes');
    const manifest = JSON.parse(read(root, 'apps/pantry/package.json'));
    assert.equal(manifest.name, '@figma-harness/pantry');
    assert.deepEqual(manifest.figmaHarness, { role: 'app' });
    assert.equal(manifest.dependencies['@figma-harness/field-notes'], 'workspace:*');
    assert.equal(manifest.dependencies['@figma-harness/template-design-system'], undefined);
    for (const file of filesUnder(path.join(root, created.directory))) {
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /template-design-system|template-app|# App template/, file);
    }
    assert.match(read(root, 'apps/pantry/src/pages/projects.ts'), /from '@figma-harness\/field-notes';/);
    assert.match(read(root, 'apps/pantry/src/app.ts'), /name: 'Pantry\\'s list'/);
    assert.match(read(root, 'apps/pantry/src/screens.ts'), /CATALOG_VERSION = 'pantry-v1'/);
    assert.equal(appDesignSystem(findPackage('pantry', 'app', root), root).name, '@figma-harness/field-notes');

    // Each app is checked with its own design system, and the starter app with every other one.
    assert.deepEqual(
      compositions(root).map((composition) =>
        [composition.app.relative, composition.designSystem.relative, composition.substituted]),
      [
        ['apps/pantry', 'design-systems/field-notes', false],
        ['templates/app', 'templates/design-system', false],
        ['templates/app', 'design-systems/field-notes', true],
      ],
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
