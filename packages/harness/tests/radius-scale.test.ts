import { loadContract } from '../src/bundle/contract-loader.ts';
import { createFigmaMock } from '../src/runtime/figma-mock.ts';
import { inspectRadii } from '../src/runtime/rules/radius-scale.ts';
import type { MockNode } from '../src/runtime/figma-mock/types.ts';
import type { HarnessContract } from '@figma-harness/contract';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

const contract = loadContract();
const SCALE = contract.designSystem.radiusScale;
/* Radii the configured design system does not declare. */
const OFF_SCALE = [1, 2, 4, 5, 7, 8, 10, 11, 13].filter((radius) => !SCALE.includes(radius)).slice(0, 5);

function fixture() {
  const { figma, pages } = createFigmaMock();
  const page = pages[0];
  page.name = '01 · Screens';
  const screen = figma.createFrame();
  screen.name = 'Screen';
  page.appendChild(screen);
  function mark(radius: number, width = 100, height = 40, parent: MockNode = screen) {
    const node = figma.createRectangle();
    node.name = 'mark';
    node.resize(width, height);
    node.cornerRadius = radius;
    parent.appendChild(node);
    return node;
  }
  return { figma, mark, page, pages, screen };
}

test('radius audit accepts the scale and round geometry, including fractional marks', () => {
  const { mark, pages } = fixture();
  assert.equal(OFF_SCALE.length, 5, 'the scale leaves room for off-scale samples');
  for (const radius of SCALE) mark(radius);
  mark(4, 8, 8);
  mark(1.5, 12, 3);
  mark(5.5, 11, 11);
  const audit = inspectRadii(pages, contract);
  assert.equal(audit.issues.size, 0);
  assert.equal(audit.fullyRounded, 3);
  assert.ok(audit.seen >= SCALE.length + 3);
});

test('radius audit rejects undeclared corners on frames and rectangles at any depth', () => {
  const { figma, mark, pages, screen } = fixture();
  const inset = figma.createFrame();
  inset.resize(120, 80);
  inset.cornerRadius = OFF_SCALE[0];
  screen.appendChild(inset);
  for (const radius of [...OFF_SCALE, -1, NaN, Infinity]) mark(radius, 100, 40, inset);
  assert.equal([...inspectRadii(pages, contract).issues.values()].reduce((sum, count) => sum + count, 0), 9);
});

test('a declared radius exception applies only to its page and to nodes its predicate accepts', () => {
  const { mark, page, pages } = fixture();
  const declared: HarnessContract = {
    ...contract,
    document: {
      ...contract.document,
      radiusExceptions: [{
        label: 'calendar day cells',
        page: 'screens',
        matches: (node) => node.name.startsWith('day-cell/')
          && node.cornerRadius === OFF_SCALE[0]
          && node.width <= 40
          && node.getPluginData('spec.calendar.cell') === 'day',
      }],
    },
  };
  const cell = mark(OFF_SCALE[0], 32, 18);
  cell.name = 'day-cell/2026-08-21';
  cell.setPluginData('spec.calendar.cell', 'day');
  assert.equal(inspectRadii(pages, declared).exceptions.get('calendar day cells'), 1);
  assert.equal(inspectRadii(pages, declared).issues.size, 0);
  assert.equal(inspectRadii(pages, contract).issues.size, 1, 'the shipped contract declares no such exception');

  cell.setPluginData('spec.calendar.cell', '');
  assert.equal(inspectRadii(pages, declared).issues.size, 1);
  cell.setPluginData('spec.calendar.cell', 'day');
  cell.resize(320, 180);
  assert.equal(inspectRadii(pages, declared).issues.size, 1);
  cell.resize(32, 18);
  cell.cornerRadius = OFF_SCALE[1];
  assert.equal(inspectRadii(pages, declared).issues.size, 1);
  cell.cornerRadius = OFF_SCALE[0];
  page.name = '02 · Design system';
  assert.equal(inspectRadii(pages, declared).issues.size, 1);
});

test('only the disposable Design lab is exempt; teaching sheets are audited', () => {
  const { mark, page, pages } = fixture();
  mark(OFF_SCALE[0]);
  page.name = '02 · Design system';
  assert.equal(inspectRadii(pages, contract).issues.size, 1);
  page.name = '03 · Design lab';
  assert.equal(inspectRadii(pages, contract).seen, 0);
  page.name = 'Design lab lookalike';
  assert.equal(inspectRadii(pages, contract).issues.size, 1);
});
