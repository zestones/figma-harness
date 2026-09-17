/* A1 · Colours and A2 · States and contrast. */

import {
  BADGE_TONES,
  COLORS,
  CVD,
  R as ratio,
  badge,
  dim,
  f as frame,
  solid,
  text,
  trend,
  type ColorToken,
} from '../index.ts';
import { colorRow, column, columnWidth, defineSheet, note, row, section, sheet, stage } from './support.ts';

const rows = async function (parent: FrameNode, width: number, prefixes: readonly string[]): Promise<void> {
  for (const [name] of COLORS) {
    if (prefixes.some((prefix) => name.startsWith(prefix))) parent.appendChild(await colorRow(name as ColorToken, width));
  }
};

export const sheetColours = defineSheet({
  code: 'A1', group: 'Colour', title: 'Colours',
  build: async () => {
    const layout = await sheet('A1', 'Colours', 'Components paint with these roles, never with a raw value. The chip shows where a role may be painted: a fill, an edge, or a shape.');
    const width = columnWidth(layout, 3);
    const first = await column(layout.body, width);
    await rows(await section(first, 'Surfaces', width), width, ['bg/']);
    await rows(await section(first, 'Text', width), width, ['text/']);
    const second = await column(layout.body, width);
    await rows(await section(second, 'Edges and controls', width), width, ['border/', 'control/', 'focus/']);
    await rows(await section(second, 'Accent', width), width, ['accent/']);
    await rows(await section(second, 'Charts', width), width, ['chart/']);
    const third = await column(layout.body, width);
    await rows(await section(third, 'States', width, 'Every state is also a word, so colour never carries it alone.'), width, ['status/']);
    return layout.frame;
  },
});

const STATE_WORDS: Readonly<Record<string, string>> = Object.freeze({
  neutral: 'Refunded', accent: 'Processing', positive: 'Succeeded', warning: 'Needs response', critical: 'Failed',
});

const VISIONS = ['normal', 'protanopia', 'deuteranopia', 'tritanopia'] as const;

export const sheetStates = defineSheet({
  code: 'A2', group: 'Colour', title: 'States and contrast',
  build: async () => {
    const layout = await sheet('A2', 'States and contrast', 'How a state reads, what the audits measure, and how the state colours look to readers with colour-vision deficiency.');
    const width = columnWidth(layout, 3);
    const first = await column(layout.body, width);
    const words = await stage(await section(first, 'A state is a word first', width), width);
    for (const tone of BADGE_TONES) {
      const line = await row('badges/' + tone);
      line.appendChild(await badge({ label: STATE_WORDS[tone], tone }));
      line.appendChild(await badge({ label: STATE_WORDS[tone], tone, dot: true }));
      words.appendChild(line);
    }
    const changes = await row('trends');
    changes.appendChild(await trend({ value: '+12.4%', direction: 'up' }));
    changes.appendChild(await trend({ value: '−3.1%', direction: 'down' }));
    changes.appendChild(await trend({ value: '−0.04 pts', direction: 'down', good: true }));
    words.appendChild(changes);
    words.appendChild(await note('A falling dispute rate is good news: a trend is coloured by what it means, not by its direction.', width - 40));

    const second = await column(layout.body, width);
    const measured = await section(second, 'Measured contrast', width, 'Ratios computed from the tokens on every build; the audits fail below 4.5:1 for text and 3:1 for edges.');
    for (const key of Object.keys(CVD.ratios)) {
      const [ink, ground] = key.split(' on ');
      const line = await frame({ name: 'ratio/' + key, dir: 'H', w: width, gap: dim('space/12').value, align: 'CENTER', justify: 'SPACE_BETWEEN' });
      const value = await text({ style: 'body/md-strong', text: ratio(ink, ground) });
      line.appendChild(await text({ style: 'body/md', text: ink + ' on ' + ground, color: 'text/secondary', maxW: width - value.width - 12 }));
      line.appendChild(value);
      measured.appendChild(line);
    }

    const third = await column(layout.body, width);
    const vision = await section(third, 'Colour-vision check', width, 'The state colours and the comparison series, simulated. Neighbours stay at least 12 ΔE apart.');
    const table = CVD as unknown as Record<string, Record<string, string>>;
    const tokens = Object.keys(table['normal']);
    for (const kind of VISIONS) {
      const line = await frame({ name: 'vision/' + kind, dir: 'H', w: width, gap: dim('space/8'), align: 'CENTER' });
      line.appendChild(await text({ style: 'body/md', text: kind.charAt(0).toUpperCase() + kind.slice(1), color: 'text/secondary', w: 112, truncate: true }));
      for (const token of tokens) {
        const swatch = await frame({ name: 'cvd-swatch', w: 40, h: 24, radius: dim('radius/sm'), fill: [solid(table[kind][token])] });
        line.appendChild(swatch);
      }
      vision.appendChild(line);
    }
    vision.appendChild(await note('Columns, left to right: ' + tokens.join(', ') + '.', width));
    return layout.frame;
  },
});
