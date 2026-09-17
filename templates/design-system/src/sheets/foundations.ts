/* F1 · Foundations: text styles, the spacing scale and the motion curves. */

import {
  DIMS,
  MOTION,
  MOTION_NAMES,
  P as tokenPaint,
  TYPE,
  dim,
  f as frame,
  text,
  type TextStyleName,
} from '../index.ts';
import { defineSheet, section, sheet } from './support.ts';

export const sheetFoundations = defineSheet({
  code: 'F1', group: 'Foundations', title: 'Type, space and motion',
  build: async () => {
    const layout = await sheet('F1', 'Type, space and motion', 'Text uses the styles, gaps use the scale, and transitions use these curves.');
    const width = Math.floor((layout.w - layout.body.itemSpacing * 2) / 3);
    const type = await section(layout.body, 'Text styles', width);
    for (const spec of TYPE) {
      const row = await frame({ name: 'type/' + spec.name, dir: 'V', w: width, gap: dim('space/2') });
      row.appendChild(await text({ style: spec.name as TextStyleName, text: spec.description, w: width }));
      row.appendChild(await text({ style: 'body/small', text: spec.name + ' · ' + spec.size + '/' + spec.lineHeight, color: 'text/muted', w: width }));
      type.appendChild(row);
    }
    const space = await section(layout.body, 'Spacing', width);
    const widest = Math.max(...DIMS.filter((token) => token.name.startsWith('space/')).map((token) => token.value));
    for (const token of DIMS) {
      if (!token.name.startsWith('space/')) continue;
      const row = await frame({ name: 'space/' + token.value, dir: 'H', w: width, gap: dim('space/12'), align: 'CENTER' });
      // Bars share one slot, so their labels line up.
      const slot = await frame({ name: 'bar-slot', dir: 'H', w: widest, align: 'CENTER' });
      const bar = figma.createRectangle();
      bar.name = 'bar';
      bar.resize(token.value, 8);
      bar.fills = [tokenPaint('accent/default')];
      slot.appendChild(bar);
      row.appendChild(slot);
      row.appendChild(await text({
        style: 'body/small', text: token.name + ' · ' + token.value + ' px', color: 'text/muted', w: width - widest - row.itemSpacing,
      }));
      space.appendChild(row);
    }
    const motion = await section(layout.body, 'Motion', width);
    for (const name of MOTION_NAMES) {
      const spec = MOTION[name];
      motion.appendChild(await text({
        style: 'body/small', color: 'text/muted', w: width,
        text: name + ' · ' + spec.duration + ' ms · cubic-bezier(' + spec.bezier.join(', ') + ') · ' + spec.use,
      }));
    }
    return layout.frame;
  },
});
