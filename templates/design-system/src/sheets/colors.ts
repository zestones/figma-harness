/* A1 · Colours: every token, and the contrast the audits hold them to. */

import { BADGE_TONES, COLORS, CVD, R as ratio, badge, dim, f as frame, text, type ColorToken } from '../index.ts';
import { colorRow, defineSheet, section, sheet } from './support.ts';

const STATE_WORDS = Object.freeze({ neutral: 'Draft', positive: 'Ready', warning: 'Needs review', critical: 'Failed' });

const rows = async function (parent: FrameNode, width: number, prefixes: readonly string[]): Promise<void> {
  for (const [name, , description] of COLORS) {
    if (prefixes.some((prefix) => name.startsWith(prefix))) {
      parent.appendChild(await colorRow(name as ColorToken, description, width));
    }
  }
};

export const sheetColours = defineSheet({
  code: 'A1', group: 'Colour', title: 'Colours',
  build: async () => {
    const layout = await sheet('A1', 'Colours', 'Components paint with these roles, never with a raw value.');
    const width = Math.floor((layout.w - layout.body.itemSpacing * 2) / 3);
    const surfaces = await section(layout.body, 'Surfaces and text', width);
    await rows(surfaces, width, ['surface/', 'text/']);
    const edges = await section(layout.body, 'Edges, accent and focus', width);
    await rows(edges, width, ['border/', 'accent/', 'focus/']);
    const words = await section(edges, 'A state is a word first', width);
    const badges = await frame({ name: 'badges', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
    for (const tone of BADGE_TONES) badges.appendChild(await badge(STATE_WORDS[tone], tone));
    words.appendChild(badges);
    const measured = await section(edges, 'Measured contrast', width);
    for (const key of Object.keys(CVD.ratios)) {
      const [ink, ground] = key.split(' on ');
      measured.appendChild(await text({ style: 'body/small', text: key + ': ' + ratio(ink, ground), color: 'text/muted', w: width }));
    }
    const states = await section(layout.body, 'States', width);
    await rows(states, width, ['status/']);
    return layout.frame;
  },
});
