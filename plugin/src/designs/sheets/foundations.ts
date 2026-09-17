/* F1–F6 · Foundations: type, size, shadows, layout, motion and icons. */

import {
  BREAKPOINTS,
  CONTROL_SIZES,
  DIMS,
  ELEVATION,
  FONT_FAMILIES,
  ICONS,
  MOTION_DURATIONS,
  MOTION_DURATION_ORDER,
  MOTION_EASINGS,
  MOTION_EASING_ORDER,
  MOTION_TRANSITIONS,
  MOTION_TRANSITION_ORDER,
  OCTICONS_VERSION,
  RADII,
  SHELL_DIMENSIONS,
  STACK,
  TYPE,
  cols,
  dim,
  f as createFrame,
  glyph,
  icon,
  span,
  t as createText,
  type IconName,
  type TextStyleName,
} from '../../kit/public.ts';
import { block, caption, defineSheet, ruleRow, sheet } from './support.ts';

export const sheetF1 = defineSheet({ code: 'F1', group: 'Foundations', title: 'Typography', build: async () => {
  const sh = await sheet({
    code: 'F1', title: 'Typography',
    note: FONT_FAMILIES.sans + ' and ' + FONT_FAMILIES.mono + ' on Primer\'s scale',
    rule: 'Primer\'s roles, not sizes: a page picks title, body or caption, and a weight only through a declared style.',
  });
  const [left, right] = span(sh.w, [7, 5], 32);
  const row = await createFrame({ name: 'type', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const ramp = await createFrame({ name: 'ramp', dir: 'V', w: left, gap: dim('base/size/4') });
  for (const spec of TYPE) {
    const line = await createFrame({ name: 'type/' + spec.name, dir: 'H', w: left, gap: dim('base/size/16'), align: 'CENTER' });
    line.appendChild(await createText({ style: 'code/small', text: spec.name, w: 140, truncate: true }));
    line.appendChild(await createText({
      style: 'code/small', color: 'fgColor/muted', w: 100, truncate: true,
      text: spec.size + '/' + spec.lineHeight + ' ' + spec.weight,
    }));
    line.appendChild(await createText({
      style: spec.name as TextStyleName,
      text: spec.family === FONT_FAMILIES.mono ? 'v4.12.0 · 3f9a2c1' : 'Ship the release',
      w: left - 272, truncate: true,
    }));
    ramp.appendChild(line);
  }
  row.appendChild(ramp);
  const notes = await createFrame({ name: 'type/notes', dir: 'V', w: right, gap: dim('stack/gap/normal') });
  notes.appendChild(await ruleRow(right,
    'title/medium names a page; its 32.5 px line matches a medium control, so actions centre on it.',
    'display inside the product: Primer keeps it for brand-to-product transitions.'));
  notes.appendChild(await ruleRow(right,
    'Noto Sans is the first member of Primer\'s stack that every Figma install has, so every reviewer sees the same wrap.',
    'SF Pro or Mona Sans in a shared file: a reviewer without them sees another font\'s metrics.'));
  notes.appendChild(await ruleRow(right,
    'label/small and label/small-600 sit on a 12 px line inside fixed-height pills, as Primer\'s CSS sets them.'));
  row.appendChild(notes);
  sh.body.appendChild(row);
  return sh.frame;
} });

const bar = async function (label: string, value: number, width: number, scale = 1): Promise<FrameNode> {
  const line = await createFrame({ name: 'size/' + label, dir: 'H', w: width, h: 20, gap: dim('base/size/8'), align: 'CENTER' });
  line.appendChild(await createText({ style: 'code/small', text: label, w: 200, truncate: true }));
  line.appendChild(await createFrame({
    name: 'size-bar', w: Math.max(1, Math.min(width - 260, value * scale)), h: 8,
    radius: dim('borderRadius/small'), fill: 'bgColor/accent-emphasis',
  }));
  line.appendChild(await createText({ style: 'code/small', text: String(value), color: 'fgColor/muted' }));
  return line;
};

export const sheetF2 = defineSheet({ code: 'F2', group: 'Foundations', title: 'Size and space', build: async () => {
  const sh = await sheet({
    code: 'F2', title: 'Size and space',
    note: 'Every size is a Primer variable, bound natively',
    rule: 'Gaps and paddings come from the base size scale; control heights from the control sizes. A number between them is a bug.',
  });
  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'sizes', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const scale = await block({ w: left, title: 'Base size scale', note: 'gaps and paddings', gap: 4 });
  for (const token of DIMS.filter((entry) => entry.name.startsWith('base/size/'))) {
    scale.body.appendChild(await bar(token.name, token.value, left, 2));
  }
  row.appendChild(scale.frame);

  const controls = await block({ w: middle, title: 'Controls and stacks', gap: 4 });
  for (const [name, value] of Object.entries(CONTROL_SIZES)) controls.body.appendChild(await bar('control/' + name, value, middle, 3));
  for (const [name, value] of Object.entries(STACK)) controls.body.appendChild(await bar('stack/gap/' + name, value, middle, 3));
  controls.body.appendChild(await bar('app/pane/width', SHELL_DIMENSIONS.pane, middle, 0.4));
  controls.body.appendChild(await bar('app/content/maxWidth', SHELL_DIMENSIONS.contentMax, middle, 0.1));
  row.appendChild(controls.frame);

  const corners = await block({ w: right, title: 'Radius', note: 'small · medium · large · full', dir: 'H', gap: 16, wrap: true, rowGap: 16 });
  for (const [name, value] of Object.entries(RADII)) {
    const specimen = await createFrame({ name: 'radius/' + name, dir: 'V', gap: dim('base/size/4'), align: 'CENTER' });
    specimen.appendChild(await createFrame({
      name: 'radius-specimen', w: 64, h: 40, radius: value, fill: 'bgColor/muted', stroke: 'borderColor/default', strokeW: 1,
    }));
    specimen.appendChild(await caption(name + ' · ' + (value > 100 ? 'full' : value)));
    corners.body.appendChild(specimen);
  }
  const cornerRules = await createFrame({ name: 'radius-rules', dir: 'V', w: right, gap: dim('base/size/8') });
  cornerRules.appendChild(await ruleRow(right,
    'medium (6) for controls and boxes, large (12) for dialogs and overlays, full for pills and avatars.',
    'A radius between them: the audit accepts only the scale, concentric knobs and focus outlines.'));
  corners.body.appendChild(cornerRules);
  row.appendChild(corners.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetF3 = defineSheet({ code: 'F3', group: 'Foundations', title: 'Shadows', build: async () => {
  const sh = await sheet({
    code: 'F3', title: 'Shadows',
    note: 'Resting for things on the page, floating for things above it',
    rule: 'A shadow suggests elevation; the border draws the edge. Every elevated surface keeps its border or a different fill.',
  });
  const grid = await createFrame({ name: 'shadows', dir: 'H', w: sh.w, gap: 32, wrap: true, rowGap: 32, pad: [dim('base/size/16'), 0, 0, 0] });
  const cell = Math.floor((sh.w - 32 * 3) / 4);
  for (const style of ELEVATION) {
    const specimen = await createFrame({ name: 'shadow/' + style.name, dir: 'V', w: cell, gap: dim('base/size/12') });
    const surface = await createFrame({
      name: 'shadow-surface', w: cell, h: 96, radius: dim(style.name.includes('floating') ? 'borderRadius/large' : 'borderRadius/medium'),
      fill: 'bgColor/default', stroke: 'borderColor/default', strokeW: 1, elevation: style.name,
    });
    specimen.appendChild(surface);
    specimen.appendChild(await createText({ style: 'code/small', text: style.name, w: cell, truncate: true }));
    specimen.appendChild(await caption(style.description || style.effects.length + ' layer(s)', cell));
    grid.appendChild(specimen);
  }
  sh.body.appendChild(grid);
  return sh.frame;
} });

export const sheetF4 = defineSheet({ code: 'F4', group: 'Foundations', title: 'Layout', build: async () => {
  const sh = await sheet({
    code: 'F4', title: 'Layout',
    note: 'A header over a PageLayout: content, and an optional pane',
    rule: 'Content is centred and capped at 1280 px. A pane is 296 px beside it, 24 px away, on the side its purpose reads from.',
  });
  const scale = 0.62;
  const diagram = await createFrame({
    name: 'layout-diagram', dir: 'V', w: Math.round(1440 * scale), gap: 0,
    radius: dim('borderRadius/medium'), stroke: 'borderColor/default', strokeW: 1, clip: true, fill: 'bgColor/default',
  });
  const header = await createFrame({ name: 'diagram/header', dir: 'H', w: diagram.width, h: Math.round(113 * scale), fill: 'page/header/bgColor', pad: [0, 12, 0, 12], align: 'CENTER' });
  header.appendChild(await caption('App header · ' + SHELL_DIMENSIONS.header + ' px bar + ' + SHELL_DIMENSIONS.localNav + ' px UnderlineNav'));
  diagram.appendChild(header);
  const bodyRow = await createFrame({ name: 'diagram/body', dir: 'H', w: diagram.width, h: 240, gap: 16, pad: 16, justify: 'CENTER' });
  const pane = await createFrame({ name: 'diagram/pane', dir: 'V', w: Math.round(SHELL_DIMENSIONS.pane * scale), h: 208, fill: 'bgColor/muted', radius: dim('borderRadius/medium'), pad: 8 });
  pane.appendChild(await caption('pane · ' + SHELL_DIMENSIONS.pane));
  const content = await createFrame({ name: 'diagram/content', dir: 'V', w: diagram.width - 32 - 16 - pane.width, h: 208, fill: 'bgColor/accent-muted', radius: dim('borderRadius/medium'), pad: 8 });
  content.appendChild(await caption('content · up to ' + SHELL_DIMENSIONS.contentMax + ' with the pane'));
  bodyRow.appendChild(pane);
  bodyRow.appendChild(content);
  diagram.appendChild(bodyRow);
  const row = await createFrame({ name: 'layout', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  row.appendChild(diagram);
  const notes = await createFrame({ name: 'layout/notes', dir: 'V', w: sh.w - diagram.width - 32, gap: dim('stack/gap/normal') });
  const points = await block({ w: notes.width, title: 'Primer breakpoints', gap: 4 });
  for (const [name, value] of Object.entries(BREAKPOINTS)) points.body.appendChild(await caption(name + ' · ' + value + ' px'));
  notes.appendChild(points.frame);
  notes.appendChild(await ruleRow(notes.width,
    'Artboards are built at 1024, 1280, 1440, 1920 and 2560 px wide by the stress cases.',
    'A column that only works at one width.'));
  row.appendChild(notes);
  sh.body.appendChild(row);
  return sh.frame;
} });

const curve = function (bezier: readonly number[], size: number): FrameNode {
  const [x1, y1, x2, y2] = bezier;
  const at = function (t: number) {
    const u = 1 - t;
    const x = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    const y = 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t;
    return [x * 14 + 1, 15 - y * 14] as const;
  };
  const points: (readonly [number, number])[] = [];
  for (let index = 0; index <= 24; index++) points.push(at(index / 24));
  // A 1 px band along the curve, closed so it can be filled.
  const upper = points.map(([x, y]) => x.toFixed(2) + ' ' + (y - 0.5).toFixed(2));
  const lower = points.slice().reverse().map(([x, y]) => x.toFixed(2) + ' ' + (y + 0.5).toFixed(2));
  const outline = 'M' + upper.join(' L') + ' L' + lower.join(' L') + ' Z';
  return glyph('easing-curve', [{ d: outline, token: 'fgColor/accent' }], size);
};

export const sheetF5 = defineSheet({ code: 'F5', group: 'Foundations', title: 'Motion', build: async () => {
  const sh = await sheet({
    code: 'F5', title: 'Motion',
    note: 'Primer\'s four transitions drive every animated prototype link',
    rule: 'Navigation is instant. Layers enter in 300 ms and leave in 200 ms; state changes move in 200 ms. Each curve is Primer\'s exact cubic Bézier.',
  });
  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'motion', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const durations = await block({ w: left, title: 'Durations', gap: 8 });
  for (const name of MOTION_DURATION_ORDER) {
    const duration = MOTION_DURATIONS[name];
    durations.body.appendChild(await createText({ style: 'body/medium-600', text: name + ' · ' + duration.milliseconds + ' ms', w: left }));
    durations.body.appendChild(await caption(duration.use, left));
  }
  row.appendChild(durations.frame);
  const easings = await block({ w: middle, title: 'Easings', gap: 8 });
  for (const name of MOTION_EASING_ORDER) {
    const easing = MOTION_EASINGS[name];
    const line = await createFrame({ name: 'easing/' + name, dir: 'H', w: middle, gap: dim('base/size/12'), align: 'CENTER' });
    const plot = await createFrame({ name: 'easing-plot', dir: 'H', w: 48, h: 48, pad: 4, radius: dim('borderRadius/medium'), fill: 'bgColor/muted' });
    plot.appendChild(curve(easing.bezier, 40));
    line.appendChild(plot);
    const text = await createFrame({ name: 'easing/text', dir: 'V', w: middle - 60, gap: 0 });
    text.appendChild(await createText({ style: 'body/medium-600', text: name + ' · ' + easing.bezier.join(', '), w: middle - 60, truncate: true }));
    text.appendChild(await caption(easing.use, middle - 60));
    line.appendChild(text);
    easings.body.appendChild(line);
  }
  row.appendChild(easings.frame);
  const transitions = await block({ w: right, title: 'Transitions', note: 'what the prototype uses', gap: 8 });
  for (const name of MOTION_TRANSITION_ORDER) {
    const transition = MOTION_TRANSITIONS[name];
    transitions.body.appendChild(await createText({
      style: 'body/medium-600', w: right,
      text: name + ' · ' + MOTION_DURATIONS[transition.duration].milliseconds + ' ms · ' + transition.easing,
    }));
    transitions.body.appendChild(await caption(transition.use, right));
  }
  transitions.body.appendChild(await ruleRow(right, 'Reduced motion keeps every link and sets each duration to zero.'));
  row.appendChild(transitions.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetF6 = defineSheet({ code: 'F6', group: 'Foundations', title: 'Octicons', build: async () => {
  const names = Object.keys(ICONS) as IconName[];
  const sh = await sheet({
    code: 'F6', title: 'Octicons',
    note: names.length + ' icons from @primer/octicons ' + OCTICONS_VERSION,
    rule: 'Icons are filled Octicons drawn on their own 12, 16 or 24 px grid, and always sit beside a word or carry an accessible name.',
  });
  const cell = 116;
  const grid = await createFrame({ name: 'icons', dir: 'H', w: sh.w, gap: 8, wrap: true, rowGap: 8 });
  for (const name of names) {
    const item = await createFrame({ name: 'icon-cell/' + name, dir: 'H', w: cell, h: 24, gap: dim('base/size/8'), align: 'CENTER' });
    item.appendChild(icon(name, 'fgColor/default', 16));
    item.appendChild(await createText({ style: 'body/small', text: name, color: 'fgColor/muted', w: cell - 24, truncate: true }));
    grid.appendChild(item);
  }
  sh.body.appendChild(grid);
  const sizes = await createFrame({ name: 'icon-sizes', dir: 'H', w: sh.w, gap: dim('stack/gap/normal'), align: 'CENTER' });
  for (const size of [12, 16, 24]) sizes.appendChild(icon('check-circle-fill', 'fgColor/success', size));
  sizes.appendChild(await caption('12, 16 and 24 px glyphs; other sizes scale the nearest smaller grid'));
  sh.body.appendChild(sizes);
  return sh.frame;
} });
