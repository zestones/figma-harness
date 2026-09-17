/* Sheet building blocks: a titled sheet, a titled section and a colour row. */

import type { SheetDefinition } from '@figma-harness/contract';
import {
  COLORS,
  COLOR_SCOPES,
  P as tokenPaint,
  dim,
  f as frame,
  text,
  type ColorToken,
} from '../index.ts';

export const SHEET_W = 1200;
export const SHEET_H = 960;
const PAD = 32;
const CHIP_W = 32;

export interface SheetLayout {
  body: FrameNode;
  frame: FrameNode;
  w: number;
}

/** Freeze a sheet descriptor; the catalog owns the order. */
export const defineSheet = function (definition: SheetDefinition): SheetDefinition {
  if (!/^[A-Z]\d+$/.test(definition.code)) throw new Error('a sheet needs a code such as A1, not ' + definition.code);
  return Object.freeze(definition);
};

export const sheet = async function (code: string, title: string, note: string): Promise<SheetLayout> {
  const width = SHEET_W - PAD * 2;
  const root = await frame({
    name: code + ' · ' + title, dir: 'V', w: SHEET_W, h: SHEET_H, gap: dim('space/24'), pad: dim('space/32'), fill: 'surface/page',
  });
  const head = await frame({ name: 'sheet-head', dir: 'V', w: width, gap: dim('space/4') });
  head.appendChild(await text({ style: 'label/small', text: code, color: 'accent/text' }));
  head.appendChild(await text({ style: 'title/large', text: title, w: width, truncate: true }));
  head.appendChild(await text({ style: 'body/default', text: note, color: 'text/muted', w: width }));
  root.appendChild(head);
  const body = await frame({ name: 'sheet-body', dir: 'H', w: width, gap: dim('space/48'), align: 'MIN' });
  root.appendChild(body);
  return { frame: root, body, w: width };
};

/** A titled column inside a sheet. */
export const section = async function (parent: FrameNode, title: string, width: number): Promise<FrameNode> {
  const column = await frame({ name: 'section/' + title, dir: 'V', w: width, gap: dim('space/12') });
  column.appendChild(await text({ style: 'body/strong', text: title, w: width, truncate: true }));
  parent.appendChild(column);
  return column;
};

/** Plugin data naming the token a colour chip shows. */
export const SWATCH_TOKEN_KEY = 'spec.swatch.token';

/* A chip shows a colour the way it may be painted: a fill where the token may
   fill a frame, a thick edge where it may only stroke, a shape otherwise. */
const chip = async function (token: ColorToken): Promise<FrameNode> {
  const scopes = COLOR_SCOPES[token] || [];
  const fills = scopes.includes('FRAME_FILL');
  const strokes = !fills && scopes.includes('STROKE_COLOR');
  const node = await frame({
    name: 'chip', dir: 'H', w: CHIP_W, h: 20, justify: 'CENTER', align: 'CENTER', radius: dim('radius/small'),
    fill: fills ? token : 'surface/page', stroke: strokes ? token : 'border/default', strokeW: strokes ? 3 : 1,
  });
  if (!fills && !strokes) {
    const shape = figma.createRectangle();
    shape.name = 'swatch';
    shape.resize(16, 8);
    shape.fills = [tokenPaint(token)];
    node.appendChild(shape);
  }
  node.setPluginData(SWATCH_TOKEN_KEY, token);
  return node;
};

// Read at build time, so a previewed override shows its own value.
const hexOf = function (token: ColorToken): string {
  const entry = COLORS.find(([name]) => name === token);
  return entry ? entry[1] : '-';
};

/** A colour, fully stated: the chip, the token, its value, and what it is for. */
export const colorRow = async function (token: ColorToken, description: string, width: number): Promise<FrameNode> {
  const row = await frame({ name: 'c/' + token, dir: 'H', w: width, gap: dim('space/12'), align: 'CENTER' });
  row.appendChild(await chip(token));
  const label = width - CHIP_W - row.itemSpacing;
  const column = await frame({ name: 'swatch-text', dir: 'V', w: label, gap: dim('space/2') });
  column.appendChild(await text({ style: 'body/strong', text: token, w: label, truncate: true }));
  column.appendChild(await text({ style: 'body/small', text: hexOf(token) + ' · ' + description, color: 'text/muted', w: label }));
  row.appendChild(column);
  return row;
};
