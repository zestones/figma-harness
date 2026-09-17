/* Runtime: text node creation and metrics. */

import {
  TYPE,
  type TextStyleName,
} from '../foundations/typography.ts';
import type { ColorToken } from '../foundations/colors.ts';
import {
  P as tokenPaint,
  TS as textStylesByName,
} from '../../engine/figma-resources.ts';

/* --- text ----------------------------------------------------------------- */

export interface TextOptions {
  align?: 'LEFT' | 'CENTER' | 'RIGHT' | 'JUSTIFIED';
  color?: ColorToken;
  lines?: number;
  /** Hug the words, but truncate at this width. */
  maxW?: number;
  style: TextStyleName;
  text: string | number;
  truncate?: boolean;
  w?: number;
}

const createText = async function (o: TextOptions): Promise<TextNode> {
  var style = textStylesByName[o.style];
  if (!style) throw new Error('Unknown text style: ' + o.style);
  var n = figma.createText();
  await n.setTextStyleIdAsync(style.id);
  n.characters = o.text == null ? '' : String(o.text);
  n.fills = [tokenPaint(o.color || 'fgColor/default')];
  if (o.align) n.textAlignHorizontal = o.align;
  if (o.w == null && o.maxW != null && n.width > o.maxW) {
    truncate(n, o.maxW, o.style, 1);
  } else if (o.w != null && o.truncate) {
    truncate(n, o.w, o.style, o.lines || 1);
  } else if (o.w != null) {
    n.textAutoResize = 'HEIGHT';
    n.resize(o.w, n.height);
  }
  return n;
};
export { createText as t };

/* A truncated text is a fixed box of `lines` lines that ends in an ellipsis.
   The box comes first: Figma's sizing mode and its truncation share one state,
   and changing textAutoResize afterwards switches the ellipsis off and lets the
   text spill out of its box. */
const truncate = function (n: TextNode, width: number, style: TextStyleName, lines: number): void {
  n.textAutoResize = 'NONE';
  n.resize(width, lineHeight(style) * lines);
  n.textTruncation = 'ENDING';
  if (n.textTruncation !== 'ENDING') {
    throw new Error('Figma did not truncate "' + n.characters.slice(0, 40) + '"');
  }
};

/** The line height of a named text style. Heights are derived from this
 *  rather than guessed — a guessed height is how a row ends up short of its
 *  own contents. */
const lineHeight = function (style: TextStyleName): number {
  const spec = TYPE.find((entry) => entry.name === style);
  if (!spec) throw new Error('Unknown text style: ' + style);
  return spec.lineHeight;
};
export { lineHeight as lh };
