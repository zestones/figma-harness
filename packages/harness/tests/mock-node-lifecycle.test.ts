import assert from 'node:assert/strict';
import test from 'node:test';
import { createMockNodeFactory } from '../src/runtime/figma-mock/node-factory.ts';
import { createFigmaMock } from '../src/runtime/figma-mock.ts';
import { hugSize } from '../src/runtime/layout.ts';
import {
  canonical,
  snapshotComponentNode,
  snapshotNode,
  writeCanonicalJson,
  writeSnapshotComponentNodeJson,
  writeSnapshotNodeJson,
} from '../src/signatures/signature.ts';
import type { AuditContext, AuditRule } from '../src/runtime/rules/types.ts';

const orphanRule = require('../src/runtime/rules/orphans.ts') as AuditRule;

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

test('a wrapping row grows to hold every line, as Figma does', () => {
  const factory = createMockNodeFactory();
  const row = factory.node('FRAME');
  row.layoutMode = 'HORIZONTAL';
  row.layoutWrap = 'WRAP';
  row.itemSpacing = 10;
  row.counterAxisSpacing = 8;
  row.resize(100, 0);
  row.counterAxisSizingMode = 'AUTO';
  for (let index = 0; index < 3; index++) {
    const chip = factory.node('FRAME');
    chip.resize(40, 20);
    row.appendChild(chip);
  }
  // Two chips fit on the first line, the third starts a second one.
  assert.equal(row.width, 100);
  assert.equal(row.height, 20 + 8 + 20);
});

test('an auto-layout frame with nothing in its flow keeps its size, as Figma does', () => {
  const factory = createMockNodeFactory();
  const row = factory.node('FRAME');
  row.layoutMode = 'HORIZONTAL';
  row.resize(32, 100);
  row.counterAxisSizingMode = 'AUTO';
  hugSize(row);
  assert.equal(row.height, 100);
  const label = factory.node('TEXT');
  row.appendChild(label);
  assert.equal(row.height, label.height);
});

test('the orphan audit reports an empty node that was never appended', async () => {
  const factory = createMockNodeFactory();
  const page = factory.node('PAGE', 'page');
  const kept = factory.node('FRAME', 'kept');
  page.appendChild(kept);
  factory.node('FRAME', 'card-actions');
  const original = console.log;
  try {
    console.log = () => undefined;
    assert.equal(await orphanRule.run({ created: factory.created } as AuditContext), 1);
  } finally { console.log = original; }
});
