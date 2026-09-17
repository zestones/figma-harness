/* Text nodes bound to a text style and a colour token. */

import { P as tokenPaint, TS as textStylesByName } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { lineHeight, type TextStyleName } from '../foundations/typography.ts';

export interface TextOptions {
  align?: 'CENTER' | 'LEFT' | 'RIGHT';
  color?: ColorToken;
  /** With `truncate`, the lines kept before the ellipsis. */
  lines?: number;
  /** Hug the words, but cut them with an ellipsis past this width. */
  maxW?: number;
  style: TextStyleName;
  text: string;
  /** Cut the text with an ellipsis at `w`. */
  truncate?: boolean;
  /** A fixed width; the text wraps unless it is truncated. */
  w?: number;
}

/* A truncated text is a fixed box of whole lines that ends in an ellipsis. The
   box comes first: Figma keeps the ellipsis only when it is set after the size. */
const truncate = function (node: TextNode, width: number, style: TextStyleName, lines: number): void {
  node.textAutoResize = 'NONE';
  node.resize(width, lineHeight(style) * lines);
  node.textTruncation = 'ENDING';
  if (lines > 1) node.maxLines = lines;
};

export const text = async function (options: TextOptions): Promise<TextNode> {
  const style = textStylesByName[options.style];
  if (!style) throw new Error('unknown text style ' + options.style);
  const node = figma.createText();
  await node.setTextStyleIdAsync(style.id);
  node.characters = options.text;
  node.fills = [tokenPaint(options.color || 'text/primary')];
  if (options.align) node.textAlignHorizontal = options.align;
  if (options.w == null && options.maxW != null && node.width > options.maxW) {
    truncate(node, options.maxW, options.style, 1);
  } else if (options.w != null && options.truncate) {
    truncate(node, options.w, options.style, options.lines || 1);
  } else if (options.w != null) {
    node.textAutoResize = 'HEIGHT';
    node.resize(options.w, node.height);
  }
  return node;
};
