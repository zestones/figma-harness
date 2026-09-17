import { defaultFamily, fontWeight } from '../../core/bundled-fonts.ts';
import { wrapLines } from '../../runtime/text-metrics.ts';
import {
  escapeXml,
  paintFill,
} from './paint.ts';
import type {
  RenderContext,
  SvgNode,
} from './types.ts';

export function drawText(
  node: SvgNode,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number,
  output: string[],
  context: RenderContext,
): void {
  const fill = paintFill(node, context);
  const size = node.fontSize || 12;
  const lineHeight = node.lineHeight?.value || size * 1.4;
  const family = node.fontName?.family || defaultFamily();
  const style = node.fontName?.style || 'Regular';
  const weight = fontWeight(style);
  const anchor = node.textAlignHorizontal === 'RIGHT'
    ? 'end'
    : node.textAlignHorizontal === 'CENTER' ? 'middle' : 'start';
  const textX = anchor === 'end' ? x + width : anchor === 'middle' ? x + width / 2 : x;
  let characters = node.characters || '';
  if (node.textCase === 'UPPER') characters = characters.toUpperCase();
  const letterSpacing = (node.letterSpacing?.value || 0) / 100 * size;

  const measuredWidth = (text: string): number => context.harness.measure(
    text,
    size,
    family,
    letterSpacing,
    false,
    style,
  );
  const lines = node.textAutoResize !== 'WIDTH_AND_HEIGHT' && width > 0
    ? wrapLines(characters, width, measuredWidth)
    : characters.split('\n');

  // Like Figma, only a truncating text ends in an ellipsis. Without truncation
  // the extra lines are drawn below the box, where a reviewer can see them.
  let cap = 0;
  if (node.textTruncation === 'ENDING') {
    cap = node.textAutoResize === 'NONE' && height > 0
      ? Math.max(1, Math.floor(height / lineHeight + 0.01))
      : node.maxLines || 0;
  }
  const shown = cap ? lines.slice(0, cap) : lines;
  if (cap && lines.length > cap) {
    shown[shown.length - 1] = shown[shown.length - 1].replace(/\s*\S*$/, '…');
  }

  for (let index = 0; index < shown.length; index++) {
    output.push(
      '<text x="' + textX.toFixed(1)
      + '" y="' + (y + lineHeight * 0.72 + index * lineHeight).toFixed(1)
      + '" font-family="' + escapeXml(family) + ', ' + defaultFamily() + ', sans-serif"'
      + ' font-size="' + size
      + '" font-weight="' + weight
      + '" letter-spacing="' + letterSpacing.toFixed(2)
      + '" text-anchor="' + anchor
      + '" fill="' + (fill?.kind === 'solid' ? fill.color : '#000')
      + '" opacity="' + (opacity * (fill?.kind === 'solid' ? fill.opacity : 1)).toFixed(2)
      + '">' + escapeXml(shown[index]) + '</text>',
    );
  }
}
