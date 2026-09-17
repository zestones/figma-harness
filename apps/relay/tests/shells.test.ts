import assert from 'node:assert/strict';
import test from 'node:test';
import { SHELL_DIMENSIONS } from '@figma-harness/primer';
import { createHarness } from '@figma-harness/harness/runtime/harness.ts';
import type { MockDimensionField, MockNode } from '@figma-harness/harness/runtime/figma-mock/types.ts';

test('every generated shell and bound property consumes the shared size contract', async () => {
  const harness = createHarness({ app: 'apps/relay' });
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
