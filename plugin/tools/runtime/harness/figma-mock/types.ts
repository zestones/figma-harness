export interface MockColor {
  b: number;
  g: number;
  r: number;
}

export interface MockPaint {
  boundVariables?: { color?: { id: string } };
  color?: MockColor;
  gradientStops?: Array<{
    color: MockColor & { a?: number };
    position: number;
  }>;
  opacity?: number;
  type?: string;
  visible?: boolean;
}

export interface MockFontName {
  family: string;
  style: string;
}

export interface MockTextStyle {
  description?: string;
  fontName: MockFontName;
  fontSize: number;
  id: string;
  letterSpacing: { unit: string; value: number };
  lineHeight: { unit: string; value: number };
  name: string;
  textCase: string;
}

export interface MockEffectStyle {
  description?: string;
  effects: unknown[];
  id: string;
  name: string;
}

export interface MockNode {
  boundVariables?: Partial<Record<MockDimensionField, { type: 'VARIABLE_ALIAS'; id: string }>>;
  setBoundVariable(field: MockDimensionField, variable: MockVariable | null): void;
  _everAttached?: boolean;
  _remeasure(): void;
  _style: MockTextStyle | null;
  _svg?: string;
  readonly absoluteTransform?: [[number, number, number], [number, number, number]];
  appendChild(child: MockNode): void;
  characters: string;
  children: MockNode[];
  clipsContent: boolean;
  clone(): MockNode;
  constraints?: { horizontal: string; vertical: string };
  cornerRadius?: number;
  counterAxisAlignItems: string;
  counterAxisSizingMode: string;
  counterAxisSpacing: number;
  createInstance(): MockNode;
  dashPattern?: readonly number[];
  effectStyleId?: string;
  effects?: unknown[];
  fills: MockPaint[];
  findAll(predicate?: (node: MockNode) => boolean): MockNode[];
  findAllWithCriteria(options: { types: readonly string[] }): MockNode[];
  findOne(predicate?: (node: MockNode) => boolean): MockNode | null;
  fontName?: MockFontName;
  fontSize?: number;
  height: number;
  id: string;
  insertChild(index: number, child: MockNode): void;
  itemSpacing: number;
  layoutMode: string;
  layoutPositioning?: string;
  layoutSizingHorizontal?: string;
  layoutSizingVertical?: string;
  layoutWrap?: string;
  letterSpacing?: { unit: string; value: number };
  lineHeight?: { unit: string; value: number };
  maxLines?: number;
  mainComponent?: MockNode | null;
  name: string;
  opacity: number;
  readonly overlayPositionType?: string;
  overflowDirection?: string;
  paddingBottom: number;
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  page: MockNode | null;
  parent: MockNode | null;
  primaryAxisAlignItems: string;
  primaryAxisSizingMode: string;
  reactions?: unknown;
  readonly removed: boolean;
  remove(): void;
  resize(width: number, height: number): void;
  resizeWithoutConstraints(width: number, height: number): void;
  screenshot(): Promise<void>;
  setEffectStyleIdAsync(id: string): Promise<void>;
  getPluginData(key: string): string;
  getPluginDataKeys(): string[];
  setProperties(properties?: Record<string, unknown>): void;
  setPluginData(key: string, value: string): void;
  setReactionsAsync(reactions: unknown): Promise<void>;
  setTextStyleIdAsync(id: string): Promise<void>;
  strokeAlign?: string;
  strokeCap?: string;
  strokeJoin?: string;
  strokes: MockPaint[];
  strokeWeight: number;
  strokeBottomWeight?: number;
  strokeLeftWeight?: number;
  strokeRightWeight?: number;
  strokeTopWeight?: number;
  textAlignHorizontal?: string;
  textAlignVertical?: string;
  textAutoResize: string;
  textCase?: string;
  textDecoration?: string;
  textStyleId?: string;
  textTruncation?: string;
  topLevelFrame: MockNode;
  type: string;
  visible?: boolean;
  width: number;
  x: number;
  y: number;
}

/** Audit evidence needs names and attachment state, never ownership of a
 * removed document graph. Live nodes structurally satisfy this record. */
export interface MockCreationRecord {
  _everAttached?: boolean;
  children: ReadonlyArray<{ name: string }>;
  name: string;
  type: string;
}

export interface MockVariableCollection {
  id: string;
  modes: Array<{ modeId: string; name: string }>;
  name: string;
  variableIds: string[];
}

export interface MockVariable {
  description: string;
  id: string;
  name: string;
  resolvedType: string;
  variableCollectionId: string;
  remove(): void;
  scopes: string[];
  setValueForMode(mode: string, value: unknown): void;
  valuesByMode: Record<string, unknown>;
}

export type MockDimensionField = 'width' | 'height' | 'cornerRadius' | 'itemSpacing'
  | 'counterAxisSpacing' | 'paddingTop' | 'paddingRight' | 'paddingBottom' | 'paddingLeft';

export interface MockStore {
  colls: MockVariableCollection[];
  effect: MockEffectStyle[];
  text: MockTextStyle[];
  vars: MockVariable[];
}
