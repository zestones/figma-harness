/* Where things are. The repository root holds figma-harness.config.json, which
 * names the plugin and the design system the harness inspects. Each workspace
 * package declares its role in package.json ("figmaHarness.role"). The harness
 * reads files and evaluates the plugin bundle; it never imports product code. */
'use strict';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');

export const CONFIG_FILE = 'figma-harness.config.json';
export const DESIGN_SYSTEM_MANIFEST = 'design-system.json';

export type PackageRole = 'app' | 'contract' | 'design-system' | 'engine' | 'plugin' | 'tooling';

export const PACKAGE_ROLES: readonly PackageRole[] = Object.freeze([
  'app', 'contract', 'design-system', 'engine', 'plugin', 'tooling',
]);

export interface PackageManifest {
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies?: Readonly<Record<string, string>>;
  readonly exports?: Readonly<Record<string, string>>;
  readonly figmaHarness?: { readonly role?: string };
  readonly name: string;
  readonly scripts?: Readonly<Record<string, string>>;
}

export interface WorkspacePackage {
  /** Absolute directory. */
  readonly dir: string;
  readonly manifest: PackageManifest;
  readonly name: string;
  /** Directory relative to the repository root, with forward slashes. */
  readonly relative: string;
  readonly role: PackageRole;
}

export interface WorkspaceConfig {
  /** The design system the harness measures fonts and generated tables for. */
  readonly designSystem: string;
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
  for (const key of ['designSystem', 'plugin', 'renders'] as const) {
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
      });
    })
    .sort((left, right) => left.relative.localeCompare(right.relative));
}

export interface PluginLayout {
  readonly baselines: { readonly components: string; readonly design: string };
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
    baselines: Object.freeze({
      design: path.join(plugin, 'baselines', 'design.json'),
      components: path.join(plugin, 'baselines', 'components.json'),
    }),
  });
}

export interface DesignSystemLayout {
  readonly cvdTable: string;
  readonly manifest: DesignSystemManifest;
  readonly root: string;
}

export function designSystemLayout(root: string = repositoryRoot()): DesignSystemLayout {
  const directory = path.join(root, readConfig(root).designSystem);
  const manifest = readJson<DesignSystemManifest>(path.join(directory, DESIGN_SYSTEM_MANIFEST));
  return Object.freeze({
    root: directory,
    manifest,
    cvdTable: path.join(directory, manifest.generated.cvdTable),
  });
}

/** The plugin and every workspace package it bundles, dependencies first.
 *  Contract packages are left out: most of what they declare is types. */
export function bundledPackages(root: string = repositoryRoot()): WorkspacePackage[] {
  const byDirectory = new Map(workspacePackages(root).map((entry) => [entry.dir, entry]));
  const plugin = byDirectory.get(fs.realpathSync(pluginLayout(root).root));
  if (!plugin) throw new Error('the configured plugin is not a workspace package');
  const ordered: WorkspacePackage[] = [];
  const seen = new Set<string>();
  const visit = (entry: WorkspacePackage): void => {
    if (seen.has(entry.dir)) return;
    seen.add(entry.dir);
    for (const name of Object.keys(entry.manifest.dependencies || {})) {
      const link = path.join(entry.dir, 'node_modules', name);
      if (!fs.existsSync(link)) continue;
      const dependency = byDirectory.get(fs.realpathSync(link));
      if (dependency) visit(dependency);
    }
    if (entry.role !== 'contract') ordered.push(entry);
  };
  visit(plugin);
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
