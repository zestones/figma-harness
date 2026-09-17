/* Isolated offline execution of the generated Figma bundle. */
'use strict';

import {
  createFigmaMock,
  type FigmaApiMetrics,
} from './figma-mock.ts';
import type {
  MockCreationRecord,
  MockNode,
  MockStore,
  MockVariable,
} from './figma-mock/types.ts';
import {
  layout,
  solveLayout,
} from './layout.ts';
import { measure } from './text-metrics.ts';
import type { AuditRuntime, LayoutIssue } from './rules/types.ts';
import { escapesOf } from './escapes.ts';
import type { StressInspector, StressRuntime } from './stress.ts';
import {
  BUNDLE_GLOBAL_NAME,
  bundleFile,
  bundlePlugin,
  bundledComposition,
} from '../bundle/bundle.ts';
import { useDesignSystemFonts } from '../core/bundled-fonts.ts';
import {
  activeComposition,
  configuredComposition,
  repositoryRoot,
  type Composition,
} from '../core/workspace.ts';

const fs = require('node:fs') as typeof import('node:fs');
const vm = require('node:vm') as typeof import('node:vm');
const { runAudit } = require('./audit.ts') as typeof import('./audit.ts');
const { stress: runStress } = require('./stress.ts') as {
  stress(runtime: StressRuntime, inspect?: StressInspector): Promise<number>;
};


export interface HarnessOptions {
  /** The app to build, by directory or package name. Defaults to
   *  FIGMA_HARNESS_APP, then to the app figma-harness.config.json names. */
  app?: string;
  /** Build the app with this design system instead of the one it depends on.
   *  Defaults to FIGMA_HARNESS_DESIGN_SYSTEM. */
  designSystem?: string;
  /** Bundle text to evaluate instead of the committed code.js. */
  code?: string;
  colorOverrides?: Record<string, string>;
  pageCap?: number;
}

export interface HarnessRuntime extends AuditRuntime, StressRuntime {
  COLORS: Array<[string, string]>;
  readonly LAST_LINKS?: number;
  readonly LAST_PAGE_CLEARS?: Partial<Record<
    'screens' | 'states' | 'system',
    { elapsedMilliseconds: number; removedTopLevelNodes: number }
  >>;
  readonly LAST_SCREEN_MATERIALIZATION?: {
    builtTemplates: number;
    cloneMilliseconds: number;
    clonedSubtrees: number;
    reuseEnabled: boolean;
  };
  buildScreens(options?: { reuse?: boolean }): Promise<unknown>;
  inspectScreenRefresh(page: MockNode): {
    canRefresh: boolean;
    key: string | null;
    reason: string;
    title: string | null;
  };
  refreshSelectedScreen(page: MockNode): Promise<{
    frame: MockNode;
    key: string;
    links: number;
    rewiredLinks: number;
    title: string;
  }>;
}

export interface Harness {
  buildAll(): Promise<MockNode[]>;
  /** The app and the design system this harness builds. */
  readonly composition: Composition;
  created: MockCreationRecord[];
  dispatchUiMessage(message: unknown): Promise<unknown>;
  emit(event: string): void;
  layout(node: MockNode): void;
  measure(
    text: unknown,
    size: number,
    family: string,
    trackingPixels?: number,
    upper?: boolean,
    style?: string,
  ): number;
  metrics: FigmaApiMetrics;
  nodeById: Map<string, MockNode>;
  pages: MockNode[];
  runtime: HarnessRuntime;
  solveLayout(node: MockNode): void;
  store: MockStore;
  stress(): Promise<number>;
  uiMessages: unknown[];
  vars: MockVariable[];
}

/* The committed code.js is built for the configured composition, and checked
   to hold it. Any other composition is bundled in memory, with the same
   reachability rule pnpm build applies. */
const bundleText = function (composition: Composition): string {
  const label = composition.app.relative + ' with ' + composition.designSystem.relative;
  const configured = configuredComposition();
  if (composition.substituted || composition.app.dir !== configured.app.dir) {
    const bundle = bundlePlugin({
      app: composition.app.relative,
      designSystem: composition.designSystem.relative,
    });
    if (bundle.unreachable.length) {
      throw new Error(label + ': source module(s) unreachable from the plugin entry: ' + bundle.unreachable.join(', '));
    }
    return bundle.code.toString('utf8');
  }
  const code = fs.readFileSync(bundleFile(), 'utf8');
  const held = bundledComposition(code);
  if (!held || held.app !== composition.app.relative || held.designSystem !== composition.designSystem.relative) {
    throw new Error('plugin/code.js holds ' + (held ? held.app + ' with ' + held.designSystem : 'an unknown build')
      + ', not the configured ' + label + '; run pnpm build');
  }
  return code;
};

export function createHarness(options: HarnessOptions = {}): Harness {
  const composition = activeComposition(repositoryRoot(), options.app, options.designSystem);
  // Text is measured with the fonts of the design system this harness builds.
  useDesignSystemFonts(composition.designSystem.dir);
  const mock = createFigmaMock({ pageCap: options.pageCap });
  const {
    figma,
    pages,
    store,
    nodeById,
    dispatchUiMessage,
    emit,
    uiMessages,
    metrics,
  } = mock;

  const context = vm.createContext({ figma, __html__: '<html></html>', console });
  vm.runInContext(
    options.code ?? bundleText(composition),
    context,
    { filename: 'code.js' },
  );

  const bundleContext = context as typeof context & Record<string, { HARNESS_API?: HarnessRuntime } | undefined>;
  const runtimeCandidate = bundleContext[BUNDLE_GLOBAL_NAME]?.HARNESS_API;
  if (!runtimeCandidate) {
    throw new Error('code.js did not expose the expected ' + BUNDLE_GLOBAL_NAME + '.HARNESS_API runtime');
  }
  const runtime = runtimeCandidate;

  if (options.colorOverrides) {
    const pending = new Set(Object.keys(options.colorOverrides));
    for (const token of runtime.COLORS) {
      if (!pending.has(token[0])) continue;
      const replacement = options.colorOverrides[token[0]];
      if (!/^#[0-9A-Fa-f]{6}(?:[0-9A-Fa-f]{2})?$/.test(replacement)) {
        throw new Error('invalid color override for ' + token[0] + ': ' + replacement);
      }
      token[1] = replacement.toUpperCase();
      pending.delete(token[0]);
    }
    if (pending.size) {
      throw new Error('unknown color override(s): ' + [...pending].join(', '));
    }
  }

  // A stress result is laid out and checked like a page: the layout lint, and nothing outside its frame.
  const inspectStress: StressInspector = (result) => {
    if (!result || typeof result !== 'object' || !('children' in result)) return [];
    const node = result as MockNode;
    layout(node);
    const issues = [
      ...runtime.lint(node, { tolerance: 1.5 }).issues.map((issue: LayoutIssue) => issue.kind + ' at ' + issue.node + ': ' + issue.detail),
      ...escapesOf(node, solveLayout),
    ];
    // Attached before the run removes it, so the orphan rule counts only what the case left behind.
    if (!node.parent && pages.length) pages[0].appendChild(node);
    return issues;
  };
  const stress = (): Promise<number> => runStress(runtime, inspectStress);

  async function buildAll(): Promise<MockNode[]> {
    await runtime.loadFonts();
    await runtime.ensureTokens();
    for (const name of Object.keys(runtime.BUILDERS)) {
      if (name === 'all') continue;
      await runtime.BUILDERS[name]();
    }
    return pages;
  }

  return {
    runtime,
    buildAll,
    composition,
    dispatchUiMessage,
    emit,
    pages,
    layout,
    solveLayout,
    store,
    vars: store.vars,
    measure,
    metrics,
    stress,
    get created() { return mock.created; },
    nodeById,
    uiMessages,
  };
}

if (require.main === module) {
  runAudit(createHarness(), {
    root: repositoryRoot(),
    verbose: process.argv.includes('--verbose'),
    args: process.argv.slice(2),
  }).then((result) => {
    if (!result.ok) process.exitCode = 1;
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.stack || error.message : error);
    process.exit(1);
  });
}
