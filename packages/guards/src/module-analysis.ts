/* Shared, typed filesystem and AST analysis for architecture guards. */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseSync } from 'oxc-parser';

interface AstNode extends Record<string, unknown> {
  end: number;
  start: number;
  type: string;
}

export interface DependencyFact {
  dynamic?: boolean;
  line: number;
  requireCall?: boolean;
  specifier: string | null;
}

export interface ModuleFacts {
  dependencies: DependencyFact[];
  identifierLines: Readonly<Record<string, readonly number[]>>;
}

export interface FunctionBodyFact {
  canonicalBody: string;
  end: number;
  line: number;
  start: number;
}

function isAstNode(value: unknown): value is AstNode {
  return !!value
    && typeof value === 'object'
    && typeof (value as { type?: unknown }).type === 'string'
    && typeof (value as { start?: unknown }).start === 'number'
    && typeof (value as { end?: unknown }).end === 'number';
}

function literalString(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { type?: unknown; value?: unknown };
  return candidate.type === 'Literal' && typeof candidate.value === 'string'
    ? candidate.value
    : null;
}

function lineResolver(source: string): (offset: number) => number {
  const starts = [0];
  for (let index = 0; index < source.length; index++) {
    if (source.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return (offset: number): number => {
    let low = 0;
    let high = starts.length;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (starts[middle] <= offset) low = middle;
      else high = middle;
    }
    return low + 1;
  };
}

function canonicalAst(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalAst);
  if (!value || typeof value !== 'object') return value;
  const normalized: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    if (key === 'start' || key === 'end' || key === 'range' || key === 'raw') continue;
    normalized[key] = canonicalAst(child);
  }
  return normalized;
}

export function toPosix(value: string): string {
  return value.split(path.sep).join('/');
}

export function walkFiles(directory: string, extension: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(absolute, extension));
    else if (entry.isFile() && entry.name.endsWith(extension)) files.push(absolute);
  }
  return files.sort();
}

export function walkTypeScript(directory: string): string[] {
  return walkFiles(directory, '.ts');
}

export function parseProgram(filename: string, source: string): AstNode {
  const result = parseSync(filename, source);
  if (result.errors.length) {
    throw new Error(result.errors.map((error) => error.message).join('; '));
  }
  return result.program as unknown as AstNode;
}

export function visitAst(node: unknown, callback: (node: AstNode) => void): void {
  if (!isAstNode(node)) return;
  callback(node);
  for (const [key, value] of Object.entries(node)) {
    if (key === 'start' || key === 'end' || key === 'type') continue;
    if (Array.isArray(value)) {
      for (const child of value) visitAst(child, callback);
    } else {
      visitAst(value, callback);
    }
  }
}

export function moduleFacts(
  filename: string,
  watchedIdentifiers: readonly string[] = [],
): ModuleFacts {
  const source = fs.readFileSync(filename, 'utf8');
  const ast = parseProgram(filename, source);
  const lineOf = lineResolver(source);
  const dependencies: DependencyFact[] = [];
  const watched = new Set(watchedIdentifiers);
  const identifierLines: Record<string, number[]> = Object.fromEntries(
    watchedIdentifiers.map((name): [string, number[]] => [name, []]),
  );

  visitAst(ast, (node) => {
    if (
      node.type === 'ImportDeclaration'
      || node.type === 'ExportNamedDeclaration'
      || node.type === 'ExportAllDeclaration'
    ) {
      const specifier = literalString(node['source']);
      if (specifier != null) dependencies.push({ specifier, line: lineOf(node.start) });
    } else if (node.type === 'ImportExpression') {
      dependencies.push({
        specifier: literalString(node['source']),
        line: lineOf(node.start),
        dynamic: true,
      });
    } else if (node.type === 'CallExpression') {
      const callee = node['callee'];
      const args = node['arguments'];
      if (
        isAstNode(callee)
        && callee.type === 'Identifier'
        && callee['name'] === 'require'
      ) {
        dependencies.push({
          specifier: Array.isArray(args) && args.length === 1
            ? literalString(args[0])
            : null,
          line: lineOf(node.start),
          requireCall: true,
        });
      }
    }

    if (node.type === 'Identifier') {
      const name = node['name'];
      if (typeof name === 'string' && watched.has(name)) {
        identifierLines[name].push(lineOf(node.start));
      }
    }
  });

  return { dependencies, identifierLines };
}

export function functionBodies(filename: string): FunctionBodyFact[] {
  const source = fs.readFileSync(filename, 'utf8');
  const ast = parseProgram(filename, source);
  const lineOf = lineResolver(source);
  const functions: FunctionBodyFact[] = [];
  visitAst(ast, (node) => {
    if (![
      'ArrowFunctionExpression',
      'FunctionDeclaration',
      'FunctionExpression',
    ].includes(node.type)) return;
    const body = node['body'];
    if (!isAstNode(body)) return;
    functions.push({
      canonicalBody: JSON.stringify(canonicalAst(body)),
      line: lineOf(node.start),
      start: node.start,
      end: node.end,
    });
  });
  return functions;
}

export function resolveDependency(importerFile: string, specifier: string): string | null {
  if (!specifier.startsWith('.')) return null;
  const target = path.resolve(path.dirname(importerFile), specifier);
  return path.extname(target) ? target : target + '.ts';
}

function canonicalCycle(cycle: string[]): string {
  const nodes = cycle.slice(0, -1);
  const rotations = nodes.map((_, index) => nodes.slice(index).concat(nodes.slice(0, index)));
  rotations.sort((left, right) => left.join('\0').localeCompare(right.join('\0')));
  return rotations[0].concat(rotations[0][0]).join(' -> ');
}

export function findCycles(edges: ReadonlyMap<string, ReadonlySet<string>>): string[] {
  const state = new Map<string, number>();
  const stack: string[] = [];
  const cycles = new Set<string>();

  function walk(node: string): void {
    state.set(node, 1);
    stack.push(node);
    for (const target of edges.get(node) || []) {
      if (!state.has(target)) walk(target);
      else if (state.get(target) === 1) {
        const start = stack.indexOf(target);
        cycles.add(canonicalCycle(stack.slice(start).concat(target)));
      }
    }
    stack.pop();
    state.set(node, 2);
  }

  for (const node of edges.keys()) if (!state.has(node)) walk(node);
  return [...cycles].sort();
}
