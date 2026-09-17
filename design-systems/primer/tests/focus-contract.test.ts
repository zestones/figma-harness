import assert from 'node:assert/strict';
import test from 'node:test';
import { createHarness, type Harness } from '@figma-harness/harness/runtime/harness.ts';
import { controlFocus } from '@figma-harness/harness/accessibility/a11y/tree/focus.ts';
import { inspectRadii } from '@figma-harness/harness/runtime/rules/radius-scale.ts';
import { paintTokenName } from '@figma-harness/harness/color/core/token-values.ts';
import type { MockNode } from '@figma-harness/harness/runtime/figma-mock/types.ts';
import type { AddFinding, ContractTreeHarness } from '@figma-harness/harness/accessibility/a11y/tree/types.ts';

const buildFocusSpecimens = async (harness: Harness) => {
  await harness.runtime.loadFonts();
  await harness.runtime.ensureTokens();
  await harness.runtime.BUILDERS['system']();
  await harness.runtime.BUILDERS['states']();
  return harness.pages;
};

const failures = async (harness: Harness): Promise<string[]> => {
  const result: string[] = [];
  const add: AddFinding = (severity, _rule, subject, detail) => {
    if (severity === 'FAIL') result.push(subject + ': ' + detail);
  };
  await controlFocus(harness as unknown as ContractTreeHarness, add);
  return result;
};

test('generated focus outlines sit where Primer places them, and keep each control intact', async () => {
  const harness = createHarness();
  const pages = await buildFocusSpecimens(harness);
  assert.deepEqual(await failures(harness), []);
  const focus = harness.runtime.CONTRACT.designSystem.focus;
  const controls = pages.flatMap(page => page.findAll(node => node.getPluginData('spec.focus') === 'visible'));
  const placements = new Set(controls.map(node => node.getPluginData(focus.placementKey)));
  assert.deepEqual([...placements].sort(), ['edge', 'flush', 'inset', 'outset', 'toggle']);
  for (const control of controls) {
    const extent = focus.offsets[control.getPluginData(focus.placementKey)] + focus.width;
    const ring = control.children.find(node => node.name === 'focus-ring');
    assert.ok(ring, control.name + ' has no ring');
    assert.equal(ring.strokeWeight, 2);
    assert.equal(ring.strokeAlign, 'INSIDE');
    assert.equal(ring.x, -extent, control.name);
    assert.equal(ring.width, control.width + extent * 2, control.name);
    assert.equal(paintTokenName(ring.strokes[0], harness.vars), 'focus/outline-color');
  }

  const system = pages.find(page => page.name === '02 · Design system');
  const sheet = (name: string): MockNode => {
    const found = system?.children.find(node => node.name === name);
    assert.ok(found, 'missing sheet ' + name);
    return found;
  };
  const buttons = sheet('C1 · Buttons').findAll(node => node.getPluginData('spec.focus') === 'visible');
  const primary = buttons.find(node => node.getPluginData('spec.button.variant') === 'primary');
  assert.ok(primary);
  const band = primary.children.find(node => node.name === 'focus-band');
  assert.ok(band, 'the primary button keeps Primer\'s white band under its outline');
  assert.equal(band.strokeWeight, 3);
  assert.equal(paintTokenName(band.strokes[0], harness.vars), 'fgColor/onEmphasis');
  assert.equal(primary.children.indexOf(band) < primary.children.findIndex(node => node.name === 'focus-ring'), true);

  const forms = sheet('C3 · Form controls').findAll(node => node.getPluginData('spec.focus') === 'visible');
  const radio = forms.find(node => node.name === 'radio');
  const checkbox = forms.find(node => node.name === 'checkbox');
  const toggle = forms.find(node => node.name === 'toggle-switch');
  const input = forms.find(node => node.name === 'text-input');
  const segment = forms.find(node => node.name.startsWith('segment/'));
  assert.ok(radio && checkbox && toggle && input && segment);
  assert.equal(radio.strokeWeight, 4, 'a focused radio keeps its checked ring');
  assert.equal(paintTokenName(radio.strokes[0], harness.vars), 'control/checked/borderColor/rest');
  assert.equal(checkbox.getPluginData(focus.placementKey), 'outset');
  assert.ok(toggle.children.some(node => node.name === 'toggle-knob'));
  assert.equal(paintTokenName(input.strokes[0], harness.vars), 'borderColor/accent-emphasis');
  assert.equal(input.getPluginData(focus.restEdgeKey), 'control/borderColor/rest');
  assert.equal(segment.getPluginData(focus.placementKey), 'edge');
  assert.equal(inspectRadii(pages, harness.runtime.CONTRACT).issues.size, 0);
  assert.equal(pages[2].name, '03 · Design lab');
});

test('focus audits reject moved, clipped, hidden, recoloured, missing and unmeasurable outlines', async () => {
  const harness = createHarness();
  const pages = await buildFocusSpecimens(harness);
  const forms = pages[1].children.find(node => node.name === 'C3 · Form controls');
  const control = forms?.findOne(node => node.name === 'checkbox' && node.getPluginData('spec.focus') === 'visible');
  assert.ok(control);
  const ring = control.children.find(node => node.name === 'focus-ring');
  assert.ok(ring);
  const has = async (pattern: RegExp): Promise<boolean> => (await failures(harness)).some(message => pattern.test(message));
  assert.deepEqual(await failures(harness), []);

  ring.visible = false;
  assert.ok(await has(/hidden/));
  ring.visible = true;
  ring.x = -3;
  assert.ok(await has(/where its placement puts it/));
  assert.ok(inspectRadii(pages, harness.runtime.CONTRACT).issues.size > 0, 'a moved outline loses its radius exemption');
  ring.x = -4;
  control.clipsContent = true;
  assert.ok(await has(/clips its outline/));
  control.clipsContent = false;
  // The specimen checkbox opens its row, so a clipping row cuts its outline.
  const clip = control.parent;
  assert.ok(clip && clip.children[0] === control);
  const clippedBefore = clip.clipsContent;
  clip.clipsContent = true;
  assert.ok(await has(/clipped by/));
  clip.clipsContent = clippedBefore;
  const strokes = ring.strokes;
  ring.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  assert.ok(await has(/must bind focus\/outline-color/));
  ring.strokes = strokes;
  ring.cornerRadius = Number(ring.cornerRadius) + 1;
  assert.ok(inspectRadii(pages, harness.runtime.CONTRACT).issues.size > 0);
  ring.cornerRadius -= 1;
  ring.name = 'renamed-outline';
  assert.ok(await has(/exactly one/));
  ring.name = 'focus-ring';
  const placement = control.getPluginData('spec.focus.placement');
  control.setPluginData('spec.focus.placement', 'sideways');
  assert.ok(await has(/no known focus placement/));
  control.setPluginData('spec.focus.placement', placement);
  const token = harness.vars.find(variable => variable.name === 'focus/outline-color');
  assert.ok(token);
  const original = { ...token.valuesByMode };
  for (const mode of Object.keys(original)) token.setValueForMode(mode, { r: 1, g: 1, b: 1, a: 1 });
  assert.ok(await has(/falls to/));
  for (const [mode, value] of Object.entries(original)) token.setValueForMode(mode, value);
  assert.deepEqual(await failures(harness), []);
});
