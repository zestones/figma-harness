/* Design-system sheet primitives. Each bounded sheet owns one concern and
 * carries its conclusion with its specimens. */

import {
  COLOR_SCOPES,
  V as variablesByName,
  below,
  dim,
  f as createFrame,
  icon,
  inner as innerWidth,
  rect as createRectangle,
  strut as createStrut,
  strutForRow,
  t as createText,
  type ColorToken,
} from '../../kit/public.ts';

const channel = function (value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, '0').toUpperCase();
};

/** A variable's first-mode value as #RRGGBB, with its alpha when it has one. */
export const varHex = function (variable: Variable): string {
  const value = variable.valuesByMode[Object.keys(variable.valuesByMode)[0]];
  if (!value || typeof value !== 'object' || !('r' in value)) return '—';
  const color = value as RGBA;
  const hex = '#' + channel(color.r) + channel(color.g) + channel(color.b);
  const alpha = color.a == null ? 1 : color.a;
  return alpha < 1 ? hex + ' · ' + Math.round(alpha * 100) + '%' : hex;
};

export interface SheetDefinition {
  build: () => Promise<FrameNode>;
  code: string;
  group: 'Colour' | 'Foundations' | 'Components';
  title: string;
}

/** Define one side-effect-free sheet descriptor. The catalog owns ordering. */
export const defineSheet = function (definition: SheetDefinition): Readonly<SheetDefinition> {
  if (!definition || !/^[A-Z]\d+$/.test(definition.code)) {
    throw new Error('A sheet requires a stable code such as A1, F4, or C8');
  }
  if (!definition.group || !definition.title || typeof definition.build !== 'function') {
    throw new Error('Sheet ' + definition.code + ' requires group, title, and build');
  }
  return Object.freeze(definition);
};

/* --- the sheet ------------------------------------------------------------ */

/* A bounded sheet fits on a laptop screen, which is what makes it readable,
   exportable and arguable on its own. */
export const SHEET_W = 1280;
export const SHEET_H = 800;
export const SHEET_PAD = 32;
const HEAD_H = 33;
const RULE_H = 44;

export interface SheetOptions {
  code: string;
  note?: string;
  rule?: string;
  title: string;
}

export interface SheetLayout {
  body: FrameNode;
  frame: FrameNode;
  h: number;
  w: number;
}

export interface BlockOptions {
  dir?: 'H' | 'V';
  gap?: number;
  h?: number;
  note?: string;
  rowGap?: number;
  title: string;
  w: number;
  wrap?: boolean;
}

export interface BlockLayout {
  body: FrameNode;
  frame: FrameNode;
}

export const sheet = async function (options: SheetOptions): Promise<SheetLayout> {
  const width = innerWidth(SHEET_W, SHEET_PAD);
  const frame = await createFrame({
    name: options.code + ' · ' + options.title, dir: 'V', w: SHEET_W, h: SHEET_H, gap: 0,
    pad: [SHEET_PAD, SHEET_PAD, dim('stack/padding/spacious'), SHEET_PAD], fill: 'bgColor/default', clip: true,
  });

  const head = await createFrame({ name: 'sheet-head', dir: 'H', w: width, h: HEAD_H, gap: dim('base/size/12'), align: 'CENTER' });
  const code = await createText({ style: 'code/small', text: options.code, color: 'fgColor/accent' });
  const title = await createText({ style: 'title/medium', text: options.title });
  head.appendChild(code);
  head.appendChild(title);
  if (options.note) {
    const room = width - code.width - title.width - 48;
    const note = await createText({ style: 'body/medium', text: options.note, color: 'fgColor/muted', maxW: Math.max(40, room) });
    head.appendChild(await createStrut(strutForRow(head, [code, title, note]), 1));
    head.appendChild(note);
  }
  frame.appendChild(head);
  frame.appendChild(await createStrut(width, 12));
  frame.appendChild(await createFrame({ name: 'rule', w: width, h: 1, stroke: 'borderColor/default', strokeSide: 'Top', strokeW: 1 }));
  frame.appendChild(await createStrut(width, 20));

  // The rule the sheet exists to state, pinned to the bottom. A reference sheet
  // whose conclusion scrolls off is a gallery.
  const ruleHeight = options.rule ? RULE_H : 0;
  const bodyHeight = below(SHEET_H, SHEET_PAD + HEAD_H + 12 + 1 + 20 + 24 + ruleHeight);
  // Nothing inside the sheet clips: an outline at a specimen's edge must stay visible.
  const body = await createFrame({ name: 'body', dir: 'V', w: width, h: bodyHeight, gap: dim('stack/gap/spacious') });
  frame.appendChild(body);

  if (options.rule) {
    frame.appendChild(await createStrut(width, 12));
    const band = await createFrame({
      name: 'rule-band', dir: 'H', w: width, h: 32, gap: dim('base/size/8'), pad: [0, dim('base/size/12'), 0, dim('base/size/12')],
      radius: dim('borderRadius/medium'), fill: 'bgColor/muted', align: 'CENTER',
    });
    band.appendChild(icon('check-circle', 'fgColor/success', 16));
    band.appendChild(await createText({ style: 'body/small', text: options.rule, maxW: width - 48 }));
    frame.appendChild(band);
  }
  return { frame, body, w: width, h: bodyHeight };
};

/** A titled block inside a sheet. */
export const block = async function (options: BlockOptions): Promise<BlockLayout> {
  const frame = await createFrame({ name: 'block/' + options.title, dir: 'V', w: options.w, h: options.h, gap: dim('base/size/8') });
  const head = await createFrame({ name: 'block-head', dir: 'H', w: options.w, h: 20, gap: dim('base/size/8'), align: 'CENTER' });
  const title = await createText({ style: 'body/small-600', text: options.title, color: 'fgColor/muted' });
  head.appendChild(title);
  if (options.note) {
    const note = await createText({
      style: 'body/small', text: options.note, color: 'fgColor/muted',
      w: Math.max(60, options.w - title.width - 16), align: 'RIGHT', truncate: true,
    });
    head.appendChild(await createStrut(strutForRow(head, [title, note]), 1));
    head.appendChild(note);
  }
  frame.appendChild(head);
  const body = await createFrame({
    name: 'block-body', dir: options.dir || 'V', w: options.w,
    h: options.h == null ? undefined : below(options.h, 28),
    gap: options.gap == null ? 8 : options.gap,
    wrap: options.wrap,
    rowGap: options.rowGap,
    align: 'MIN',
  });
  frame.appendChild(body);
  return { frame, body };
};

/** A one-line "do this / not that" statement: most sheets need the rule more than the gallery. */
export const ruleRow = async function (width: number, good: string, bad?: string): Promise<FrameNode> {
  const rule = await createFrame({ name: 'rule', dir: 'V', w: width, gap: dim('base/size/4') });
  const yes = await createFrame({ name: 'do', dir: 'H', w: width, gap: dim('base/size/8'), align: 'MIN' });
  yes.appendChild(icon('check-circle-fill', 'fgColor/success', 16));
  yes.appendChild(await createText({ style: 'body/small', text: good, w: width - 24 }));
  rule.appendChild(yes);
  if (bad) {
    const no = await createFrame({ name: 'dont', dir: 'H', w: width, gap: dim('base/size/8'), align: 'MIN' });
    no.appendChild(icon('x-circle-fill', 'fgColor/danger', 16));
    no.appendChild(await createText({ style: 'body/small', text: bad, color: 'fgColor/muted', w: width - 24 }));
    rule.appendChild(no);
  }
  return rule;
};

/* --- colour rows ----------------------------------------------------------- */

/** Plugin data naming the token a colour chip shows. */
export const SWATCH_TOKEN_KEY = 'spec.swatch.token';

export const COLOR_NAME_W = 220;
export const COLOR_VALUE_W = 108;
const CHIP_W = 36;

/* A chip shows a colour the way Primer lets it be painted: a fill where the
   token may fill a frame, a shape where it may only fill a glyph, and a thick
   edge where it may only stroke. */
const chip = async function (token: ColorToken): Promise<FrameNode> {
  const scopes: readonly string[] = COLOR_SCOPES[token] || [];
  const fills = scopes.includes('ALL_SCOPES') || scopes.includes('FRAME_FILL');
  const frame = await createFrame({
    name: 'chip', dir: 'H', w: CHIP_W, h: 20, justify: 'CENTER', align: 'CENTER',
    radius: dim('borderRadius/small'),
    fill: fills ? token : 'bgColor/default',
    stroke: fills ? 'borderColor/muted' : scopes.includes('STROKE_COLOR') ? token : 'borderColor/muted',
    strokeW: !fills && scopes.includes('STROKE_COLOR') ? 3 : 1,
  });
  if (!fills && !scopes.includes('STROKE_COLOR')) frame.appendChild(createRectangle('swatch', 20, 12, token, 3));
  frame.setPluginData(SWATCH_TOKEN_KEY, token);
  return frame;
};

/** A colour, fully stated: the patch, the token, the value, and what it is for. */
export const colorRow = async function (width: number, token: ColorToken, role?: string): Promise<FrameNode> {
  const variable = variablesByName[token];
  const row = await createFrame({ name: 'c/' + token, dir: 'H', w: width, h: 24, gap: dim('base/size/8'), align: 'CENTER' });
  row.appendChild(await chip(token));
  row.appendChild(await createText({ style: 'code/small', text: token, w: COLOR_NAME_W, truncate: true }));
  row.appendChild(await createText({
    style: 'code/small', text: variable ? varHex(variable) : '—', color: 'fgColor/muted', w: COLOR_VALUE_W, truncate: true,
  }));
  row.appendChild(await createText({
    style: 'body/small', text: role || (variable ? variable.description : ''), color: 'fgColor/muted',
    w: Math.max(60, width - CHIP_W - COLOR_NAME_W - COLOR_VALUE_W - 24), truncate: true,
  }));
  return row;
};

/** A titled run of colour rows, stacked flush like a table. */
export const colorGroup = async function (
  parent: FrameNode,
  width: number,
  title: string,
  tokens: readonly ColorToken[],
): Promise<FrameNode> {
  const group = await createFrame({ name: 'g/' + title, dir: 'V', w: width, gap: 0 });
  group.appendChild(await createText({ style: 'body/small-600', text: title, color: 'fgColor/accent', w: width, truncate: true }));
  group.appendChild(await createStrut(width, 4));
  for (const token of tokens) group.appendChild(await colorRow(width, token));
  group.appendChild(await createStrut(width, 12));
  parent.appendChild(group);
  return group;
};

/** Two columns of colour groups that fill a sheet. */
export const colorColumns = async function (
  body: FrameNode,
  width: number,
  height: number,
  columns: readonly (readonly (readonly [title: string, tokens: readonly ColorToken[]])[])[],
): Promise<FrameNode[]> {
  const gap = 32;
  const columnWidth = Math.floor((width - gap * (columns.length - 1)) / columns.length);
  const row = await createFrame({ name: 'columns', dir: 'H', w: width, h: height, gap, align: 'MIN' });
  const frames: FrameNode[] = [];
  for (const groups of columns) {
    const column = await createFrame({ name: 'column', dir: 'V', w: columnWidth, gap: 0 });
    for (const [title, tokens] of groups) await colorGroup(column, columnWidth, title, tokens);
    row.appendChild(column);
    frames.push(column);
  }
  body.appendChild(row);
  return frames;
};

/** A small caption under a specimen. */
export const caption = function (text: string, width?: number): Promise<TextNode> {
  return createText({ style: 'body/small', text, color: 'fgColor/muted', w: width });
};
