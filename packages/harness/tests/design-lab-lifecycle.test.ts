'use strict';

import type { MockNode } from '../src/runtime/figma-mock/types.ts';
import type { AuditContext, AuditRule } from '../src/runtime/rules/types.ts';
import type { AddFinding, TreeHarness } from '../src/accessibility/a11y/tree/types.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

const {
  createSignatureFromBuiltPages,
  selectProtectedPages,
} = require('../src/signatures/design-signature.ts') as
  typeof import('../src/signatures/design-signature.ts');
const { loadContract } = require('../src/bundle/contract-loader.ts') as
  typeof import('../src/bundle/contract-loader.ts');
const { protectedPageNames, workspacePageNames } = require('@figma-harness/contract') as
  typeof import('@figma-harness/contract');

const WORKSPACE = loadContract().workspace;
const PROTECTED_PAGE_NAMES = protectedPageNames(WORKSPACE);
const REQUIRED_WORKSPACE_PAGE_NAMES = workspacePageNames(WORKSPACE);
const { createHarness } = require('../src/runtime/harness.ts') as
  typeof import('../src/runtime/harness.ts');
const { nodeSignature, settleLayout } = require('../src/signatures/signature.ts') as
  typeof import('../src/signatures/signature.ts');
const outOfFrame = require('../src/runtime/rules/out-of-frame.ts') as AuditRule;
const { treeContrast } = require('../src/accessibility/a11y/tree/contrast.ts') as
  typeof import('../src/accessibility/a11y/tree/contrast.ts');

test('stable signature scope requires all three pages but selects only 01 and 02', () => {
  const pages = REQUIRED_WORKSPACE_PAGE_NAMES.map((name) => ({ name }));
  assert.deepEqual(
    selectProtectedPages(pages, WORKSPACE).map((page) => page.name),
    [...PROTECTED_PAGE_NAMES],
  );
  assert.throws(
    () => selectProtectedPages(pages.slice(0, 2), WORKSPACE),
    /03 · Design lab/,
  );
  assert.throws(
    () => selectProtectedPages([...pages, { name: '04 · Accidental page' }], WORKSPACE),
    /workspace pages must be exactly/,
  );
});

test('Design Lab rebuild replaces disposable studies and preserves the protected pages', async () => {
  const harness = createHarness();
  const pages = await harness.buildAll();
  const lab = pages.find((page) => page.name === '03 · Design lab');
  const screens = pages.find((page) => page.name === '01 · Screens');

  assert.ok(lab);
  assert.ok(screens?.children[0]);
  settleLayout(harness, [lab]);
  const firstFrames = [...lab.children];
  const labSignatures = firstFrames.map(nodeSignature);
  const activeExperiment = lab.getPluginData('workspace.lab.active-experiment');
  const reviewStateCount = lab.getPluginData('workspace.lab.review-state-count');
  const prototypeActionCount = lab.getPluginData('workspace.lab.prototype-action-count');
  const before = createSignatureFromBuiltPages(harness, pages);
  const retired = screens.children[0].clone();
  retired.name = 'Retired focus study';
  lab.appendChild(retired);
  lab.setPluginData('workspace.lab.active-experiment', 'focus-study');
  lab.setPluginData('workspace.lab.review-state-count', '2');
  lab.setPluginData('workspace.lab.prototype-action-count', '1');

  await harness.runtime.BUILDERS['states']();
  assert.equal(retired.removed, true);
  assert.ok(firstFrames.every(frame => frame.removed));
  assert.equal(lab.getPluginData('workspace.lab.active-experiment'), activeExperiment);
  assert.equal(lab.getPluginData('workspace.lab.review-state-count'), reviewStateCount);
  assert.equal(lab.getPluginData('workspace.lab.prototype-action-count'), prototypeActionCount);
  assert.equal(lab.getPluginData('workspace.lab.archives'), '');
  settleLayout(harness, [lab]);
  assert.deepEqual(lab.children.map(nodeSignature), labSignatures);

  const labChildren = lab.children as MockNode[];
  labChildren.push(screens.children[0] as MockNode);
  const after = createSignatureFromBuiltPages(harness, pages);
  labChildren.pop();
  assert.deepEqual(after, before);
  assert.deepEqual(before.workspacePages, [...REQUIRED_WORKSPACE_PAGE_NAMES]);
  assert.equal(before.protectedPageCount, 2);

  await harness.runtime.BUILDERS['states']();
  settleLayout(harness, [lab]);
  assert.deepEqual(lab.children.map(nodeSignature), labSignatures);
  assert.deepEqual(createSignatureFromBuiltPages(harness, pages), before);
});

test('structural rules continue to inspect an experiment mounted in the lab', async () => {
  const escapingChild = {
    type: 'RECTANGLE', name: 'escaping specimen', x: 96, y: 0,
    width: 12, height: 12, children: [],
  } as unknown as MockNode;
  const experiment = {
    type: 'FRAME', name: 'temporary experiment', x: 0, y: 0,
    width: 100, height: 100, children: [escapingChild],
  } as unknown as MockNode;
  const lab = {
    type: 'PAGE', name: '03 · Design lab', children: [experiment],
  } as unknown as MockNode;
  const context = {
    pages: [lab],
    solveLayout: () => undefined,
  } as unknown as AuditContext;

  const originalLog = console.log;
  try {
    console.log = () => undefined;
    assert.equal(await outOfFrame.run(context), 1);
  } finally {
    console.log = originalLog;
  }
});

test('accessibility contrast continues to inspect text mounted in the lab', async () => {
  const harness = {
    buildAll: async () => undefined,
    vars: [],
    pages: [{
      type: 'PAGE',
      name: '03 · Design lab',
      children: [{
        type: 'FRAME',
        name: 'temporary contrast experiment',
        fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }],
        children: [{
          type: 'TEXT',
          name: 'low contrast copy',
          characters: 'Lab contrast must still be audited',
          fontSize: 12,
          fills: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9 } }],
          children: [],
        }],
      }],
    }],
  } satisfies TreeHarness;
  const findings: Array<{ detail: string; severity: string }> = [];
  const add: AddFinding = (severity, _rule, _subject, detail) => {
    findings.push({ severity, detail });
  };

  await treeContrast(harness, add);

  assert.equal(findings.some((finding) =>
    finding.severity === 'FAIL' && finding.detail.includes('03 · Design lab')), true);
});
