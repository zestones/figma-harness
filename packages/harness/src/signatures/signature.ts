/* Shared deterministic snapshot primitives for visual-parity gates. */
'use strict';

import type { MockNode } from '../runtime/figma-mock/types.ts';

const crypto = require('node:crypto') as typeof import('node:crypto');

const OMIT_NODE_KEYS = new Set([
  'children', 'parent', 'topLevelFrame', 'page', '_style', '_everAttached',
]);
const OMIT_COMPONENT_NODE_KEYS = new Set([
  ...OMIT_NODE_KEYS,
  // Allocation ids change when an unrelated frame moves earlier in the build.
  'id',
  // Prototype semantics are exhaustively protected by the independent flow
  // contract; destination ids would otherwise couple visual parity to layout order.
  'reactions',
]);

export interface NodeSnapshot {
  children: NodeSnapshot[];
  properties: Record<string, unknown>;
}

export interface NodeSignature {
  designSha256: string;
  name: string;
  nodeCount: number;
  type: string;
}

export interface SignatureHarness {
  layout(node: MockNode): void;
  solveLayout(node: MockNode): void;
}

export function canonical(value: unknown, seen: Set<object>): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('non-finite number in design snapshot: ' + value);
    }
    return Object.is(value, -0) ? 0 : value;
  }
  if (typeof value === 'undefined' || typeof value === 'function') return undefined;
  if (Array.isArray(value)) return value.map((item) => canonical(item, seen));
  if (typeof value !== 'object') return String(value);
  if (seen.has(value)) throw new Error('unexpected cycle outside the node parent relation');

  seen.add(value);
  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    const normalized = canonical(source[key], seen);
    if (normalized !== undefined) output[key] = normalized;
  }
  seen.delete(value);
  return output;
}

type JsonWriter = (chunk: string) => void;

function writeCanonicalJsonValue(
  value: unknown,
  write: JsonWriter,
  seen: Set<object>,
): boolean {
  if (value === null) { write('null'); return true; }
  if (typeof value === 'string' || typeof value === 'boolean') {
    write(JSON.stringify(value));
    return true;
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('non-finite number in design snapshot: ' + value);
    }
    write(String(Object.is(value, -0) ? 0 : value));
    return true;
  }
  if (typeof value === 'undefined' || typeof value === 'function') return false;
  if (Array.isArray(value)) {
    write('[');
    for (let index = 0; index < value.length; index++) {
      if (index) write(',');
      if (!writeCanonicalJsonValue(value[index], write, seen)) write('null');
    }
    write(']');
    return true;
  }
  if (typeof value !== 'object') {
    write(JSON.stringify(String(value)));
    return true;
  }
  if (seen.has(value)) throw new Error('unexpected cycle outside the node parent relation');

  seen.add(value);
  const source = value as Record<string, unknown>;
  write('{');
  let wroteProperty = false;
  for (const key of Object.keys(source).sort()) {
    const property = source[key];
    if (typeof property === 'undefined' || typeof property === 'function') continue;
    if (wroteProperty) write(',');
    write(JSON.stringify(key));
    write(':');
    writeCanonicalJsonValue(property, write, seen);
    wroteProperty = true;
  }
  write('}');
  seen.delete(value);
  return true;
}

/** Writes the exact bytes produced by JSON.stringify(canonical(value)). */
export function writeCanonicalJson(value: unknown, write: JsonWriter): void {
  if (!writeCanonicalJsonValue(value, write, new Set<object>())) {
    throw new Error('cannot serialize an undefined canonical root');
  }
}

function writeSnapshotNodeJsonWithOmissions(
  node: MockNode,
  omittedKeys: ReadonlySet<string>,
  write: JsonWriter,
): void {
  const source = node as unknown as Record<string, unknown>;
  write('{"properties":{');
  let wroteProperty = false;
  for (const key of Object.keys(source).sort()) {
    if (omittedKeys.has(key) || typeof source[key] === 'function' || source[key] === undefined) {
      continue;
    }
    if (wroteProperty) write(',');
    write(JSON.stringify(key));
    write(':');
    writeCanonicalJson(source[key], write);
    wroteProperty = true;
  }
  write('},"children":[');
  for (let index = 0; index < node.children.length; index++) {
    if (index) write(',');
    writeSnapshotNodeJsonWithOmissions(node.children[index], omittedKeys, write);
  }
  write(']}');
}

/** Streams the exact JSON bytes of snapshotNode without retaining its object tree. */
export function writeSnapshotNodeJson(node: MockNode, write: JsonWriter): void {
  writeSnapshotNodeJsonWithOmissions(node, OMIT_NODE_KEYS, write);
}

/** Streams the exact JSON bytes of snapshotComponentNode. */
export function writeSnapshotComponentNodeJson(node: MockNode, write: JsonWriter): void {
  writeSnapshotNodeJsonWithOmissions(node, OMIT_COMPONENT_NODE_KEYS, write);
}

function snapshotNodeWithOmissions(node: MockNode, omittedKeys: ReadonlySet<string>): NodeSnapshot {
  const source = node as unknown as Record<string, unknown>;
  const properties: Record<string, unknown> = {};
  for (const key of Object.keys(source).sort()) {
    if (omittedKeys.has(key) || typeof source[key] === 'function' || source[key] === undefined) {
      continue;
    }
    properties[key] = canonical(source[key], new Set<object>());
  }
  return {
    properties,
    children: node.children.map((child) => snapshotNodeWithOmissions(child, omittedKeys)),
  };
}

export function snapshotNode(node: MockNode): NodeSnapshot {
  return snapshotNodeWithOmissions(node, OMIT_NODE_KEYS);
}

export function snapshotComponentNode(node: MockNode): NodeSnapshot {
  return snapshotNodeWithOmissions(node, OMIT_COMPONENT_NODE_KEYS);
}

export function sha256(value: import('node:crypto').BinaryLike): string {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function streamedSha256(serialize: (write: JsonWriter) => void): string {
  const digest = crypto.createHash('sha256');
  serialize((chunk) => { digest.update(chunk); });
  return digest.digest('hex');
}

export function snapshotComponentNodeSha256(node: MockNode): string {
  return streamedSha256((write) => writeSnapshotComponentNodeJson(node, write));
}

export function countNodes(nodes: readonly MockNode[]): number {
  let count = 0;
  const visit = (node: MockNode): void => {
    count++;
    for (const child of node.children) visit(child);
  };
  for (const node of nodes) visit(node);
  return count;
}

export function settleLayout(
  harness: SignatureHarness,
  pages: readonly MockNode[],
): void {
  const position = (node: MockNode): void => {
    harness.solveLayout(node);
    for (const child of node.children) position(child);
  };
  for (const page of pages) {
    for (const top of page.children) {
      harness.layout(top);
      position(top);
    }
  }
}

export function nodeSignature(node: MockNode): NodeSignature {
  return {
    type: node.type,
    name: node.name,
    nodeCount: countNodes([node]),
    designSha256: snapshotComponentNodeSha256(node),
  };
}

/** Explain a missing acceptance record instead of failing on a bare path. */
export function missingBaselineMessage(baselineName: string, printCommand: string, app: string): string {
  return 'no accepted baseline: ' + baselineName + ' does not exist.\n'
    + 'Review the generated document in Figma Desktop, then record the reviewed output of '
    + '`FIGMA_HARNESS_APP=' + app + ' pnpm --silent ' + printCommand + '` in a BASELINE_ACCEPTANCE task '
    + '(docs/ia/ACCEPTANCE_GATES.md).';
}
