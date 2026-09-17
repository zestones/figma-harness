'use strict';

const fs = require('fs');
const path = require('path');
const { errorMessage } = require('../core/errors.ts');
import {
  findCycles,
  moduleFacts,
  resolveDependency,
  toPosix,
  walkFiles,
  walkTypeScript,
} from './module-analysis.ts';

export const SOURCE_ROOT = path.resolve(__dirname, '..', '..', 'src');
export const KIT_FACADE = 'kit/public.ts';
export const FIXTURE_FACADE = 'fixtures/public.ts';

export { findCycles };

export type SourceLayer =
  | 'component'
  | 'design'
  | 'engine'
  | 'facade'
  | 'fixture'
  | 'foundation'
  | 'pattern'
  | 'plugin'
  | 'primitive';

export interface SourceGraphOptions {
  sourceRoot?: string;
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

export function classifySource(relative: string): SourceLayer | null {
  if (relative === KIT_FACADE) return 'facade';
  if (relative.startsWith('engine/')) return 'engine';
  if (relative.startsWith('kit/foundations/')) return 'foundation';
  if (relative.startsWith('kit/primitives/')) return 'primitive';
  if (relative.startsWith('kit/components/')) return 'component';
  if (relative.startsWith('kit/patterns/')) return 'pattern';
  if (relative.startsWith('fixtures/')) return 'fixture';
  if (relative.startsWith('designs/')) return 'design';
  if (relative.startsWith('plugin/')) return 'plugin';
  return null;
}

export function isBoundaryAllowed(
  importer: SourceLayer,
  target: SourceLayer,
  targetFile: string,
): boolean {
  if (importer === 'plugin') return true;
  if (importer === 'engine') return target === 'engine';
  if (importer === 'foundation') return target === 'engine' || target === 'foundation';
  if (importer === 'primitive') {
    return target === 'engine' || target === 'foundation' || target === 'primitive';
  }
  if (importer === 'component') {
    return ['engine', 'foundation', 'primitive', 'component'].includes(target);
  }
  if (importer === 'pattern') {
    if (target === 'fixture') return targetFile === FIXTURE_FACADE;
    return ['engine', 'foundation', 'primitive', 'component', 'pattern'].includes(target);
  }
  if (importer === 'fixture') return target === 'foundation' || target === 'fixture';
  if (importer === 'facade') {
    return ['engine', 'foundation', 'primitive', 'component', 'pattern'].includes(target);
  }
  if (importer === 'design') {
    return target === 'design' || targetFile === KIT_FACADE || targetFile === FIXTURE_FACADE;
  }
  return false;
}

export function validateSourceGraph(options: SourceGraphOptions = {}): SourceGraphReport {
  const sourceRoot = path.resolve(options.sourceRoot || SOURCE_ROOT);
  const files = walkTypeScript(sourceRoot);
  const violations: SourceGraphViolation[] = walkFiles(sourceRoot, '.js').map((filename) => ({
    file: toPosix(path.relative(sourceRoot, filename)),
    line: 1,
    message: 'browser source must be TypeScript; .js is reserved for the generated code.js artifact',
  }));
  const edges = new Map<string, Set<string>>();

  for (const filename of files) {
    const relative = toPosix(path.relative(sourceRoot, filename));
    const layer = classifySource(relative);
    edges.set(relative, new Set());
    if (!layer) {
      violations.push({ file: relative, line: 1, message: 'module is outside every declared source layer' });
      continue;
    }

    let facts;
    try {
      facts = moduleFacts(filename, ['figma']);
    } catch (error) {
      violations.push({ file: relative, line: 1, message: 'cannot parse module: ' + errorMessage(error) });
      continue;
    }

    const figmaReferences = facts.identifierLines['figma'] || [];
    if ((layer === 'design' || layer === 'fixture') && figmaReferences.length) {
      for (const line of figmaReferences) {
        violations.push({
          file: relative,
          line,
          message: 'authored designs and fixtures must not access the global Figma runtime; use a public API',
        });
      }
    }

    for (const dependency of facts.dependencies) {
      if (dependency.requireCall) {
        violations.push({ file: relative, line: dependency.line, message: 'CommonJS require() is forbidden in src/' });
        continue;
      }
      if (dependency.dynamic && typeof dependency.specifier !== 'string') {
        violations.push({ file: relative, line: dependency.line, message: 'computed dynamic imports are forbidden' });
        continue;
      }
      if (typeof dependency.specifier !== 'string' || !dependency.specifier.startsWith('.')) {
        violations.push({
          file: relative,
          line: dependency.line,
          message: 'runtime source may import only explicit relative modules',
        });
        continue;
      }
      if (!dependency.specifier.endsWith('.ts')) {
        violations.push({ file: relative, line: dependency.line, message: 'relative imports must include the .ts extension' });
        continue;
      }

      const targetAbsolute = resolveDependency(filename, dependency.specifier);
      if (!targetAbsolute) {
        violations.push({ file: relative, line: dependency.line, message: 'cannot resolve import: ' + dependency.specifier });
        continue;
      }
      const targetRelative = toPosix(path.relative(sourceRoot, targetAbsolute));
      if (targetRelative.startsWith('../') || path.isAbsolute(targetRelative)) {
        violations.push({ file: relative, line: dependency.line, message: 'import escapes src/: ' + dependency.specifier });
        continue;
      }
      if (!fs.existsSync(targetAbsolute) || !fs.statSync(targetAbsolute).isFile()) {
        violations.push({ file: relative, line: dependency.line, message: 'import target does not exist: ' + targetRelative });
        continue;
      }

      const targetLayer = classifySource(targetRelative);
      edges.get(relative)!.add(targetRelative);
      if (!targetLayer || !isBoundaryAllowed(layer, targetLayer, targetRelative)) {
        violations.push({
          file: relative,
          line: dependency.line,
          message: layer + ' may not import ' + targetRelative + ' (' + (targetLayer || 'unowned') + ')',
        });
      }
    }
  }

  for (const cycle of findCycles(edges)) {
    violations.push({ file: cycle.split(' -> ')[0], line: 1, message: 'dependency cycle: ' + cycle });
  }

  return {
    files: files.length,
    violations: violations.sort((a: SourceGraphViolation, b: SourceGraphViolation) =>
      a.file.localeCompare(b.file) || a.line - b.line || a.message.localeCompare(b.message)),
  };
}

module.exports = {
  FIXTURE_FACADE,
  KIT_FACADE,
  SOURCE_ROOT,
  classifySource,
  findCycles,
  isBoundaryAllowed,
  validateSourceGraph,
};
