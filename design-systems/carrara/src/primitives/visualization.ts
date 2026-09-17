/* Charts drawn as editable vectors: sparklines, and an area chart with an
 * optional dashed comparison, gridlines, axis labels and a tooltip. A chart
 * never carries meaning by colour alone: its legend names every series. */

import { P as tokenPaint, f as frame } from '@figma-harness/engine';
import type { ColorToken } from '../foundations/colors.ts';
import { dim } from '../foundations/dimensions.ts';
import { text } from './text.ts';

type Point = readonly [x: number, y: number];

const coordinate = function (value: number): string {
  if (!Number.isFinite(value)) throw new Error('a chart coordinate is not a finite number');
  return String(Math.round(value * 100) / 100);
};

/** A smooth path through the points that never overshoots them (monotone cubic). */
export const smoothPath = function (points: readonly Point[]): string {
  if (points.length < 2) throw new Error('a line needs at least two points');
  const count = points.length;
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index++) {
    const [x0, y0] = points[index];
    const [x1, y1] = points[index + 1];
    slopes.push((y1 - y0) / (x1 - x0));
  }
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0];
    if (index === count - 1) return slopes[count - 2];
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : (before + after) / 2;
  });
  for (let index = 0; index < count - 1; index++) {
    if (slopes[index] === 0) {
      tangents[index] = 0;
      tangents[index + 1] = 0;
      continue;
    }
    const a = tangents[index] / slopes[index];
    const b = tangents[index + 1] / slopes[index];
    const length = a * a + b * b;
    if (length > 9) {
      const factor = 3 / Math.sqrt(length);
      tangents[index] = factor * a * slopes[index];
      tangents[index + 1] = factor * b * slopes[index];
    }
  }
  let path = 'M' + coordinate(points[0][0]) + ' ' + coordinate(points[0][1]);
  for (let index = 0; index < count - 1; index++) {
    const [x0, y0] = points[index];
    const [x1, y1] = points[index + 1];
    const third = (x1 - x0) / 3;
    path += 'C' + coordinate(x0 + third) + ' ' + coordinate(y0 + tangents[index] * third)
      + ' ' + coordinate(x1 - third) + ' ' + coordinate(y1 - tangents[index + 1] * third)
      + ' ' + coordinate(x1) + ' ' + coordinate(y1);
  }
  return path;
};

interface VectorPaint {
  readonly dash?: readonly number[];
  readonly fill?: ColorToken;
  readonly stroke?: ColorToken;
  readonly weight?: number;
}

/* One SVG, one vector per path, each painted from a token. */
const vectors = function (
  name: string,
  width: number,
  height: number,
  paths: readonly string[],
  paints: readonly VectorPaint[],
): FrameNode {
  const node = figma.createNodeFromSvg(
    '<svg width="' + width + '" height="' + height + '" viewBox="0 0 ' + width + ' ' + height + '" '
    + 'xmlns="http://www.w3.org/2000/svg">' + paths.map((d) => '<path d="' + d + '"/>').join('') + '</svg>');
  node.name = name;
  node.resize(width, height);
  node.fills = [];
  const shapes = node.findAll((child) => child.type === 'VECTOR') as VectorNode[];
  if (shapes.length !== paints.length) {
    throw new Error(name + ': expected ' + paints.length + ' vectors, found ' + shapes.length);
  }
  shapes.forEach((shape, index) => {
    const paint = paints[index];
    shape.fills = paint.fill ? [tokenPaint(paint.fill)] : [];
    shape.strokes = paint.stroke ? [tokenPaint(paint.stroke)] : [];
    if (paint.stroke) {
      shape.strokeWeight = paint.weight || 2;
      shape.strokeCap = 'ROUND';
      shape.strokeJoin = 'ROUND';
      if (paint.dash) shape.dashPattern = [...paint.dash];
    }
  });
  node.setPluginData('aria.role', 'img');
  return node;
};

/* Place values on a plot `width` wide, between `top` and `bottom`. */
const plot = function (values: readonly number[], width: number, top: number, bottom: number, min: number, max: number): Point[] {
  const span = max - min || 1;
  return values.map((value, index): Point => [
    values.length === 1 ? 0 : (index / (values.length - 1)) * width,
    bottom - ((value - min) / span) * (bottom - top),
  ]);
};

export interface SparklineOptions {
  /** What the line shows, for assistive technology. */
  label: string;
  token?: ColorToken;
  values: readonly number[];
  w: number;
  h: number;
}

/** A small trend line, drawn inside its box with room for its stroke. */
export const sparkline = function (options: SparklineOptions): FrameNode {
  const low = Math.min(...options.values);
  const high = Math.max(...options.values);
  const points = plot(options.values, options.w - 4, 2, options.h - 2, low, high)
    .map(([x, y]): Point => [x + 2, y]);
  const node = vectors('sparkline', options.w, options.h, [smoothPath(points)], [
    { stroke: options.token || 'chart/primary', weight: 1.5 },
  ]);
  node.setPluginData('aria.accessible-name', options.label);
  return node;
};

export interface ChartSeries {
  readonly label: string;
  readonly values: readonly number[];
}

export interface ChartHighlight {
  readonly index: number;
  readonly rows: ReadonlyArray<{ readonly label: string; readonly value: string }>;
  readonly title: string;
}

export interface AreaChartOptions {
  /** A second series, drawn dashed, such as the previous period. */
  comparison?: ChartSeries;
  /** The label of a value on the vertical axis. */
  format(value: number): string;
  h: number;
  /** A point to call out with a tooltip. */
  highlight?: ChartHighlight;
  name?: string;
  series: ChartSeries;
  w: number;
  /** Labels spread evenly under the plot. */
  xLabels: readonly string[];
  /** Gridline values, lowest first. Every value must fit between the first and the last. */
  yTicks: readonly number[];
}

const AXIS_WIDTH = 56;
const AXIS_GAP = 12;
const X_AXIS_HEIGHT = 30;
const PLOT_TOP = 9;
/* Room after the last point for the highlight marker. */
const PLOT_END = 6;
const X_LABEL_WIDTH = 72;
const MARKER = 10;

/* A series' swatch: solid for the main series, two dashes for a comparison. */
const swatch = async function (index: number, dashed: boolean): Promise<SceneNode> {
  const token: ColorToken = index === 0 ? 'chart/primary' : 'chart/secondary';
  const dash = (width: number): RectangleNode => {
    const piece = figma.createRectangle();
    piece.name = 'swatch-dash';
    piece.resize(width, 2);
    piece.fills = [tokenPaint(token)];
    return piece;
  };
  if (!dashed) {
    const line = dash(12);
    line.name = 'swatch';
    return line;
  }
  const pair = await frame({ name: 'swatch-dashed', dir: 'H', gap: dim('space/2'), align: 'CENTER' });
  pair.appendChild(dash(5));
  pair.appendChild(dash(5));
  return pair;
};

const tooltip = async function (highlight: ChartHighlight, comparison: boolean): Promise<FrameNode> {
  const card = await frame({
    name: 'chart-tooltip', dir: 'V', gap: dim('space/6'), pad: dim('space/12'), radius: dim('radius/md'),
    fill: 'bg/surface', stroke: 'border/default', strokeW: 1, elevation: 'shadow/lg',
  });
  card.appendChild(await text({ style: 'body/sm-medium', text: highlight.title }));
  for (const [index, row] of highlight.rows.entries()) {
    const line = await frame({ name: 'tooltip-row', dir: 'H', gap: dim('space/8'), align: 'CENTER' });
    line.appendChild(await swatch(index, index > 0 && comparison));
    line.appendChild(await text({ style: 'body/sm', text: row.label, color: 'text/tertiary' }));
    line.appendChild(await text({ style: 'body/sm-medium', text: row.value }));
    card.appendChild(line);
  }
  card.setPluginData('aria.role', 'tooltip');
  return card;
};

/** An area chart with gridlines, axes and an optional comparison and tooltip. */
export const areaChart = async function (options: AreaChartOptions): Promise<FrameNode> {
  const { series, comparison, yTicks } = options;
  if (comparison && comparison.values.length !== series.values.length) {
    throw new Error('a comparison needs as many values as its series');
  }
  const min = yTicks[0];
  const max = yTicks[yTicks.length - 1];
  const values = [...series.values, ...(comparison ? comparison.values : [])];
  if (values.some((value) => value < min || value > max)) throw new Error('a chart value falls outside its ticks');

  const root = await frame({ name: options.name || 'chart', w: options.w, h: options.h });
  const plotX = AXIS_WIDTH + AXIS_GAP;
  const plotWidth = options.w - plotX - PLOT_END;
  const plotBottom = options.h - X_AXIS_HEIGHT;
  const plotHeight = plotBottom - PLOT_TOP;
  const yOf = (value: number): number => PLOT_TOP + plotHeight - ((value - min) / (max - min)) * plotHeight;

  for (const tick of yTicks) {
    const y = Math.round(yOf(tick));
    const line = figma.createRectangle();
    line.name = 'gridline';
    line.resize(plotWidth, 1);
    line.fills = [tokenPaint('chart/grid')];
    root.appendChild(line);
    line.x = plotX;
    line.y = y;
    const label = await text({
      style: 'body/sm', text: options.format(tick), color: 'text/tertiary', w: AXIS_WIDTH, align: 'RIGHT', truncate: true,
    });
    root.appendChild(label);
    label.x = 0;
    label.y = y - 9;
  }

  const points = plot(series.values, plotWidth, 0, plotHeight, min, max);
  const line = smoothPath(points);
  const area = line + 'L' + coordinate(plotWidth) + ' ' + coordinate(plotHeight) + 'L0 ' + coordinate(plotHeight) + 'Z';
  const paths = [area];
  const paints: VectorPaint[] = [{ fill: 'chart/primary-area' }];
  if (comparison) {
    paths.push(smoothPath(plot(comparison.values, plotWidth, 0, plotHeight, min, max)));
    paints.push({ stroke: 'chart/secondary', weight: 1.5, dash: [4, 4] });
  }
  paths.push(line);
  paints.push({ stroke: 'chart/primary', weight: 2 });
  const drawing = vectors('chart-plot', plotWidth, plotHeight, paths, paints);
  drawing.setPluginData('aria.accessible-name', series.label + (comparison ? ' compared with ' + comparison.label : ''));
  root.appendChild(drawing);
  drawing.x = plotX;
  drawing.y = PLOT_TOP;

  const step = options.xLabels.length > 1 ? plotWidth / (options.xLabels.length - 1) : 0;
  // A label kept inside the chart moves off its point, so neighbours need half a label more room.
  const every = step ? Math.max(1, Math.ceil((X_LABEL_WIDTH * 1.5) / step)) : 1;
  for (const [index, value] of options.xLabels.entries()) {
    if (index % every) continue;
    const label = await text({
      style: 'body/sm', text: value, color: 'text/tertiary', w: X_LABEL_WIDTH, align: 'CENTER', truncate: true,
    });
    root.appendChild(label);
    label.x = Math.max(plotX, Math.min(options.w - X_LABEL_WIDTH, Math.round(plotX + index * step - X_LABEL_WIDTH / 2)));
    label.y = options.h - 18;
  }

  if (options.highlight) {
    const [px, py] = points[options.highlight.index];
    const x = Math.round(plotX + px);
    const guide = figma.createRectangle();
    guide.name = 'chart-guide';
    guide.resize(1, plotHeight);
    guide.fills = [tokenPaint('chart/grid')];
    root.appendChild(guide);
    guide.x = x;
    guide.y = PLOT_TOP;
    const marker = figma.createEllipse();
    marker.name = 'chart-marker';
    marker.resize(MARKER, MARKER);
    marker.fills = [tokenPaint('bg/surface')];
    marker.strokes = [tokenPaint('chart/primary')];
    marker.strokeWeight = 2;
    marker.strokeAlign = 'INSIDE';
    root.appendChild(marker);
    marker.x = x - MARKER / 2;
    marker.y = Math.round(PLOT_TOP + py - MARKER / 2);
    const card = await tooltip(options.highlight, !!comparison);
    root.appendChild(card);
    card.x = x + 16 + card.width <= options.w ? x + 16 : x - 16 - card.width;
    card.y = PLOT_TOP + 8;
  }
  root.setPluginData('aria.role', 'figure');
  return root;
};

export interface LegendItem {
  /** A dashed swatch, for a comparison series. */
  readonly dashed?: boolean;
  readonly label: string;
}

/** Names every series of a chart: the first is the main one. */
export const chartLegend = async function (items: readonly LegendItem[]): Promise<FrameNode> {
  if (!items.length) throw new Error('a chart legend needs at least one series');
  const legend = await frame({ name: 'chart-legend', dir: 'H', gap: dim('space/16'), align: 'CENTER' });
  for (const [index, item] of items.entries()) {
    const entry = await frame({ name: 'legend/' + item.label, dir: 'H', gap: dim('space/6'), align: 'CENTER' });
    entry.appendChild(await swatch(index, !!item.dashed));
    entry.appendChild(await text({ style: 'body/sm', text: item.label, color: 'text/secondary' }));
    legend.appendChild(entry);
  }
  return legend;
};
