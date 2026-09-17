/* Create a design system or an app by copying its template and giving the copy
 * its own name. Each edit names the text it replaces and fails when the
 * template no longer contains it, so the templates and this file change
 * together (tests/scaffold.test.ts runs every edit). */
'use strict';

import {
  ACTIVE_APP_SPECIFIER,
  ACTIVE_DESIGN_SYSTEM_SPECIFIER,
  PACKAGE_FOLDERS,
  PACKAGE_SCOPE,
  appDesignSystem,
  findPackage,
  repositoryRoot,
  templatePackage,
  workspacePackages,
  type PackageManifest,
} from '@figma-harness/harness/core/workspace.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

const NAME = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/* The build aliases already use these package names. */
const RESERVED = Object.freeze([ACTIVE_APP_SPECIFIER, ACTIVE_DESIGN_SYSTEM_SPECIFIER]
  .map((specifier) => specifier.slice(PACKAGE_SCOPE.length)));

/** A folder and package name: lowercase words joined by hyphens. */
export function checkName(name: string): string {
  if (!NAME.test(name)) {
    throw new Error('a name is lowercase words joined by hyphens, such as "coffer" or "field-notes"; got '
      + JSON.stringify(name));
  }
  if (RESERVED.includes(name)) throw new Error(JSON.stringify(name) + ' is reserved for the build; choose another name');
  return name;
}

/** "field-notes" becomes "Field notes". */
export function titleOf(name: string): string {
  const words = name.split('-').join(' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

const literal = function (text: string): string {
  return "'" + text.replace(/[\\']/g, '\\$&') + "'";
};

/* Copy a package without its installed dependencies. */
const copyPackage = function (from: string, to: string): void {
  fs.cpSync(from, to, {
    recursive: true,
    filter: (source: string) => path.basename(source) !== 'node_modules',
  });
};

interface Edit {
  /** Relative to the new package. */
  readonly file: string;
  readonly from: string;
  readonly to: string;
}

const applyEdits = function (directory: string, edits: readonly Edit[]): void {
  for (const edit of edits) {
    const file = path.join(directory, edit.file);
    const source = fs.readFileSync(file, 'utf8');
    if (!source.includes(edit.from)) {
      throw new Error('the template\'s ' + edit.file + ' no longer contains ' + JSON.stringify(edit.from)
        + '; update packages/cli/src/scaffold.ts with it');
    }
    fs.writeFileSync(file, source.split(edit.from).join(edit.to));
  }
};

/* Every text file of a package, relative to it. */
const textFiles = function (directory: string, prefix = ''): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(path.join(directory, prefix), { withFileTypes: true })) {
    const relative = path.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...textFiles(directory, relative));
    else if (/\.(?:json|md|ts)$/.test(entry.name)) files.push(relative);
  }
  return files.sort();
};

const writeManifest = function (
  directory: string,
  change: (manifest: PackageManifest & { description?: string }) => object,
): void {
  const file = path.join(directory, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(file, 'utf8')) as PackageManifest & { description?: string };
  fs.writeFileSync(file, JSON.stringify(change(manifest), null, 2) + '\n');
};

const sorted = function (record: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(record).sort(([left], [right]) => left.localeCompare(right)));
};

export interface CreateOptions {
  readonly name: string;
  /** The workspace to create it in; this repository by default. */
  readonly root?: string;
  /** The display name; derived from the name by default. */
  readonly title?: string;
}

export interface CreateAppOptions extends CreateOptions {
  /** The design system the app is built with: a folder, a package name or a bare name. */
  readonly designSystem: string;
}

export interface Created {
  /** Relative to the workspace root. */
  readonly directory: string;
  readonly packageName: string;
  readonly title: string;
}

const destinationFor = function (root: string, role: keyof typeof PACKAGE_FOLDERS, name: string) {
  checkName(name);
  const relative = PACKAGE_FOLDERS[role] + '/' + name;
  const packageName = PACKAGE_SCOPE + name;
  if (fs.existsSync(path.join(root, relative))) throw new Error(relative + ' already exists');
  if (workspacePackages(root).some((entry) => entry.name === packageName)) {
    throw new Error('a workspace package is already named ' + packageName);
  }
  return { directory: path.join(root, relative), packageName, relative };
};

/** Copy the design system template to design-systems/<name>. */
export function createDesignSystem(options: CreateOptions): Created {
  const root = options.root || repositoryRoot();
  const template = templatePackage('design-system', root);
  const target = destinationFor(root, 'design-system', options.name);
  const title = options.title || titleOf(options.name);
  copyPackage(template.dir, target.directory);
  try {
    writeManifest(target.directory, (manifest) => ({
      ...manifest,
      name: target.packageName,
      description: title + ', a design system created from the design system template',
      figmaHarness: { role: 'design-system' },
    }));
    applyEdits(target.directory, [
      { file: 'design-system.json', from: '"name": "Template"', to: '"name": ' + JSON.stringify(title) },
      { file: 'src/system.ts', from: "name: 'Template',", to: 'name: ' + literal(title) + ',' },
      { file: 'src/foundations/collections.ts', from: "'Template / Color'", to: literal(title + ' / Color') },
      { file: 'src/foundations/collections.ts', from: "'Template / Size'", to: literal(title + ' / Size') },
      { file: 'README.md', from: '# Design system template', to: '# ' + title },
      {
        file: 'README.md',
        from: '`' + template.name + '` is the design system template:',
        to: '`' + target.packageName + '` was created from the design system template:',
      },
      { file: 'README.md', from: 'pnpm cvd:generate ' + template.relative, to: 'pnpm cvd:generate ' + target.relative },
      {
        file: 'src/foundations/cvd.generated.ts',
        from: 'pnpm cvd:generate ' + template.relative,
        to: 'pnpm cvd:generate ' + target.relative,
      },
    ]);
  } catch (error) {
    fs.rmSync(target.directory, { recursive: true, force: true });
    throw error;
  }
  return { directory: target.relative, packageName: target.packageName, title };
}

export interface CreatedApp extends Created {
  /** The design system the app is built with, relative to the workspace root. */
  readonly designSystem: string;
}

/** Copy the app template to apps/<name>, built with an existing design system. */
export function createApp(options: CreateAppOptions): CreatedApp {
  const root = options.root || repositoryRoot();
  const template = templatePackage('app', root);
  const templateSystem = appDesignSystem(template, root);
  const designSystem = findPackage(options.designSystem, 'design-system', root);
  if (designSystem.template) {
    throw new Error('an app is built with a real design system, not the template; '
      + 'create one first with pnpm create:design-system <name>');
  }
  const target = destinationFor(root, 'app', options.name);
  const title = options.title || titleOf(options.name);
  copyPackage(template.dir, target.directory);
  try {
    writeManifest(target.directory, (manifest) => {
      const dependencies: Record<string, string> = { ...manifest.dependencies };
      delete dependencies[templateSystem.name];
      dependencies[designSystem.name] = 'workspace:*';
      return {
        ...manifest,
        name: target.packageName,
        description: title + ', an app built with ' + designSystem.name,
        figmaHarness: { role: 'app' },
        dependencies: sorted(dependencies),
      };
    });
    // Pages reach the design system by its package name.
    for (const file of textFiles(target.directory)) {
      const filename = path.join(target.directory, file);
      const source = fs.readFileSync(filename, 'utf8');
      const quoted = "'" + templateSystem.name + "'";
      if (source.includes(quoted)) fs.writeFileSync(filename, source.split(quoted).join("'" + designSystem.name + "'"));
    }
    applyEdits(target.directory, [
      { file: 'src/app.ts', from: "name: 'App template'", to: 'name: ' + literal(title) },
      { file: 'src/screens.ts', from: "CATALOG_VERSION = 'template-v1'", to: 'CATALOG_VERSION = ' + literal(options.name + '-v1') },
      { file: 'README.md', from: '# App template', to: '# ' + title },
      {
        file: 'README.md',
        from: '`' + template.name + '` is the app template new apps are created from:',
        to: '`' + target.packageName + '` was created from the app template, built with `' + designSystem.name + '`:',
      },
    ]);
    const leftover = textFiles(target.directory).filter((file) =>
      fs.readFileSync(path.join(target.directory, file), 'utf8').includes(templateSystem.name));
    if (leftover.length) throw new Error('the new app still names the template design system in ' + leftover.join(', '));
  } catch (error) {
    fs.rmSync(target.directory, { recursive: true, force: true });
    throw error;
  }
  return { directory: target.relative, packageName: target.packageName, title, designSystem: designSystem.relative };
}
