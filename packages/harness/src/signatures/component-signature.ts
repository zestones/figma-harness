/* Deterministic visual signatures for representative refactoring boundaries.
 * Schema 2 is independent from mock node allocation and prototype destinations;
 * the flow contract owns reaction parity. */
'use strict';

import type { HarnessContract } from '@figma-harness/contract';
import { appLayout, repositoryRoot } from '../core/workspace.ts';
import type { MockNode } from '../runtime/figma-mock/types.ts';
import {
  missingBaselineMessage,
  nodeSignature,
  settleLayout,
  type NodeSignature,
  type SignatureHarness,
} from './signature.ts';

const fs = require('node:fs') as typeof import('node:fs');
const path = require('node:path') as typeof import('node:path');
const { createHarness } = require('../runtime/harness.ts') as {
  createHarness(): ComponentHarness;
};

interface ComponentHarness extends SignatureHarness {
  buildAll(): Promise<MockNode[]>;
  runtime: { readonly CONTRACT: HarnessContract };
}

interface ComponentSnapshot extends NodeSignature {
  selector: {
    node: string;
    page: string;
    topLevel: string;
  };
}

interface ComponentBaseline {
  components: Record<string, ComponentSnapshot>;
  schemaVersion: 2;
}

const APP = appLayout();
const BASELINE_FILE = APP.baselines.components;
const CHECK = process.argv.includes('--check');

function exactlyOne<T>(nodes: readonly T[], description: string): T {
  if (nodes.length !== 1) {
    throw new Error(description + ': expected exactly one match, found ' + nodes.length);
  }
  return nodes[0];
}

function descendants(node: MockNode, name: string): MockNode[] {
  const matches: MockNode[] = [];
  const visit = (candidate: MockNode): void => {
    if (candidate.name === name) matches.push(candidate);
    for (const child of candidate.children) visit(child);
  };
  visit(node);
  return matches;
}

async function createSignature(): Promise<ComponentBaseline> {
  const harness = createHarness();
  const pages = await harness.buildAll();
  settleLayout(harness, pages);
  const components: Record<string, ComponentSnapshot> = {};

  for (const definition of harness.runtime.CONTRACT.document.signatureComponents) {
    const page = exactlyOne(
      pages.filter((candidate) => candidate.name === definition.page),
      definition.key + ' page ' + JSON.stringify(definition.page),
    );
    const top = exactlyOne(
      page.children.filter((candidate) => candidate.name === definition.topLevel),
      definition.key + ' top-level frame ' + JSON.stringify(definition.topLevel),
    );
    const node = exactlyOne(
      descendants(top, definition.node),
      definition.key + ' node ' + JSON.stringify(definition.node),
    );
    components[definition.key] = {
      selector: {
        page: definition.page,
        topLevel: definition.topLevel,
        node: definition.node,
      },
      ...nodeSignature(node),
    };
  }

  return { schemaVersion: 2, components };
}

// Every selector is resolved, even for a build that has no baseline to compare with.
createSignature().then((signature) => {
  if (!CHECK) {
    console.log(JSON.stringify(signature, null, 2));
    return;
  }
  const count = Object.keys(signature.components).length;
  if (APP.unreviewed) {
    console.log('components: ' + count + (count === 1 ? ' representative boundary' : ' representative boundaries')
      + ' found; not compared: ' + APP.unreviewed);
    return;
  }
  if (!fs.existsSync(BASELINE_FILE)) {
    console.error(missingBaselineMessage(path.relative(repositoryRoot(), BASELINE_FILE), 'design:components', APP.package.relative));
    process.exitCode = 1;
    return;
  }
  const baseline: unknown = JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'));
  if (JSON.stringify(signature) !== JSON.stringify(baseline)) {
    console.error('component signatures changed');
    console.error('expected: ' + JSON.stringify(baseline, null, 2));
    console.error('actual:   ' + JSON.stringify(signature, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log('components: unchanged (' + count + ' representative boundaries)');
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exitCode = 1;
});
