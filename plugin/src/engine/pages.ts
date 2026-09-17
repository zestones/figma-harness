/* Runtime: Figma page lifecycle. */
/* --- pages ---------------------------------------------------------------- */

export let pageLimitHit = false;

export const resetPageLimit = function (): void {
  pageLimitHit = false;
};

export const getPage = async function (
  name: string,
  claimIndex?: number,
): Promise<PageNode> {
  var pages = figma.root.children;
  for (var i = 0; i < pages.length; i++) {
    if (pages[i].name === name) {
      await figma.setCurrentPageAsync(pages[i]);
      return pages[i];
    }
  }
  // Claim an existing page before spending one of the three slots. A page is
  // claimable when it is an untitled default or one of our own numbered pages.
  var claimable = function (n: string): boolean {
    return /^Page \d+$/.test(n) || /^0\d · /.test(n);
  };
  if (claimIndex != null && pages[claimIndex] && claimable(pages[claimIndex].name)) {
    pages[claimIndex].name = name;
    await figma.setCurrentPageAsync(pages[claimIndex]);
    return pages[claimIndex];
  }
  try {
    var p = figma.createPage();
    p.name = name;
    await figma.setCurrentPageAsync(p);
    return p;
  } catch (e) {
    pageLimitHit = true;
    var t: PageNode | null = null;
    for (var a = 0; a < pages.length; a++) if (claimable(pages[a].name)) { t = pages[a]; break; }
    if (!t) t = pages[pages.length - 1];
    t.name = name;
    await figma.setCurrentPageAsync(t);
    return t;
  }
};

export interface PageClearStats {
  elapsedMilliseconds: number;
  removedTopLevelNodes: number;
}

export const clearPage = function (page: PageNode): PageClearStats {
  var startedAt = Date.now();
  var kids = page.children.slice();
  for (var i = 0; i < kids.length; i++) kids[i].remove();
  return {
    elapsedMilliseconds: Date.now() - startedAt,
    removedTopLevelNodes: kids.length,
  };
};

/** Keep viewport mechanics out of authored design modules. */
export const focusViewport = function (nodes: readonly SceneNode[]): void {
  figma.viewport.scrollAndZoomIntoView(nodes);
};
