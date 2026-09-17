import type { Color } from '../../color/core/color.ts';
import type {
  RenderContext,
  SvgFill,
  SvgNode,
} from './types.ts';

export function escapeXml(value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function rgb(color: Color): string {
  const channel = (value: number): number =>
    Math.round(Math.max(0, Math.min(1, value)) * 255);
  return 'rgb('
    + channel(color.r) + ','
    + channel(color.g) + ','
    + channel(color.b) + ')';
}

export function paintFill(node: SvgNode, context: RenderContext): SvgFill | null {
  const paint = node.fills[0];
  if (!paint) return null;
  if (paint.type === 'SOLID') {
    const color = context.resolvePaint(paint);
    if (!color) throw new Error('solid paint has no resolvable colour on ' + node.name);
    return { kind: 'solid', color: rgb(color), opacity: color.a };
  }
  if (paint.type?.startsWith('GRADIENT')) {
    return {
      kind: 'grad',
      stops: (paint.gradientStops || []).map((stop) => ({
        o: stop.position,
        c: rgb(stop.color),
        a: stop.color.a == null ? 1 : stop.color.a,
      })),
    };
  }
  return null;
}
