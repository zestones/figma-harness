/* Data visualisation primitives. Each takes its box size and draws inside it,
 * so a column at 40 % is 40 % of the height it was given. Series colours are
 * Primer's data tokens, and a legend always names them. */

import { dim } from '../foundations/dimensions.ts';
import type { ColorToken } from '../foundations/colors.ts';
import { f as createFrame } from '@figma-harness/engine';
import { t as createText } from './text.ts';

export interface ChartSeries {
  readonly label: string;
  readonly token: ColorToken;
  readonly values: readonly number[];
}

export interface ColumnChartOptions {
  /** One label per column; every third one is printed. */
  categories: readonly string[];
  h: number;
  /** Drawn bottom to top in each column. */
  series: readonly ChartSeries[];
  w: number;
}

const LABEL_HEIGHT = 20;
const SEGMENT_GAP = 2;

/** The smallest round number at or above a value whose half is a whole
 *  number, so the half-way gridline reads as a count. */
export const niceMaximum = function (value: number): number {
  if (value <= 0) return 2;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  for (const step of [1, 2, 3, 4, 5, 6, 8, 10]) {
    const candidate = step * magnitude;
    if (candidate >= value && Number.isInteger(candidate / 2)) return candidate;
  }
  return 20 * magnitude;
};

/** Stacked columns over a baseline, with a half-way gridline and its value. */
export const columnChart = async function (options: ColumnChartOptions): Promise<FrameNode> {
  const count = options.categories.length;
  if (!count) throw new Error('columnChart: no categories');
  for (const entry of options.series) {
    if (entry.values.length !== count) throw new Error('columnChart: ' + entry.label + ' has the wrong length');
  }
  const totals = options.categories.map((_, index) =>
    options.series.reduce((sum, entry) => sum + Math.max(0, entry.values[index]), 0));
  const maximum = niceMaximum(Math.max(...totals));
  const chart = await createFrame({ name: 'column-chart', w: options.w, h: options.h });
  const plotHeight = options.h - LABEL_HEIGHT;
  const axisWidth = 24;
  const plotWidth = options.w - axisWidth;
  const gap = count > 1 ? Math.min(8, Math.floor(plotWidth / count / 3)) : 0;
  const column = Math.floor((plotWidth - gap * (count - 1)) / count);

  for (const [fraction, name] of [[0.5, 'gridline'], [0, 'baseline']] as const) {
    const line = await createFrame({
      name, w: plotWidth, h: 1,
      stroke: fraction === 0 ? 'borderColor/default' : 'borderColor/muted', strokeSide: 'Top', strokeW: 1,
    });
    chart.appendChild(line);
    line.x = axisWidth;
    line.y = Math.round(plotHeight * (1 - fraction));
  }
  const tick = await createText({ style: 'body/small', text: String(maximum / 2), color: 'fgColor/muted', w: axisWidth - 4, align: 'RIGHT' });
  chart.appendChild(tick);
  tick.x = 0;
  tick.y = Math.round(plotHeight / 2 - tick.height / 2);

  for (let index = 0; index < count; index++) {
    const x = axisWidth + index * (column + gap);
    let top = plotHeight;
    for (const entry of options.series) {
      const value = Math.max(0, entry.values[index]);
      if (!value) continue;
      const height = Math.max(1, Math.round(plotHeight * value / maximum) - SEGMENT_GAP);
      top -= height;
      const segment = await createFrame({
        name: 'column/' + options.categories[index] + '/' + entry.label, w: column, h: height, fill: entry.token,
      });
      chart.appendChild(segment);
      segment.x = x;
      segment.y = top;
      top -= SEGMENT_GAP;
    }
    if (index % 3 === 0) {
      const label = await createText({
        style: 'body/small', text: options.categories[index], color: 'fgColor/muted', w: column + gap * 2, align: 'CENTER',
      });
      chart.appendChild(label);
      label.x = x - gap;
      label.y = plotHeight + 2;
    }
  }
  chart.setPluginData('aria.role', 'img');
  chart.setPluginData('aria.accessible-name', options.series.map((entry) => entry.label).join(' and ')
    + ' per ' + (count === 1 ? 'period' : count + ' periods'));
  return chart;
};

/** Swatches and names for the series of a chart. */
export const chartLegend = async function (series: readonly ChartSeries[]): Promise<FrameNode> {
  const legend = await createFrame({ name: 'chart-legend', dir: 'H', gap: dim('base/size/16'), align: 'CENTER' });
  for (const entry of series) {
    const item = await createFrame({ name: 'legend/' + entry.label, dir: 'H', gap: dim('base/size/6'), align: 'CENTER' });
    item.appendChild(await createFrame({ name: 'swatch', w: 8, h: 8, radius: dim('borderRadius/small'), fill: entry.token }));
    item.appendChild(await createText({ style: 'body/small', text: entry.label, color: 'fgColor/muted' }));
    legend.appendChild(item);
  }
  return legend;
};
