/* Small shapes: status dots, hairline rules and keyboard keys. */

import { P as tokenPaint, f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { text } from './text.ts';

/** A round mark. It repeats a state; a word always states it. */
export const dot = function (token: ColorToken, size = 6): EllipseNode {
  const node = figma.createEllipse();
  node.name = 'dot';
  node.resize(size, size);
  node.fills = [tokenPaint(token)];
  return node;
};

/** A one-pixel divider drawn as the top edge of an empty frame. */
export const rule = function (width: number, token: ColorToken = 'border/default'): Promise<FrameNode> {
  return frame({ name: 'rule', w: width, h: 1, stroke: token, strokeSide: 'Top', strokeW: 1 });
};

/** A keyboard shortcut, such as / or Ctrl C. */
export const kbd = async function (label: string): Promise<FrameNode> {
  const node = await frame({
    name: 'kbd', dir: 'H', h: 20, pad: [0, dim('space/6'), 0, dim('space/6')], align: 'CENTER',
    radius: dim('radius/xs'), fill: 'bg/subtle', stroke: 'border/default', strokeW: 1,
  });
  node.appendChild(await text({ style: 'body/sm-medium', text: label, color: 'text/tertiary' }));
  return node;
};
