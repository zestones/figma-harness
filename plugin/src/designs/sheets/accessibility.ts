/* F7 · Accessibility: focus placements, measured ratios, reviewed exceptions
 * and simulated colour-vision deficiency. */

import {
  CVD,
  FOCUS_OFFSETS,
  R as ratioLabel,
  actionListItem,
  button,
  checkbox,
  cols,
  dim,
  f as createFrame,
  solid,
  t as createText,
  textInput,
  toggleSwitch,
  type FocusPlacement,
} from '../../kit/public.ts';
import { block, caption, defineSheet, ruleRow, sheet } from './support.ts';

const focusSpecimen = async function (
  placement: FocusPlacement,
  control: FrameNode,
  note: string,
  width: number,
): Promise<FrameNode> {
  const cell = await createFrame({ name: 'focus/' + placement, dir: 'V', w: width, gap: dim('base/size/8') });
  const stage = await createFrame({
    name: 'focus-stage', dir: 'H', w: width, h: 64, justify: 'CENTER', align: 'CENTER',
    radius: dim('borderRadius/medium'), stroke: 'borderColor/muted', strokeW: 1,
  });
  stage.appendChild(control);
  cell.appendChild(stage);
  cell.appendChild(await createText({
    style: 'body/medium-600', w: width,
    text: placement + ' · outline-offset ' + FOCUS_OFFSETS[placement] + ' px',
  }));
  cell.appendChild(await caption(note, width));
  return cell;
};

const QUOTED: ReadonlyArray<readonly [string, string, string]> = [
  ['fgColor/default', 'bgColor/default', 'body text'],
  ['fgColor/muted', 'bgColor/default', 'secondary text'],
  ['fgColor/muted', 'bgColor/muted', 'secondary text on muted'],
  ['fgColor/link', 'bgColor/default', 'links'],
  ['button/primary/fgColor/rest', 'button/primary/bgColor/rest', 'primary button label'],
  ['focus/outline-color', 'bgColor/default', 'focus outline on the page'],
  ['focus/outline-color', 'button/default/bgColor/rest', 'focus outline on a default button'],
  ['focus/outline-color', 'fgColor/onEmphasis', 'focus outline over the primary band'],
  ['control/borderColor/emphasis', 'bgColor/default', 'checkbox and radio edge'],
  ['control/borderColor/rest', 'bgColor/default', 'text input edge · waived'],
  ['underlineNav/borderColor/active', 'bgColor/default', 'current tab underline · waived'],
];

export const sheetF7 = defineSheet({ code: 'F7', group: 'Foundations', title: 'Accessibility', build: async () => {
  const sh = await sheet({
    code: 'F7', title: 'Accessibility',
    note: 'Measured on the rendered tree, not on a list of hopes',
    rule: 'Every text is measured against the surface behind it, every outline against what it covers, and every waiver is printed in the audit.',
  });
  const width = Math.floor((sh.w - 5 * 16) / 6);
  const focus = await block({ w: sh.w, title: 'Focus outlines', note: 'where Primer draws them', dir: 'H', gap: 16 });
  focus.body.appendChild(await focusSpecimen('inset',
    await button({ label: 'Default', state: 'focus' }), 'Buttons: over their own edge.', width));
  focus.body.appendChild(await focusSpecimen('inset',
    await button({ label: 'Primary', variant: 'primary', state: 'focus' }), 'Primary adds a 3 px white band under it.', width));
  focus.body.appendChild(await focusSpecimen('edge',
    await textInput({ w: width - 32, placeholder: 'Search', accessibleName: 'Search', focused: true }), 'Fields: across the accent border.', width));
  focus.body.appendChild(await focusSpecimen('flush',
    await actionListItem({ label: 'Settings', leadingVisual: 'gear', state: 'focus' }, width - 16), 'List items: against their edge.', width));
  focus.body.appendChild(await focusSpecimen('outset',
    await checkbox({ checked: true, focused: true }), 'Choices and links: 2 px of ground between.', width));
  focus.body.appendChild(await focusSpecimen('toggle',
    await toggleSwitch({ label: 'Automatic rollback', on: true, focused: true }), 'The switch: 3 px of ground between.', width));
  sh.body.appendChild(focus.frame);

  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'a11y', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const ratios = await block({ w: left, title: 'Quoted ratios', note: 'generated from the tokens', gap: 2 });
  for (const [ink, ground, purpose] of QUOTED) {
    const line = await createFrame({ name: 'ratio/' + purpose, dir: 'H', w: left, gap: dim('base/size/8'), align: 'CENTER' });
    line.appendChild(await createText({ style: 'code/small', text: ratioLabel(ink, ground), w: 64 }));
    line.appendChild(await caption(purpose, left - 72));
    ratios.body.appendChild(line);
  }
  row.appendChild(ratios.frame);

  const waivers = await block({ w: middle, title: 'Reviewed exceptions', note: 'reported, never hidden', gap: 12 });
  waivers.body.appendChild(await ruleRow(middle,
    'Text inputs keep Primer\'s 1.39:1 edge; a visible label always names the field.'));
  waivers.body.appendChild(await ruleRow(middle,
    'The current tab underline is 2.29:1; the tab is also semibold and marked aria-current.'));
  waivers.body.appendChild(await ruleRow(middle,
    'Switch and segmented tracks are light; the switch states On or Off, the selected segment is raised and semibold.'));
  waivers.body.appendChild(await ruleRow(middle,
    'State fills meet under simulated deficiency; each carries its Octicon and its word.'));
  row.appendChild(waivers.frame);

  const vision = await block({ w: right, title: 'Simulated vision', note: 'normal · protan · deutan · tritan', gap: 4 });
  const kinds = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'] as const;
  const table = CVD as unknown as Record<string, Record<string, string>>;
  for (const token of Object.keys(table['normal'])) {
    const line = await createFrame({ name: 'cvd/' + token, dir: 'H', w: right, gap: dim('base/size/4'), align: 'CENTER' });
    for (const kind of kinds) {
      const swatch = await createFrame({ name: 'cvd-swatch', w: 28, h: 16, radius: dim('borderRadius/small'), fill: [solid(table[kind][token])] });
      line.appendChild(swatch);
    }
    line.appendChild(await createText({ style: 'code/small', text: token, color: 'fgColor/muted', w: right - 4 * 32, truncate: true }));
    vision.body.appendChild(line);
  }
  row.appendChild(vision.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });
