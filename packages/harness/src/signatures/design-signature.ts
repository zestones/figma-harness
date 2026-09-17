/* Deterministic structural signature of the stable generated Figma document.
 * The Design Lab must exist, but its disposable contents are deliberately not
 * part of visual-parity acceptance. All pages remain in the audit harness. */
'use strict';

import {
  protectedPageNames,
  workspacePageNames,
  type WorkspaceContract,
} from '@figma-harness/contract';
import { appLayout, pluginLayout, repositoryRoot } from '../core/workspace.ts';
import type {
  MockNode,
  MockStore,
} from '../runtime/figma-mock/types.ts';
import {
  countNodes,
  missingBaselineMessage,
  settleLayout,
  sha256,
  streamedSha256,
  writeCanonicalJson,
  writeSnapshotNodeJson,
  type SignatureHarness,
} from './signature.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');
const { createHarness } = require('../runtime/harness.ts') as {
  createHarness(): DesignHarness;
};

export interface DesignHarness extends SignatureHarness {
  buildAll(): Promise<MockNode[]>;
  runtime: { readonly CONTRACT: { readonly workspace: WorkspaceContract } };
  store: MockStore;
}

export interface DesignSignature {
  designSha256: string;
  manifestSha256: string;
  protectedNodeCount: number;
  protectedPageCount: number;
  protectedPages: Array<{ children: number; name: string }>;
  protectedTopLevelNodeCount: number;
  schemaVersion: 2;
  uiSha256: string;
  workspacePages: string[];
}

const CHECK = process.argv.includes('--check');

function fileDigest(filename: string): string {
  return sha256(fs.readFileSync(filename));
}

export function selectProtectedPages<T extends { name: string }>(
  pages: readonly T[],
  workspace: WorkspaceContract,
): T[] {
  const requiredNames = workspacePageNames(workspace);
  const actualNames = pages.map((page) => page.name);
  if (JSON.stringify(actualNames) !== JSON.stringify(requiredNames)) {
    throw new Error(
      'workspace pages must be exactly '
      + requiredNames.join(' | ')
      + '; received '
      + (actualNames.length ? actualNames.join(' | ') : '(none)'),
    );
  }
  return protectedPageNames(workspace).map((name) => {
    const page = pages.find((candidate) => candidate.name === name);
    if (!page) throw new Error('missing protected page: ' + name);
    return page;
  });
}

export function createSignatureFromBuiltPages(
  harness: DesignHarness,
  pages: MockNode[],
): DesignSignature {
  const protectedPages = selectProtectedPages(pages, harness.runtime.CONTRACT.workspace);
  settleLayout(harness, protectedPages);

  const designSha256 = streamedSha256((write) => {
    write('{"pages":[');
    for (let index = 0; index < protectedPages.length; index++) {
      if (index) write(',');
      writeSnapshotNodeJson(protectedPages[index], write);
    }
    write('],"collections":');
    writeCanonicalJson(harness.store.colls, write);
    write(',"variables":');
    writeCanonicalJson(harness.store.vars, write);
    write(',"textStyles":');
    writeCanonicalJson(harness.store.text, write);
    write(',"effectStyles":');
    writeCanonicalJson(harness.store.effect, write);
    write('}');
  });
  return {
    schemaVersion: 2,
    designSha256,
    protectedNodeCount: countNodes(protectedPages),
    protectedPageCount: protectedPages.length,
    protectedTopLevelNodeCount: protectedPages.reduce(
      (sum, page) => sum + page.children.length,
      0,
    ),
    protectedPages: protectedPages.map((page) => ({
      name: page.name,
      children: page.children.length,
    })),
    workspacePages: pages.map((page) => page.name),
    uiSha256: fileDigest(pluginLayout().ui),
    manifestSha256: fileDigest(pluginLayout().manifest),
  };
}

export async function createSignature(harness: DesignHarness = createHarness()): Promise<DesignSignature> {
  const pages = await harness.buildAll();
  return createSignatureFromBuiltPages(harness, pages);
}

async function run(): Promise<void> {
  const app = appLayout();
  const signature = await createSignature();
  if (!CHECK) {
    console.log(JSON.stringify(signature, null, 2));
    return;
  }
  if (app.unreviewed) {
    console.log('design: ' + signature.protectedNodeCount + ' protected nodes built; not compared: ' + app.unreviewed);
    return;
  }
  const BASELINE_FILE = app.baselines.design;
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(missingBaselineMessage(path.relative(repositoryRoot(), BASELINE_FILE), 'design:signature', app.package.relative));
    process.exitCode = 1;
    return;
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) as Record<string, unknown>;
  const actual = signature as unknown as Record<string, unknown>;
  const keys = [...new Set([...Object.keys(baseline), ...Object.keys(actual)])];
  const mismatches = keys.filter(
    (key) => JSON.stringify(actual[key]) !== JSON.stringify(baseline[key]),
  );
  if (mismatches.length) {
    console.error('stable design signature changed: ' + mismatches.join(', '));
    console.error('expected: ' + JSON.stringify(baseline, null, 2));
    console.error('actual:   ' + JSON.stringify(signature, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log(
    'design: unchanged (' + signature.protectedNodeCount
    + ' protected nodes, sha256 ' + signature.designSha256 + ')',
  );
}

if (require.main === module) {
  run().catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exitCode = 1;
  });
}
