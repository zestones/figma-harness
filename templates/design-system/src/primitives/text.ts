/* Text nodes bound to a text style and a colour token. */

import { P as tokenPaint, TS as textStylesByName } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { lineHeight, type TextStyleName } from '../foundations/typography.ts';

export interface TextOptions {
  color?: ColorToken;
  style: TextStyleName;
  text: string;
  /** Cut the text to one line with an ellipsis at `w`. */
  truncate?: boolean;
  /** A fixed width; the text wraps unless it is truncated. */
  w?: number;
}

export const text = async function (options: TextOptions): Promise<TextNode> {
  const style = textStylesByName[options.style];
  if (!style) throw new Error('unknown text style ' + options.style);
  const node = figma.createText();
  await node.setTextStyleIdAsync(style.id);
  node.characters = options.text;
  node.fills = [tokenPaint(options.color || 'text/default')];
  if (options.w != null && options.truncate) {
    // The box first: Figma keeps the ellipsis only when it is set after the size.
    node.textAutoResize = 'NONE';
    node.resize(options.w, lineHeight(options.style));
    node.textTruncation = 'ENDING';
  } else if (options.w != null) {
    node.textAutoResize = 'HEIGHT';
    node.resize(options.w, node.height);
  }
  return node;
};
