/* Small filled marks that are not Octicons: spinner arcs and switch glyphs. */

import { P as tokenPaint } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';

export interface GlyphPath {
  readonly d: string;
  readonly opacity?: number;
  readonly token: ColorToken;
}

/** Filled paths on a square grid, each coloured from its own token. */
export const glyph = function (
  name: string,
  paths: readonly GlyphPath[],
  size: number,
  grid = 16,
): FrameNode {
  const node = figma.createNodeFromSvg(
    '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + grid + ' ' + grid + '" '
    + 'xmlns="http://www.w3.org/2000/svg">'
    + paths.map((path) => '<path fill-rule="evenodd" d="' + path.d + '"/>').join('')
    + '</svg>');
  node.name = name;
  node.resize(size, size);
  node.fills = [];
  const vectors = node.findAll((child) => child.type !== 'FRAME' && child.type !== 'GROUP');
  if (vectors.length !== paths.length) throw new Error(name + ': expected ' + paths.length + ' vectors');
  vectors.forEach((vector, index) => {
    const path = paths[index];
    if ('fills' in vector) {
      const paint = tokenPaint(path.token);
      vector.fills = [path.opacity == null ? paint : { ...paint, opacity: path.opacity }];
    }
    if ('strokes' in vector) vector.strokes = [];
  });
  return node;
};

/* Primer's Spinner: a 2 px ring at a quarter of its strength, and a quarter arc. */
const RING = 'M8 0a8 8 0 1 0 0 16A8 8 0 1 0 8 0Zm0 2a6 6 0 1 1 0 12A6 6 0 1 1 8 2Z';
const ARC = 'M8 0a8 8 0 0 1 8 8a1 1 0 0 1-2 0a6 6 0 0 0-6-6a1 1 0 0 1 0-2Z';

export const spinner = function (token: ColorToken, size = 16): FrameNode {
  const node = glyph('spinner', [
    { d: RING, token, opacity: 0.25 },
    { d: ARC, token },
  ], size);
  node.setPluginData('aria.role', 'status');
  node.setPluginData('aria.accessible-name', 'Loading');
  return node;
};
