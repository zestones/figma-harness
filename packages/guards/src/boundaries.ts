/* Architecture boundaries for the product packages: which package may import
 * which, and which layer inside a package may import which. A package's role
 * comes from its package.json ("figmaHarness.role"); a layer comes from the
 * file's place inside the package's src/. Tooling is checked by
 * tooling-hygiene.ts. */
'use strict';

import {
  repositoryRoot,
  workspacePackages,
  type PackageRole,
  type WorkspacePackage,
} from '@figma-harness/harness/core/workspace.ts';
import {
  findCycles,
  moduleFacts,
  resolveDependency,
  toPosix,
  walkFiles,
  walkTypeScript,
} from './module-analysis.ts';

const fs = require('fs');
const path = require('path');
const { errorMessage } = require('@figma-harness/harness/core/errors.ts');

export { findCycles };

export type SourceLayer =
  | 'app-entry'
  | 'component'
  | 'contract'
  | 'design'
  | 'engine'
  | 'facade'
  | 'fixture'
  | 'fixture-facade'
  | 'foundation'
  | 'pattern'
  | 'plugin'
  | 'primitive'
  | 'sheet'
  | 'system';

export interface SourceGraphOptions {
  /** A repository root other than this one, for tests. */
  root?: string;
}

export interface SourceGraphViolation {
  file: string;
  line: number;
  message: string;
}

export interface SourceGraphReport {
  files: number;
  violations: SourceGraphViolation[];
}

/** The layer of a product file, from its package's role and its path under src/. */
export function classifySource(role: PackageRole, relative: string): SourceLayer | null {
  if (role === 'contract') return 'contract';
  if (role === 'engine') return 'engine';
  if (role === 'plugin') return 'plugin';
  if (role === 'design-system') {
    if (relative === 'index.ts') return 'facade';
    if (relative === 'system.ts') return 'system';
    if (relative.startsWith('foundations/')) return 'foundation';
    if (relative.startsWith('primitives/')) return 'primitive';
    if (relative.startsWith('components/')) return 'component';
    if (relative.startsWith('patterns/')) return 'pattern';
    if (relative.startsWith('sheets/')) return 'sheet';
    return null;
  }
  if (role === 'app') {
    if (relative === 'index.ts') return 'app-entry';
    if (relative === 'fixtures/index.ts') return 'fixture-facade';
    if (relative.startsWith('fixtures/')) return 'fixture';
    return 'design';
  }
  return null;
}

/* What each layer may import. Layers of another package are reached through
   that package's published entry points only. */
const SAME_PACKAGE: Readonly<Record<SourceLayer, readonly SourceLayer[]>> = Object.freeze({
  'app-entry': ['design', 'fixture-facade'],
  component: ['foundation', 'primitive', 'component'],
  contract: ['contract'],
  design: ['design', 'fixture-facade'],
  engine: ['engine'],
  facade: ['foundation', 'primitive', 'component', 'pattern'],
  fixture: ['fixture'],
  'fixture-facade': ['fixture'],
  foundation: ['foundation'],
  pattern: ['foundation', 'primitive', 'component', 'pattern'],
  plugin: ['plugin'],
  primitive: ['foundation', 'primitive'],
  sheet: ['facade', 'sheet'],
  system: ['foundation', 'primitive', 'component', 'pattern', 'facade', 'sheet'],
});

const OTHER_PACKAGE: Readonly<Record<SourceLayer, readonly SourceLayer[]>> = Object.freeze({
  'app-entry': ['contract', 'facade'],
  component: ['contract', 'engine'],
  contract: [],
  design: ['contract', 'facade'],
  engine: ['contract'],
  facade: ['contract', 'engine'],
  fixture: ['contract'],
  'fixture-facade': [],
  foundation: ['contract', 'engine'],
  pattern: ['contract', 'engine'],
  plugin: ['contract', 'engine', 'system', 'app-entry'],
  primitive: ['contract', 'engine'],
  sheet: ['contract'],
  system: ['contract', 'engine'],
});

export function isBoundaryAllowed(
  importer: SourceLayer,
  target: SourceLayer,
  crossPackage: boolean,
): boolean {
  return (crossPackage ? OTHER_PACKAGE : SAME_PACKAGE)[importer].includes(target);
}

interface ProductFile {
  readonly absolute: string;
  readonly layer: SourceLayer | null;
  readonly owner: WorkspacePackage;
  /** Relative to the repository root. */
  readonly relative: string;
}

/* A workspace package specifier resolves through its exact "exports" entry. */
const resolvePackageSpecifier = function (
  specifier: string,
  packages: readonly WorkspacePackage[],
): { owner: WorkspacePackage; file: string | null } | null {
  const owner = packages
    .filter((entry) => specifier === entry.name || specifier.startsWith(entry.name + '/'))
    .sort((left, right) => right.name.length - left.name.length)[0];
  if (!owner) return null;
  const subpath = '.' + specifier.slice(owner.name.length);
  const exported = owner.manifest.exports?.[subpath];
  return { owner, file: exported ? path.join(owner.dir, exported) : null };
};

export function validateSourceGraph(options: SourceGraphOptions = {}): SourceGraphReport {
  const root = path.resolve(options.root || repositoryRoot());
  const violations: SourceGraphViolation[] = [];
  let packages: WorkspacePackage[];
  try {
    packages = workspacePackages(root);
  } catch (error) {
    return { files: 0, violations: [{ file: 'pnpm-workspace.yaml', line: 1, message: errorMessage(error) }] };
  }
  const product = packages.filter((entry) => entry.role !== 'tooling');
  const files = new Map<string, ProductFile>();
  for (const owner of product) {
    const sources = path.join(owner.dir, 'src');
    if (!fs.existsSync(sources)) continue;
    for (const filename of walkFiles(sources, '.js')) {
      violations.push({
        file: toPosix(path.relative(root, filename)),
        line: 1,
        message: 'product source must be TypeScript; .js is reserved for the generated plugin bundle',
      });
    }
    for (const absolute of walkTypeScript(sources)) {
      files.set(absolute, {
        absolute,
        layer: classifySource(owner.role, toPosix(path.relative(sources, absolute))),
        owner,
        relative: toPosix(path.relative(root, absolute)),
      });
    }
  }

  const edges = new Map<string, Set<string>>();
  for (const file of files.values()) {
    edges.set(file.relative, new Set());
    const report = (line: number, message: string): void => {
      violations.push({ file: file.relative, line, message });
    };
    if (!file.layer) {
      report(1, 'module is outside every declared layer of its ' + file.owner.role + ' package');
      continue;
    }

    let facts;
    try {
      facts = moduleFacts(file.absolute, ['figma']);
    } catch (error) {
      report(1, 'cannot parse module: ' + errorMessage(error));
      continue;
    }

    if (file.layer === 'design' || file.layer === 'fixture' || file.layer === 'fixture-facade') {
      for (const line of facts.identifierLines['figma'] || []) {
        report(line, 'authored designs and fixtures must not access the global Figma runtime; use a public API');
      }
    }

    for (const dependency of facts.dependencies) {
      if (dependency.requireCall) {
        report(dependency.line, 'CommonJS require() is forbidden in product source');
        continue;
      }
      if (dependency.dynamic && typeof dependency.specifier !== 'string') {
        report(dependency.line, 'computed dynamic imports are forbidden');
        continue;
      }
      const specifier = dependency.specifier;
      if (typeof specifier !== 'string') continue;

      let target: ProductFile | undefined;
      if (specifier.startsWith('.')) {
        if (!specifier.endsWith('.ts')) {
          report(dependency.line, 'relative imports must include the .ts extension');
          continue;
        }
        const absolute = resolveDependency(file.absolute, specifier);
        if (!absolute || !fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
          report(dependency.line, 'import target does not exist: ' + specifier);
          continue;
        }
        target = files.get(absolute);
        if (!target || target.owner !== file.owner) {
          report(dependency.line, 'a relative import may not leave its package; import ' + specifier + ' by package name');
          continue;
        }
      } else {
        const resolved = resolvePackageSpecifier(specifier, packages);
        if (!resolved) {
          report(dependency.line, 'product source may import only its own modules and workspace packages: ' + specifier);
          continue;
        }
        if (resolved.owner.role === 'tooling') {
          report(dependency.line, 'product source may not import tooling: ' + specifier);
          continue;
        }
        if (!(file.owner.manifest.dependencies || {})[resolved.owner.name]) {
          report(dependency.line, resolved.owner.name + ' is not a dependency of ' + file.owner.name);
          continue;
        }
        if (!resolved.file || !fs.existsSync(resolved.file)) {
          report(dependency.line, specifier + ' is not an entry point ' + resolved.owner.name + ' exports');
          continue;
        }
        target = files.get(fs.realpathSync(resolved.file)) || files.get(resolved.file);
        if (!target) {
          report(dependency.line, 'cannot resolve ' + specifier);
          continue;
        }
      }

      edges.get(file.relative)!.add(target.relative);
      const crossPackage = target.owner !== file.owner;
      if (!target.layer || !isBoundaryAllowed(file.layer, target.layer, crossPackage)) {
        report(
          dependency.line,
          file.layer + ' may not import ' + target.relative + ' (' + (target.layer || 'unowned')
            + (crossPackage ? ' in ' + target.owner.name : '') + ')',
        );
      }
    }
  }

  for (const cycle of findCycles(edges)) {
    violations.push({ file: cycle.split(' -> ')[0], line: 1, message: 'dependency cycle: ' + cycle });
  }

  return {
    files: files.size,
    violations: violations.sort((a: SourceGraphViolation, b: SourceGraphViolation) =>
      a.file.localeCompare(b.file) || a.line - b.line || a.message.localeCompare(b.message)),
  };
}

module.exports = {
  classifySource,
  findCycles,
  isBoundaryAllowed,
  validateSourceGraph,
};
