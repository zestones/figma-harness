/* C5–C8 · Components: feedback, data, overlays and page patterns. */

import {
  appHeader,
  avatar,
  banner,
  blankslate,
  box,
  button,
  cols,
  counterLabel,
  dataTable,
  dialog,
  dim,
  f as createFrame,
  icon,
  inlineMessage,
  label,
  overlayBackdrop,
  pageHeader,
  progressBar,
  skeletonBox,
  span,
  spinner,
  stateLabel,
  t as createText,
  timeline,
  tooltip,
  abs,
  type InlineMessageVariant,
} from '../index.ts';
import { block, caption, defineSheet, ruleRow, sheet } from './support.ts';

export const sheetC5 = defineSheet({ code: 'C5', group: 'Components', title: 'Feedback', build: async () => {
  const sh = await sheet({
    code: 'C5', title: 'Feedback',
    note: 'Banner, InlineMessage, Blankslate, ProgressBar, Spinner',
    rule: 'A failed action stays on the page as a critical Banner until the person dismisses it or the action succeeds; nothing times out.',
  });
  const [left, right] = span(sh.w, [7, 5], 32);
  const row = await createFrame({ name: 'feedback', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const banners = await block({ w: left, title: 'Banner', note: 'critical · warning · info · success', gap: 12 });
  banners.body.appendChild(await banner({
    variant: 'critical', w: left, dismissible: true, title: 'Settings could not be saved',
    description: 'The release service did not answer in time. Your change is still here; try again.',
  }));
  banners.body.appendChild(await banner({
    variant: 'warning', w: left, title: 'One check is still running',
    description: 'Visual regression has compared 38 of 64 screens.',
    actions: [await button({ label: 'View check', size: 'small' })],
  }));
  banners.body.appendChild(await banner({ variant: 'info', w: left, title: 'Deploy previews are on for this project.' }));
  banners.body.appendChild(await banner({ variant: 'success', w: left, title: 'v4.11.2 is on all of Production.' }));
  row.appendChild(banners.frame);

  const side = await createFrame({ name: 'feedback/side', dir: 'V', w: right, gap: dim('stack/gap/spacious') });
  const inline = await block({ w: right, title: 'InlineMessage', gap: 8 });
  const messages: ReadonlyArray<readonly [InlineMessageVariant, string]> = [
    ['critical', 'The release name is already taken.'],
    ['warning', 'This rollout has no approver yet.'],
    ['success', 'All 12 checks passed.'],
    ['unavailable', 'Metrics are unavailable for Preview.'],
  ];
  for (const [variant, text] of messages) inline.body.appendChild(await inlineMessage(variant, text, right));
  side.appendChild(inline.frame);
  const progress = await block({ w: right, title: 'ProgressBar and loading', gap: 12 });
  progress.body.appendChild(await progressBar({
    w: right, accessibleName: '60% rolled out',
    segments: [{ label: 'rolled out', token: 'bgColor/attention-emphasis', value: 60 }],
  }));
  progress.body.appendChild(await progressBar({
    w: right, size: 'large', accessibleName: '11 passed, 1 failed of 12 checks',
    segments: [
      { label: 'passed', token: 'bgColor/success-emphasis', value: 11 },
      { label: 'failed', token: 'bgColor/danger-emphasis', value: 1 },
    ],
    total: 12,
  }));
  progress.body.appendChild(await caption('11 passed · 1 failed', right));
  const loading = await createFrame({ name: 'loading', dir: 'H', w: right, gap: dim('base/size/12'), align: 'CENTER' });
  loading.appendChild(spinner('fgColor/muted', 16));
  loading.appendChild(spinner('fgColor/accent', 32));
  const skeletons = await createFrame({ name: 'skeletons', dir: 'V', w: right - 80, gap: dim('base/size/8') });
  skeletons.appendChild(await skeletonBox(right - 80, 16));
  skeletons.appendChild(await skeletonBox(Math.round((right - 80) * 0.6), 16));
  loading.appendChild(skeletons);
  progress.body.appendChild(loading);
  side.appendChild(progress.frame);
  row.appendChild(side);
  sh.body.appendChild(row);
  return sh.frame;
} });

const eventText = async function (text: string, width: number): Promise<FrameNode> {
  const frame = await createFrame({ name: 'event-text', dir: 'V', w: width });
  frame.appendChild(await createText({ style: 'body/medium', text, color: 'fgColor/muted', w: width }));
  return frame;
};

export const sheetC6 = defineSheet({ code: 'C6', group: 'Components', title: 'Data and lists', build: async () => {
  const sh = await sheet({
    code: 'C6', title: 'Data and lists',
    note: 'Box, DataTable, Timeline and Blankslate',
    rule: 'Rows divide with borderColor/muted; the container edge is borderColor/default. An empty list says why and what to do next.',
  });
  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'data', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });

  const tableBlock = await block({ w: left + middle + 32, title: 'DataTable', gap: 16 });
  tableBlock.body.appendChild(await dataTable({
    w: left + middle + 32, name: 'Checks', rowPrefix: 'specimen-row/',
    columns: [
      { field: 'check', header: 'Check', weight: 2, rowHeader: true },
      { field: 'state', header: 'State', weight: 1.4 },
      { field: 'duration', header: 'Duration', weight: 1, align: 'end' },
    ],
    rows: [
      { id: 'unit', cells: { check: 'Unit tests', state: () => stateLabel({ status: 'done', text: 'Passed', icon: 'check-circle', size: 'small' }), duration: '2m 14s' } },
      { id: 'visual', cells: { check: 'Visual regression', state: () => stateLabel({ status: 'queued', text: 'Running', icon: 'dot-fill', size: 'small' }), duration: '4m 40s' } },
      { id: 'a11y', cells: { check: 'Accessibility', state: () => stateLabel({ status: 'done', text: 'Passed', icon: 'check-circle', size: 'small' }), duration: '1m 51s' } },
    ],
  }));
  const boxRows: FrameNode[] = [];
  for (const [text, meta] of [['v4.12.0 · Faster checkout', 'Rolling out · 2 hours ago'], ['v4.11.2 · Payment retry fix', 'Shipped · yesterday']]) {
    const line = await createFrame({ name: 'box-row', dir: 'H', w: left + middle + 32, gap: dim('base/size/8'), pad: dim('stack/padding/normal'), align: 'CENTER' });
    line.appendChild(icon('tag', 'fgColor/muted', 16));
    line.appendChild(await createText({ style: 'body/medium-600', text }));
    line.appendChild(await caption(meta));
    boxRows.push(line);
  }
  tableBlock.body.appendChild(await box({
    name: 'box', w: left + middle + 32, rows: boxRows,
    header: { title: 'Releases', count: await counterLabel({ count: 2 }), actions: [await button({ label: 'View all', size: 'small' })] },
  }));
  row.appendChild(tableBlock.frame);

  const side = await createFrame({ name: 'data/side', dir: 'V', w: right, gap: dim('stack/gap/spacious') });
  const events = await block({ w: right, title: 'Timeline', gap: 0 });
  events.body.appendChild(await timeline({
    w: right,
    items: [
      {
        icon: 'rocket', variant: 'open',
        body: async (width) => {
          const line = await createFrame({ name: 'event', dir: 'H', w: width, gap: dim('base/size/8'), align: 'CENTER' });
          line.appendChild(await avatar({ initials: 'RO', name: 'Rhea Okafor' }));
          line.appendChild(await createText({ style: 'body/medium', text: 'Rollout started', color: 'fgColor/muted', maxW: width - 28 }));
          return line;
        },
      },
      { icon: 'check', body: (width) => eventText('All checks passed', width) },
      { icon: 'git-commit', condensed: true, body: (width) => eventText('3 commits added', width) },
    ],
  }));
  side.appendChild(events.frame);
  const empty = await block({ w: right, title: 'Blankslate', gap: 0 });
  empty.body.appendChild(await blankslate({
    w: right, border: true, icon: 'rocket', heading: 'No deployments yet',
    description: 'Promote a release to an environment to see it here.',
    actions: [await button({ label: 'Promote a release', variant: 'primary' })],
  }));
  side.appendChild(empty.frame);
  row.appendChild(side);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetC7 = defineSheet({ code: 'C7', group: 'Components', title: 'Overlays', build: async () => {
  const sh = await sheet({
    code: 'C7', title: 'Overlays',
    note: 'Dialog on its backdrop, and Tooltip',
    rule: 'A dialog is modal: focus moves into it, Escape closes it, and focus returns to the control that opened it.',
  });
  const [left, right] = span(sh.w, [8, 4], 32);
  const row = await createFrame({ name: 'overlays', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const stage = await createFrame({ name: 'dialog-stage', w: left, h: 420, radius: dim('borderRadius/medium'), clip: true, fill: 'bgColor/default', stroke: 'borderColor/default', strokeW: 1 });
  const page = await createFrame({ name: 'stage-page', dir: 'V', w: left, pad: dim('stack/padding/spacious'), gap: dim('base/size/8') });
  page.appendChild(await createText({ style: 'title/medium', text: 'v4.12.0 · Faster checkout' }));
  page.appendChild(await caption('The page behind stays visible, dimmed by the backdrop.', left - 48));
  abs(stage, page, 0, 0);
  abs(stage, await overlayBackdrop(left, 420), 0, 0);
  const specimen = await dialog({
    title: 'Promote v4.12.0 to all traffic?', subtitle: 'Production · currently at 60%',
    body: (width) => createText({ style: 'body/medium', w: width, text: 'Everyone will be served v4.12.0 within five minutes.' }),
    footer: [await button({ label: 'Cancel' }), await button({ label: 'Promote', variant: 'primary' })],
  });
  abs(stage, specimen, Math.round((left - specimen.width) / 2), 72);
  row.appendChild(stage);
  const tips = await block({ w: right, title: 'Tooltip', note: 'names its trigger', gap: 16 });
  const pair = await createFrame({ name: 'tooltip-pair', dir: 'V', gap: dim('base/size/4'), align: 'CENTER' });
  pair.appendChild(await tooltip('Copy version'));
  pair.appendChild(icon('copy', 'fgColor/muted', 16));
  tips.body.appendChild(pair);
  tips.body.appendChild(await tooltip('A longer description wraps at 250 px, and still holds nothing a person must click.'));
  tips.body.appendChild(await ruleRow(right,
    'A tooltip repeats an accessible name or adds a hint.',
    'A tooltip that holds the only copy of an instruction, or a link.'));
  row.appendChild(tips.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetC8 = defineSheet({ code: 'C8', group: 'Components', title: 'Page patterns', build: async () => {
  const sh = await sheet({
    code: 'C8', title: 'Page patterns',
    note: 'App header and PageHeader',
    rule: 'Every screen is an app header over a PageLayout; its PageHeader names the page and holds at most one primary action.',
  });
  sh.body.appendChild(await appHeader({
    w: sh.w,
    product: { name: 'Relay', icon: 'rocket' },
    context: ['acme-inc', 'storefront'],
    search: 'Search or jump to…',
    actions: [{ icon: 'plus', label: 'Create' }, { icon: 'bell', label: 'Notifications' }],
    user: { initials: 'RO', name: 'Rhea Okafor' },
    nav: [
      { label: 'Overview', icon: 'home', current: true },
      { label: 'Releases', icon: 'tag', count: 32 },
      { label: 'Settings', icon: 'gear' },
    ],
  }));
  const headers = await block({ w: sh.w, title: 'PageHeader', note: 'medium · with visuals and actions · large', gap: 24 });
  headers.body.appendChild(await pageHeader({
    w: sh.w, title: 'Releases', hasBorder: true,
    actions: [await button({ label: 'Draft a new release', variant: 'primary', leadingVisual: 'plus' })],
  }));
  headers.body.appendChild(await pageHeader({
    w: sh.w, title: 'v4.12.0 · Faster checkout',
    trailingVisual: await stateLabel({ status: 'open', text: 'Rolling out', icon: 'rocket' }),
    actions: [await button({ label: 'Edit', leadingVisual: 'pencil' }), await button({ label: 'Promote to 100%', variant: 'primary' })],
    description: await label({ text: 'performance', variant: 'success' }),
  }));
  headers.body.appendChild(await pageHeader({ w: sh.w, title: 'Overview', size: 'large' }));
  sh.body.appendChild(headers.frame);
  return sh.frame;
} });
