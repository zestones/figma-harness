/* Reachability and exact-clone guards for Node tooling.
 *
 * Tooling is every TypeScript file of a tooling package (the harness, these
 * guards), every file of a product package outside its src/ (a design
 * system's generators), and every test. Tooling reads product knowledge
 * through HARNESS_API.CONTRACT, typed by the contract package; only tests may
 * import product source.
 *
 * A non-trivial function body must not repeat, with one exception: the same
 * body in two apps, or in two design systems, is allowed. Each owns its code,
 * and one created from a template starts as a copy of it. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  repositoryRoot,
  workspacePackages,
  type PackageManifest,
  type PackageRole,
  type WorkspacePackage,
} from '@figma-harness/harness/core/workspace.ts';
import {
  findCycles,
  functionBodies,
  moduleFacts,
  resolveDependency,
  toPosix,
  walkTypeScript,
} from './module-analysis.ts';

const MIN_CLONE_LENGTH = 160;

export interface ToolingHygieneIssue {
  file: string;
  line: number;
  message: string;
}

export interface ToolingHygieneOptions {
  /** A repository root other than this one, for tests. */
  root?: string;
}

export interface ToolingHygieneReport {
  cloneCandidates: number;
  roots: number;
  toolFiles: number;
  violations: ToolingHygieneIssue[];
}

interface CloneOwner {
  readonly package: string;
  readonly role: PackageRole;
}

interface CloneLocation {
  file: string;
  line: number;
  owner: CloneOwner;
}

/* Copies are independent when each sits in its own app, or each in its own design system. */
const independentCopies = function (locations: readonly CloneLocation[]): boolean {
  const packages = new Set(locations.map((location) => location.owner.package));
  const roles = new Set(locations.map((location) => location.owner.role));
  return packages.size === locations.length && roles.size === 1
    && (roles.has('app') || roles.has('design-system'));
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function scriptRoots(
  root: string,
  directory: string,
  manifest: PackageManifest,
  violations: ToolingHygieneIssue[],
): string[] {
  const roots: string[] = [];
  const commandPattern = /(?:^|&&|\|\|)\s*(?:(?:npx\s+|pnpm\s+exec\s+)?tsx(?:\s+--[^\s]+)*|node(?:\s+--[^\s]+)*\s+--import(?:\s+|=)tsx(?:\s+--[^\s]+)*)\s+([\w./-]+\.ts)\b/g;
  const owner = toPosix(path.relative(root, path.join(directory, 'package.json')));
  for (const [name, command] of Object.entries(manifest.scripts || {})) {
    for (const match of command.matchAll(commandPattern)) {
      const filename = path.resolve(directory, match[1]);
      if (fs.existsSync(filename)) roots.push(filename);
      else {
        violations.push({
          file: owner,
          line: 1,
          message: `script ${name} references missing tool ${match[1]}`,
        });
      }
    }
  }
  return roots;
}

/* `owners` maps each file to the package it belongs to. */
function cloneViolations(
  root: string,
  owners: ReadonlyMap<string, CloneOwner>,
  violations: ToolingHygieneIssue[],
): number {
  const groups = new Map<string, CloneLocation[]>();
  let candidates = 0;
  for (const [filename, owner] of owners) {
    if (filename.endsWith('.generated.ts')) continue;
    try {
      for (const body of functionBodies(filename)) {
        if (body.end - body.start < MIN_CLONE_LENGTH) continue;
        candidates++;
        const locations = groups.get(body.canonicalBody) || [];
        locations.push({ file: toPosix(path.relative(root, filename)), line: body.line, owner });
        groups.set(body.canonicalBody, locations);
      }
    } catch (error) {
      violations.push({
        file: toPosix(path.relative(root, filename)),
        line: 1,
        message: 'cannot inspect function bodies: ' + errorMessage(error),
      });
    }
  }

  for (const locations of groups.values()) {
    if (locations.length < 2 || independentCopies(locations)) continue;
    const summary = locations.map((location) => `${location.file}:${location.line}`).join(', ');
    violations.push({
      file: locations[0].file,
      line: locations[0].line,
      message: 'exact non-trivial function clone: ' + summary,
    });
  }
  return candidates;
}

const packageFiles = function (entry: WorkspacePackage): { product: string[]; tools: string[] } {
  const product: string[] = [];
  const tools: string[] = [];
  for (const child of fs.readdirSync(entry.dir, { withFileTypes: true })) {
    if (!child.isDirectory() || child.name === 'node_modules' || child.name.startsWith('.')) continue;
    // Declaration files describe modules; they are not tools.
    const files = walkTypeScript(path.join(entry.dir, child.name)).filter((file) => !file.endsWith('.d.ts'));
    if (child.name === 'src' && entry.role !== 'tooling') {
      if (entry.role !== 'contract') product.push(...files);
    } else {
      tools.push(...files);
    }
  }
  return { product, tools };
};

/* A workspace package specifier: its own entry, or a wildcard subpath. */
const resolvePackageFile = function (
  specifier: string,
  packages: readonly WorkspacePackage[],
): { file: string | null; owner: WorkspacePackage } | null {
  const owner = packages
    .filter((entry) => specifier === entry.name || specifier.startsWith(entry.name + '/'))
    .sort((left, right) => right.name.length - left.name.length)[0];
  if (!owner) return null;
  const subpath = '.' + specifier.slice(owner.name.length);
  const exports = owner.manifest.exports || {};
  if (exports[subpath]) return { owner, file: path.join(owner.dir, exports[subpath]) };
  for (const [pattern, target] of Object.entries(exports)) {
    if (!pattern.endsWith('/*') || !target.endsWith('/*')) continue;
    const prefix = pattern.slice(0, -1);
    if (subpath.startsWith(prefix)) {
      return { owner, file: path.join(owner.dir, target.slice(0, -1) + subpath.slice(prefix.length)) };
    }
  }
  return { owner, file: null };
};

export function validateToolingHygiene(
  options: ToolingHygieneOptions = {},
): ToolingHygieneReport {
  const root = path.resolve(options.root || repositoryRoot());
  const violations: ToolingHygieneIssue[] = [];
  let packages: WorkspacePackage[];
  try {
    packages = workspacePackages(root);
  } catch (error) {
    return {
      cloneCandidates: 0,
      roots: 0,
      toolFiles: 0,
      violations: [{ file: 'pnpm-workspace.yaml', line: 1, message: errorMessage(error) }],
    };
  }
  const productFiles = new Set<string>();
  const toolFiles: string[] = [];
  const cloneOwners = new Map<string, CloneOwner>();
  for (const entry of packages) {
    const { product, tools } = packageFiles(entry);
    const owner: CloneOwner = { package: entry.relative, role: entry.role };
    for (const file of product) productFiles.add(file);
    for (const file of [...product, ...tools]) cloneOwners.set(file, owner);
    toolFiles.push(...tools);
  }
  const fileSet = new Set(toolFiles);
  const relativeOf = (filename: string): string => toPosix(path.relative(root, filename));
  const isTest = (filename: string): boolean => /(^|\/)tests\//.test(relativeOf(filename));
  const edges = new Map<string, Set<string>>(toolFiles.map((filename) => [relativeOf(filename), new Set<string>()]));

  for (const filename of toolFiles) {
    const relative = relativeOf(filename);
    try {
      const facts = moduleFacts(filename);
      for (const dependency of facts.dependencies) {
        const specifier = dependency.specifier;
        if (!specifier) continue;
        let target: string | null = null;
        if (specifier.startsWith('.')) {
          target = resolveDependency(filename, specifier);
        } else {
          const resolved = resolvePackageFile(specifier, packages);
          // The contract package is the shared interface, not product source.
          if (!resolved || resolved.owner.role === 'contract') continue;
          if (resolved.owner.role !== 'tooling' && !isTest(filename)) {
            violations.push({
              file: relative,
              line: dependency.line,
              message: 'tooling reads product knowledge through HARNESS_API.CONTRACT, never by importing '
                + specifier,
            });
            continue;
          }
          target = resolved.file;
        }
        if (!target) continue;
        if (productFiles.has(target)) {
          if (!isTest(filename)) {
            violations.push({
              file: relative,
              line: dependency.line,
              message: 'tooling reads product knowledge through HARNESS_API.CONTRACT, never by importing '
                + relativeOf(target),
            });
          }
          continue;
        }
        if (!fileSet.has(target)) {
          if (!fs.existsSync(target)) {
            violations.push({
              file: relative,
              line: dependency.line,
              message: 'local tool dependency does not exist: ' + specifier,
            });
          }
          continue;
        }
        edges.get(relative)!.add(relativeOf(target));
      }
    } catch (error) {
      violations.push({ file: relative, line: 1, message: 'cannot parse tool module: ' + errorMessage(error) });
    }
  }

  const roots: string[] = [];
  const rootManifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')) as PackageManifest;
  roots.push(...scriptRoots(root, root, rootManifest, violations));
  for (const entry of packages) roots.push(...scriptRoots(root, entry.dir, entry.manifest, violations));
  for (const filename of toolFiles) if (isTest(filename)) roots.push(filename);

  const experimentsRoot = path.join(root, 'packages', 'harness', 'src', 'color', 'experiments');
  if (fs.existsSync(experimentsRoot)) {
    const readmeFile = path.join(experimentsRoot, 'README.md');
    const readme = fs.existsSync(readmeFile) ? fs.readFileSync(readmeFile, 'utf8') : '';
    for (const filename of walkTypeScript(experimentsRoot)) {
      roots.push(filename);
      if (!readme.includes('`' + path.basename(filename) + '`')) {
        violations.push({
          file: relativeOf(filename),
          line: 1,
          message: 'manual experiment is not documented in its experiments README.md',
        });
      }
    }
  }

  const reached = new Set<string>();
  const queue = [...new Set(roots.map((filename) => relativeOf(path.resolve(filename))))];
  while (queue.length) {
    const relative = queue.pop()!;
    if (reached.has(relative) || !edges.has(relative)) continue;
    reached.add(relative);
    for (const target of edges.get(relative)!) queue.push(target);
  }
  for (const relative of edges.keys()) {
    if (!reached.has(relative)) {
      violations.push({
        file: relative,
        line: 1,
        message: 'tool module is unreachable from package scripts, tests, or documented experiments',
      });
    }
  }

  for (const cycle of findCycles(edges)) {
    violations.push({ file: cycle.split(' -> ')[0], line: 1, message: 'tool dependency cycle: ' + cycle });
  }

  const cloneCandidates = cloneViolations(root, cloneOwners, violations);
  violations.sort((left, right) =>
    left.file.localeCompare(right.file)
    || left.line - right.line
    || left.message.localeCompare(right.message));
  return {
    cloneCandidates,
    roots: new Set(roots.map((filename) => path.resolve(filename))).size,
    toolFiles: toolFiles.length,
    violations,
  };
}
