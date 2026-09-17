import assert from 'node:assert/strict';
import test from 'node:test';
import { lint } from '../../src/engine/layout-lint.ts';
import { createFigmaMock } from '../runtime/harness/figma-mock.ts';
import type { MockNode, MockTextStyle } from '../runtime/harness/figma-mock/types.ts';
import { layoutText, measure, wrapLines } from '../runtime/harness/text-metrics.ts';

const BODY: MockTextStyle = {
  id: 'S1',
  name: 'body/sm',
  fontName: { family: 'Noto Sans', style: 'Regular' },
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

test('text is measured with the advance widths of the bundled fonts', () => {
  const regular = measure('Releases', 24, 'Noto Sans', 0, false, 'Regular');
  const semiBold = measure('Releases', 24, 'Noto Sans', 0, false, 'SemiBold');
  assert.ok(semiBold > regular, 'a heavier weight is wider');
  assert.ok(semiBold > 95 && semiBold < 115, 'Noto Sans SemiBold at 24 px measures ' + semiBold);
  assert.equal(measure('Releases', 24, 'Unknown Family'), measure('Releases', 24, 'Noto Sans'), 'unknown families measure as Noto Sans');
  assert.equal(measure('0123456789', 10, 'Noto Sans Mono'), 60);
  assert.equal(measure('AB', 10, 'Noto Sans', 2), measure('AB', 10, 'Noto Sans') + 4);
  assert.equal(measure('ab', 10, 'Noto Sans', 0, true), measure('AB', 10, 'Noto Sans'));
  assert.equal(measure('\u{1F9EA}', 10, 'Noto Sans'), 6, 'a character no subset contains falls back to 0.6 em');
});

test('fixed-width text breaks at words, and a word wider than its box spans lines', () => {
  const width = (line: string): number => line.length * 10;
  assert.deepEqual(wrapLines('alpha beta gamma', 100, width), ['alpha beta', 'gamma']);
  assert.deepEqual(wrapLines('one\ntwo three', 1000, width), ['one', 'two three']);
  assert.equal(layoutText('a '.repeat(80), BODY, 60).lines > 1, true);
  const long = layoutText('x'.repeat(60), BODY, 100);
  assert.equal(long.lines, Math.ceil(measure('x'.repeat(60), 12, 'Noto Sans') / 100));
  const auto = layoutText('short\nlonger line', BODY, null);
  assert.equal(auto.lines, 2);
  assert.equal(auto.w, measure('longer line', 12, 'Noto Sans'));
});

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
