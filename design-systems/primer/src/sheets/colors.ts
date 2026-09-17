/* A1–A6 · Colour: every token Primer's light theme installs, grouped as Primer
 * groups them, with the rule each group exists to state. */

import {
  COLORS,
  PRIMER_VERSION,
  STATUS_KINDS,
  chartLegend,
  columnChart,
  dim,
  f as createFrame,
  stateLabel,
  type ColorToken,
} from '../index.ts';
import { colorColumns, defineSheet, ruleRow, sheet } from './support.ts';

const tokens = function (pattern: RegExp): ColorToken[] {
  return COLORS.filter(([name]) => pattern.test(name)).map(([name]) => name as ColorToken);
};

const family = function (role: 'muted' | 'emphasis', prefix: 'bgColor/' | 'borderColor/'): ColorToken[] {
  return STATUS_KINDS.map((kind) => (prefix + kind + '-' + role) as ColorToken);
};

export const sheetA1 = defineSheet({ code: 'A1', group: 'Colour', title: 'Foreground and surfaces', build: async () => {
  const sh = await sheet({
    code: 'A1', title: 'Foreground and surfaces',
    note: 'Primer Primitives ' + PRIMER_VERSION + ', light theme',
    rule: 'Ink and surfaces are Primer\'s, unchanged. Pick the functional token for the role; never a value, never a scale step.',
  });
  const [, right] = await colorColumns(sh.body, sh.w, sh.h, [
    [['Foreground', tokens(/^fgColor\//)]],
    [['Surfaces', ['bgColor/default', 'bgColor/muted', 'bgColor/inset', 'bgColor/disabled', 'bgColor/emphasis', 'bgColor/inverse', 'page/header/bgColor']]],
  ]);
  right.appendChild(await ruleRow(right.width,
    'fgColor/default and fgColor/muted carry text; the family inks carry state words and icons.',
    'fgColor/disabled for anything a reader must read: it is exempt only because the control is.'));
  return sh.frame;
} });

export const sheetA2 = defineSheet({ code: 'A2', group: 'Colour', title: 'Families: backgrounds', build: async () => {
  const sh = await sheet({
    code: 'A2', title: 'Families: backgrounds',
    note: 'Ten families, a tint and an emphasis each',
    rule: 'open, closed and draft alias success, danger and neutral: a state keeps its meaning if the palette changes.',
  });
  const [, right] = await colorColumns(sh.body, sh.w, sh.h, [
    [['Muted: tints for banners and labels', family('muted', 'bgColor/')]],
    [['Emphasis: solid state fills', family('emphasis', 'bgColor/')]],
  ]);
  const labels = await createFrame({ name: 'state-labels', dir: 'H', w: right.width, gap: dim('base/size/8'), wrap: true, rowGap: dim('base/size/8') });
  const statuses: ReadonlyArray<readonly [Parameters<typeof stateLabel>[0]['status'], string]> = [
    ['open', 'Open'], ['done', 'Shipped'], ['closed', 'Rolled back'], ['draft', 'Draft'], ['queued', 'Queued'],
  ];
  for (const [status, text] of statuses) labels.appendChild(await stateLabel({ status, text, size: 'small' }));
  right.appendChild(labels);
  return sh.frame;
} });

export const sheetA3 = defineSheet({ code: 'A3', group: 'Colour', title: 'Borders and focus', build: async () => {
  const sh = await sheet({
    code: 'A3', title: 'Borders and focus',
    note: 'Border tokens stroke; they never fill',
    rule: 'Figma scopes border tokens to strokes, as Primer declares them. A 1 px divider is a stroke, not a filled rectangle.',
  });
  await colorColumns(sh.body, sh.w, sh.h, [
    [
      ['Neutral borders', ['borderColor/default', 'borderColor/muted', 'borderColor/emphasis', 'borderColor/disabled', 'borderColor/translucent']],
      ['Focus', ['focus/outline-color']],
      ['Muted family borders', family('muted', 'borderColor/').slice(0, 5)],
    ],
    [
      ['Muted family borders, continued', family('muted', 'borderColor/').slice(5)],
      ['Emphasis family borders', family('emphasis', 'borderColor/')],
    ],
  ]);
  return sh.frame;
} });

export const sheetA4 = defineSheet({ code: 'A4', group: 'Colour', title: 'Controls', build: async () => {
  const sh = await sheet({
    code: 'A4', title: 'Controls',
    note: 'Fields, choices, tracks and knobs',
    rule: 'A checkbox and a radio are identified by control/borderColor/emphasis (3:1). Fields keep Primer\'s lighter edge and always carry a visible label.',
  });
  await colorColumns(sh.body, sh.w, sh.h, [
    [
      ['Control', tokens(/^control\/(bgColor|fgColor|borderColor|iconColor)\//)],
      ['Transparent and danger controls', tokens(/^control\/(transparent|danger)\//)],
    ],
    [
      ['Checked', tokens(/^control\/checked\//)],
      ['Track', tokens(/^controlTrack\//)],
      ['Knob', tokens(/^controlKnob\//)],
    ],
  ]);
  return sh.frame;
} });

export const sheetA5 = defineSheet({ code: 'A5', group: 'Colour', title: 'Buttons', build: async () => {
  const sh = await sheet({
    code: 'A5', title: 'Buttons',
    note: 'Default, primary, invisible and danger',
    rule: 'One primary button per view. Danger turns solid only on hover and press, so a destructive action is never the loudest thing at rest.',
  });
  await colorColumns(sh.body, sh.w, sh.h, [
    [
      ['Default', tokens(/^button\/default\//)],
      ['Primary', tokens(/^button\/primary\//)],
      ['Counters in buttons', tokens(/^buttonCounter\//)],
    ],
    [
      ['Invisible', tokens(/^button\/invisible\//)],
      ['Danger', tokens(/^button\/danger\//)],
      ['Inactive', tokens(/^button\/inactive\//)],
    ],
  ]);
  return sh.frame;
} });

const SERIES = [
  { label: 'Production', token: 'data/purple/color/emphasis' as ColorToken, values: [4, 5, 3, 6, 5, 7, 4, 6] },
  { label: 'Staging', token: 'data/orange/color/emphasis' as ColorToken, values: [9, 11, 8, 12, 10, 13, 9, 14] },
];

export const sheetA6 = defineSheet({ code: 'A6', group: 'Colour', title: 'Components and data', build: async () => {
  const sh = await sheet({
    code: 'A6', title: 'Components and data',
    note: 'Component roles and chart series',
    rule: 'A data colour is a series, never a state; its name is always printed beside it.',
  });
  const [, right] = await colorColumns(sh.body, sh.w, sh.h, [
    [['Components', tokens(/^(counter|avatar|overlay|tooltip|underlineNav|progressBar|timelineBadge|skeletonLoader)\//)]],
    [['Data series', tokens(/^data\//)]],
  ]);
  const chart = await createFrame({ name: 'data-specimen', dir: 'V', w: right.width, gap: dim('base/size/8') });
  chart.appendChild(await chartLegend(SERIES));
  chart.appendChild(await columnChart({ w: right.width, h: 120, categories: ['W34', 'W35', 'W36', 'W37', 'W38', 'W39', 'W40', 'W41'], series: SERIES }));
  right.appendChild(chart);
  right.appendChild(await ruleRow(right.width,
    'Series stay apart under simulated colour blindness (F7), and a legend names each one.',
    'A status colour in a chart: success and danger are states, not categories.'));
  return sh.frame;
} });
