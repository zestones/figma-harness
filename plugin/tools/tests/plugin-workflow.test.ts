'use strict';

import type { MockNode } from '../runtime/harness/figma-mock/types.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const fs: typeof import('node:fs') = require('node:fs');
const path: typeof import('node:path') = require('node:path');
const test: typeof import('node:test') = require('node:test');
const { createHarness } = require('../runtime/harness.ts') as
  typeof import('../runtime/harness.ts');
const {
  countNodes,
  snapshotComponentNodeSha256,
} = require('../runtime/signature.ts') as typeof import('../runtime/signature.ts');

const pageDigest = function (page: MockNode): string {
  return snapshotComponentNodeSha256(page);
};

const screenByKey = function (page: MockNode, key: string): MockNode {
  var frame = page.children.find(function (candidate) {
    return candidate.getPluginData('workspace.screen.key') === key;
  });
  assert.ok(frame, 'missing generated screen key ' + key);
  return frame;
};

test('screen subtree reuse preserves exact output while avoiding native factory work', async () => {
  let optimized: ReturnType<typeof createHarness> | null = createHarness();
  await optimized.runtime.loadFonts();
  await optimized.runtime.ensureTokens();
  await optimized.runtime.buildScreens({ reuse: true });

  // Preserve complete comparison evidence before releasing the first graph.
  // Two live documents plus the snapshot exceed the bounded heap.
  const optimizedDigest = pageDigest(optimized.pages[0]);
  const optimizedNodes = countNodes([optimized.pages[0]]);
  const optimizedEvidence = {
    links: optimized.runtime.LAST_LINKS,
    reuseEnabled: optimized.runtime.LAST_SCREEN_MATERIALIZATION?.reuseEnabled,
    clonedSubtrees: optimized.runtime.LAST_SCREEN_MATERIALIZATION?.clonedSubtrees || 0,
    cloneMilliseconds: optimized.runtime.LAST_SCREEN_MATERIALIZATION?.cloneMilliseconds,
    clonedStruts: optimized.metrics.nodes.clonedStruts,
    createFrame: optimized.metrics.createFrame,
    createText: optimized.metrics.createText,
    createNodeFromSvg: optimized.metrics.createNodeFromSvg,
    appendChild: optimized.metrics.nodes.appendChild,
    setTextStyle: optimized.metrics.nodes.setTextStyle,
  };
  for (const page of optimized.pages) for (const child of [...page.children]) child.remove();
  optimized = null;

  const reference = createHarness();
  await reference.runtime.loadFonts();
  await reference.runtime.ensureTokens();
  await reference.runtime.buildScreens({ reuse: false });

  assert.equal(optimizedDigest, pageDigest(reference.pages[0]));
  assert.equal(optimizedNodes, countNodes([reference.pages[0]]));
  assert.equal(optimizedEvidence.links, reference.runtime.LAST_LINKS);
  assert.equal(optimizedEvidence.reuseEnabled, true);
  // App headers: one per section, cloned for the two other Releases screens and
  // the two other Settings screens.
  assert.equal(optimizedEvidence.clonedSubtrees, 4);
  assert.equal(
    Number.isFinite(optimizedEvidence.cloneMilliseconds),
    true,
  );
  assert.ok(optimizedEvidence.clonedStruts > 0);
  assert.ok(optimizedEvidence.createFrame < reference.metrics.createFrame);
  assert.ok(optimizedEvidence.createText < reference.metrics.createText);
  assert.ok(optimizedEvidence.createNodeFromSvg < reference.metrics.createNodeFromSvg);
  assert.ok(optimizedEvidence.appendChild < reference.metrics.nodes.appendChild);
  assert.ok(optimizedEvidence.setTextStyle < reference.metrics.nodes.setTextStyle);
});

test('selected-screen refresh is idempotent and preserves stable Figma identities', async () => {
  const harness = createHarness();
  await harness.runtime.loadFonts();
  await harness.runtime.ensureTokens();
  await harness.runtime.buildScreens();

  const page = harness.pages[0] as MockNode & { selection: MockNode[] };
  const selected = screenByKey(page, 'overview');
  const untouched = screenByKey(page, 'settings');
  const selectedId = selected.id;
  const untouchedId = untouched.id;
  const originalChild = selected.children[0];
  const expectedDigest = pageDigest(page);
  const expectedNodes = countNodes([page]);
  const expectedLinks = harness.runtime.LAST_LINKS;

  page.selection = [selected, untouched];
  assert.equal(harness.runtime.inspectScreenRefresh(page).canRefresh, false);
  for (const child of page.children) {
    if (child.type !== 'FRAME' || !child.getPluginData('workspace.screen.key')) continue;
    child.setPluginData('workspace.screen.key', '');
    child.setPluginData('workspace.screen.catalog', '');
  }
  page.setPluginData('workspace.screen.catalog', '');
  page.setPluginData('workspace.prototype.action-count', '');
  page.selection = [selected.children[0]];
  assert.equal(harness.runtime.inspectScreenRefresh(page).canRefresh, true);
  const first = await harness.runtime.refreshSelectedScreen(page);
  assert.equal(first.frame, selected);
  assert.equal(first.frame.id, selectedId);
  assert.equal(untouched.id, untouchedId);
  assert.equal(harness.nodeById.get(selectedId), selected);
  assert.equal(originalChild.removed, true);
  assert.equal(first.links, expectedLinks);
  assert.equal(first.rewiredLinks, expectedLinks);
  assert.equal(pageDigest(page), expectedDigest);
  assert.equal(countNodes([page]), expectedNodes);
  assert.equal(selected.getPluginData('workspace.screen.key'), 'overview');
  assert.equal(untouched.getPluginData('workspace.screen.key'), 'settings');

  page.selection = [selected];
  const reactionsBeforeTargetedRefresh = harness.metrics.nodes.setReactions;
  const second = await harness.runtime.refreshSelectedScreen(page);
  assert.equal(second.frame.id, selectedId);
  assert.equal(second.links, expectedLinks);
  assert.ok(second.rewiredLinks > 0);
  assert.ok(second.rewiredLinks < second.links);
  assert.equal(
    harness.metrics.nodes.setReactions - reactionsBeforeTargetedRefresh,
    second.rewiredLinks,
  );
  assert.equal(pageDigest(page), expectedDigest);
  assert.equal(countNodes([page]), expectedNodes);
  assert.equal(page.getPluginData('workspace.prototype.action-count'), String(expectedLinks));
});

test('every generated screen supports an exact source-local refresh', async () => {
  const harness = createHarness();
  await harness.runtime.loadFonts();
  await harness.runtime.ensureTokens();
  await harness.runtime.buildScreens();

  const page = harness.pages[0] as MockNode & { selection: MockNode[] };
  const expectedDigest = pageDigest(page);
  const expectedNodes = countNodes([page]);
  const expectedLinks = harness.runtime.LAST_LINKS;
  const generated = page.children.filter(function (candidate) {
    return candidate.type === 'FRAME' && !!candidate.getPluginData('workspace.screen.key');
  });
  // Every generated screen takes part in the prototype.
  assert.equal(generated.length, 7);

  for (const screen of generated) {
    const stableId = screen.id;
    const reactionsBefore = harness.metrics.nodes.setReactions;
    page.selection = [screen];
    const refreshed = await harness.runtime.refreshSelectedScreen(page);
    const reactionWrites = harness.metrics.nodes.setReactions - reactionsBefore;
    assert.equal(refreshed.frame.id, stableId, screen.name + ': root id changed');
    assert.equal(refreshed.links, expectedLinks, screen.name + ': global link total changed');
    assert.ok(refreshed.rewiredLinks > 0, screen.name + ': no local action was verified');
    assert.ok(refreshed.rewiredLinks < refreshed.links, screen.name + ': refresh was not local');
    assert.ok(reactionWrites > 0 && reactionWrites <= refreshed.rewiredLinks);
    assert.equal(pageDigest(page), expectedDigest, screen.name + ': generated output drifted');
    assert.equal(countNodes([page]), expectedNodes, screen.name + ': node count drifted');
  }
});

test('the mock rejects reuse of nodes destroyed by remove()', async () => {
  const { createFigmaMock } = require('../runtime/harness/figma-mock.ts') as
    typeof import('../runtime/harness/figma-mock.ts');
  const { figma, nodeById } = createFigmaMock();
  const parent = figma.createFrame();
  const child = figma.createFrame();
  parent.appendChild(child);
  figma.currentPage.appendChild(parent);

  parent.remove();
  assert.equal(parent.removed, true);
  assert.equal(child.removed, true);
  assert.equal(nodeById.has(parent.id), false);
  assert.equal(await figma.getNodeByIdAsync(child.id), null);
  assert.throws(() => figma.currentPage.appendChild(parent), /does not exist/);
  assert.throws(() => parent.clone(), /does not exist/);
});

test('the mock exposes the native clone hazards guarded by materialization', async () => {
  const { createFigmaMock } = require('../runtime/harness/figma-mock.ts') as
    typeof import('../runtime/harness/figma-mock.ts');
  const { figma } = createFigmaMock();
  const source = figma.createFrame();
  const nestedComponent = figma.createComponent();
  const destination = figma.createFrame();
  source.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
  source.appendChild(nestedComponent);
  figma.currentPage.appendChild(source);
  figma.currentPage.appendChild(destination);
  await source.setReactionsAsync([{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE',
      destinationId: destination.id,
      navigation: 'NAVIGATE',
      transition: null,
      preserveScrollPosition: false,
    }],
  }]);

  const clone = source.clone();
  assert.deepEqual(clone.constraints, source.constraints);
  assert.notEqual(clone.constraints, source.constraints);
  assert.deepEqual(clone.reactions, source.reactions);
  assert.equal(clone.children[0].type, 'INSTANCE');
  assert.equal(clone.children[0].mainComponent, nestedComponent);
});

test('absolute children stop contributing to the mock hug size before the next measurement', () => {
  const { createFigmaMock } = require('../runtime/harness/figma-mock.ts') as
    typeof import('../runtime/harness/figma-mock.ts');
  const { figma } = createFigmaMock();
  const control = figma.createFrame();
  control.layoutMode = 'HORIZONTAL';
  control.primaryAxisSizingMode = 'AUTO';
  const content = figma.createFrame();
  content.resize(120, 36);
  control.appendChild(content);
  assert.equal(control.width, 120);

  const outline = figma.createFrame();
  outline.resize(128, 44);
  control.appendChild(outline);
  assert.equal(control.width, 248);
  outline.layoutPositioning = 'ABSOLUTE';
  assert.equal(control.width, 120, 'a separate outline must not inflate the measured control');
  outline.layoutPositioning = 'AUTO';
  assert.equal(control.width, 248, 'returning to flow must also update the measured control');
});

test('plugin UI exposes contextual fast refresh and reports scoped verification', async () => {
  const harness = createHarness();
  await harness.dispatchUiMessage({ type: 'ready' });
  assert.deepEqual(JSON.parse(JSON.stringify(harness.uiMessages.at(-1))), {
    type: 'context',
    canRefresh: false,
    key: null,
    page: 'Page 1',
    reason: 'Open 01 · Screens and select a generated screen.',
    title: null,
  });

  await harness.dispatchUiMessage({ type: 'run', task: 'screens' });
  const expectedLinks = harness.runtime.LAST_LINKS;
  const expectedScreenRoots = harness.pages[0].children.length;
  assert.ok(expectedLinks);
  const built = [...harness.uiMessages].reverse().find(function (message) {
    return (message as { type?: string }).type === 'status';
  }) as { status: string; text: string };
  assert.equal(built.status, 'done');
  assert.match(built.text, new RegExp(String(expectedLinks) + ' prototype links'));
  assert.match(built.text, /repeated subtrees reused/);
  assert.match(built.text, /native clone/);

  await harness.dispatchUiMessage({ type: 'run', task: 'screens' });
  const rebuilt = [...harness.uiMessages].reverse().find(function (message) {
    return (message as { type?: string }).type === 'status';
  }) as { status: string; text: string };
  assert.equal(rebuilt.status, 'done');
  assert.match(rebuilt.text, new RegExp(
    'Cleanup removed ' + expectedScreenRoots + ' top-level nodes',
  ));
  assert.equal(harness.pages[0].children.length, expectedScreenRoots);

  const page = harness.pages[0] as MockNode & { selection: MockNode[] };
  const screen = screenByKey(page, 'overview');
  page.selection = [screen.children[0]];
  harness.emit('selectionchange');
  assert.equal((harness.uiMessages.at(-1) as { canRefresh?: boolean }).canRefresh, true);

  await harness.dispatchUiMessage({ type: 'run', task: 'refresh' });
  const refreshed = [...harness.uiMessages].reverse().find(function (message) {
    return (message as { type?: string }).type === 'status';
  }) as { status: string; text: string };
  assert.equal(refreshed.status, 'done');
  assert.match(refreshed.text, /01 · Overview refreshed/);
  const rewiredMatch = refreshed.text.match(
    new RegExp(String(expectedLinks) + ' prototype links retained\\. (\\d+) rewired and verified'),
  );
  assert.ok(rewiredMatch, 'missing scoped reaction verification count');
  const rewiredLinks = Number(rewiredMatch[1]);
  assert.ok(rewiredLinks > 0, 'refresh must verify at least one local reaction');
  assert.ok(rewiredLinks < expectedLinks, 'refresh must remain scoped below the full link total');
  assert.match(refreshed.text, /Layout check: 1 frame clean/);

  const html = fs.readFileSync(path.resolve(__dirname, '..', '..', 'ui.html'), 'utf8');
  assert.match(html, /data-task="refresh"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /about a minute/i);
});

test('complete UI rebuild is idempotent and reports its native-cost phases', async () => {
  const harness = createHarness();
  await harness.dispatchUiMessage({ type: 'run', task: 'all' });
  const expectedLinks = harness.runtime.LAST_LINKS;
  const expectedReusedSubtrees = harness.runtime.LAST_SCREEN_MATERIALIZATION?.clonedSubtrees;
  assert.ok(expectedLinks);
  assert.ok(expectedReusedSubtrees);
  const firstPageShape = harness.pages.map(function (page) {
    return [page.name, page.children.length];
  });
  const expectedLintRoots = harness.pages.reduce(function (total, page) {
    return total + page.children.filter(function (child) {
      return child.children.length > 0;
    }).length;
  }, 0);
  const expectedClearedTopLevel = harness.pages.reduce(function (total, page) {
    return total + page.children.length;
  }, 0);
  await harness.dispatchUiMessage({ type: 'run', task: 'all' });

  const status = [...harness.uiMessages].reverse().find(function (message) {
    return (message as { type?: string }).type === 'status';
  }) as { status: string; text: string };
  assert.equal(status.status, 'done');
  assert.match(status.text, new RegExp(String(expectedLinks) + ' prototype links'));
  assert.match(status.text, new RegExp('Layout check: ' + expectedLintRoots + ' frames clean'));
  assert.match(status.text, new RegExp(
    String(expectedReusedSubtrees) + ' repeated subtrees reused \\(native clone',
  ));
  assert.match(status.text, new RegExp('Cleanup removed ' + expectedClearedTopLevel + ' top-level nodes'));
  assert.deepEqual(harness.pages.map(function (page) {
    return [page.name, page.children.length];
  }), firstPageShape);
});
