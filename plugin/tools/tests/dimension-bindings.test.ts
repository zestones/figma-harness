import test from 'node:test';
import assert from 'node:assert/strict';
import { createFigmaMock } from '../runtime/harness/figma-mock.ts';
import { createHarness } from '../runtime/harness.ts';
import type { MockNode, MockDimensionField } from '../runtime/harness/figma-mock/types.ts';
import { ensureTokens } from '../../src/kit/foundations/install.ts';
import { DIMS, dim, SHELL_DIMENSIONS } from '../../src/kit/foundations/dimensions.ts';
import { f } from '../../src/engine/node-factory.ts';
import { bindDimensions, setDimension } from '../../src/engine/dimension-bindings.ts';

async function sourceMock() {
  const mock = createFigmaMock();
  const globals = globalThis as typeof globalThis & { figma?: PluginAPI };
  const original = globals.figma;
  globals.figma = mock.figma as unknown as PluginAPI;
  await ensureTokens();
  return { mock, restore: () => { globals.figma = original; } };
}

test('size installation owns its collection, repairs scopes and preserves installed identities', async () => {
  const { mock, restore } = await sourceMock();
  try {
    const sizeCollection = mock.store.colls.find(value => value.name === 'Primer / Size')!;
    const padding = mock.store.vars.find(value => value.name === 'stack/padding/spacious')!;
    const originalId = padding.id;
    padding.scopes = ['WIDTH_HEIGHT'];
    padding.setValueForMode('m1', 7);
    const foreignCollection = mock.figma.variables.createVariableCollection('User sizes');
    const foreign = mock.figma.variables.createVariable('stack/padding/spacious', foreignCollection, 'FLOAT');
    foreign.setValueForMode('m1', 99);
    await ensureTokens();
    const restored = mock.store.vars.find(value => value.variableCollectionId === sizeCollection.id && value.name === 'stack/padding/spacious')!;
    assert.equal(restored.id, originalId);
    assert.equal(restored.valuesByMode['m1'], 24);
    assert.deepEqual(restored.scopes, ['GAP']);
    assert.equal(foreign.valuesByMode['m1'], 99);
    const identities = mock.store.vars.map(value => value.id + ':' + value.name).join('|');
    await ensureTokens();
    assert.equal(mock.store.vars.map(value => value.id + ':' + value.name).join('|'), identities);
    for (const token of DIMS) {
      const variable = mock.store.vars.find(item => item.variableCollectionId === sizeCollection.id && item.name === token.name)!;
      assert.equal(variable.valuesByMode['m1'], token.value, token.name);
      assert.deepEqual(variable.scopes, [...token.scopes], token.name);
    }
    assert.equal(mock.store.vars.filter(value => value.variableCollectionId === sizeCollection.id).length, DIMS.length);
    const colors = mock.store.vars.filter(value => value.resolvedType === 'COLOR');
    assert.deepEqual(colors.find(value => value.name === 'borderColor/default')?.scopes, ['EFFECT_COLOR', 'STROKE_COLOR']);
    assert.deepEqual(colors.find(value => value.name === 'borderColor/muted')?.valuesByMode['m1'],
      { r: 209 / 255, g: 217 / 255, b: 224 / 255, a: 179 / 255 });
  } finally { restore(); }
});

test('explicit sizes bind native properties, survive cloning and follow variable updates', async () => {
  const { mock, restore } = await sourceMock();
  try {
    const built = await f({ name: 'bound-frame', dir: 'H', w: dim('app/pane/width'), h: 120,
      gap: dim('stack/gap/spacious'),
      pad: [dim('stack/padding/spacious'), dim('stack/padding/normal'), dim('stack/padding/spacious'), dim('stack/padding/normal')],
      radius: dim('borderRadius/medium'), wrap: true, rowGap: dim('stack/gap/condensed') });
    const node = built as unknown as MockNode;
    const clone = node.clone();
    assert.equal(node.width, 296);
    assert.equal(node.height, 120);
    assert.equal(node.boundVariables?.height, undefined);
    assert.equal(node.paddingLeft, 16);
    assert.equal(node.paddingTop, 24);
    const normal = mock.store.vars.find(variable => variable.name === 'stack/padding/normal')!;
    const spacious = mock.store.vars.find(variable => variable.name === 'stack/padding/spacious')!;
    assert.equal(node.boundVariables?.paddingLeft?.id, normal.id);
    assert.equal(node.boundVariables?.paddingTop?.id, spacious.id);
    assert.equal(JSON.stringify(clone.boundVariables), JSON.stringify(node.boundVariables));
    normal.setValueForMode('m1', 20);
    assert.equal(node.paddingLeft, 20);
    assert.equal(node.paddingRight, 20);
    assert.equal(clone.paddingLeft, 20);
    assert.equal(node.paddingTop, 24);
    clone.setBoundVariable('paddingLeft', null);
    normal.setValueForMode('m1', 28);
    assert.equal(node.paddingLeft, 28);
    assert.equal(clone.paddingLeft, 20);
    const width = mock.store.vars.find(variable => variable.name === 'app/pane/width')!;
    width.setValueForMode('m1', 320);
    assert.equal(node.width, 320);
    assert.equal(clone.width, 320);
    node.remove(); clone.remove();
    width.setValueForMode('m1', 296);
    assert.equal(mock.nodeById.has(node.id), false);
  } finally { restore(); }
});

test('sizes bind only where their Figma scopes allow, never by matching numbers', async () => {
  const { mock, restore } = await sourceMock();
  try {
    const node = await f({ name: 'calculated-geometry', dir: 'V', w: 32, h: 100, gap: 16, pad: 24, radius: 1 });
    assert.equal(Boolean(node.boundVariables), false);
    assert.throws(() => bindDimensions(node, { width: dim('stack/gap/condensed') }), /cannot own width/);
    assert.throws(() => bindDimensions(node, { paddingLeft: dim('app/pane/width') }), /cannot own paddingLeft/);
    assert.throws(() => bindDimensions(node, { cornerRadius: dim('base/size/8') }), /cannot own cornerRadius/);
    bindDimensions(node, { width: dim('base/size/32'), itemSpacing: dim('base/size/16') });
    assert.ok(node.boundVariables?.width && node.boundVariables?.itemSpacing, 'a base size scopes both sizes and gaps');
    assert.throws(() => bindDimensions(node, { width: { ...dim('app/pane/width'), variable: 'app/not-installed' } }), /missing numeric variable/);
    const color = mock.store.vars.find(variable => variable.resolvedType === 'COLOR')!;
    assert.throws(() => bindDimensions(node, { width: { ...dim('app/pane/width'), variable: color.name } }), /missing numeric variable/);
    assert.equal(node.cornerRadius, 1);
    setDimension(node, 'cornerRadius', dim('borderRadius/medium'));
    assert.equal(node.cornerRadius, 6);
    assert.ok(node.boundVariables?.cornerRadius);
    setDimension(node, 'cornerRadius', 0);
    assert.equal(node.cornerRadius, 0);
    assert.equal(node.boundVariables?.cornerRadius, undefined);
    node.remove();
  } finally { restore(); }
});

test('every generated shell and bound property consumes the shared size contract', async () => {
  const harness = createHarness();
  const pages = await harness.buildAll();
  const variables = new Map(harness.vars.map(variable => [variable.id, variable]));
  let shells = 0, bindings = 0;
  const mismatches = new Map<string, number>();
  const assertBinding = (node: MockNode, field: MockDimensionField, name: string) => {
    const id = node.boundVariables?.[field]?.id;
    assert.equal(id ? variables.get(id)?.name : null, name, node.name + '.' + field);
  };
  const walk = (node: MockNode) => {
    for (const field of Object.keys(node.boundVariables || {}) as MockDimensionField[]) {
      const variable = variables.get(node.boundVariables![field]!.id);
      assert.equal(variable?.resolvedType, 'FLOAT', node.name + '.' + field);
      if (node[field] !== variable?.valuesByMode['m1']) {
        const key = `${node.name}.${field}: ${node[field]} / ${variable?.name}=${variable?.valuesByMode['m1']}`;
        mismatches.set(key, (mismatches.get(key) || 0) + 1);
      }
      bindings++;
    }
    for (const child of node.children) walk(child);
  };
  for (const page of pages) walk(page);
  assert.equal(mismatches.size, 0, JSON.stringify([...mismatches].slice(0, 30)));
  for (const frame of pages[0].children) {
    const header = frame.children.find(node => node.name === 'App header');
    const body = frame.children.find(node => node.name === 'page');
    if (!header || !body) continue;
    shells++;
    const bar = header.children.find(node => node.name === 'global-bar')!;
    const nav = header.children.find(node => node.name === 'underline-nav')!;
    const container = body.children.find(node => node.name === 'page-container')!;
    assertBinding(bar, 'height', 'app/header/height');
    assertBinding(nav, 'height', 'control/xlarge/size');
    assert.equal(header.height, SHELL_DIMENSIONS.header + SHELL_DIMENSIONS.localNav);
    for (const side of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft'] as const) {
      assertBinding(body, side, 'stack/padding/spacious');
    }
    assertBinding(container, 'itemSpacing', 'stack/gap/spacious');
    assertBinding(container, 'width', 'app/content/maxWidth');
    const pane = container.children.find(node => node.name === 'pane');
    if (pane) assertBinding(pane, 'width', 'app/pane/width');
    assert.ok(frame.height >= 1024, frame.name + ' is shorter than its artboard');
  }
  // The seven prototype screens.
  assert.equal(shells, 7);
  assert.ok(bindings > 1000);
  assert.equal(harness.runtime.LAST_LINKS, 83);
  console.log(JSON.stringify({ shells, bindings }));
});
