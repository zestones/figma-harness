/* Isolated Figma API mock; node semantics live in figma-mock/node-factory.ts. */

import {
  createMockNodeFactory,
  type MockNodeMetrics,
} from './figma-mock/node-factory.ts';
import type {
  MockEffectStyle,
  MockNode,
  MockPaint,
  MockStore,
  MockTextStyle,
  MockVariable,
  MockVariableCollection,
} from './figma-mock/types.ts';

export interface FigmaMockOptions {
  pageCap?: number;
}

export interface FigmaApiMetrics {
  combineAsVariants: number;
  createComponent: number;
  createEllipse: number;
  createFrame: number;
  createNodeFromSvg: number;
  createPage: number;
  createRectangle: number;
  createText: number;
  nodes: MockNodeMetrics;
}

export function createFigmaMock(options: FigmaMockOptions = {}) {
  const factory = createMockNodeFactory();
  const {
    node,
    nodeById,
    registerEffectStyle,
    registerTextStyle,
    metrics: nodeMetrics,
  } = factory;
  const pages: MockNode[] = [];
  const store: MockStore = { colls: [], vars: [], text: [], effect: [] };
  let resourceSequence = 0;

  function createCollection(name: string): MockVariableCollection {
    const collection: MockVariableCollection = {
      id: 'C' + (++resourceSequence),
      name,
      modes: [{ modeId: 'm1', name: 'Mode 1' }],
      variableIds: [],
    };
    store.colls.push(collection);
    return collection;
  }

  const firstPage = node('PAGE', 'Page 1');
  pages.push(firstPage);
  let currentPage = firstPage;
  let uiMessageHandler: ((message: unknown) => unknown) | null = null;
  const uiMessages: unknown[] = [];
  const eventHandlers = new Map<string, Array<() => void>>();
  const metrics: FigmaApiMetrics = {
    combineAsVariants: 0,
    createComponent: 0,
    createEllipse: 0,
    createFrame: 0,
    createNodeFromSvg: 0,
    createPage: 0,
    createRectangle: 0,
    createText: 0,
    nodes: nodeMetrics,
  };

  const emit = function (event: string): void {
    for (const handler of eventHandlers.get(event) || []) handler();
  };

  const figma = {
    root: { children: pages },
    get currentPage(): MockNode { return currentPage; },
    set currentPage(_page: MockNode) {
      throw new Error('sync currentPage is not supported');
    },
    async setCurrentPageAsync(page: MockNode): Promise<void> {
      currentPage = page;
      emit('currentpagechange');
    },
    createPage(): MockNode {
      metrics.createPage++;
      if (pages.length >= (options.pageCap || Number(process.env['PAGE_CAP']) || 3)) {
        throw new Error('in createPage: The Starter plan only comes with 3 pages.');
      }
      const page = node('PAGE', 'Page');
      pages.push(page);
      return page;
    },
    createFrame(): MockNode { metrics.createFrame++; return node('FRAME'); },
    createText(): MockNode { metrics.createText++; return node('TEXT'); },
    createEllipse(): MockNode { metrics.createEllipse++; return node('ELLIPSE'); },
    createRectangle(): MockNode { metrics.createRectangle++; return node('RECTANGLE'); },
    createComponent(): MockNode { metrics.createComponent++; return node('COMPONENT'); },
    createSection: (): MockNode => node('SECTION'),
    createNodeFromSvg(svg: string): MockNode {
      metrics.createNodeFromSvg++;
      if (!/^<svg[\s>]/.test(svg)) {
        throw new Error('createNodeFromSvg: not an svg -> ' + svg.slice(0, 50));
      }
      if (!/viewBox=/.test(svg)) throw new Error('createNodeFromSvg: svg without viewBox');
      if (/NaN|undefined/.test(svg)) {
        throw new Error('createNodeFromSvg: svg contains NaN/undefined');
      }
      const frame = node('FRAME', 'svg');
      frame._svg = svg;
      const count = (svg.match(/<(path|circle|rect|polygon|line)\b/g) || ['<path']).length;
      for (let index = 0; index < count; index++) {
        frame.appendChild(node('VECTOR', 'v' + index));
      }
      return frame;
    },
    combineAsVariants(list: readonly MockNode[], parent: MockNode): MockNode {
      metrics.combineAsVariants++;
      const set = node('COMPONENT_SET');
      for (const component of list) set.appendChild(component);
      parent.appendChild(set);
      return set;
    },
    async loadFontAsync(): Promise<void> {},
    async listAvailableFontsAsync(): Promise<unknown[]> { return []; },
    async getLocalTextStylesAsync(): Promise<MockTextStyle[]> { return store.text; },
    async getLocalEffectStylesAsync(): Promise<MockEffectStyle[]> { return store.effect; },
    async getLocalPaintStylesAsync(): Promise<unknown[]> { return []; },
    createTextStyle(): MockTextStyle {
      const style: MockTextStyle = {
        id: 'T' + (++resourceSequence),
        name: '',
        fontName: { family: 'Inter', style: 'Regular' },
        fontSize: 12,
        lineHeight: { unit: 'PIXELS', value: 16 },
        letterSpacing: { unit: 'PERCENT', value: 0 },
        textCase: 'ORIGINAL',
      };
      store.text.push(style);
      registerTextStyle(style);
      return style;
    },
    createEffectStyle(): MockEffectStyle {
      const style: MockEffectStyle = {
        id: 'E' + (++resourceSequence),
        name: '',
        effects: [],
      };
      store.effect.push(style);
      registerEffectStyle(style);
      return style;
    },
    async getNodeByIdAsync(id: string): Promise<MockNode | null> {
      return nodeById.get(id) || null;
    },
    variables: {
      createVariableCollection: createCollection,
      async getLocalVariableCollectionsAsync(): Promise<MockVariableCollection[]> {
        return store.colls;
      },
      async getLocalVariablesAsync(type?: string): Promise<MockVariable[]> {
        return store.vars.filter((variable) => !type || variable.resolvedType === type);
      },
      async getVariableByIdAsync(id: string): Promise<MockVariable | null> {
        return store.vars.find((variable) => variable.id === id) || null;
      },
      createVariable(
        name: string,
        collection: MockVariableCollection,
        type: string,
      ): MockVariable {
        const variable: MockVariable = {
          id: 'V' + (++resourceSequence),
          name,
          resolvedType: type,
          variableCollectionId: collection.id,
          scopes: [],
          description: '',
          valuesByMode: {},
          setValueForMode(mode: string, value: unknown): void {
            if (this.valuesByMode[mode] === value) return;
            this.valuesByMode[mode] = value;
            factory.refreshVariable(this);
          },
          remove(): void {
            const index = store.vars.indexOf(this);
            if (index >= 0) store.vars.splice(index, 1);
            const collectionIndex = collection.variableIds.indexOf(this.id);
            if (collectionIndex >= 0) collection.variableIds.splice(collectionIndex, 1);
            for (const candidate of nodeById.values()) {
              if (!candidate.boundVariables) continue;
              for (const field of Object.keys(candidate.boundVariables) as import('./figma-mock/types.ts').MockDimensionField[]) {
                if (candidate.boundVariables[field]?.id === this.id) candidate.setBoundVariable(field, null);
              }
            }
          },
        };
        store.vars.push(variable);
        collection.variableIds.push(variable.id);
        return variable;
      },
      setBoundVariableForPaint(
        paint: MockPaint,
        _field: string,
        variable: MockVariable,
      ): MockPaint {
        if (!variable) throw new Error('setBoundVariableForPaint: no variable');
        return {
          type: 'SOLID',
          color: paint.color,
          opacity: paint.opacity,
          boundVariables: { color: { id: variable.id } },
        };
      },
    },
    viewport: { scrollAndZoomIntoView(): void {} },
    showUI(): void {},
    on(event: string, handler: () => void): void {
      const handlers = eventHandlers.get(event) || [];
      handlers.push(handler);
      eventHandlers.set(event, handlers);
    },
    ui: {
      postMessage(message: unknown): void { uiMessages.push(message); },
      get onmessage(): ((message: unknown) => unknown) | null { return uiMessageHandler; },
      set onmessage(handler: ((message: unknown) => unknown) | null) { uiMessageHandler = handler; },
    },
    notify(): never { throw new Error('figma.notify is not implemented'); },
  };

  return {
    get created() { return factory.created; },
    dispatchUiMessage(message: unknown): Promise<unknown> {
      return Promise.resolve(uiMessageHandler?.(message));
    },
    emit,
    figma,
    metrics,
    nodeById,
    pages,
    store,
    uiMessages,
  };
}
