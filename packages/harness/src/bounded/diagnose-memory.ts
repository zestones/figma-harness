/* Bounded allocation sampling and rebuild measurements; never dump node graphs. */
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { HeapProfiler } from 'node:inspector';
import { Session } from 'node:inspector/promises';
import path from 'node:path';
import { labPageName } from '@figma-harness/contract';
import { fromRoot, rendersDirectory } from '../core/workspace.ts';
import { createMockNodeFactory } from '../runtime/figma-mock/node-factory.ts';
import { nodeSignature } from '../signatures/signature.ts';

const observations: unknown[] = [];
function record(value: unknown): void {
  observations.push(value);
  console.log(JSON.stringify(value));
}

async function collect(): Promise<NodeJS.MemoryUsage> {
  if (!global.gc) throw new Error('This diagnostic requires --expose-gc');
  await new Promise(resolve => setImmediate(resolve));
  global.gc();
  return process.memoryUsage();
}

async function nodes(): Promise<void> {
  const factory = createMockNodeFactory();
  const baseline = await collect();
  const session = new Session();
  session.connect();
  await session.post('HeapProfiler.startSampling', { samplingInterval: 8192 });
  const rootId = (() => {
    const root = factory.node('PAGE', 'memory-probe');
    for (let index = 0; index < 2500; index++) {
      const frame = factory.node('FRAME', 'row');
      frame.layoutMode = 'HORIZONTAL';
      root.appendChild(frame);
      const label = factory.node('TEXT', 'label');
      label.characters = 'Memory probe ' + index;
      frame.appendChild(label);
    }
    record({ stage: 'probe-signature', ...nodeSignature(root) });
    return root.id;
  })();
  const live = await collect();
  const { profile } = await session.post('HeapProfiler.stopSampling');
  session.disconnect();
  const allocations = new Map<string, number>();
  const walk = (node: HeapProfiler.SamplingHeapProfileNode): void => {
    const frame = node.callFrame;
    const key = `${frame.functionName || '(anonymous)'} ${frame.url}:${frame.lineNumber + 1}`;
    allocations.set(key, (allocations.get(key) || 0) + node.selfSize);
    for (const child of node.children) walk(child);
  };
  walk(profile.head);
  record({ stage: 'live', count: factory.nodeById.size,
    heapDeltaBytes: live.heapUsed - baseline.heapUsed, ...live,
    allocations: [...allocations].sort((a, b) => b[1] - a[1]).slice(0, 12) });
  factory.nodeById.get(rootId)!.remove();
  const removed = await collect();
  record({ stage: 'removed', indexed: factory.nodeById.size, ledger: factory.created.length,
    heapDeltaBytes: removed.heapUsed - baseline.heapUsed, ...removed });
}

async function assertion(): Promise<void> {
  for (const size of [4, 8, 16]) {
    const factory = createMockNodeFactory();
    const page = factory.node('PAGE', 'assertion-probe');
    for (let index = 0; index < size; index++) {
      const frame = factory.node('FRAME', 'frame-' + index);
      page.appendChild(frame);
      frame.appendChild(factory.node('TEXT', 'label'));
    }
    const attempt = (kind: string, check: () => void): void => {
      const before = process.memoryUsage().heapUsed;
      const start = performance.now();
      try { check(); } catch (error) {
        record({ stage: kind, frames: size, messageLength: (error as Error).message.length,
          milliseconds: performance.now() - start,
          heapGrowthBytes: process.memoryUsage().heapUsed - before });
      }
    };
    attempt('cyclic-assertion', () => assert.deepEqual(page.children, []));
    attempt('scalar-assertion', () => assert.equal(page.children.length, 0));
    await collect();
  }
}

async function document(labOnly = false): Promise<void> {
  const { createHarness } = await import('../runtime/harness.ts');
  const { createSignatureFromBuiltPages } = await import('../signatures/design-signature.ts');
  const harness = createHarness();
  if (labOnly) {
    await harness.runtime.loadFonts();
    await harness.runtime.ensureTokens();
    await harness.runtime.BUILDERS['states']();
    const lab = harness.pages.find(page => page.name === labPageName(harness.runtime.CONTRACT.workspace));
    if (!lab) throw new Error('Missing Design lab');
    record({ stage: 'lab', frames: lab.children.map(nodeSignature), ...await collect() });
    return;
  }
  record({ stage: 'document-start', ...await collect() });
  for (let pass = 1; pass <= 3; pass++) {
    const started = performance.now();
    const pages = await harness.buildAll();
    record({ stage: 'built', pass, milliseconds: performance.now() - started,
      indexed: harness.nodeById.size, ledger: harness.created.length, ...await collect() });
    if (pass === 1) record({ stage: 'document-signature', ...createSignatureFromBuiltPages(harness, pages) });
  }
}

async function main(): Promise<void> {
  // Even the manual entry point refuses to run inside the graphical service.
  const group = readFileSync('/proc/self/cgroup', 'utf8');
  if (!/\/app\.slice\/figma-harness-check-[\w-]+\.service/.test(group)) {
    throw new Error('Use pnpm isolated diagnose:memory <nodes|assertion|document|lab> [renders/output.json]');
  }
  const [mode, output] = process.argv.slice(2);
  if (mode === 'nodes') await nodes();
  else if (mode === 'assertion') await assertion();
  else if (mode === 'document') await document();
  else if (mode === 'lab') await document(true);
  else throw new Error('Expected nodes, assertion, document or lab');
  if (output) {
    const filename = fromRoot(output);
    if (!filename.startsWith(rendersDirectory() + path.sep)) throw new Error('Output must be inside the renders directory');
    mkdirSync(path.dirname(filename), { recursive: true });
    writeFileSync(filename, JSON.stringify(observations, null, 2) + '\n');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
