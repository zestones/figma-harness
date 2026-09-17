/* Octicons, materialised as filled, editable vectors coloured from a token.
 * The glyph table is generated from @primer/octicons by tools/icons/icons.ts. */

import { ICONS } from './icons.generated.ts';
import { P as tokenPaint } from '../../engine/figma-resources.ts';
import type { ColorToken } from '../foundations/colors.ts';

export type IconName = keyof typeof ICONS;

/** Plugin data recording the glyph and the design height an icon was drawn from. */
export const ICON_GLYPH_KEY = 'spec.icon.glyph';

/* Octicons are drawn on 12, 16 and 24 px grids. A size draws the glyph made for
   it, or the nearest smaller grid, so strokes land on whole pixels. */
const designHeight = function (glyphs: Readonly<Partial<Record<number, string>>>, size: number): number {
  const heights = Object.keys(glyphs).map(Number).sort((a, b) => a - b);
  const fitting = heights.filter((height) => height <= size);
  return fitting.length ? fitting[fitting.length - 1] : heights[0];
};

export const icon = function (name: IconName, token: ColorToken, size = 16): FrameNode {
  const glyphs = ICONS[name] as Readonly<Partial<Record<number, string>>> | undefined;
  if (!glyphs) throw new Error('Unknown icon: ' + name);
  const height = designHeight(glyphs, size);
  const node = figma.createNodeFromSvg(
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + height + ' ' + height + '" '
    + 'xmlns="http://www.w3.org/2000/svg">' + glyphs[height] + '</svg>');
  node.name = 'icon/' + name;
  node.resize(size, size);
  node.fills = [];
  for (const child of node.findAll(() => true)) {
    if (child.type === 'FRAME' || child.type === 'GROUP') continue;
    if ('fills' in child) child.fills = [tokenPaint(token)];
    if ('strokes' in child) child.strokes = [];
  }
  node.setPluginData(ICON_GLYPH_KEY, name + '@' + height);
  return node;
};
