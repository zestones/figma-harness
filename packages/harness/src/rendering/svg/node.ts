import {
  paintFill,
  rgb,
} from './paint.ts';
import { drawText } from './text.ts';
import type {
  RenderContext,
  SvgNode,
} from './types.ts';
import { drawEmbeddedSvg } from './vector.ts';

/* An INSIDE side stroke sits within the box, half its weight in from the edge. */
function drawStrokeLine(
  output: string[],
  color: { a: number; b: number; g: number; r: number },
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  weight: number,
): void {
  output.push(
    '<line x1="' + x1.toFixed(1)
    + '" y1="' + y1.toFixed(1)
    + '" x2="' + x2.toFixed(1)
    + '" y2="' + y2.toFixed(1)
    + '" stroke="' + rgb(color)
    + '" stroke-opacity="' + color.a.toFixed(3)
    + '" stroke-width="' + weight + '"/>',
  );
}

function drawFill(
  node: SvgNode,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  opacity: number,
  output: string[],
  context: RenderContext,
): void {
  const fill = paintFill(node, context);
  if (fill?.kind === 'solid') {
    output.push(
      '<rect x="' + x.toFixed(1)
      + '" y="' + y.toFixed(1)
      + '" width="' + width
      + '" height="' + height
      + '" rx="' + radius
      + '" fill="' + fill.color
      + '" opacity="' + (opacity * fill.opacity).toFixed(2) + '"/>',
    );
    return;
  }
  if (fill?.kind !== 'grad') return;

  const id = 'g' + output.length;
  output.push(
    '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">'
    + fill.stops.map((stop) =>
      '<stop offset="' + stop.o
      + '" stop-color="' + stop.c
      + '" stop-opacity="' + stop.a + '"/>').join('')
    + '</linearGradient></defs>',
  );
  output.push(
    '<rect x="' + x.toFixed(1)
    + '" y="' + y.toFixed(1)
    + '" width="' + width
    + '" height="' + height
    + '" rx="' + radius
    + '" fill="url(#' + id
    + ')" opacity="' + opacity.toFixed(2) + '"/>',
  );
}

function drawStroke(
  node: SvgNode,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  output: string[],
  context: RenderContext,
): void {
  const stroke = node.strokes[0];
  if (!stroke || stroke.type !== 'SOLID') return;

  const weight = node.strokeWeight || 1;
  const hasSideWeights = node.strokeTopWeight !== undefined
    || node.strokeRightWeight !== undefined
    || node.strokeBottomWeight !== undefined
    || node.strokeLeftWeight !== undefined;
  if (!hasSideWeights) {
    const color = context.resolvePaint(stroke);
    if (!color) throw new Error('solid stroke has no resolvable colour on ' + node.name);
    output.push(
      '<rect x="' + (x + weight / 2).toFixed(1)
      + '" y="' + (y + weight / 2).toFixed(1)
      + '" width="' + Math.max(0, width - weight)
      + '" height="' + Math.max(0, height - weight)
      + '" rx="' + radius
      + '" fill="none" stroke="' + rgb(color)
      + '" stroke-opacity="' + color.a.toFixed(3)
      + '" stroke-width="' + weight
      + (node.dashPattern ? '" stroke-dasharray="' + node.dashPattern.join(' ') : '')
      + '"/>',
    );
    return;
  }

  // A side-specific stroke is usually bound to a colour variable; its literal
  // colour is only a placeholder, so resolve it like any other stroke.
  const sideColor = context.resolvePaint(stroke);
  if (!sideColor) throw new Error('partial stroke has no resolvable colour on ' + node.name);
  const top = node.strokeTopWeight || 0;
  const bottom = node.strokeBottomWeight || 0;
  const left = node.strokeLeftWeight || 0;
  const right = node.strokeRightWeight || 0;
  if (top) drawStrokeLine(output, sideColor, x, y + top / 2, x + width, y + top / 2, top);
  if (bottom) drawStrokeLine(output, sideColor, x, y + height - bottom / 2, x + width, y + height - bottom / 2, bottom);
  if (left) drawStrokeLine(output, sideColor, x + left / 2, y, x + left / 2, y + height, left);
  if (right) drawStrokeLine(output, sideColor, x + width - right / 2, y, x + width - right / 2, y + height, right);
}

export function drawNode(
  node: SvgNode,
  offsetX: number,
  offsetY: number,
  output: string[],
  depth: number,
  context: RenderContext,
): void {
  if (depth > 60 || node.visible === false) return;
  context.harness.solveLayout(node);

  const x = offsetX + (node.x || 0);
  const y = offsetY + (node.y || 0);
  const width = node.width || 0;
  const height = node.height || 0;
  const opacity = node.opacity == null ? 1 : node.opacity;
  // An ellipse is drawn as a fully rounded box: a circle when it is square.
  const radius = node.type === 'ELLIPSE'
    ? Math.min(width, height) / 2
    : Math.min(node.cornerRadius || 0, width / 2, height / 2);

  if (node.type === 'TEXT') {
    drawText(node, x, y, width, height, opacity, output, context);
    return;
  }
  if (node._svg) {
    drawEmbeddedSvg(node, x, y, width, height, opacity, output, context);
    return;
  }

  drawFill(node, x, y, width, height, radius, opacity, output, context);
  drawStroke(node, x, y, width, height, radius, output, context);

  let clipId: string | null = null;
  if (node.clipsContent && node.children.length) {
    clipId = 'c' + output.length;
    output.push(
      '<defs><clipPath id="' + clipId
      + '"><rect x="' + x.toFixed(1)
      + '" y="' + y.toFixed(1)
      + '" width="' + width
      + '" height="' + height
      + '" rx="' + radius
      + '"/></clipPath></defs><g clip-path="url(#' + clipId + ')">',
    );
  }
  for (const child of node.children) {
    drawNode(child, x, y, output, depth + 1, context);
  }
  if (clipId) output.push('</g>');
}
