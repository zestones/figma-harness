/* Stateful mock-node factory with Figma-like validation and text reflow. */

import type {
  MockCreationRecord,
  MockEffectStyle,
  MockNode,
  MockTextStyle,
  MockVariable,
  MockDimensionField,
} from './types.ts';
import { initializeMockProperties, installMockPropertyPrototypes } from './properties.ts';

const { bubble, layout, solveLayout } = require('../layout.ts');
const { layoutText } = require('../text-metrics.ts');

export interface MockNodeFactory {
  refreshVariable(variable: MockVariable): void;
  created: MockCreationRecord[];
  metrics: MockNodeMetrics;
  node(type: string, name?: string): MockNode;
  nodeById: Map<string, MockNode>;
  registerEffectStyle(style: MockEffectStyle): void;
  registerTextStyle(style: MockTextStyle): void;
}

export interface MockNodeMetrics {
  appendChild: number;
  clone: number;
  clonedNodes: number;
  clonedStruts: number;
  createInstance: number;
  findAll: number;
  insertChild: number;
  remove: number;
  resize: number;
  setEffectStyle: number;
  setReactions: number;
  setTextStyle: number;
}

export function createMockNodeFactory(): MockNodeFactory {
  let sequence = 0;
  const textStyleById = new Map<string, MockTextStyle>();
  const effectStyleById = new Map<string, MockEffectStyle>();
  const nodeById = new Map<string, MockNode>();
  const removedOrphans: MockCreationRecord[] = [];
  const removed = new WeakSet<MockNode>();
  const pluginData = new WeakMap<MockNode, Map<string, string>>();
  const metrics: MockNodeMetrics = {
    appendChild: 0,
    clone: 0,
    clonedNodes: 0,
    clonedStruts: 0,
    createInstance: 0,
    findAll: 0,
    insertChild: 0,
    remove: 0,
    resize: 0,
    setEffectStyle: 0,
    setReactions: 0,
    setTextStyle: 0,
  };

  const cloneValue = function (value: unknown): unknown {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (!value || typeof value !== 'object') return value;
    const output: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      output[key] = cloneValue(child);
    }
    return output;
  };

  const settleTree = function (root: MockNode): void {
    layout(root);
    const position = function (candidate: MockNode): void {
      solveLayout(candidate);
      for (const child of candidate.children) position(child);
    };
    position(root);
  };

  const absoluteTransform = function (candidate: MockNode): [[number, number, number], [number, number, number]] {
    const top = candidate.topLevelFrame;
    settleTree(top);
    var x = 0;
    var y = 0;
    var current: MockNode | null = candidate;
    while (current && current.type !== 'PAGE') {
      x += current.x || 0;
      y += current.y || 0;
      current = current.parent;
    }
    return [[1, 0, x], [0, 1, y]];
  };

  const prototype: Partial<MockNode> & ThisType<MockNode> = {
    setBoundVariable(field: MockDimensionField, variable: MockVariable | null): void {
      if (!['width', 'height', 'cornerRadius', 'itemSpacing', 'counterAxisSpacing',
        'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'].includes(field)) {
        throw new Error('setBoundVariable: unsupported numeric field ' + field);
      }
      if (variable === null) {
        if (this.boundVariables) {
          delete this.boundVariables[field];
          if (!Object.keys(this.boundVariables).length) delete this.boundVariables;
        }
        return;
      }
      const value = Object.values(variable.valuesByMode)[0];
      if (variable.resolvedType !== 'FLOAT' || typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        throw new Error('setBoundVariable: expected a non-negative numeric variable');
      }
      (this.boundVariables ||= {})[field] = { type: 'VARIABLE_ALIAS', id: variable.id };
      this[field] = value;
      bubble(this);
    },
    appendChild(child: MockNode): void {
      metrics.appendChild++;
      if (!child || typeof child !== 'object' || !child.type) {
        const candidate = child as unknown as { then?: unknown } | null;
        throw new Error(
          'in appendChild: expected a node, got '
          + (candidate?.then ? 'a Promise (missing await?)' : typeof child)
          + '  [parent "' + this.name + '"]',
        );
      }
      if (this.removed || child.removed) {
        throw new Error(
          'in appendChild: The node with id "' + (child.removed ? child.id : this.id)
          + '" does not exist',
        );
      }
      if (child.parent) {
        const index = child.parent.children.indexOf(child);
        if (index >= 0) child.parent.children.splice(index, 1);
      }
      child._everAttached = true;
      child.parent = this;
      this.children.push(child);
      bubble(this);
    },
    insertChild(index: number, child: MockNode): void {
      metrics.insertChild++;
      if (this.removed || child.removed) {
        throw new Error(
          'in insertChild: The node with id "' + (child.removed ? child.id : this.id)
          + '" does not exist',
        );
      }
      if (child.parent) {
        const currentIndex = child.parent.children.indexOf(child);
        if (currentIndex >= 0) child.parent.children.splice(currentIndex, 1);
      }
      child._everAttached = true;
      child.parent = this;
      this.children.splice(index, 0, child);
      bubble(this);
    },
    remove(): void {
      metrics.remove++;
      if (this.removed) return;
      const currentParent = this.parent;
      if (currentParent) {
        const index = currentParent.children.indexOf(this);
        if (index >= 0) currentParent.children.splice(index, 1);
      }
      this.parent = null;
      const destroy = (candidate: MockNode): void => {
        if (!candidate._everAttached && candidate.type === 'FRAME' && candidate.children.length) {
          removedOrphans.push({ type: candidate.type, name: candidate.name,
            children: candidate.children.map(child => ({ name: child.name })) });
        }
        removed.add(candidate);
        nodeById.delete(candidate.id);
        for (const child of candidate.children) destroy(child);
      };
      destroy(this);
      if (currentParent) bubble(currentParent);
    },
    resize(width: number, height: number): void {
      metrics.resize++;
      for (const [property, value] of [
        ['width', width],
        ['height', height],
      ] as const) {
        if (!Number.isFinite(value)) {
          throw new Error(
            'in resize: Property "' + property
            + '" failed validation: Expected number, received '
            + (Number.isNaN(value) ? 'nan' : String(value))
            + '  [node "' + this.name + '"]',
          );
        }
        if (value < 0) {
          throw new Error(
            'in resize: Property "' + property
            + '" failed validation: Number must be greater than or equal to 0, received '
            + value + '  [node "' + this.name + '"]',
          );
        }
      }
      this.width = width;
      this.height = height;
      if (this.layoutMode !== 'NONE') {
        this.primaryAxisSizingMode = 'FIXED';
        this.counterAxisSizingMode = 'FIXED';
      }
      if (this.type === 'TEXT' && this.textAutoResize === 'HEIGHT') this._remeasure();
      bubble(this.parent);
    },
    resizeWithoutConstraints(width: number, height: number): void {
      if (!Number.isFinite(width) || !Number.isFinite(height)) {
        throw new Error(
          'in resizeWithoutConstraints: expected numbers, got ' + width + ' x ' + height
          + '  [node "' + this.name + '"]',
        );
      }
      this.width = width;
      this.height = height;
    },
    findAll(predicate?: (candidate: MockNode) => boolean): MockNode[] {
      metrics.findAll++;
      if (this.removed) throw new Error('The node with id "' + this.id + '" does not exist');
      const found: MockNode[] = [];
      const walk = (parent: MockNode): void => {
        for (const child of parent.children || []) {
          if (!predicate || predicate(child)) found.push(child);
          walk(child);
        }
      };
      walk(this);
      return found;
    },
    findOne(predicate?: (candidate: MockNode) => boolean): MockNode | null {
      return this.findAll(predicate)[0] || null;
    },
    findAllWithCriteria(options: { types: readonly string[] }): MockNode[] {
      return this.findAll((candidate: MockNode) => options.types.includes(candidate.type));
    },
    clone(): MockNode {
      metrics.clone++;
      if (this.removed) throw new Error('The node with id "' + this.id + '" does not exist');

      const copy = (source: MockNode, parent: MockNode | null): MockNode => {
        const nestedComponent = parent !== null && source.type === 'COMPONENT';
        const duplicate = node(nestedComponent ? 'INSTANCE' : source.type, source.name);
        metrics.clonedNodes++;
        if (source.type === 'FRAME' && source.name === 'strut' && source.children.length === 0) {
          metrics.clonedStruts++;
        }
        duplicate._style = source._style;

        for (const property of [
          'boundVariables', 'clipsContent', 'constraints', 'cornerRadius', 'counterAxisAlignItems',
          'counterAxisSizingMode', 'counterAxisSpacing', 'dashPattern',
          '_svg', 'effectStyleId', 'effects', 'fills', 'fontName', 'fontSize',
          'height', 'itemSpacing', 'layoutMode', 'layoutWrap', 'letterSpacing',
          'lineHeight', 'maxLines',
          'opacity', 'overflowDirection', 'paddingBottom', 'paddingLeft',
          'paddingRight', 'paddingTop', 'primaryAxisAlignItems',
          'primaryAxisSizingMode', 'reactions', 'strokeAlign', 'strokeCap',
          'strokeJoin', 'strokes', 'strokeWeight', 'strokeBottomWeight',
          'strokeLeftWeight', 'strokeRightWeight', 'strokeTopWeight',
          'textAlignHorizontal', 'textAlignVertical', 'textAutoResize',
          'textCase', 'textDecoration', 'textStyleId', 'textTruncation',
          'visible', 'width', 'x', 'y',
        ] as const) {
          const value = source[property];
          if (value !== undefined) {
            (duplicate as unknown as Record<string, unknown>)[property] = cloneValue(value);
          }
        }
        if (source.type === 'TEXT') duplicate.characters = source.characters;
        for (const key of source.getPluginDataKeys()) {
          duplicate.setPluginData(key, source.getPluginData(key));
        }
        if (nestedComponent) {
          Object.defineProperty(duplicate, 'mainComponent', {
            configurable: false,
            enumerable: false,
            value: source,
            writable: true,
          });
        } else if (source.mainComponent) {
          Object.defineProperty(duplicate, 'mainComponent', {
            configurable: false,
            enumerable: false,
            value: source.mainComponent,
            writable: true,
          });
        }
        if (parent) {
          duplicate._everAttached = true;
          duplicate.parent = parent;
          parent.children.push(duplicate);
        }
        for (const child of source.children) copy(child, duplicate);

        // These properties validate against the parent and therefore land
        // only after the cloned relation exists.
        if (source.layoutPositioning !== undefined) {
          duplicate.layoutPositioning = source.layoutPositioning;
        }
        if (source.layoutSizingHorizontal !== undefined) {
          duplicate.layoutSizingHorizontal = source.layoutSizingHorizontal;
        }
        if (source.layoutSizingVertical !== undefined) {
          duplicate.layoutSizingVertical = source.layoutSizingVertical;
        }
        duplicate.width = source.width;
        duplicate.height = source.height;
        return duplicate;
      };

      return copy(this, null);
    },
    async setTextStyleIdAsync(id: string): Promise<void> {
      metrics.setTextStyle++;
      const style = textStyleById.get(id) || null;
      this._style = style;
      this.textStyleId = id || '';
      if (style) {
        this.fontName = style.fontName;
        this.fontSize = style.fontSize;
        this.lineHeight = style.lineHeight;
        this.letterSpacing = style.letterSpacing;
        this.textCase = style.textCase;
      }
      this._remeasure();
    },
    async setEffectStyleIdAsync(id: string): Promise<void> {
      metrics.setEffectStyle++;
      this.effectStyleId = id || '';
      this.effects = effectStyleById.get(id)?.effects || [];
    },
    async setReactionsAsync(reactions: unknown): Promise<void> {
      metrics.setReactions++;
      const candidates = Array.isArray(reactions) ? reactions : [];
      for (const reaction of candidates) {
        if (!reaction || typeof reaction !== 'object') continue;
        const actions = 'actions' in reaction && Array.isArray(reaction.actions)
          ? reaction.actions
          : [];
        for (const action of actions) {
          if (!action || typeof action !== 'object' || !('destinationId' in action)) continue;
          if ('transition' in action && action.transition !== null) {
            const transition = action.transition;
            const easing = transition && typeof transition === 'object' && 'easing' in transition
              ? transition.easing
              : null;
            const duration = transition && typeof transition === 'object' && 'duration' in transition
              ? transition.duration
              : null;
            const transitionType = transition && typeof transition === 'object' && 'type' in transition
              ? transition.type
              : null;
            const easingType = easing && typeof easing === 'object' && 'type' in easing
              ? easing.type
              : null;
            if (transitionType !== 'SMART_ANIMATE'
              || typeof duration !== 'number' || !Number.isFinite(duration) || duration < 0
              || !['EASE_IN', 'EASE_OUT', 'EASE_IN_AND_OUT', 'LINEAR', 'CUSTOM_CUBIC_BEZIER'].includes(String(easingType))) {
              throw new Error('setReactionsAsync: invalid prototype transition');
            }
            // Figma requires a curve for a custom easing, with both x values inside 0..1.
            if (easingType === 'CUSTOM_CUBIC_BEZIER') {
              const bezier = easing && typeof easing === 'object' && 'easingFunctionCubicBezier' in easing
                ? easing.easingFunctionCubicBezier as Record<string, unknown> | null
                : null;
              const values = bezier ? ['x1', 'y1', 'x2', 'y2'].map((key) => bezier[key]) : [];
              if (values.length !== 4 || !values.every((value) => typeof value === 'number' && Number.isFinite(value))
                || [values[0], values[2]].some((value) => (value as number) < 0 || (value as number) > 1)) {
                throw new Error('setReactionsAsync: a custom cubic-bezier easing needs x1, y1, x2, y2 with x in 0..1');
              }
            }
          }
          const destinationId = typeof action.destinationId === 'string'
            ? action.destinationId
            : '';
          const destination = nodeById.get(destinationId);
          if (!destination) {
            throw new Error('setReactionsAsync: destination does not exist: ' + destinationId);
          }
          if ('navigation' in action && action.navigation === 'OVERLAY'
            && 'overlayRelativePosition' in action && action.overlayRelativePosition
            && destination.overlayPositionType !== 'MANUAL') {
            throw new Error(
              'setReactionsAsync: overlayRelativePosition requires a MANUAL overlay destination',
            );
          }
          if ('navigation' in action && action.navigation === 'CHANGE_TO') {
            const parent = this.parent;
            if (this.type !== 'COMPONENT' || destination.type !== 'COMPONENT'
              || !parent || parent.type !== 'COMPONENT_SET'
              || destination.parent !== parent) {
              throw new Error(
                'setReactionsAsync: CHANGE_TO requires variants in the same component set',
              );
            }
          }
        }
      }
      this.reactions = reactions;
    },
    get topLevelFrame(): MockNode {
      let current: MockNode = this;
      while (current.parent && current.parent.type !== 'PAGE') current = current.parent;
      return current;
    },
    get page(): MockNode | null {
      let current: MockNode = this;
      while (current.parent) current = current.parent;
      return current.type === 'PAGE' ? current : null;
    },
    createInstance(): MockNode {
      metrics.createInstance++;
      const instance = node('INSTANCE', this.name);
      instance.resize(this.width, this.height);
      instance.clipsContent = this.clipsContent;
      instance.fills = this.fills.map((paint) => ({ ...paint }));
      Object.defineProperty(instance, 'mainComponent', {
        configurable: false,
        enumerable: false,
        value: this,
        writable: true,
      });
      return instance;
    },
    setProperties(): void {},
    getPluginData(key: string): string {
      return pluginData.get(this)?.get(key) || '';
    },
    getPluginDataKeys(): string[] {
      return [...(pluginData.get(this)?.keys() || [])];
    },
    setPluginData(key: string, value: string): void {
      if (value === '') pluginData.get(this)?.delete(key);
      else {
        let data = pluginData.get(this);
        if (!data) { data = new Map(); pluginData.set(this, data); }
        data.set(key, value);
      }
    },
    async screenshot(): Promise<void> {},
    _remeasure(): void {
      if (this.type !== 'TEXT') return;
      const own = this._style || {
        fontSize: this.fontSize || 12,
        fontName: this.fontName || { family: 'Inter', style: 'Regular' },
        lineHeight: this.lineHeight,
        letterSpacing: this.letterSpacing,
        textCase: this.textCase,
      };
      if (this.textAutoResize === 'WIDTH_AND_HEIGHT') {
        const measurement = layoutText(this.characters, own, null);
        this.width = measurement.w;
        this.height = measurement.lineHeight * measurement.lines;
      } else if (this.textAutoResize === 'HEIGHT') {
        const measurement = layoutText(this.characters, own, this.width);
        // maxLines only caps a box whose truncation is switched on.
        const cap = this.textTruncation === 'ENDING' && this.maxLines ? this.maxLines : Infinity;
        this.height = measurement.lineHeight * Math.min(measurement.lines, cap);
      }
      bubble(this.parent);
    },
  };

  Object.defineProperties(prototype, {
    removed: { get(this: MockNode): boolean { return removed.has(this); } },
    absoluteTransform: { get(this: MockNode) { return absoluteTransform(this); } },
  });
  const textPrototype = installMockPropertyPrototypes(prototype);

  function node(type: string, name?: string): MockNode {
    const mock = Object.create(type === 'TEXT' ? textPrototype : prototype) as MockNode;
    Object.assign(mock, {
      id: String(++sequence) + ':' + sequence,
      type,
      name: name || '',
      children: [],
      parent: null,
      width: type === 'TEXT' ? 10 : 100,
      height: type === 'TEXT' ? 12 : 100,
      x: 0,
      y: 0,
      opacity: 1,
      fills: [],
      strokes: [],
      strokeWeight: 1,
      paddingTop: 0,
      paddingRight: 0,
      paddingBottom: 0,
      paddingLeft: 0,
      itemSpacing: 0,
      counterAxisSpacing: 0,
      clipsContent: false,
      _style: null,
    });
    initializeMockProperties(mock);
    if (type !== 'TEXT') mock.characters = '';
    Object.defineProperty(mock, 'overlayPositionType', {
      value: type === 'FRAME' ? 'CENTER' : undefined,
    });
    if (type === 'PAGE') {
      let selection: MockNode[] = [];
      Object.defineProperty(mock, 'selection', {
        configurable: false,
        enumerable: false,
        get(): MockNode[] { return selection; },
        set(value: readonly MockNode[]): void { selection = [...value]; },
      });
    }
    nodeById.set(mock.id, mock);
    return mock;
  }

  return {
    refreshVariable(variable: MockVariable): void {
      // Scan only live nodes; variables never retain a removed document graph.
      for (const candidate of nodeById.values()) {
        if (!candidate.boundVariables) continue;
        for (const field of Object.keys(candidate.boundVariables) as MockDimensionField[]) {
          if (candidate.boundVariables[field]?.id === variable.id) candidate.setBoundVariable(field, variable);
        }
      }
    },
    get created(): MockCreationRecord[] { return [...nodeById.values(), ...removedOrphans]; },
    metrics,
    node,
    nodeById,
    registerEffectStyle(style: MockEffectStyle): void {
      effectStyleById.set(style.id, style);
    },
    registerTextStyle(style: MockTextStyle): void {
      textStyleById.set(style.id, style);
    },
  };
}
