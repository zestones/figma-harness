/* 01 · Overview: how the month is going, what needs attention, and the latest
 * payments. A payment row opens the payment. */

import {
  alert,
  areaChart,
  barList,
  button,
  card,
  chartLegend,
  dim,
  f as frame,
  matchHeights,
  pageHeader,
  progress,
  segmented,
  stat,
  text,
  trend,
} from '@figma-harness/carrara';
import { appShell } from '../app.ts';
import { COFFER, customerById } from '../fixtures/index.ts';
import { count, money, thousands, wholeMoney } from './format.ts';
import { paymentTable } from './payment-table.ts';

const SIDE_WIDTH = 360;
/* The day the revenue chart calls out. */
const HIGHLIGHT_DAY = 19;

const revenueCard = async function (width: number): Promise<FrameNode> {
  const { revenue } = COFFER;
  const layout = await card({
    w: width, title: 'Net revenue', description: 'Daily, after fees and refunds',
    actions: [await chartLegend([{ label: 'September' }, { label: 'August', dashed: true }])],
  });
  const net = COFFER.metrics.find((metric) => metric.label === 'Net revenue');
  const headline = await frame({ name: 'revenue-total', dir: 'H', gap: dim('space/12'), align: 'CENTER' });
  headline.appendChild(await text({ style: 'display/md', text: net ? net.value : wholeMoney(0) }));
  if (net) headline.appendChild(await trend({ value: net.change, direction: net.direction, good: net.good }));
  layout.body.appendChild(headline);
  const day = Math.min(HIGHLIGHT_DAY, revenue.current.length) - 1;
  layout.body.appendChild(await areaChart({
    name: 'chart/net-revenue', w: layout.bodyWidth, h: 240,
    series: { label: 'September', values: revenue.current },
    comparison: { label: 'August', values: revenue.previous },
    xLabels: revenue.labels,
    yTicks: [0, 20, 40, 60],
    format: (value) => thousands(value),
    highlight: {
      index: day,
      title: 'Sept ' + (day + 1),
      rows: [
        { label: 'September', value: thousands(revenue.current[day], 1) },
        { label: 'August', value: thousands(revenue.previous[day], 1) },
      ],
    },
  }));
  return layout.frame;
};

const methodsCard = async function (width: number): Promise<FrameNode> {
  const layout = await card({ w: width, title: 'Payment methods', description: 'Share of gross volume' });
  layout.body.appendChild(await barList(COFFER.methods.map((method) => ({
    label: method.label, value: Math.round(method.share * 100) + '%', share: method.share,
  })), layout.bodyWidth));
  const payout = await frame({
    name: 'next-payout', dir: 'V', w: layout.bodyWidth, gap: dim('space/12'), pad: [dim('space/16'), 0, 0, 0],
    stroke: 'border/default', strokeSide: 'Top', strokeW: 1,
  });
  payout.appendChild(await text({ style: 'body/sm-medium', text: 'Next payout', color: 'text/tertiary' }));
  payout.appendChild(await text({ style: 'title/page', text: money(COFFER.payout.amount) }));
  payout.appendChild(await progress({
    w: layout.bodyWidth, label: 'Arrives ' + COFFER.payout.arrives, detail: COFFER.payout.bank, value: COFFER.payout.progress,
  }));
  layout.body.appendChild(payout);
  return layout.frame;
};

export const screenOverview = async function (name: string): Promise<FrameNode> {
  const layout = await appShell(name, 'Overview');
  const width = layout.contentWidth;
  const wide = width >= 960;
  const firstName = COFFER.user.name.split(' ')[0];
  layout.content.appendChild(await pageHeader({
    w: width,
    title: 'Good morning, ' + firstName,
    description: 'Here is how ' + COFFER.workspace.name + ' is doing this month.',
    actions: [
      await segmented([{ label: '7D' }, { label: '30D', current: true }, { label: '90D' }, { label: '12M' }], 'Time range'),
      await button({ label: 'Export', icon: 'arrow-down-tray' }),
      await button({ label: 'New invoice', icon: 'plus', variant: 'primary' }),
    ],
  }));

  const disputed = COFFER.payments.filter((payment) => payment.status === 'disputed');
  if (disputed.length) {
    const first = disputed[0];
    const customer = customerById(COFFER, first.customerId);
    layout.content.appendChild(await alert({
      w: width, tone: 'warning', name: 'dispute-alert',
      title: disputed.length === 1 ? 'A dispute needs your response' : disputed.length + ' disputes need your response',
      text: (customer ? customer.name : 'A customer') + ' disputed ' + money(first.amount)
        + '. Send your evidence before Sept 24 to keep the funds.',
      action: { label: 'Respond', name: 'button/Respond' },
    }));
  }

  const perRow = wide ? 4 : 2;
  const tile = Math.floor((width - dim('space/16').value * (perRow - 1)) / perRow);
  const figures = await frame({ name: 'kpis', dir: 'V', w: width, gap: dim('space/16') });
  for (let start = 0; start < COFFER.metrics.length; start += perRow) {
    const line = await frame({ name: 'kpi-row', dir: 'H', w: width, gap: dim('space/16'), align: 'MIN' });
    for (const metric of COFFER.metrics.slice(start, start + perRow)) {
      line.appendChild(await stat({
        w: tile, label: metric.label, value: metric.value, caption: 'vs. August', series: metric.series,
        trend: { value: metric.change, direction: metric.direction, good: metric.good },
      }));
    }
    figures.appendChild(line);
  }
  layout.content.appendChild(figures);

  const insights = await frame({ name: 'insights', dir: wide ? 'H' : 'V', w: width, gap: dim('space/24') });
  const chart = await revenueCard(wide ? width - SIDE_WIDTH - dim('space/24').value : width);
  const methods = await methodsCard(wide ? SIDE_WIDTH : width);
  insights.appendChild(chart);
  insights.appendChild(methods);
  if (wide) matchHeights([chart, methods]);
  layout.content.appendChild(insights);

  const recent = await card({
    w: width, flush: true, title: 'Recent payments', name: 'recent-payments',
    description: count(COFFER.counts.all) + ' payments this month',
    actions: [await button({ label: 'View all', iconAfter: 'arrow-right', size: 'sm', name: 'button/View all payments' })],
  });
  recent.body.appendChild(await paymentTable({ w: width, label: 'Recent payments', payments: COFFER.payments.slice(0, 5) }));
  layout.content.appendChild(recent.frame);
  layout.fit();
  return layout.frame;
};
