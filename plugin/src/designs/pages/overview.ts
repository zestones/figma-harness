/* 01 · Overview: release health, environments, deployments and activity. */

import { RELAY, type RelayData } from '../../fixtures/public.ts';
import {
  box,
  button,
  chartLegend,
  cols,
  columnChart,
  counterLabel,
  dim,
  f as createFrame,
  icon,
  pageHeader,
  span,
  t as createText,
  timeline,
  type ChartSeries,
  type ColorToken,
  type IconName,
} from '../../kit/public.ts';
import {
  activityBody,
  activityIcon,
  environmentRow,
  releaseList,
} from './cells.ts';
import { shell } from './frame.ts';

export interface OverviewOptions {
  name: string;
}

interface Stat {
  readonly delta: string;
  readonly direction: 'up' | 'down' | 'none';
  readonly good: boolean;
  readonly label: string;
  readonly value: string;
}

const statCard = async function (stat: Stat, width: number): Promise<FrameNode> {
  const card = await createFrame({
    name: 'stat/' + stat.label, dir: 'V', w: width, gap: dim('base/size/4'), pad: dim('stack/padding/normal'),
    radius: dim('borderRadius/medium'), fill: 'bgColor/default', stroke: 'borderColor/default', strokeW: 1,
  });
  card.appendChild(await createText({ style: 'body/medium-600', text: stat.label, color: 'fgColor/muted', w: width - 32, truncate: true }));
  card.appendChild(await createText({ style: 'title/large', text: stat.value, w: width - 32, truncate: true }));
  const delta = await createFrame({ name: 'stat/delta', dir: 'H', w: width - 32, gap: dim('base/size/4'), align: 'CENTER' });
  const ink: ColorToken = stat.direction === 'none' ? 'fgColor/muted' : stat.good ? 'fgColor/success' : 'fgColor/danger';
  const glyph: IconName = stat.direction === 'up' ? 'arrow-up' : stat.direction === 'down' ? 'arrow-down' : 'dash';
  delta.appendChild(icon(glyph, ink, 16));
  delta.appendChild(await createText({ style: 'body/small', text: stat.delta, color: ink, w: width - 32 - 20, truncate: true }));
  card.appendChild(delta);
  card.setPluginData('aria.role', 'group');
  card.setPluginData('aria.accessible-name', stat.label + ': ' + stat.value + ', ' + stat.delta);
  return card;
};

const statistics = function (data: RelayData): readonly Stat[] {
  const stats = data.stats;
  return [
    { label: 'Releases this month', value: String(stats.releasesThisMonth), delta: '+' + stats.releasesDelta + ' on last month', direction: 'up', good: true },
    { label: 'Deploy success', value: stats.successRate, delta: stats.successDelta + ' on last month', direction: 'up', good: true },
    { label: 'Median lead time', value: stats.leadTime, delta: stats.leadTimeDelta + ' faster than last month', direction: 'down', good: true },
    { label: 'Open incidents', value: String(stats.openIncidents), delta: stats.openIncidents ? 'Checkout latency, since 09:12' : 'None open', direction: 'none', good: false },
  ];
};

const DEPLOY_SERIES = function (data: RelayData): readonly ChartSeries[] {
  return [
    // Not blue: the accent already means "building" on this page.
    { label: 'Production', token: 'data/purple/color/emphasis', values: data.weekly.map((week) => week.production) },
    { label: 'Staging', token: 'data/orange/color/emphasis', values: data.weekly.map((week) => week.staging) },
  ];
};

export const screenOverview = async function (options: OverviewOptions): Promise<FrameNode> {
  const data = RELAY;
  const layout = await shell({ name: options.name, section: 'Overview' });
  const width = layout.contentWidth;
  const content = layout.content;

  content.appendChild(await pageHeader({
    w: width,
    title: 'Overview',
    actions: [
      await button({ label: 'View releases' }),
      await button({ label: 'Draft a new release', variant: 'primary', leadingVisual: 'plus' }),
    ],
    description: await createText({
      style: 'body/medium', color: 'fgColor/muted', w: width,
      text: data.org + '/' + data.project + ' · the last 30 days',
    }),
  }));

  const stats = statistics(data);
  const statWidths = cols(width, stats.length, 16);
  const statRow = await createFrame({ name: 'stats', dir: 'H', w: width, gap: dim('stack/gap/normal'), align: 'MIN' });
  for (let index = 0; index < stats.length; index++) statRow.appendChild(await statCard(stats[index], statWidths[index]));
  content.appendChild(statRow);

  const [left, right] = span(width, [7, 5], 16);
  const middle = await createFrame({ name: 'health', dir: 'H', w: width, gap: dim('stack/gap/normal'), align: 'MIN' });
  const environmentRows: FrameNode[] = [];
  for (const environment of data.environments) environmentRows.push(await environmentRow(environment, left));
  middle.appendChild(await box({
    name: 'Environments', w: left, rows: environmentRows,
    header: { title: 'Environments', count: await counterLabel({ count: data.environments.length }) },
  }));
  const series = DEPLOY_SERIES(data);
  const chartBody = await createFrame({ name: 'deployments/body', dir: 'V', w: right, gap: dim('base/size/12'), pad: dim('stack/padding/normal') });
  chartBody.appendChild(await chartLegend(series));
  chartBody.appendChild(await columnChart({ w: right - 32, h: 160, categories: data.weekly.map((week) => week.week), series }));
  middle.appendChild(await box({ name: 'Deployments', w: right, rows: [chartBody], header: { title: 'Deployments per week' } }));
  content.appendChild(middle);

  const bottom = await createFrame({ name: 'recent', dir: 'H', w: width, gap: dim('stack/gap/normal'), align: 'MIN' });
  bottom.appendChild(await releaseList(data, data.releases.slice(0, 4), left, {
    title: 'Latest releases',
    actions: [await button({ label: 'View all', variant: 'invisible', size: 'small', trailingVisual: 'arrow-right' })],
  }));
  const activity = await createFrame({ name: 'activity/body', dir: 'V', w: right, pad: [0, dim('stack/padding/normal'), 0, dim('stack/padding/normal')] });
  if (data.activity.length) {
    activity.appendChild(await timeline({
      w: right - 32,
      items: data.activity.map((event) => ({ icon: activityIcon(event), body: activityBody(data, event) })),
    }));
  } else {
    const quiet = await createFrame({ name: 'activity/empty', dir: 'V', w: right - 32, pad: [dim('stack/padding/normal'), 0, dim('stack/padding/normal'), 0] });
    quiet.appendChild(await createText({ style: 'body/medium', text: 'Nothing has happened yet this month.', color: 'fgColor/muted', w: right - 32 }));
    activity.appendChild(quiet);
  }
  bottom.appendChild(await box({ name: 'Recent activity', w: right, rows: [activity], header: { title: 'Recent activity' } }));
  content.appendChild(bottom);
  layout.fit();
  return layout.frame;
};
