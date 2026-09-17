/* Sheet building blocks: a titled sheet with columns, titled sections, and
 * colour rows whose chip shows how a token may be painted. */

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

export const SHEET_W = 1440;
/** The tallest a sheet may grow; the plugin spaces rows of sheets by it. */
export const SHEET_H = 1280;
const PAD = 48;
const CHIP_W = 40;

export interface SheetLayout {
  /** Columns sit side by side in here. */
  readonly body: FrameNode;
  readonly frame: FrameNode;
  readonly w: number;
}

/** Freeze a sheet descriptor; the catalog owns the order. A sheet is as tall as its content, up to SHEET_H. */
export const defineSheet = function (definition: SheetDefinition): SheetDefinition {
  if (!/^[A-Z]\d+$/.test(definition.code)) throw new Error('a sheet needs a code such as A1, not ' + definition.code);
  return Object.freeze({
    ...definition,
    build: async () => {
      const node = await definition.build();
      if (node.height > SHEET_H) {
        throw new Error(definition.code + ' is ' + Math.ceil(node.height) + ' px tall; a sheet may be ' + SHEET_H + ' px at most');
      }
      return node;
    },
  });
};

export const sheet = async function (code: string, title: string, note: string): Promise<SheetLayout> {
  const width = SHEET_W - PAD * 2;
  const root = await frame({
    name: code + ' · ' + title, dir: 'V', w: SHEET_W, gap: dim('space/32'), pad: dim('space/48'),
    fill: 'bg/canvas',
  });
  const head = await frame({ name: 'sheet-head', dir: 'V', w: width, gap: dim('space/4') });
  head.appendChild(await text({ style: 'label/overline', text: 'CARRARA · ' + code, color: 'accent/text' }));
  head.appendChild(await text({ style: 'title/page', text: title, w: width, truncate: true }));
  head.appendChild(await text({ style: 'body/md', text: note, color: 'text/secondary', w: width }));
  root.appendChild(head);
  const body = await frame({ name: 'sheet-body', dir: 'H', w: width, gap: dim('space/48'), align: 'MIN' });
  root.appendChild(body);
  return { frame: root, body, w: width };
};

/** The width of each of `count` columns in a sheet body. */
export const columnWidth = function (layout: SheetLayout, count: number): number {
  return Math.floor((layout.w - layout.body.itemSpacing * (count - 1)) / count);
};

export const column = async function (parent: FrameNode, width: number): Promise<FrameNode> {
  const node = await frame({ name: 'sheet-column', dir: 'V', w: width, gap: dim('space/32') });
  parent.appendChild(node);
  return node;
};

/** A titled group inside a column. */
export const section = async function (parent: FrameNode, title: string, width: number, note?: string): Promise<FrameNode> {
  const group = await frame({ name: 'section/' + title, dir: 'V', w: width, gap: dim('space/12') });
  group.appendChild(await text({ style: 'title/card', text: title, w: width, truncate: true }));
  if (note) group.appendChild(await text({ style: 'body/sm', text: note, color: 'text/tertiary', w: width }));
  parent.appendChild(group);
  return group;
};

/** A white stage that holds specimens, like a card on a page. */
export const stage = async function (parent: FrameNode, width: number, name = 'stage'): Promise<FrameNode> {
  const node = await frame({
    name, dir: 'V', w: width, gap: dim('space/16'), pad: dim('space/20'), radius: dim('radius/lg'),
    fill: 'bg/surface', stroke: 'border/default', strokeW: 1,
  });
  parent.appendChild(node);
  return node;
};

/** Plugin data naming the token a colour chip shows. */
export const SWATCH_TOKEN_KEY = 'spec.swatch.token';

/* A chip shows a colour the way it may be painted: a fill where the token may
   fill a frame, a thick edge where it may only stroke, a shape otherwise. */
const chip = async function (token: ColorToken): Promise<FrameNode> {
  const scopes = COLOR_SCOPES[token] || [];
  const fills = scopes.includes('FRAME_FILL');
  const strokes = !fills && !scopes.includes('SHAPE_FILL');
  const node = await frame({
    name: 'chip', dir: 'H', w: CHIP_W, h: 28, justify: 'CENTER', align: 'CENTER', radius: dim('radius/sm'),
    fill: fills ? token : 'bg/surface', stroke: strokes ? token : 'border/default', strokeW: strokes ? 3 : 1,
  });
  if (!fills && !strokes) {
    const shape = figma.createRectangle();
    shape.name = 'swatch';
    shape.resize(20, 8);
    shape.fills = [tokenPaint(token)];
    node.appendChild(shape);
  }
  node.setPluginData(SWATCH_TOKEN_KEY, token);
  return node;
};

/** A colour, fully stated: the chip, the token, its value, and what it is for. */
export const colorRow = async function (token: ColorToken, width: number): Promise<FrameNode> {
  const entry = COLORS.find(([name]) => name === token);
  if (!entry) throw new Error('unknown colour ' + token);
  const row = await frame({ name: 'c/' + token, dir: 'H', w: width, gap: dim('space/12'), align: 'CENTER' });
  row.appendChild(await chip(token));
  const label = width - CHIP_W - row.itemSpacing;
  const words = await frame({ name: 'swatch-text', dir: 'V', w: label });
  words.appendChild(await text({ style: 'body/md-strong', text: token, w: label, truncate: true }));
  words.appendChild(await text({ style: 'body/sm', text: entry[1] + ' · ' + entry[2], color: 'text/tertiary', w: label }));
  row.appendChild(words);
  return row;
};

/** A small caption under a specimen. */
export const note = function (value: string, width: number): Promise<TextNode> {
  return text({ style: 'body/sm', text: value, color: 'text/tertiary', w: width });
};

/** A horizontal row of specimens. */
export const row = function (name: string, gap: 'space/8' | 'space/12' | 'space/16' | 'space/24' = 'space/12'): Promise<FrameNode> {
  return frame({ name, dir: 'H', gap: dim(gap), align: 'CENTER', wrap: false });
};
