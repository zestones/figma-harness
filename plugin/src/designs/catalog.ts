/* ============================================================================
 * Page orchestration.
 *
 * Three pages, because a Starter file allows three:
 *   01 · Screens        top-level frames + the clickable prototype
 *   02 · Design system  foundations and components
 *   03 · Design lab     disposable, isolated design experiments
 * ==========================================================================*/

import {
  SHEET_H,
  SHEET_W,
} from './sheets/support.ts';
import {
  SHEETS,
} from './sheets/catalog.ts';
import {
  f as createFrame,
  clearPage,
  focusViewport,
  getPage,
  t as createText,
} from '../kit/public.ts';
import {
  beginScreenMaterialization,
  endScreenMaterialization,
  type ScreenMaterializationStats,
} from './pages/render-cache.ts';
import { SCREEN_GROUPS } from './pages/state-matrix.ts';
import {
  SCREEN_CATALOG_PLUGIN_DATA,
  SCREEN_CATALOG_VERSION,
  SCREEN_PAGE_PLUGIN_DATA,
  SCREEN_PROTOTYPE_ACTION_COUNT_PLUGIN_DATA,
  START_SCREEN_KEY,
  buildCatalogScreen,
} from './screen-catalog.ts';
import {
  wirePrototype,
} from './flows/prototype.ts';
import { PROTOTYPE_FLOWS } from './flows/index.ts';
import { PAGES } from './workspace.ts';

/* Experiments registered in the Design lab while they are under review. */
const DESIGN_LAB_ARCHIVE: ReadonlyArray<{ id: string; build: (page: PageNode) => Promise<void> }> = Object.freeze([]);

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

/* A category band. Frames stay DIRECT PAGE CHILDREN and the grouping is drawn
   around them rather than made of them: a prototype NAVIGATE must reach a
   top-level frame on the same page, so a Section cannot hold the screens. */
export const band = async function (
  page: PageNode,
  x: number,
  y: number,
  letter: string,
  title: string,
  body: string,
  width: number,
): Promise<number> {
  var head = await createFrame({ name: 'band/' + title, dir: 'H', gap: 12, align: 'CENTER' });
  // Page chrome lives outside the authored frames on Figma's dark canvas,
  // so it uses the ink Primer sets on emphasis surfaces.
  var chip = await createFrame({
    name: 'band-chip', dir: 'H', w: 40, h: 40, radius: 6, fill: 'bgColor/accent-emphasis',
    justify: 'CENTER', align: 'CENTER',
  });
  chip.appendChild(await createText({ style: 'title/medium', text: letter, color: 'fgColor/onEmphasis' }));
  head.appendChild(chip);
  var col = await createFrame({ name: 'band-text', dir: 'V', gap: 2 });
  col.appendChild(await createText({ style: 'title/large', text: title, color: 'fgColor/onEmphasis' }));
  if (body) col.appendChild(await createText({ style: 'body/large', text: body, color: 'fgColor/onEmphasis', w: width }));
  head.appendChild(col);
  page.appendChild(head);
  head.x = x; head.y = y;
  var rule = await createFrame({ name: 'band-rule', w: width, h: 2, stroke: 'borderColor/default', strokeSide: 'Top', strokeW: 2 });
  page.appendChild(rule);
  rule.x = x; rule.y = y + head.height + 20;
  return head.height + 40;
};

/** The frame's name above it. Frames stay top-level; captions are siblings. */
export const frameCaption = async function (
  page: PageNode,
  x: number,
  y: number,
  title: string,
): Promise<TextNode> {
  var text = await createText({ style: 'title/medium', text: title, color: 'fgColor/onEmphasis' });
  page.appendChild(text);
  text.x = x; text.y = y - 44;
  return text;
};

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
    for (const group of SCREEN_GROUPS) {
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
      y += await band(page, 0, y, group.letter, group.title, group.body, bandWidth);
      y += 78;
      for (const row of rows) {
        var x = 0;
        var rowHeight = 0;
        for (const item of row) {
          page.appendChild(item);
          item.x = x;
          item.y = y;
          await frameCaption(page, x, y, item.name);
          x += item.width + SCREEN_GAP_X;
          rowHeight = Math.max(rowHeight, item.height);
        }
        y += rowHeight + SCREEN_GAP_Y;
      }
    }
  } finally {
    LAST_SCREEN_MATERIALIZATION = endScreenMaterialization();
  }

  var links = await wirePrototype(prototypeFrames, PROTOTYPE_FLOWS);
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

  /* Sheets are laid out by group; each bounded descriptor owns one concern. */
  var W = SHEET_W, H = SHEET_H;
  var GX = 64, GY = 120, PER_ROW = 3;

  var groups: Array<(typeof SHEETS)[number]['group']> = [];
  for (var i = 0; i < SHEETS.length; i++) {
    var g = SHEETS[i].group;
    if (groups.indexOf(g) < 0) groups.push(g);
  }

  groups.sort(function (a2, b2) {
    var ia = GROUP_ORDER.indexOf(a2), ib = GROUP_ORDER.indexOf(b2);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });

  var y = 120;
  var first: FrameNode | null = null;
  for (var gi = 0; gi < groups.length; gi++) {
    var name = groups[gi];
    var members = SHEETS.filter(function (sh) { return sh.group === name; });
    y += await band(page, 0, y, String(gi + 1), name, GROUP_NOTE[name] || '', 1400);
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

export const GROUP_NOTE = {
  Colour: 'Primer\'s light theme as installed variables: surfaces and ink, the state families, controls, buttons, and the data series.',
  Foundations: 'Type, size, shadows, layout, motion and Octicons, each read from Primer Primitives, and the accessibility evidence behind them.',
  Components: 'Primer React\'s components rebuilt as Figma layers, with the states and the rule each one exists to enforce.',
};

/* Groups appear in this order. Colour first, because it is the sheet anyone
   re-theming the interface opens before any other. */
export const GROUP_ORDER = ['Colour', 'Foundations', 'Components'];

/* --- 03 · Design lab ------------------------------------------------------
 * Deliberately empty between explorations. An experiment may register its
 * renderer here while it is under review, then must leave after its decision
 * and evidence have moved to docs. The page itself remains a stable workspace
 * slot, but its contents are disposable and excluded from design parity.
 * ------------------------------------------------------------------------ */
BUILDERS.states = async function () {
  var page = await getPage(PAGES.states, 2);
  LAST_PAGE_CLEARS.states = clearPage(page);
  page.setPluginData(
    'workspace.lab.archives',
    DESIGN_LAB_ARCHIVE.map(function (entry) { return entry.id; }).join(','),
  );
  page.setPluginData('workspace.lab.active-experiment', '');
  page.setPluginData('workspace.lab.authoring-mode', '');
  page.setPluginData('workspace.lab.prototype-action-count', '0');
  page.setPluginData('workspace.lab.review-state-count', '0');
  page.setPluginData('workspace.lab.review-scope', '');
};

Object.freeze(BUILDERS);
