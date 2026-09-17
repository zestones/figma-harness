/* Reachability and exact-clone guards for handwritten source and tooling. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  findCycles,
  functionBodies,
  moduleFacts,
  resolveDependency,
  toPosix,
  walkTypeScript,
} from './module-analysis.ts';

const DEFAULT_PLUGIN_ROOT = path.resolve(__dirname, '..', '..');
const MIN_CLONE_LENGTH = 160;

export interface ToolingHygieneIssue {
  file: string;
  line: number;
  message: string;
}

export interface ToolingHygieneOptions {
  pluginRoot?: string;
}

export interface ToolingHygieneReport {
  cloneCandidates: number;
  roots: number;
  toolFiles: number;
  violations: ToolingHygieneIssue[];
}

interface PackageManifest {
  scripts?: Record<string, string>;
}

interface CloneLocation {
  file: string;
  line: number;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function packageScriptRoots(
  pluginRoot: string,
  scripts: Readonly<Record<string, string>>,
  violations: ToolingHygieneIssue[],
): string[] {
  const roots: string[] = [];
  const commandPattern = /(?:^|&&|\|\|)\s*(?:(?:npx\s+)?tsx(?:\s+--[^\s]+)*|node(?:\s+--[^\s]+)*\s+--import(?:\s+|=)tsx(?:\s+--[^\s]+)*)\s+(tools\/[^\s*]+\.ts)\b/g;
  for (const [name, command] of Object.entries(scripts)) {
    for (const match of command.matchAll(commandPattern)) {
      const filename = path.resolve(pluginRoot, match[1]);
      if (fs.existsSync(filename)) roots.push(filename);
      else {
        violations.push({
          file: 'package.json',
          line: 1,
          message: `script ${name} references missing tool ${match[1]}`,
        });
      }
    }
  }
  return roots;
}

function cloneViolations(
  pluginRoot: string,
  files: readonly string[],
  violations: ToolingHygieneIssue[],
): number {
  const groups = new Map<string, CloneLocation[]>();
  let candidates = 0;
  for (const filename of files) {
    if (filename.endsWith('.generated.ts')) continue;
    try {
      for (const body of functionBodies(filename)) {
        if (body.end - body.start < MIN_CLONE_LENGTH) continue;
        candidates++;
        const locations = groups.get(body.canonicalBody) || [];
        locations.push({
          file: toPosix(path.relative(pluginRoot, filename)),
          line: body.line,
        });
        groups.set(body.canonicalBody, locations);
      }
    } catch (error) {
      violations.push({
        file: toPosix(path.relative(pluginRoot, filename)),
        line: 1,
        message: 'cannot inspect function bodies: ' + errorMessage(error),
      });
    }
  }

  for (const locations of groups.values()) {
    if (locations.length < 2) continue;
    const summary = locations.map((location) => `${location.file}:${location.line}`).join(', ');
    violations.push({
      file: locations[0].file,
      line: locations[0].line,
      message: 'exact non-trivial function clone: ' + summary,
    });
  }
  return candidates;
}

export function validateToolingHygiene(
  options: ToolingHygieneOptions = {},
): ToolingHygieneReport {
  const pluginRoot = path.resolve(options.pluginRoot || DEFAULT_PLUGIN_ROOT);
  const toolsRoot = path.join(pluginRoot, 'tools');
  const sourceRoot = path.join(pluginRoot, 'src');
  const files = walkTypeScript(toolsRoot);
  const fileSet = new Set(files.map((filename) => path.resolve(filename)));
  const relativeOf = (filename: string): string => toPosix(path.relative(toolsRoot, filename));
  const edges = new Map<string, Set<string>>(
    files.map((filename) => [relativeOf(filename), new Set<string>()]),
  );
  const violations: ToolingHygieneIssue[] = [];

  for (const filename of files) {
    const relative = relativeOf(filename);
    try {
      const facts = moduleFacts(filename);
      for (const dependency of facts.dependencies) {
        if (!dependency.specifier || !dependency.specifier.startsWith('.')) continue;
        const target = resolveDependency(filename, dependency.specifier);
        if (target && target.startsWith(sourceRoot + path.sep) && !relative.startsWith('tests/')) {
          violations.push({
            file: 'tools/' + relative,
            line: dependency.line,
            message: 'tools read product knowledge through HARNESS_API.CONTRACT, never by importing src/: '
              + dependency.specifier,
          });
          continue;
        }
        if (!target || !target.startsWith(toolsRoot + path.sep)) continue;
        if (!fileSet.has(target)) {
          violations.push({
            file: 'tools/' + relative,
            line: dependency.line,
            message: 'local tool dependency does not exist: ' + dependency.specifier,
          });
          continue;
        }
        edges.get(relative)!.add(relativeOf(target));
      }
    } catch (error) {
      violations.push({
        file: 'tools/' + relative,
        line: 1,
        message: 'cannot parse tool module: ' + errorMessage(error),
      });
    }
  }

  const packageFile = path.join(pluginRoot, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8')) as PackageManifest;
  const roots = packageScriptRoots(pluginRoot, manifest.scripts || {}, violations);
  const experimentsRoot = path.join(toolsRoot, 'color', 'experiments');
  const experimentReadmeFile = path.join(experimentsRoot, 'README.md');
  const experimentReadme = fs.existsSync(experimentReadmeFile)
    ? fs.readFileSync(experimentReadmeFile, 'utf8')
    : '';
  const experiments = fs.existsSync(experimentsRoot) ? walkTypeScript(experimentsRoot) : [];
  for (const filename of experiments) {
    roots.push(filename);
    const basename = path.basename(filename);
    if (!experimentReadme.includes('`' + basename + '`')) {
      violations.push({
        file: 'tools/color/experiments/' + basename,
        line: 1,
        message: 'manual experiment is not documented in tools/color/experiments/README.md',
      });
    }
  }
  for (const filename of files) {
    if (relativeOf(filename).startsWith('tests/')) roots.push(filename);
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
        file: 'tools/' + relative,
        line: 1,
        message: 'tool module is unreachable from package scripts, tests, or documented experiments',
      });
    }
  }

  for (const cycle of findCycles(edges)) {
    violations.push({
      file: 'tools/' + cycle.split(' -> ')[0],
      line: 1,
      message: 'tool dependency cycle: ' + cycle,
    });
  }

  const cloneCandidates = cloneViolations(
    pluginRoot,
    walkTypeScript(sourceRoot).concat(files),
    violations,
  );
  violations.sort((left, right) =>
    left.file.localeCompare(right.file)
    || left.line - right.line
    || left.message.localeCompare(right.message));
  return {
    cloneCandidates,
    roots: new Set(queue.concat(roots.map((filename) => path.resolve(filename)))).size,
    toolFiles: files.length,
    violations,
  };
}
