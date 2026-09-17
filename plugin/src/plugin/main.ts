/* ============================================================================
 * Plugin entry point: UI commands and build orchestration.
 * ==========================================================================*/

import {
  BUILDERS,
  LAST_LINKS,
  LAST_PAGE_CLEARS,
  LAST_SCREEN_MATERIALIZATION,
} from '../designs/catalog.ts';
import { PAGES } from '../designs/workspace.ts';
import { lint } from '../engine/layout-lint.ts';
import { pageLimitHit, resetPageLimit } from '../engine/pages.ts';
import { ensureTokens, loadDesignFonts } from '../kit/foundations/install.ts';
import {
  inspectScreenRefresh,
  refreshSelectedScreen,
  type ScreenRefreshResult,
} from './screen-refresh.ts';

figma.showUI(__html__, { width: 380, height: 640, themeColors: true });

type PluginStatus = 'busy' | 'done' | 'error' | 'warn';
type PageKey = keyof typeof PAGES;

interface PluginTaskOutcome {
  detail?: string;
  lintRoots?: readonly SceneNode[];
  links?: number;
  rewiredLinks?: number;
}

interface PluginTask {
  label: string;
  pages?: readonly PageKey[];
  run: () => Promise<PluginTaskOutcome | void>;
}

interface RunMessage {
  task: string;
  type: 'run';
}

interface LayoutReport {
  frames: number;
  issues: number;
}

var now = function (): number { return Date.now(); };

var post = function (
  status: PluginStatus,
  text: string,
  details: Record<string, unknown> = {},
): void {
  figma.ui.postMessage({ type: 'status', status: status, text: text, ...details });
};

var pageByKey = function (key: PageKey): PageNode | null {
  var name = PAGES[key];
  for (const page of figma.root.children) if (page.name === name) return page;
  return null;
};

var lintableRoots = function (pageKeys: readonly PageKey[]): SceneNode[] {
  var roots: SceneNode[] = [];
  for (const key of pageKeys) {
    var page = pageByKey(key);
    if (!page) continue;
    for (const child of page.children) {
      if ('children' in child && child.children.length) roots.push(child);
    }
  }
  return roots;
};

var lintRoots = function (roots: readonly SceneNode[]): LayoutReport {
  var issues = 0;
  for (const root of roots) {
    try {
      issues += lint(root, { tolerance: 1.5 }).issues.length;
    } catch (error) { /* a node type the linter does not walk */ }
  }
  return { frames: roots.length, issues: issues };
};

var postSelectionContext = function (): void {
  var context = inspectScreenRefresh(figma.currentPage);
  figma.ui.postMessage({
    type: 'context',
    canRefresh: context.canRefresh,
    key: context.key,
    page: figma.currentPage.name,
    reason: context.reason,
    title: context.title,
  });
};

var TASKS: Readonly<Record<string, PluginTask>> = Object.freeze({
  refresh: {
    label: 'Selected screen',
    run: async function () {
      var result: ScreenRefreshResult = await refreshSelectedScreen(figma.currentPage);
      return {
        detail: result.title,
        lintRoots: [result.frame],
        links: result.links,
        rewiredLinks: result.rewiredLinks,
      };
    },
  },
  screens: {
    label: 'Screens & prototype',
    pages: ['screens'],
    run: async function () { await BUILDERS.screens(); },
  },
  system: {
    label: 'Design system',
    pages: ['system'],
    run: async function () { await BUILDERS.system(); },
  },
  states: {
    label: 'Design lab',
    pages: ['states'],
    run: async function () { await BUILDERS.states(); },
  },
  all: {
    label: 'Everything',
    pages: ['screens', 'system', 'states'],
    run: async function () {
      post('busy', 'Building Design system…', { phase: 'build' });
      await BUILDERS.system();
      post('busy', 'Cleaning Design lab…', { phase: 'build' });
      await BUILDERS.states();
      post('busy', 'Building Screens & prototype…', { phase: 'build' });
      await BUILDERS.screens();
    },
  },
});

var running = false;

figma.ui.onmessage = async function (message: unknown) {
  if (!message || typeof message !== 'object' || !('type' in message)) return;
  if (message.type === 'ready') {
    postSelectionContext();
    return;
  }
  if (message.type !== 'run' || !('task' in message)
    || typeof message.task !== 'string') return;

  var msg = message as RunMessage;
  var task = TASKS[msg.task];
  if (!task) { post('error', 'Unknown task: ' + msg.task); return; }
  if (running) { post('warn', 'Another build is already running.'); return; }

  running = true;
  var startedAt = now();
  try {
    post('busy', 'Loading fonts…', { phase: 'fonts', task: msg.task });
    await loadDesignFonts();
    post('busy', 'Checking tokens and styles…', { phase: 'tokens', task: msg.task });
    await ensureTokens();
    resetPageLimit();
    post('busy', 'Building ' + task.label + '…', { phase: 'build', task: msg.task });
    var outcome = await task.run();

    post('busy', 'Checking generated layout…', { phase: 'lint', task: msg.task });
    var roots = outcome?.lintRoots || lintableRoots(task.pages || []);
    var report = lintRoots(roots);
    var elapsedMs = now() - startedAt;
    var msgOut = outcome?.detail
      ? outcome.detail + ' refreshed'
      : task.label + ' built';
    msgOut += ' in ' + (elapsedMs / 1000).toFixed(1) + 's.';
    var links = outcome?.links ?? LAST_LINKS;
    if (links != null && ['refresh', 'screens', 'all'].includes(msg.task)) {
      if (outcome?.rewiredLinks != null && outcome.rewiredLinks < links) {
        msgOut += ' ' + links + ' prototype links retained. '
          + outcome.rewiredLinks + ' rewired and verified.';
      } else {
        msgOut += ' ' + links + ' prototype links.';
      }
    }
    msgOut += ' Layout check: ' + (report.issues === 0
      ? report.frames + ' frame' + (report.frames === 1 ? '' : 's') + ' clean.'
      : report.issues + ' issue(s) across ' + report.frames + ' frames.');
    if (LAST_SCREEN_MATERIALIZATION && ['screens', 'all'].includes(msg.task)) {
      msgOut += ' ' + LAST_SCREEN_MATERIALIZATION.clonedSubtrees
        + ' repeated subtrees reused (native clone '
        + (LAST_SCREEN_MATERIALIZATION.cloneMilliseconds / 1000).toFixed(1) + 's).';
    }
    var clearedTopLevel = 0;
    var clearMilliseconds = 0;
    for (const key of task.pages || []) {
      var pageClear = LAST_PAGE_CLEARS[key];
      if (!pageClear) continue;
      clearedTopLevel += pageClear.removedTopLevelNodes;
      clearMilliseconds += pageClear.elapsedMilliseconds;
    }
    if (clearedTopLevel) {
      msgOut += ' Cleanup removed ' + clearedTopLevel + ' top-level nodes in '
        + (clearMilliseconds / 1000).toFixed(1) + 's.';
    }
    if (pageLimitHit) msgOut += ' Note: the 3-page cap forced reuse of an existing page.';
    post(report.issues === 0 ? 'done' : 'warn', msgOut, {
      elapsedMs: elapsedMs,
      issues: report.issues,
      task: msg.task,
    });
  } catch (error) {
    post('error', error instanceof Error ? error.message : String(error), {
      elapsedMs: now() - startedAt,
      task: msg.task,
    });
  } finally {
    running = false;
    postSelectionContext();
  }
};

figma.on('selectionchange', postSelectionContext);
figma.on('currentpagechange', postSelectionContext);
