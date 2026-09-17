/* ============================================================================
 * Page orchestration.
 *
 * Three pages, because a Starter file allows three:
 *   01 · Screens        top-level frames + the clickable prototype
 *   02 · Design system  foundations and components
 *   03 · Design lab     disposable, isolated design experiments
 * ==========================================================================*/

import {
  beginScreenMaterialization,
  clearPage,
  endScreenMaterialization,
  focusViewport,
  getPage,
  type ScreenMaterializationStats,
} from '@figma-harness/engine';
import { APP, DESIGN_SYSTEM, PROTOTYPE } from '../composition.ts';
import { wirePrototype } from './prototype.ts';
import {
  SCREEN_CATALOG_PLUGIN_DATA,
  SCREEN_CATALOG_VERSION,
  SCREEN_PAGE_PLUGIN_DATA,
  SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA,
  START_SCREEN_KEY,
  buildCatalogScreen,
} from './screen-catalog.ts';
import { PAGES } from './workspace.ts';

export let LAST_LINKS: number | undefined;
export let LAST_SCREEN_MATERIALIZATION: ScreenMaterializationStats | undefined;

type BuilderName = 'screens' | 'system' | 'states';
export const LAST_PAGE_CLEARS: Partial<Record<
  BuilderName,
  ReturnType<typeof clearPage>
>> = {};

export interface BuildScreensOptions {
  /** Clone repeated reaction-free subtrees instead of rebuilding them. */
  reuse?: boolean;
}

export const BUILDERS = {} as Record<BuilderName, () => Promise<unknown>>;

export { PAGES };

/* --- 01 · Screens --------------------------------------------------------- */

const SCREEN_GAP_X = 160;
const SCREEN_GAP_Y = 200;
const SCREENS_PER_ROW = 3;
const BAND_MIN_WIDTH = 1400;

export const buildScreens = async function (
  options: BuildScreensOptions = {},
) {
  var page = await getPage(PAGES.screens, 0);
  LAST_PAGE_CLEARS.screens = clearPage(page);
  page.setPluginData(SCREEN_PAGE_PLUGIN_DATA, 'screens');
  page.setPluginData(SCREEN_CATALOG_PLUGIN_DATA, SCREEN_CATALOG_VERSION);

  var made: Record<string, FrameNode> = {};
  var prototypeFrames: Record<string, FrameNode> = {};
  var y = 120;
  beginScreenMaterialization(options.reuse !== false);
  try {
    for (const group of APP.screenGroups) {
      var frames: FrameNode[] = [];
      for (const definition of group.screens) {
        var frame = await buildCatalogScreen(definition.key);
        made[definition.key] = frame;
        if (group.prototype) prototypeFrames[definition.key] = frame;
        frames.push(frame);
      }
      var rows: FrameNode[][] = [];
      for (var index = 0; index < frames.length; index += SCREENS_PER_ROW) {
        rows.push(frames.slice(index, index + SCREENS_PER_ROW));
      }
      var bandWidth = BAND_MIN_WIDTH;
      for (const row of rows) {
        var rowWidth = row.reduce((sum, item) => sum + item.width, 0) + SCREEN_GAP_X * (row.length - 1);
        bandWidth = Math.max(bandWidth, rowWidth);
      }
      y += await DESIGN_SYSTEM.chrome.band(page, 0, y, group.letter, group.title, group.body, bandWidth);
      y += 78;
      for (const row of rows) {
        var x = 0;
        var rowHeight = 0;
        for (const item of row) {
          page.appendChild(item);
          item.x = x;
          item.y = y;
          await DESIGN_SYSTEM.chrome.caption(page, x, y, item.name);
          x += item.width + SCREEN_GAP_X;
          rowHeight = Math.max(rowHeight, item.height);
        }
        y += rowHeight + SCREEN_GAP_Y;
      }
    }
  } finally {
    LAST_SCREEN_MATERIALIZATION = endScreenMaterialization();
  }

  var links = await wirePrototype(prototypeFrames, PROTOTYPE);
  page.setPluginData(SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA, String(links));
  try {
    (page as PageNode & { prototypeStartNodeId?: string }).prototypeStartNodeId = made[START_SCREEN_KEY].id;
  } catch (e) { /* not always settable */ }
  LAST_LINKS = links;
  focusViewport([made[START_SCREEN_KEY]]);
  return links;
};
BUILDERS.screens = buildScreens;

/* --- 02 · Design system --------------------------------------------------- */

BUILDERS.system = async function () {
  var page = await getPage(PAGES.system, 1);
  LAST_PAGE_CLEARS.system = clearPage(page);

  /* Sheets are laid out by group, in the design system's group order; each
     bounded descriptor owns one concern. */
  var SHEETS = DESIGN_SYSTEM.sheets.list;
  var ORDER = DESIGN_SYSTEM.sheets.groups.map(function (group) { return group.name; });
  var W = DESIGN_SYSTEM.sheets.width, H = DESIGN_SYSTEM.sheets.height;
  var GX = 64, GY = 120, PER_ROW = 3;

  var groups: string[] = [];
  for (var i = 0; i < SHEETS.length; i++) {
    var g = SHEETS[i].group;
    if (groups.indexOf(g) < 0) groups.push(g);
  }

  groups.sort(function (a2, b2) {
    var ia = ORDER.indexOf(a2), ib = ORDER.indexOf(b2);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  var y = 120;
  var first: FrameNode | null = null;
  for (var gi = 0; gi < groups.length; gi++) {
    var name = groups[gi];
    var members = SHEETS.filter(function (sh) { return sh.group === name; });
    var note = DESIGN_SYSTEM.sheets.groups.find(function (group) { return group.name === name; });
    y += await DESIGN_SYSTEM.chrome.band(page, 0, y, String(gi + 1), name, note ? note.note : '', 1400);
    for (var m = 0; m < members.length; m++) {
      var f = await members[m].build();
      page.appendChild(f);
      f.x = (m % PER_ROW) * (W + GX);
      f.y = y + 56 + Math.floor(m / PER_ROW) * (H + GY);
      // No caption: a sheet carries its own code and title in its header.
      if (!first) first = f;
    }
    y += 56 + Math.ceil(members.length / PER_ROW) * (H + GY);
  }
  if (first) focusViewport([first]);
};

/* --- 03 · Design lab ------------------------------------------------------
 * Deliberately empty between explorations. An app may register an experiment
 * (AppDefinition.lab) while it is under review; it must leave after its
 * decision and evidence have moved to docs. The page itself remains a stable workspace
 * slot, but its contents are disposable and excluded from design parity.
 * ------------------------------------------------------------------------ */
BUILDERS.states = async function () {
  var page = await getPage(PAGES.states, 2);
  LAST_PAGE_CLEARS.states = clearPage(page);
  page.setPluginData(
    'workspace.lab.archives',
    APP.lab.map(function (entry) { return entry.id; }).join(','),
  );
  page.setPluginData('workspace.lab.active-experiment', '');
  page.setPluginData('workspace.lab.authoring-mode', '');
  page.setPluginData('workspace.lab.prototype-action-count', '0');
  page.setPluginData('workspace.lab.review-state-count', '0');
  page.setPluginData('workspace.lab.review-scope', '');
};

Object.freeze(BUILDERS);
