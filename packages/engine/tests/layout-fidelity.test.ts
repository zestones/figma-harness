import assert from 'node:assert/strict';
import test from 'node:test';
import { lint } from '../src/layout-lint.ts';
import { createFigmaMock } from '@figma-harness/harness/runtime/figma-mock.ts';
import type { MockNode, MockTextStyle } from '@figma-harness/harness/runtime/figma-mock/types.ts';
import { defaultFamily } from '@figma-harness/harness/core/bundled-fonts.ts';

const BODY: MockTextStyle = {
  id: 'S1',
  name: 'body/sm',
  fontName: { family: defaultFamily(), style: 'Regular' },
  fontSize: 12,
  lineHeight: { unit: 'PIXELS', value: 16 },
  letterSpacing: { unit: 'PERCENT', value: 0 },
  textCase: 'ORIGINAL',
};

type MockFigma = ReturnType<typeof createFigmaMock>['figma'];

async function textNode(figma: MockFigma, characters: string): Promise<MockNode> {
  const style = figma.createTextStyle();
  Object.assign(style, BODY, { id: style.id });
  const node = figma.createText();
  await node.setTextStyleIdAsync(style.id);
  node.characters = characters;
  return node;
}

function lintIssues(root: MockNode): string[] {
  return lint(root as unknown as SceneNode, { tolerance: 0.75 }).issues.map((issue) => issue.kind);
}

test('a fixed text box keeps its ellipsis only when it is set after the box', async () => {
  const { figma } = createFigmaMock();
  const row = figma.createFrame();
  row.layoutMode = 'HORIZONTAL';
  row.resize(200, 36);
  row.name = 'row';

  // The order that shipped first: Figma switched the ellipsis off again.
  const spilled = await textNode(figma, 'A label long enough to need a second line in this box');
  spilled.textTruncation = 'ENDING';
  spilled.textAutoResize = 'NONE';
  spilled.resize(120, 16);
  row.appendChild(spilled);
  assert.equal(spilled.textTruncation, 'DISABLED');
  assert.deepEqual(lintIssues(row), ['untruncated-fixed-text']);
  spilled.remove();

  const truncated = await textNode(figma, 'A label long enough to need a second line in this box');
  truncated.textAutoResize = 'NONE';
  truncated.resize(120, 16);
  truncated.textTruncation = 'ENDING';
  row.appendChild(truncated);
  assert.equal(truncated.textTruncation, 'ENDING');
  assert.equal(truncated.height, 16);
  assert.deepEqual(lintIssues(row), []);

  const wrapped = await textNode(figma, 'A label long enough to need a second line in this box');
  wrapped.textAutoResize = 'HEIGHT';
  wrapped.resize(120, wrapped.height);
  assert.ok(wrapped.height >= 32, 'an auto-height text grows with its lines');
});
