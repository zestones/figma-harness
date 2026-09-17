import { rgb } from './paint.ts';
import type {
  RenderContext,
  SvgNode,
} from './types.ts';

export function drawEmbeddedSvg(
  node: SvgNode,
  x: number,
  y: number,
  width: number,
  height: number,
  opacity: number,
  output: string[],
  context: RenderContext,
): void {
  const source = node._svg || '';
  let inner = source.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const viewBox = (source.match(/viewBox="([^"]+)"/) || [null, '0 0 24 24'])[1];
  const rootWeight = (source.match(/stroke-width="([^"]+)"/) || [null, '1.75'])[1];
  const vectors = node.findAll((candidate) => candidate.type === 'VECTOR');
  let index = 0;
  inner = inner
    .replace(/\s(?:stroke|fill|fill-rule|class)="[^"]*"/g, '')
    .replace(/<(path|circle|rect|polygon|line)\b/g, (_match: string, tag: string) => {
      const vector = vectors[index++];
      const fill = vector?.fills[0];
      const stroke = vector?.strokes[0];
      const weight = vector?.strokeWeight != null ? vector.strokeWeight : null;
      const dash = vector?.dashPattern?.length
        ? ' stroke-dasharray="' + vector.dashPattern.join(' ') + '"'
        : '';
      const cap = vector?.strokeCap
        ? ' stroke-linecap="' + String(vector.strokeCap).toLowerCase() + '"'
        : '';
      const join = vector?.strokeJoin
        ? ' stroke-linejoin="' + String(vector.strokeJoin).toLowerCase() + '"'
        : '';
      const fillColor = fill?.type === 'SOLID' ? context.resolvePaint(fill) : null;
      const strokeColor = stroke?.type === 'SOLID' ? context.resolvePaint(stroke) : null;
      const fillRule = (vector?.fills?.length && /fill-rule="evenodd"/.test(source)) ? ' fill-rule="evenodd"' : '';
      return '<' + tag
        + ' fill="' + (fillColor ? rgb(fillColor) : 'none') + '"'
        + (fillColor && fillColor.a < 1 ? ' fill-opacity="' + fillColor.a.toFixed(3) + '"' : '')
        + fillRule
        + ' stroke="' + (strokeColor ? rgb(strokeColor) : 'none') + '"'
        + (strokeColor && strokeColor.a < 1 ? ' stroke-opacity="' + strokeColor.a.toFixed(3) + '"' : '')
        + (weight != null ? ' stroke-width="' + weight + '"' : '')
        + cap + join + dash;
    });
  output.push(
    '<svg x="' + x.toFixed(1)
    + '" y="' + y.toFixed(1)
    + '" width="' + width
    + '" height="' + height
    + '" viewBox="' + viewBox
    + '" stroke-width="' + rootWeight + '"'
    + ' opacity="' + opacity.toFixed(2) + '">' + inner + '</svg>',
  );
}
