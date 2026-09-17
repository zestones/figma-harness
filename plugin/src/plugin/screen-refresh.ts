/* Targeted iteration path for one generated screen in an existing catalog. */

import { PROTOTYPE_FLOWS } from '../designs/flows/index.ts';
import { wirePrototype } from '../designs/flows/prototype.ts';
import {
  SCREEN_CATALOG,
  SCREEN_CATALOG_PLUGIN_DATA,
  SCREEN_CATALOG_VERSION,
  SCREEN_PAGE_PLUGIN_DATA,
  SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA,
  START_SCREEN_KEY,
  buildCatalogScreen,
  markCatalogScreen,
  readCatalogScreenKey,
} from '../designs/screen-catalog.ts';
import { PAGES } from '../designs/workspace.ts';
import { focusViewport } from '../kit/public.ts';

export interface ScreenRefreshContext {
  canRefresh: boolean;
  key: string | null;
  missingKeys: readonly string[];
  reason: string;
  title: string | null;
}

export interface ScreenRefreshResult {
  frame: FrameNode;
  key: string;
  links: number;
  rewiredLinks: number;
  title: string;
}

const storedPrototypeActionCount = function (page: PageNode): number | null {
  var raw = page.getPluginData(SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA);
  var count = Number(raw);
  return raw && Number.isInteger(count) && count > 0 ? count : null;
};

const collectCatalogFrames = function (
  page: PageNode,
  writeMetadata = false,
): { frames: Record<string, FrameNode>; missingKeys: string[] } {
  var frames: Record<string, FrameNode> = {};
  for (const child of page.children) {
    if (child.type !== 'FRAME') continue;
    var key = readCatalogScreenKey(child);
    if (!key) continue;
    if (frames[key]) throw new Error('duplicate generated screen key "' + key + '"');
    if (writeMetadata) markCatalogScreen(child, key);
    frames[key] = child;
  }
  return {
    frames: frames,
    missingKeys: SCREEN_CATALOG
      .filter(function (item) { return !frames[item.key]; })
      .map(function (item) { return item.key; }),
  };
};

const selectedCatalogFrame = function (page: PageNode): {
  frame: FrameNode;
  key: string;
} | null {
  var found: { frame: FrameNode; key: string } | null = null;
  for (const selected of page.selection) {
    var candidate: BaseNode | null = selected;
    while (candidate && candidate.parent && candidate.parent !== page) {
      candidate = candidate.parent;
    }
    if (!candidate || candidate.parent !== page || candidate.type !== 'FRAME') continue;
    var key = readCatalogScreenKey(candidate);
    if (!key) continue;
    if (found && found.frame !== candidate) return null;
    found = { frame: candidate, key: key };
  }
  return found;
};

export const inspectScreenRefresh = function (page: PageNode): ScreenRefreshContext {
  if (page.name !== PAGES.screens) {
    return {
      canRefresh: false,
      key: null,
      missingKeys: [],
      reason: 'Open ' + PAGES.screens + ' and select a generated screen.',
      title: null,
    };
  }
  var selected = selectedCatalogFrame(page);
  if (!selected) {
    return {
      canRefresh: false,
      key: null,
      missingKeys: [],
      reason: 'Select one screen or layers inside the same screen.',
      title: null,
    };
  }
  var catalog = collectCatalogFrames(page);
  var selectedKey = selected.key;
  var item = SCREEN_CATALOG.find(function (candidate) { return candidate.key === selectedKey; });
  if (catalog.missingKeys.length) {
    return {
      canRefresh: false,
      key: selected.key,
      missingKeys: catalog.missingKeys,
      reason: 'The Screens catalog is incomplete. Rebuild page 01 once.',
      title: item?.title || selected.frame.name,
    };
  }
  return {
    canRefresh: true,
    key: selected.key,
    missingKeys: [],
    reason: 'Ready to rebuild this screen without replacing the other pages.',
    title: item?.title || selected.frame.name,
  };
};

const copyScreenRootPresentation = function (
  target: FrameNode,
  source: FrameNode,
): void {
  /* Keep the target node itself alive so comments, selection, and any external
   * references retain its stable Figma id. Only its generated subtree moves. */
  target.name = source.name;
  target.layoutMode = source.layoutMode;
  target.layoutWrap = source.layoutWrap;
  target.primaryAxisAlignItems = source.primaryAxisAlignItems;
  target.counterAxisAlignItems = source.counterAxisAlignItems;
  target.paddingTop = source.paddingTop;
  target.paddingRight = source.paddingRight;
  target.paddingBottom = source.paddingBottom;
  target.paddingLeft = source.paddingLeft;
  target.itemSpacing = source.itemSpacing;
  target.counterAxisSpacing = source.counterAxisSpacing;
  target.clipsContent = source.clipsContent;
  target.opacity = source.opacity;
  if (Array.isArray(source.fills)) target.fills = source.fills;
  target.strokes = source.strokes;
  if (typeof source.cornerRadius === 'number') target.cornerRadius = source.cornerRadius;
  target.resize(source.width, source.height);
  if (source.layoutMode !== 'NONE') {
    target.primaryAxisSizingMode = source.primaryAxisSizingMode;
    target.counterAxisSizingMode = source.counterAxisSizingMode;
  }
};

const transplantScreenChildren = function (
  target: FrameNode,
  source: FrameNode,
): void {
  copyScreenRootPresentation(target, source);
  while (target.children.length) target.children[0].remove();
  while (source.children.length) target.appendChild(source.children[0]);
  source.remove();
};

export const refreshSelectedScreen = async function (
  page: PageNode,
): Promise<ScreenRefreshResult> {
  var context = inspectScreenRefresh(page);
  if (!context.canRefresh || !context.key || !context.title) {
    throw new Error(context.reason);
  }
  var selected = selectedCatalogFrame(page);
  if (!selected || selected.key !== context.key) {
    throw new Error('the selected screen changed before refresh started');
  }
  var catalogVersion = page.getPluginData(SCREEN_CATALOG_PLUGIN_DATA);
  var retainedActionCount = storedPrototypeActionCount(page);
  var catalog = collectCatalogFrames(page, true);
  if (catalog.missingKeys.length) {
    throw new Error('incomplete Screens catalog: ' + catalog.missingKeys.join(', '));
  }

  var childrenBeforeStaging = new Set(page.children);
  var replacement: FrameNode;
  try {
    replacement = await buildCatalogScreen(context.key);
  } catch (error) {
    /* Native create*() calls attach to the current page. A failed renderer must
     * not leave its partial staging tree beside the still-valid old screen. */
    for (const child of [...page.children]) {
      if (!childrenBeforeStaging.has(child)) child.remove();
    }
    throw error;
  }
  transplantScreenChildren(selected.frame, replacement);
  markCatalogScreen(selected.frame, context.key);
  catalog.frames[context.key] = selected.frame;

  var canWireSelectedSource = catalogVersion === SCREEN_CATALOG_VERSION
    && retainedActionCount !== null;
  var rewiredLinks = await wirePrototype(catalog.frames, PROTOTYPE_FLOWS, {
    cleanStaleReactions: true,
    sourceKeys: canWireSelectedSource ? [context.key] : undefined,
  });
  var links = canWireSelectedSource && retainedActionCount !== null
    ? retainedActionCount
    : rewiredLinks;
  try {
    (page as PageNode & { prototypeStartNodeId?: string }).prototypeStartNodeId =
      catalog.frames[START_SCREEN_KEY].id;
  } catch (error) { /* not always settable */ }
  page.setPluginData(SCREEN_PAGE_PLUGIN_DATA, 'screens');
  page.setPluginData(SCREEN_CATALOG_PLUGIN_DATA, SCREEN_CATALOG_VERSION);
  page.setPluginData(SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA, String(links));
  page.selection = [selected.frame];
  focusViewport([selected.frame]);
  return {
    frame: selected.frame,
    key: context.key,
    links: links,
    rewiredLinks: rewiredLinks,
    title: context.title,
  };
};
