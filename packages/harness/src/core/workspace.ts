/* Where things are. The repository root holds figma-harness.config.json, which
 * names the plugin and the active app; the active design system is the one
 * that app depends on. For one run, FIGMA_HARNESS_APP selects another app and
 * FIGMA_HARNESS_DESIGN_SYSTEM builds the app with another design system.
 * Each workspace package declares its role in package.json
 * ("figmaHarness.role"). The harness reads files and evaluates the plugin
 * bundle; it never imports product code. */
'use strict';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

export const CONFIG_FILE = 'figma-harness.config.json';
export const DESIGN_SYSTEM_MANIFEST = 'design-system.json';
/** Environment variable that selects another app for one command. */
export const APP_ENVIRONMENT_VARIABLE = 'FIGMA_HARNESS_APP';
/** Environment variable that builds the app with another design system for one command. */
export const DESIGN_SYSTEM_ENVIRONMENT_VARIABLE = 'FIGMA_HARNESS_DESIGN_SYSTEM';
/** Build-time aliases the plugin's composition imports. */
export const ACTIVE_APP_SPECIFIER = '@figma-harness/active-app';
export const ACTIVE_DESIGN_SYSTEM_SPECIFIER = '@figma-harness/active-design-system';

export type PackageRole = 'app' | 'contract' | 'design-system' | 'engine' | 'plugin' | 'tooling';

export const PACKAGE_ROLES: readonly PackageRole[] = Object.freeze([
  'app', 'contract', 'design-system', 'engine', 'plugin', 'tooling',
]);

export interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly exports?: Readonly<Record<string, string>>;
  /** `template` marks a starter package that is copied rather than reviewed. */
  readonly figmaHarness?: { readonly role?: string; readonly template?: boolean };
  readonly name: string;
  readonly scripts?: Readonly<Record<string, string>>;
}

export interface WorkspacePackage {
  /** Absolute, real directory. */
  readonly dir: string;
  readonly manifest: PackageManifest;
  readonly name: string;
  /** Directory relative to the repository root, with forward slashes. */
  readonly relative: string;
  readonly role: PackageRole;
  readonly template: boolean;
}

export interface WorkspaceConfig {
  /** The app the plugin builds, as a directory relative to the root. */
  readonly app: string;
  readonly plugin: string;
  /** Local inspection output; ignored by git. */
  readonly renders: string;
}

export interface FontFamilyManifest {
  /** A Fontsource package, resolved from the design system's directory. */
  readonly package: string;
  readonly weights: readonly number[];
}

export interface DesignSystemManifest {
  readonly fonts: {
    /** The family unknown or unstyled text is measured and drawn with. */
    readonly default: string;
    readonly families: Readonly<Record<string, FontFamilyManifest>>;
  };
  readonly generated: {
    /** The colour-vision table the harness writes and checks. */
    readonly cvdTable: string;
  };
  readonly name: string;
}

const toPosix = function (value: string): string {
  return value.split(path.sep).join('/');
};

const readJson = function <T>(filename: string): T {
  return JSON.parse(fs.readFileSync(filename, 'utf8')) as T;
};

const roots = new Map<string, string>();

/** The nearest directory holding figma-harness.config.json, from `start` up. */
export function repositoryRoot(start: string = __dirname): string {
  const cached = roots.get(start);
  if (cached) return cached;
  let directory = path.resolve(start);
  for (;;) {
    if (fs.existsSync(path.join(directory, CONFIG_FILE))) break;
    const parent = path.dirname(directory);
    if (parent === directory) throw new Error('cannot find ' + CONFIG_FILE + ' above ' + start);
    directory = parent;
  }
  roots.set(start, directory);
  return directory;
}

export function readConfig(root: string = repositoryRoot()): WorkspaceConfig {
  const config = readJson<Partial<WorkspaceConfig>>(path.join(root, CONFIG_FILE));
  for (const key of ['app', 'plugin', 'renders'] as const) {
    if (typeof config[key] !== 'string' || !config[key]) {
      throw new Error(CONFIG_FILE + ' must name "' + key + '"');
    }
  }
  return config as WorkspaceConfig;
}

/* pnpm-workspace.yaml lists package directories, optionally ending in "/*". */
const workspaceGlobs = function (root: string): string[] {
  const source = fs.readFileSync(path.join(root, 'pnpm-workspace.yaml'), 'utf8');
  const globs: string[] = [];
  let inPackages = false;
  for (const line of source.split('\n')) {
    if (/^packages:\s*$/.test(line)) { inPackages = true; continue; }
    if (/^\S/.test(line)) inPackages = false;
    const item = inPackages ? /^\s+-\s+['"]?([^'"#\s]+)['"]?/.exec(line) : null;
    if (item) globs.push(item[1]);
  }
  return globs;
};

/** Every workspace package, sorted by directory. */
export function workspacePackages(root: string = repositoryRoot()): WorkspacePackage[] {
  const directories: string[] = [];
  for (const glob of workspaceGlobs(root)) {
    if (glob.endsWith('/*')) {
      const parent = path.join(root, glob.slice(0, -2));
      if (!fs.existsSync(parent)) continue;
      for (const entry of fs.readdirSync(parent, { withFileTypes: true })) {
        if (entry.isDirectory()) directories.push(path.join(parent, entry.name));
      }
    } else {
      directories.push(path.join(root, glob));
    }
  }
  return directories
    .filter((directory) => fs.existsSync(path.join(directory, 'package.json')))
    .map((directory): WorkspacePackage => {
      const manifest = readJson<PackageManifest>(path.join(directory, 'package.json'));
      const role = manifest.figmaHarness?.role;
      if (!role || !PACKAGE_ROLES.includes(role as PackageRole)) {
        throw new Error(toPosix(path.relative(root, directory)) + '/package.json declares no known figmaHarness.role');
      }
      return Object.freeze({
        dir: fs.realpathSync(directory),
        manifest,
        name: manifest.name,
        relative: toPosix(path.relative(root, directory)),
        role: role as PackageRole,
        template: manifest.figmaHarness?.template === true,
      });
    })
    .sort((left, right) => left.relative.localeCompare(right.relative));
}

/** Workspace packages by name, for resolving `workspace:*` dependencies. */
const packagesByName = function (root: string): Map<string, WorkspacePackage> {
  return new Map(workspacePackages(root).map((entry) => [entry.name, entry]));
};

/** The workspace packages a package depends on at runtime. */
export function workspaceDependencies(entry: WorkspacePackage, root: string = repositoryRoot()): WorkspacePackage[] {
  const byName = packagesByName(root);
  return Object.keys(entry.manifest.dependencies || {})
    .map((name) => byName.get(name))
    .filter((dependency): dependency is WorkspacePackage => !!dependency);
}

/** The app a command works on: FIGMA_HARNESS_APP, or the one the config names. */
export function activeAppPath(root: string = repositoryRoot()): string {
  return process.env[APP_ENVIRONMENT_VARIABLE] || readConfig(root).app;
}

/** Where the packages people create live, and the scope their names take. */
export const PACKAGE_FOLDERS = Object.freeze({ app: 'apps', 'design-system': 'design-systems' });
export const PACKAGE_SCOPE = '@figma-harness/';

const article = function (word: string): string {
  return (/^[aeiou]/.test(word) ? 'an ' : 'a ') + word;
};

/** Find an app or a design system by folder (relative to the root, or
 *  absolute), by package name, or by bare name ("coffer" for apps/coffer). */
export function findPackage(
  reference: string,
  role: keyof typeof PACKAGE_FOLDERS,
  root: string = repositoryRoot(),
): WorkspacePackage {
  const packages = workspacePackages(root);
  const candidate = path.resolve(root, reference);
  const directory = reference && fs.existsSync(candidate) ? fs.realpathSync(candidate) : null;
  const bare = reference.replace(/\/+$/, '');
  const found = packages.find((entry) => entry.dir === directory || entry.name === reference)
    || packages.find((entry) => entry.role === role
      && (entry.relative === PACKAGE_FOLDERS[role] + '/' + bare || entry.name === PACKAGE_SCOPE + bare));
  if (!found) {
    throw new Error('no ' + role + ' named ' + JSON.stringify(reference) + '; the ' + role + 's are '
      + packages.filter((entry) => entry.role === role).map((entry) => entry.relative).join(', '));
  }
  if (found.role !== role) {
    throw new Error(found.relative + ' is ' + article(found.role) + ' package, not ' + article(role) + ' package');
  }
  return found;
}

/** The starter package new packages of this role are created from. */
export function templatePackage(role: 'app' | 'design-system', root: string = repositoryRoot()): WorkspacePackage {
  const found = workspacePackages(root).filter((entry) => entry.role === role && entry.template);
  if (found.length !== 1) throw new Error('expected exactly one ' + role + ' template, found ' + found.length);
  return found[0];
}

/** Find an app by folder, package name or bare name. */
export function resolveApp(app: string, root: string = repositoryRoot()): WorkspacePackage {
  return findPackage(app, 'app', root);
}

export interface Composition {
  readonly app: WorkspacePackage;
  readonly designSystem: WorkspacePackage;
  /** The design system replaces the one the app depends on. Such a
   *  composition is audited, never compared with the app's baselines. */
  readonly substituted: boolean;
}

/** Find a design system by folder, package name or bare name. */
export function resolveDesignSystem(designSystem: string, root: string = repositoryRoot()): WorkspacePackage {
  return findPackage(designSystem, 'design-system', root);
}

/** The one design system an app depends on. */
export function appDesignSystem(appPackage: WorkspacePackage, root: string = repositoryRoot()): WorkspacePackage {
  const designSystems = workspaceDependencies(appPackage, root).filter((entry) => entry.role === 'design-system');
  if (designSystems.length !== 1) {
    throw new Error(appPackage.relative + ' must depend on exactly one design system; it depends on '
      + (designSystems.map((entry) => entry.name).join(', ') || 'none'));
  }
  return designSystems[0];
}

/** The app a command works on, and the design system it is built with: the
 *  one the app depends on, unless `designSystem` substitutes another one (the
 *  app template runs on every design system this way). A command that names
 *  no app follows FIGMA_HARNESS_APP and FIGMA_HARNESS_DESIGN_SYSTEM, then the
 *  config; a command that names its app ignores both variables. */
export function activeComposition(root: string = repositoryRoot(), app?: string, designSystem?: string): Composition {
  const appPackage = resolveApp(app || activeAppPath(root), root);
  const own = appDesignSystem(appPackage, root);
  const requested = designSystem || (app ? undefined : process.env[DESIGN_SYSTEM_ENVIRONMENT_VARIABLE]);
  const chosen = requested ? resolveDesignSystem(requested, root) : own;
  return Object.freeze({
    app: appPackage,
    designSystem: chosen,
    substituted: chosen.dir !== own.dir,
  });
}

/** The composition figma-harness.config.json names, which code.js is built for. */
export function configuredComposition(root: string = repositoryRoot()): Composition {
  const appPackage = resolveApp(readConfig(root).app, root);
  const own = appDesignSystem(appPackage, root);
  return Object.freeze({ app: appPackage, designSystem: own, substituted: false });
}

/** The file a package publishes under an `exports` key. */
export function exportedFile(entry: WorkspacePackage, subpath: string): string {
  const target = entry.manifest.exports?.[subpath];
  if (!target) throw new Error(entry.name + ' does not export "' + subpath + '"');
  return path.join(entry.dir, target);
}

export interface PluginLayout {
  readonly bundle: string;
  readonly entry: string;
  readonly manifest: string;
  readonly root: string;
  readonly ui: string;
}

export function pluginLayout(root: string = repositoryRoot()): PluginLayout {
  const plugin = path.join(root, readConfig(root).plugin);
  return Object.freeze({
    root: plugin,
    entry: path.join(plugin, 'src', 'entry.ts'),
    bundle: path.join(plugin, 'code.js'),
    manifest: path.join(plugin, 'manifest.json'),
    ui: path.join(plugin, 'ui.html'),
  });
}

export interface AppLayout {
  /** Reviewed signatures of the document this app and its design system produce. */
  readonly baselines: { readonly components: string; readonly design: string };
  readonly composition: Composition;
  readonly package: WorkspacePackage;
  /** Why this composition has no reviewed baseline, or null when it has one. */
  readonly unreviewed: string | null;
}

export function appLayout(root: string = repositoryRoot(), app?: string): AppLayout {
  const composition = activeComposition(root, app);
  const entry = composition.app;
  const unreviewed = entry.template
    ? entry.relative + ' is a template, and templates are audited, not reviewed'
    : composition.substituted
      ? entry.relative + ' is built with ' + composition.designSystem.relative
        + ' instead of its own design system, and such a build is audited, not reviewed'
      : null;
  return Object.freeze({
    package: entry,
    composition,
    unreviewed,
    baselines: Object.freeze({
      design: path.join(entry.dir, 'baselines', 'design.json'),
      components: path.join(entry.dir, 'baselines', 'components.json'),
    }),
  });
}

export interface DesignSystemLayout {
  readonly cvdTable: string;
  readonly manifest: DesignSystemManifest;
  readonly package: WorkspacePackage;
  readonly root: string;
}

export function designSystemLayoutOf(entry: WorkspacePackage): DesignSystemLayout {
  const manifest = readJson<DesignSystemManifest>(path.join(entry.dir, DESIGN_SYSTEM_MANIFEST));
  return Object.freeze({
    package: entry,
    root: entry.dir,
    manifest,
    cvdTable: path.join(entry.dir, manifest.generated.cvdTable),
  });
}

/** Every package the plugin bundles for an app, dependencies first: the
 *  plugin's own infrastructure, the app, and the app's design system.
 *  Contract packages are left out: most of what they declare is types. */
export function bundledPackages(root: string = repositoryRoot(), app?: string, designSystem?: string): WorkspacePackage[] {
  const packages = workspacePackages(root);
  const byName = new Map(packages.map((entry) => [entry.name, entry]));
  const pluginDirectory = fs.realpathSync(pluginLayout(root).root);
  const plugin = packages.find((entry) => entry.dir === pluginDirectory);
  if (!plugin) throw new Error('the configured plugin is not a workspace package');
  const ordered: WorkspacePackage[] = [];
  const seen = new Set<string>();
  const visit = (entry: WorkspacePackage): void => {
    if (seen.has(entry.dir)) return;
    seen.add(entry.dir);
    for (const name of Object.keys(entry.manifest.dependencies || {})) {
      const dependency = byName.get(name);
      if (!dependency) continue;
      // The plugin reaches apps and design systems only through the active composition.
      if (entry === plugin && (dependency.role === 'app' || dependency.role === 'design-system')) continue;
      visit(dependency);
    }
    if (entry.role !== 'contract') ordered.push(entry);
  };
  visit(plugin);
  const composition = activeComposition(root, app, designSystem);
  // A substituted design system replaces the app's own one.
  if (composition.substituted) seen.add(appDesignSystem(composition.app, root).dir);
  visit(composition.designSystem);
  visit(composition.app);
  return ordered;
}

/** Local inspection output, created on demand. */
export function rendersDirectory(root: string = repositoryRoot()): string {
  return path.join(root, readConfig(root).renders);
}

/** A path given on the command line, read from the repository root. */
export function fromRoot(value: string, root: string = repositoryRoot()): string {
  return path.resolve(root, value);
}
