/* C1 · Components: every component in each of its states. */

import {
  BADGE_TONES,
  BUTTON_STATES,
  badge,
  button,
  card,
  dim,
  f as frame,
  listRow,
  text,
} from '../index.ts';
import { defineSheet, section, sheet } from './support.ts';

export const sheetComponents = defineSheet({
  code: 'C1', group: 'Components', title: 'Components',
  build: async () => {
    const layout = await sheet('C1', 'Components', 'Screens are made of these. A missing component is added here first.');
    const width = Math.floor((layout.w - layout.body.itemSpacing) / 2);
    const buttons = await section(layout.body, 'Button · rest, hover, focus, disabled', width);
    for (const variant of ['primary', 'secondary'] as const) {
      const row = await frame({ name: 'row/' + variant, dir: 'H', w: width, gap: dim('space/16'), align: 'CENTER' });
      for (const state of BUTTON_STATES) row.appendChild(await button({ label: 'Save', variant, state }));
      buttons.appendChild(row);
    }
    buttons.appendChild(await text({
      style: 'body/small', color: 'text/muted', w: width,
      text: 'Focus draws a 2 px outline 2 px outside the button; the button itself does not change.',
    }));
    const badges = await section(buttons, 'Badge', width);
    const tones = await frame({ name: 'badges', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
    for (const tone of BADGE_TONES) tones.appendChild(await badge(tone.charAt(0).toUpperCase() + tone.slice(1), tone));
    badges.appendChild(tones);
    const cards = await section(layout.body, 'Card and ListRow', width);
    cards.appendChild(await card({
      w: width,
      title: 'Card',
      rows: [
        await listRow({ label: 'A row', detail: 'With its detail', w: width, badge: { label: 'Ready', tone: 'positive' } }),
        await listRow({ label: 'Another row', detail: 'Rows after the first draw a divider', w: width, divider: true }),
        await listRow({
          label: 'A very long label that does not fit is cut with an ellipsis, never wrapped',
          detail: 'The detail is cut the same way when it runs out of room', w: width, divider: true,
          badge: { label: 'Failed', tone: 'critical' },
        }),
      ],
    }));
    return layout.frame;
  },
});
