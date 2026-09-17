'use strict';

import type {
  BoundColorPaint,
  TokenVariable,
} from '../src/color/core/token-values.ts';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');
const runtimeGlobal = global as typeof global & { figma?: unknown; FigmaHarnessPlugin?: unknown };

const color = require('../src/color/core/color.ts') as typeof import('../src/color/core/color.ts');
const { oklch, toOklch } = require('../src/color/core/oklch.ts') as typeof import('../src/color/core/oklch.ts');
const {
  analyzeColorOwnership,
  analyzeProjectColorOwnership,
} = require('../src/color/core/token-source.ts') as typeof import('../src/color/core/token-source.ts');
const {
  colorTokenMap, paintColorInfo, resolvePaintColor, variableIndex,
} = require('../src/color/core/token-values.ts') as typeof import('../src/color/core/token-values.ts');

test('shared contrast implementation retains both current and historical breakpoints', () => {
  const white = color.hex('#FFFFFF');
  const accent = color.hex('#0969DA');
  assert.equal(color.ratio(white, accent), color.ratio(white, accent, 0.03928));
  assert.equal(Number(color.ratio(white, accent).toFixed(2)), 5.19);
});

test('translucent colours are parsed with their alpha and never measured unflattened', () => {
  assert.throws(() => color.hex('#D1D9E0B3'), /needs a ground/);
  assert.throws(() => color.hex('#D1D9E'), /invalid colour/);
  const muted = color.rgba('#D1D9E0B3');
  assert.equal(Number(muted.a.toFixed(3)), 0.702);
  assert.deepEqual(color.rgba('#FFFFFF'), { r: 255, g: 255, b: 255, a: 1 });
  const flat = color.flatten(muted, color.hex('#FFFFFF'));
  assert.equal(color.toHex(flat), '#DFE4E9');

  const { measurePair } = require('../src/accessibility/contrast.ts') as typeof import('../src/accessibility/contrast.ts');
  const tokens = { ink: '#59636E', tint: '#818B981F', page: '#FFFFFF' };
  assert.equal(Number(measurePair(tokens, ['ink', 'tint', 4.5, 'label', 'page']).ratio.toFixed(2)), 5.4);
  assert.throws(() => measurePair(tokens, ['ink', 'tint', 4.5, 'label']), /must declare the ground/);
  assert.throws(() => measurePair(tokens, ['missing', 'page', 4.5, 'label']), /undeclared colour token/);
});

test('OKLCH conversion round-trips sample colours exactly', () => {
  for (const sample of ['#0969DA', '#F6F8FA', '#1F2328', '#1F883D', '#FFFFFF']) {
    const value = toOklch(sample);
    assert.equal(oklch(value.L, value.C, value.h), sample);
  }
  assert.equal(toOklch('#F6F8FA').C < 0.03, true);
});

test('an exact shared value needs a common declared source', () => {
  const unexplained = analyzeColorOwnership(
    [['token/one', '#123456'], ['token/two', '#123456']],
    { 'token/one': 'semantic/token/one', 'token/two': 'semantic/token/two' },
    {},
  );
  assert.equal(
    unexplained.issues.some((issue) => issue.startsWith('unexplained exact alias #123456')),
    true,
  );
  const aliased = analyzeColorOwnership(
    [['token/one', '#123456'], ['token/two', '#123456']],
    { 'token/one': 'base/one', 'token/two': 'base/one' },
    { 'base/one': { policy: 'linked-aliases', rationale: 'two names for one role' } },
  );
  assert.deepEqual(aliased.issues, []);
  assert.deepEqual(analyzeProjectColorOwnership().issues, [], 'the configured design system explains its shared values');
});

test('categorical separation fails collapsed pairs and annotates declared waivers', () => {
  const { auditCategoricalSeparation } = require('../src/accessibility/a11y/rules/categorical.ts') as
    typeof import('../src/accessibility/a11y/rules/categorical.ts');
  const values: Record<string, string> = {
    'status/warning': '#9A6200',
    'status/danger': '#C93036',
    'status/near': '#A06000',
  };
  type Waiver = import('@figma-harness/contract').CategoricalWaiver;
  const run = function (tokens: readonly string[], waivers: readonly Waiver[]) {
    const findings: { detail: string; severity: string; subject: string }[] = [];
    auditCategoricalSeparation(
      (token) => (values[token] ? color.rgba(values[token]) : undefined),
      new Set(['status/warning|status/danger', 'status/warning|status/near']),
      (severity, _rule, subject, detail) => findings.push({ detail, severity, subject }),
      { categorical: { tokens, rampPrefixes: [], sameFamilyPrefixes: [], waivers } },
    );
    return findings;
  };

  assert.deepEqual(run(['status/warning', 'status/danger'], []).map((finding) =>
    [finding.subject, finding.severity]), [['status/warning vs status/danger · tritanopia', 'WARN']]);

  const waived = run(['status/warning', 'status/danger'], [{
    label: 'reviewed warning and danger pair',
    detail: 'both always carry their word',
    counts: 'adjacent',
    matches: (first, second) => first === 'status/warning' && second === 'status/danger',
    summary: (count) => count + ' reviewed pair(s)',
  }]);
  assert.deepEqual(waived.map((finding) => [finding.subject, finding.severity]), [
    ['status/warning vs status/danger · tritanopia', 'WARN'],
    ['reviewed warning and danger pair', 'note'],
  ]);
  assert.match(waived[0].detail, /\. WAIVED: both always carry their word$/);
  assert.equal(waived[1].detail, '1 reviewed pair(s)');

  const collapsed = run(['status/warning', 'status/near'], []);
  assert.equal(collapsed.length, 3);
  assert.equal(collapsed.every((finding) => finding.severity === 'FAIL'), true);
});

test('runtime token adapters resolve the first mode, the alpha and bound paints consistently', () => {
  const variables: TokenVariable[] = [{
    id: 'V1', name: 'fgColor/accent', valuesByMode: { mode: { r: 0.2, g: 0.4, b: 0.6, a: 0.5 } },
  }];
  const paint = {
    type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0.5, boundVariables: { color: { id: 'V1' } },
  } satisfies BoundColorPaint & { type: string };
  assert.deepEqual(colorTokenMap(variables), {
    'fgColor/accent': { r: 51, g: 102, b: 153, a: 0.5 },
  });
  assert.deepEqual(resolvePaintColor(paint, variables), { r: 0.2, g: 0.4, b: 0.6, a: 0.25 });
  assert.deepEqual(paintColorInfo(paint, variableIndex(variables), 255), {
    color: { r: 51, g: 102, b: 153, a: 0.25 }, name: 'fgColor/accent',
  });
});

test('harness import is side-effect free and instances do not share state', () => {
  delete runtimeGlobal.figma;
  delete runtimeGlobal.FigmaHarnessPlugin;
  const { createHarness } = require('../src/runtime/harness.ts') as typeof import('../src/runtime/harness.ts');
  assert.equal(runtimeGlobal.figma, undefined);
  assert.equal(runtimeGlobal.FigmaHarnessPlugin, undefined);
  const first = createHarness();
  const second = createHarness();
  assert.notEqual(first.pages, second.pages);
  assert.notEqual(first.store, second.store);
  const [name, original] = first.runtime.COLORS[0];
  const replacement = original === '#123456' ? '#654321' : '#123456';
  const overridden = createHarness({ colorOverrides: { [name]: replacement } });
  assert.equal(overridden.runtime.COLORS.find((token) => token[0] === name)?.[1], replacement);
  assert.equal(first.runtime.COLORS.find((token) => token[0] === name)?.[1], original);
  assert.throws(() => createHarness({ colorOverrides: { 'not/a/token': '#123456' } }), /unknown color override/);
});

test('component signatures ignore allocation order and prototype destination ids', async () => {
  const { createFigmaMock } = require('../src/runtime/figma-mock.ts') as
    typeof import('../src/runtime/figma-mock.ts');
  const { nodeSignature } = require('../src/signatures/signature.ts') as
    typeof import('../src/signatures/signature.ts');

  const signatureAfter = async function (unrelatedNodes: number) {
    const { figma } = createFigmaMock();
    for (var index = 0; index < unrelatedNodes; index++) figma.createFrame();
    const root = figma.createFrame();
    root.name = 'component-boundary';
    root.resize(200, 100);
    const child = figma.createRectangle();
    child.name = 'visual-child';
    child.resize(40, 24);
    root.appendChild(child);
    const destination = figma.createFrame();
    await root.setReactionsAsync([{
      trigger: { type: 'ON_CLICK' },
      actions: [{
        type: 'NODE',
        destinationId: destination.id,
        navigation: 'NAVIGATE',
        transition: null,
      }],
    }]);
    return nodeSignature(root);
  };

  assert.deepEqual(await signatureAfter(0), await signatureAfter(7));
});
