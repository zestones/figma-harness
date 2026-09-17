/* Heroicons, materialised as filled, editable vectors coloured from a token.
 * The glyph table is generated from the pinned heroicons package by
 * generators/icons/icons.ts. */

import { P as tokenPaint } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { ICONS } from './icons.generated.ts';

export type IconName = keyof typeof ICONS;
export type IconSize = 16 | 20;

export const ICON_NAMES: readonly IconName[] = Object.freeze(Object.keys(ICONS) as IconName[]);

/** Plugin data recording the glyph and the grid an icon was drawn from. */
export const ICON_GLYPH_KEY = 'spec.icon.glyph';

/** An icon drawn from the glyph made for its size: the 16 px set is simplified. */
export const icon = function (name: IconName, token: ColorToken, size: IconSize = 20): FrameNode {
  const glyphs: Readonly<Record<IconSize, string>> = ICONS[name];
  if (!glyphs) throw new Error('unknown icon ' + name);
  const node = figma.createNodeFromSvg(
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '" '
    + 'xmlns="http://www.w3.org/2000/svg">' + glyphs[size] + '</svg>');
  node.name = 'icon/' + name;
  node.resize(size, size);
  node.fills = [];
  for (const child of node.findAll(() => true)) {
    if (child.type === 'FRAME' || child.type === 'GROUP') continue;
    if ('fills' in child) child.fills = [tokenPaint(token)];
    if ('strokes' in child) child.strokes = [];
  }
  node.setPluginData(ICON_GLYPH_KEY, name + '@' + size);
  node.setPluginData('aria.role', 'presentation');
  return node;
};
