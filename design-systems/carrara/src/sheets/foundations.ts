/* F1 · Typography, F2 · Space, shape and depth, F3 · Icons, motion and focus. */

import {
  DIMS,
  ELEVATION,
  FOCUS,
  ICON_NAMES,
  MOTION,
  MOTION_NAMES,
  P as tokenPaint,
  RADII,
  TYPE,
  abs,
  button,
  dim,
  f as frame,
  icon,
  text,
  type ColorToken,
  type TextStyleName,
} from '../index.ts';
import { column, columnWidth, defineSheet, note, section, sheet, stage } from './support.ts';

const SAMPLES: Readonly<Record<string, string>> = Object.freeze({
  'display/lg': '$2,400.00',
  'display/md': '$1,284,390',
  'title/page': 'Payments',
  'title/dialog': 'Refund this payment?',
  'title/card': 'Revenue over time',
  'body/md': 'Payouts arrive two business days after a charge.',
  'body/md-medium': 'Export report',
  'body/md-strong': 'Brightline Studio',
  'body/sm': 'Updated 4 minutes ago',
  'body/sm-medium': 'Amount',
  'label/overline': 'WORKSPACE',
  'mono/sm': 'pay_3Qx7L2m9ZkT4',
});

export const sheetTypography = defineSheet({
  code: 'F1', group: 'Foundations', title: 'Typography',
  build: async () => {
    const layout = await sheet('F1', 'Typography', 'Inter for the interface and JetBrains Mono for identifiers. Every text uses one of these styles.');
    const width = layout.w;
    const list = await stage(layout.body, width, 'type-scale');
    for (const [index, spec] of TYPE.entries()) {
      const line = await frame({
        name: 'type/' + spec.name, dir: 'H', w: width - 40, gap: dim('space/24'), align: 'CENTER',
        pad: [dim('space/12'), 0, dim('space/12'), 0], stroke: index ? 'border/default' : null, strokeSide: 'Top', strokeW: 1,
      });
      const meta = await frame({ name: 'type-meta', dir: 'V', w: 280, gap: dim('space/2') });
      meta.appendChild(await text({ style: 'body/md-strong', text: spec.name, w: 280 }));
      meta.appendChild(await text({
        style: 'body/sm', color: 'text/tertiary', w: 280,
        text: spec.family + ' ' + spec.style + ' · ' + spec.size + '/' + spec.lineHeight,
      }));
      line.appendChild(meta);
      const room = width - 40 - 280 - 24 - 360 - 24;
      line.appendChild(await text({ style: spec.name as TextStyleName, text: SAMPLES[spec.name] || spec.name, w: room, truncate: true }));
      line.appendChild(await text({ style: 'body/sm', text: spec.description, color: 'text/tertiary', w: 360 }));
      list.appendChild(line);
    }
    return layout.frame;
  },
});

/* A 1440 × 1024 screen drawn to scale: the sidebar, the top bar, a row of
   figures, a chart beside a narrower card, and a table. */
const layoutDiagram = async function (width: number): Promise<FrameNode> {
  const scale = width / 1440;
  const px = (value: number): number => Math.round(value * scale);
  const board = await frame({
    name: 'layout-diagram', w: width, h: px(1024), radius: dim('radius/md'), fill: 'bg/canvas',
    stroke: 'border/default', strokeW: 1, clip: true,
  });
  const block = async function (name: string, x: number, y: number, w: number, h: number, fill: ColorToken): Promise<void> {
    const node = await frame({
      name: 'diagram/' + name, w, h, radius: fill === 'bg/surface' ? dim('radius/xs') : 0, fill,
      stroke: fill === 'bg/surface' ? 'border/default' : null, strokeW: 1,
    });
    abs(board, node, x, y);
  };
  const side = px(dim('sidebar/width').value);
  const bar = px(dim('topbar/height').value);
  const pad = px(dim('space/32').value);
  const gap = px(dim('space/24').value);
  await block('sidebar', 0, 0, side, px(1024), 'bg/inverse');
  await block('topbar', side, 0, width - side, bar, 'bg/surface');
  const left = side + pad;
  const room = width - left - pad;
  let y = bar + pad + px(56);
  const figure = Math.floor((room - gap * 3) / 4);
  for (let index = 0; index < 4; index++) await block('figure', left + index * (figure + gap), y, figure, px(128), 'bg/surface');
  y += px(128) + gap;
  const narrow = px(360);
  await block('chart', left, y, room - narrow - gap, px(320), 'bg/surface');
  await block('card', left + room - narrow, y, narrow, px(320), 'bg/surface');
  y += px(320) + gap;
  await block('table', left, y, room, px(1024) - y, 'bg/surface');
  board.setPluginData('aria.role', 'img');
  board.setPluginData('aria.accessible-name', 'The layout of a screen');
  return board;
};

export const sheetLayout = defineSheet({
  code: 'F2', group: 'Foundations', title: 'Space, shape and depth',
  build: async () => {
    const layout = await sheet('F2', 'Space, shape and depth', 'Gaps and paddings come from the spacing scale, corners from the radius scale, and height from four shadows that always come with a border.');
    const width = columnWidth(layout, 3);
    const first = await column(layout.body, width);
    const spacing = await stage(await section(first, 'Spacing', width), width);
    const widest = 64;
    for (const token of DIMS) {
      if (!token.name.startsWith('space/')) continue;
      const line = await frame({ name: token.name, dir: 'H', w: width - 40, gap: dim('space/16'), align: 'CENTER' });
      const slot = await frame({ name: 'bar-slot', dir: 'H', w: widest, align: 'CENTER' });
      const bar = figma.createRectangle();
      bar.name = 'bar';
      bar.resize(token.value, 12);
      bar.fills = [tokenPaint('accent/solid')];
      slot.appendChild(bar);
      line.appendChild(slot);
      line.appendChild(await text({ style: 'body/md', text: token.name + ' · ' + token.value + ' px', color: 'text/secondary' }));
      spacing.appendChild(line);
    }

    const second = await column(layout.body, width);
    const radii = await stage(await section(second, 'Corners', width), width);
    for (const [key, value] of Object.entries(RADII)) {
      const line = await frame({ name: 'radius/' + key, dir: 'H', w: width - 40, gap: dim('space/16'), align: 'CENTER' });
      line.appendChild(await frame({
        name: 'radius-sample', w: 48, h: 48, radius: dim(('radius/' + key) as 'radius/lg'),
        fill: 'accent/subtle', stroke: 'accent/solid', strokeW: 1,
      }));
      line.appendChild(await text({
        style: 'body/md', color: 'text/secondary',
        text: 'radius/' + key + ' · ' + (value > 100 ? 'full' : value + ' px'),
      }));
      radii.appendChild(line);
    }
    const sizes = await stage(await section(second, 'Fixed sizes', width), width);
    for (const token of DIMS) {
      if (!/^(control|sidebar|topbar|dialog)\//.test(token.name)) continue;
      sizes.appendChild(await text({
        style: 'body/md', color: 'text/secondary', w: width - 40,
        text: token.name + ' · ' + token.value + ' px · ' + token.description,
      }));
    }

    const third = await column(layout.body, width);
    const depth = await section(third, 'Shadows', width, 'A shadow only suggests height; the border draws the edge.');
    for (const style of ELEVATION) {
      const tile = await frame({
        name: 'elevation/' + style.name, dir: 'V', w: width, gap: dim('space/2'), pad: dim('space/20'),
        radius: dim('radius/lg'), fill: 'bg/surface', stroke: 'border/default', strokeW: 1, elevation: style.name,
      });
      tile.appendChild(await text({ style: 'body/md-strong', text: style.name }));
      tile.appendChild(await text({ style: 'body/sm', text: style.description, color: 'text/tertiary' }));
      depth.appendChild(tile);
    }
    const page = await section(third, 'Page layout', width, 'Every screen, at 1440 px: the sidebar, the top bar, and content padded by space/32 with space/24 between cards.');
    page.appendChild(await layoutDiagram(width));
    page.appendChild(await note('Below 1024 px the sidebar folds into the top bar, the padding drops to space/16, and rows of cards stack.', width));
    return layout.frame;
  },
});

export const sheetIcons = defineSheet({
  code: 'F3', group: 'Foundations', title: 'Icons, motion and focus',
  build: async () => {
    const layout = await sheet('F3', 'Icons, motion and focus', 'Solid Heroicons on 20 and 16 px grids, the three transitions the prototype may use, and the focus outline.');
    const wide = columnWidth(layout, 3) * 2 + layout.body.itemSpacing;
    const first = await column(layout.body, wide);
    const grid = await stage(await section(first, 'Icons', wide, 'Drawn from their own grid, filled from a colour role, never stroked.'), wide);
    const perRow = 4;
    const cell = Math.floor((wide - 40 - dim('space/8').value * (perRow - 1)) / perRow);
    for (let start = 0; start < ICON_NAMES.length; start += perRow) {
      const line = await frame({ name: 'icon-row', dir: 'H', w: wide - 40, gap: dim('space/8') });
      for (const name of ICON_NAMES.slice(start, start + perRow)) {
        const tile = await frame({ name: 'icon-cell', dir: 'H', w: cell, gap: dim('space/8'), align: 'CENTER', pad: [dim('space/4'), 0, dim('space/4'), 0] });
        tile.appendChild(icon(name, 'text/primary', 20));
        tile.appendChild(icon(name, 'text/secondary', 16));
        tile.appendChild(await text({ style: 'body/sm', text: name, color: 'text/tertiary', w: cell - 52, truncate: true }));
        line.appendChild(tile);
      }
      grid.appendChild(line);
    }

    const width = columnWidth(layout, 3);
    const second = await column(layout.body, width);
    const motion = await stage(await section(second, 'Motion', width), width);
    for (const name of MOTION_NAMES) {
      const spec = MOTION[name];
      const line = await frame({ name: 'motion/' + name, dir: 'V', w: width - 40, gap: dim('space/2') });
      line.appendChild(await text({ style: 'body/md-strong', text: name + ' · ' + spec.duration + ' ms' }));
      line.appendChild(await text({ style: 'mono/sm', text: 'cubic-bezier(' + spec.bezier.join(', ') + ')', color: 'text/secondary' }));
      line.appendChild(await text({ style: 'body/sm', text: spec.use, color: 'text/tertiary', w: width - 40 }));
      motion.appendChild(line);
    }
    motion.appendChild(await note('Moving between pages is instant; only dialogs and changes in place animate.', width - 40));
    const focus = await stage(await section(second, 'Focus', width), width);
    const specimen = await frame({ name: 'focus-specimen', dir: 'H', gap: dim('space/24'), align: 'CENTER', pad: dim('space/8') });
    specimen.appendChild(await button({ label: 'Export', icon: 'arrow-down-tray', state: 'focus' }));
    specimen.appendChild(await button({ label: 'Refund', variant: 'primary', state: 'focus' }));
    focus.appendChild(specimen);
    focus.appendChild(await note(
      'A ' + FOCUS.width + ' px ' + FOCUS.token + ' outline, ' + FOCUS.offsets.outset + ' px outside the control. It reaches 3:1 on every surface, the sidebar included.',
      width - 40,
    ));
    return layout.frame;
  },
});
