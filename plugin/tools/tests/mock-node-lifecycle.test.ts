import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockNodeFactory } from '../runtime/harness/figma-mock/node-factory.ts';
import { createFigmaMock } from '../runtime/harness/figma-mock.ts';
import {
  canonical,
  snapshotComponentNode,
  snapshotNode,
  writeCanonicalJson,
  writeSnapshotComponentNodeJson,
  writeSnapshotNodeJson,
} from '../runtime/signature.ts';
import type { AuditContext, AuditRule } from '../runtime/harness/rules/types.ts';

const orphanRule = require('../runtime/harness/rules/orphans.ts') as AuditRule;

test('removing a subtree releases inventory ownership while retained handles stay removed', () => {
  const mock = createFigmaMock();
  const { figma, nodeById } = mock;
  const page = figma.root.children[0];
  for (let pass = 0; pass < 5; pass++) {
    const root = figma.createFrame();
    page.appendChild(root);
    const child = figma.createText();
    root.appendChild(child);
    root.remove();
    assert.equal(nodeById.size, 1);
    assert.equal(mock.created.length, 1);
    assert.equal(root.removed, true);
    assert.equal(child.removed, true);
    assert.throws(() => page.appendChild(child), /does not exist/);
    assert.throws(() => child.clone(), /does not exist/);
    root.remove();
  }
});

test('deleted orphans retain audit evidence without retaining mock nodes', async () => {
  const factory = createMockNodeFactory();
  const root = factory.node('FRAME', 'forgotten-frame');
  const child = factory.node('TEXT', 'forgotten-label');
  root.appendChild(child);
  const findings = async (): Promise<number> => {
    const original = console.log;
    try {
      console.log = () => undefined;
      return await orphanRule.run({ created: factory.created } as AuditContext);
    } finally { console.log = original; }
  };
  assert.equal(await findings(), 1);
  root.remove();
  assert.equal(factory.nodeById.size, 0);
  assert.equal(await findings(), 1);
  assert.deepEqual(factory.created, [{
    type: 'FRAME', name: 'forgotten-frame', children: [{ name: 'forgotten-label' }],
  }]);
});

test('shared accessors preserve independent values, layout validation and text reflow', () => {
  const factory = createMockNodeFactory();
  const first = factory.node('FRAME');
  const second = factory.node('FRAME');
  first.layoutMode = 'HORIZONTAL';
  assert.equal(second.layoutMode, 'NONE');
  assert.throws(() => { second.layoutMode = 'INVALID'; }, /Invalid enum/);
  assert.throws(() => { second.layoutSizingHorizontal = 'FILL'; }, /parent is not auto-layout/);
  first.appendChild(second);
  second.layoutSizingHorizontal = 'FILL';
  second.layoutPositioning = 'ABSOLUTE';
  assert.throws(() => { second.layoutSizingVertical = 'FILL'; }, /absolute child/);
  assert.throws(() => { second.layoutWrap = 'WRAP'; }, /needs layoutMode=HORIZONTAL/);
  const label = factory.node('TEXT');
  first.appendChild(label);
  label.characters = 'Retained layout';
  const width = label.width;
  label.fontSize = 24;
  assert.ok(label.width > width);
  label.setPluginData('test', 'first');
  const duplicate = label.clone();
  duplicate.characters = 'Short';
  duplicate.setPluginData('test', 'copy');
  assert.equal(label.characters, 'Retained layout');
  assert.equal(label.getPluginData('test'), 'first');
  assert.equal(duplicate.getPluginData('test'), 'copy');
  assert.equal(snapshotNode(first).properties['layoutMode'], 'HORIZONTAL');
  assert.equal(snapshotNode(label).properties['characters'], 'Retained layout');

  const streamedNode: string[] = [];
  writeSnapshotNodeJson(first, chunk => streamedNode.push(chunk));
  assert.equal(streamedNode.join(''), JSON.stringify(snapshotNode(first)));
  const streamedComponent: string[] = [];
  writeSnapshotComponentNodeJson(first, chunk => streamedComponent.push(chunk));
  assert.equal(streamedComponent.join(''), JSON.stringify(snapshotComponentNode(first)));

  const value = { z: [undefined, { b: 2, a: -0 }], a: 'canonical' };
  const streamedValue: string[] = [];
  writeCanonicalJson(value, chunk => streamedValue.push(chunk));
  assert.equal(streamedValue.join(''), JSON.stringify(canonical(value, new Set<object>())));
});
