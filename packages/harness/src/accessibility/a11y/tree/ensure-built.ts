import type { TreeHarness } from './types.ts';

export async function ensureBuilt(harness: TreeHarness): Promise<void> {
  if (
    !harness.pages.length
    || !harness.pages.some((page) => (page.children || []).length)
  ) {
    await harness.buildAll();
  }
}
