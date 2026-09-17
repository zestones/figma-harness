'use strict';

import type { MockNode } from '@figma-harness/harness/runtime/figma-mock/types.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const { createHarness } = require('@figma-harness/harness/runtime/harness.ts') as
  typeof import('@figma-harness/harness/runtime/harness.ts');
const {
  countNodes,
  snapshotComponentNodeSha256,
} = require('@figma-harness/harness/signatures/signature.ts') as typeof import('@figma-harness/harness/signatures/signature.ts');

/* The plugin's own tests use the small app template. Relay adds what it lacks:
   icons, struts inside reused headers, and a dialog that enters and exits. */
const RELAY = { app: 'apps/relay' } as const;

test('Relay reuses its headers, struts included, and refreshes an animated screen in place', async () => {
  let optimized: ReturnType<typeof createHarness> | null = createHarness(RELAY);
  await optimized.runtime.loadFonts();
  await optimized.runtime.ensureTokens();
  await optimized.runtime.buildScreens({ reuse: true });
  // Keep the evidence, then release the first document: two live ones exceed the bounded heap.
  const evidence = {
    digest: snapshotComponentNodeSha256(optimized.pages[0]),
    nodes: countNodes([optimized.pages[0]]),
    clonedSubtrees: optimized.runtime.LAST_SCREEN_MATERIALIZATION?.clonedSubtrees || 0,
    clonedStruts: optimized.metrics.nodes.clonedStruts,
    createNodeFromSvg: optimized.metrics.createNodeFromSvg,
  };
  for (const page of optimized.pages) for (const child of [...page.children]) child.remove();
  optimized = null;

  const reference = createHarness(RELAY);
  await reference.runtime.loadFonts();
  await reference.runtime.ensureTokens();
  await reference.runtime.buildScreens({ reuse: false });
  const page = reference.pages[0] as MockNode & { selection: MockNode[] };
  assert.equal(evidence.digest, snapshotComponentNodeSha256(page));
  assert.equal(evidence.nodes, countNodes([page]));
  // App headers: one per section, cloned for the two other Releases screens and
  // the two other Settings screens.
  assert.equal(evidence.clonedSubtrees, 4);
  assert.ok(evidence.clonedStruts > 0);
  assert.ok(evidence.createNodeFromSvg < reference.metrics.createNodeFromSvg);

  // The promote dialog enters and exits: refreshing its screen rewrites and reads back animated actions.
  const dialog = page.children.find((node) => node.getPluginData('workspace.screen.key') === 'releasePromote');
  assert.ok(dialog);
  const links = reference.runtime.LAST_LINKS;
  page.selection = [dialog];
  const refreshed = await reference.runtime.refreshSelectedScreen(page);
  assert.equal(refreshed.frame, dialog);
  assert.equal(refreshed.links, links);
  assert.ok(refreshed.rewiredLinks > 0 && refreshed.rewiredLinks < refreshed.links);
  assert.equal(snapshotComponentNodeSha256(page), evidence.digest);
});
