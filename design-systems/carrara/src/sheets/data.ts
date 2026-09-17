/* C3 · Data display. */

import {
  AVATAR_SIZES,
  actionCell,
  amountCell,
  areaChart,
  avatar,
  badge,
  badgeCell,
  barList,
  card,
  chartLegend,
  codeCell,
  descriptionList,
  dim,
  f as frame,
  factStrip,
  iconCell,
  listRow,
  personCell,
  progress,
  stat,
  table,
  timeline,
} from '../index.ts';
import { column, columnWidth, defineSheet, note, section, sheet } from './support.ts';

export const sheetData = defineSheet({
  code: 'C3', group: 'Components', title: 'Data display',
  build: async () => {
    const layout = await sheet('C3', 'Data display', 'Figures, tables, charts and facts. Numbers align on the right, states are words, and every chart names its series.');
    const wide = columnWidth(layout, 3) * 2 + layout.body.itemSpacing;
    const first = await column(layout.body, wide);
    const stats = await section(first, 'Stat', wide);
    const tiles = await frame({ name: 'stats', dir: 'H', w: wide, gap: dim('space/16') });
    const tile = Math.floor((wide - 16) / 2);
    tiles.appendChild(await stat({
      w: tile, label: 'Gross volume', value: '$1,284,390', icon: 'banknotes', caption: 'vs. last 30 days',
      trend: { value: '+12.4%', direction: 'up' }, series: [4, 6, 5, 8, 7, 9, 12, 11, 14],
    }));
    tiles.appendChild(await stat({
      w: tile, label: 'Dispute rate', value: '0.21%', icon: 'shield-check', caption: 'vs. last 30 days',
      trend: { value: '−0.04 pts', direction: 'down', good: true }, series: [9, 8, 8, 7, 6, 6, 5, 5, 4],
    }));
    stats.appendChild(tiles);

    const charts = await section(first, 'Chart', wide);
    const chartCard = await card({
      w: wide, title: 'Net revenue', description: 'Daily, this month and the one before',
      actions: [await chartLegend([{ label: 'September' }, { label: 'August', dashed: true }])],
    });
    chartCard.body.appendChild(await areaChart({
      name: 'chart/specimen', w: chartCard.bodyWidth, h: 200,
      series: { label: 'September', values: [42, 48, 45, 52, 58, 55, 61, 66, 63, 70, 74, 72] },
      comparison: { label: 'August', values: [38, 40, 43, 41, 46, 48, 47, 52, 50, 55, 57, 58] },
      xLabels: ['Sept 1', 'Sept 8', 'Sept 15', 'Sept 22'],
      yTicks: [0, 25, 50, 75],
      format: (value) => '$' + value + 'k',
      highlight: { index: 9, title: 'Sept 19', rows: [{ label: 'September', value: '$70.2k' }, { label: 'August', value: '$55.1k' }] },
    }));
    charts.appendChild(chartCard.frame);

    const tables = await section(first, 'Table', wide);
    const tableCard = await card({ w: wide, flush: true, title: 'Recent payments' });
    tableCard.body.appendChild(await table({
      w: wide, label: 'Recent payments',
      columns: [
        { key: 'customer', header: 'Customer', weight: 2.2 },
        { key: 'amount', header: 'Amount', align: 'RIGHT', weight: 1.1, sorted: 'desc' },
        { key: 'status', header: 'Status', weight: 1.2 },
        { key: 'id', header: 'Payment ID', weight: 1.4 },
        { key: 'menu', header: '', width: 32 },
      ],
      rows: [
        {
          name: 'table-row/specimen-1',
          cells: {
            customer: personCell('Brightline Studio', 'jonas@brightline.example', 'BS'),
            amount: amountCell('$2,400.00', 'USD'),
            status: badgeCell({ label: 'Succeeded', tone: 'positive', dot: true }),
            id: codeCell('pay_3Qx7L2m9ZkT4'),
            menu: actionCell('Payment actions', 'row-action/specimen-1'),
          },
        },
        {
          name: 'table-row/specimen-2', selected: true,
          cells: {
            customer: personCell('Harborview Clinics', 'billing@harborview.example', 'HC'),
            amount: amountCell('$860.00', 'USD'),
            status: badgeCell({ label: 'Needs response', tone: 'warning', dot: true }),
            id: codeCell('pay_3Qw1Hc8DpR2s'),
            menu: actionCell('Payment actions', 'row-action/specimen-2'),
          },
        },
        {
          name: 'table-row/specimen-3',
          cells: {
            customer: personCell('Quarry Analytics', 'finance@quarry.example', 'QA'),
            amount: amountCell('$129.00', 'USD'),
            status: badgeCell({ label: 'Failed', tone: 'critical', dot: true }),
            id: codeCell('pay_3Qv9Tn4XbM7e'),
            menu: actionCell('Payment actions', 'row-action/specimen-3'),
          },
        },
      ],
    }));
    tables.appendChild(tableCard.frame);
    tables.appendChild(await note('A selected row takes the accent tint; hovered rows take the subtle surface.', wide));

    const width = columnWidth(layout, 3);
    const third = await column(layout.body, width);
    const people = await section(third, 'Avatar and list row', width);
    const faces = await frame({ name: 'avatars', dir: 'H', gap: dim('space/12'), align: 'CENTER' });
    for (const size of AVATAR_SIZES) faces.appendChild(await avatar({ initials: 'MC', label: 'Maya Castellanos', size }));
    for (const size of AVATAR_SIZES) faces.appendChild(await avatar({ initials: 'QA', label: 'Quarry Analytics', size, tone: 'neutral' }));
    people.appendChild(faces);
    const listCard = await card({ w: width, gap: 0 });
    listCard.body.appendChild(await listRow({
      w: listCard.bodyWidth, label: 'Brightline Studio', detail: '184 payments', leading: { initials: 'BS' },
      value: { text: '$48,210', caption: 'Lifetime' },
    }));
    listCard.body.appendChild(await listRow({
      w: listCard.bodyWidth, label: 'Payout to Northbank ···· 6021', detail: 'Arrives Sept 19', leading: { icon: 'building-library' },
      badge: { label: 'In transit', tone: 'accent' }, divider: true,
    }));
    people.appendChild(listCard.frame);

    const facts = await section(third, 'Description list', width);
    facts.appendChild(await descriptionList([
      { label: 'Payment ID', value: 'pay_3Qx7L2m9ZkT4', code: true },
      { label: 'Method', value: (room) => iconCell('credit-card', 'Visa ···· 4242')(room) },
      { label: 'Risk', value: () => badge({ label: 'Normal', tone: 'positive' }) },
    ], width, 112));
    facts.appendChild(await factStrip([
      { label: 'Date', value: 'Sept 16', icon: 'calendar' },
      { label: 'Method', value: 'Amex ···· 1005', icon: 'credit-card' },
      { label: 'Risk', value: 'Normal', icon: 'shield-check' },
    ], width));
    facts.appendChild(await note('A fact strip sits under a page title; it wraps without rules when the row is too narrow.', width));

    const events = await section(third, 'Timeline', width);
    events.appendChild(await timeline([
      { icon: 'check-circle', tone: 'positive', title: 'Payment succeeded', detail: 'Captured in full', time: '14:32' },
      { icon: 'shield-check', tone: 'accent', title: 'Risk check passed', time: '14:31' },
      { icon: 'credit-card', title: 'Payment started', detail: 'Visa ···· 4242', time: '14:31' },
    ], width));

    const shares = await section(third, 'Progress and bar list', width);
    shares.appendChild(await progress({ w: width, label: 'Monthly goal', detail: '$842k of $1M', value: 0.84 }));
    shares.appendChild(await barList([
      { label: 'Cards', value: '64%', share: 0.64 },
      { label: 'Bank transfers', value: '21%', share: 0.21 },
    ], width));
    shares.appendChild(await note('Shares are written as values; the bars only compare them.', width));
    return layout.frame;
  },
});
