/* Rows and cells the Relay screens share. */

import {
  type ActivityEvent,
  type Check,
  type Environment,
  type RelayData,
  type Release,
  type ReleaseState,
  personById,
} from '../../fixtures/public.ts';
import {
  avatar,
  box,
  counterLabel,
  dim,
  f as createFrame,
  icon,
  label,
  progressBar,
  strut as createStrut,
  strutForRow,
  t as createText,
  type ColorToken,
  type IconName,
  type LabelVariant,
  type StateLabelStatus,
} from '../../kit/public.ts';

export interface ReleaseStateSpec {
  readonly icon: IconName;
  readonly ink: ColorToken;
  readonly label: string;
  readonly status: StateLabelStatus;
}

/** How a release state reads: a word, a StateLabel status, an Octicon and its ink. */
export const RELEASE_STATES: Readonly<Record<ReleaseState, ReleaseStateSpec>> = Object.freeze({
  draft: { label: 'Draft', status: 'draft', icon: 'file-diff', ink: 'fgColor/draft' },
  queued: { label: 'Queued', status: 'queued', icon: 'clock', ink: 'fgColor/attention' },
  rollingOut: { label: 'Rolling out', status: 'open', icon: 'rocket', ink: 'fgColor/open' },
  shipped: { label: 'Shipped', status: 'done', icon: 'check-circle', ink: 'fgColor/done' },
  rolledBack: { label: 'Rolled back', status: 'closed', icon: 'history', ink: 'fgColor/closed' },
});

const LABEL_VARIANTS: Readonly<Record<string, LabelVariant>> = Object.freeze({
  bug: 'danger',
  feature: 'accent',
  performance: 'success',
  checkout: 'done',
  search: 'attention',
});

type Row = SceneNode & LayoutMixin;

const checksSummary = async function (release: Release): Promise<FrameNode> {
  const { passed, total, running, failed } = release.checks;
  const glyph: IconName = failed ? 'x-circle-fill' : running ? 'dot-fill' : 'check-circle-fill';
  const ink: ColorToken = failed ? 'fgColor/danger' : running ? 'fgColor/attention' : 'fgColor/success';
  const row = await createFrame({ name: 'checks-summary', dir: 'H', gap: dim('base/size/4'), align: 'CENTER' });
  row.appendChild(icon(glyph, ink, 16));
  row.appendChild(await createText({ style: 'body/small', text: passed + '/' + total, color: 'fgColor/muted' }));
  row.setPluginData('aria.accessible-name', passed + ' of ' + total + ' checks passed'
    + (running ? ', ' + running + ' running' : '') + (failed ? ', ' + failed + ' failed' : ''));
  return row;
};

/** One release in a list: state, title, labels, what and who, and its checks. */
export const releaseRow = async function (data: RelayData, release: Release, width: number): Promise<FrameNode> {
  const state = RELEASE_STATES[release.state];
  const author = personById(data, release.authorId);
  const row = await createFrame({
    name: 'release-row/' + release.id, dir: 'H', w: width, gap: dim('base/size/8'), align: 'MIN',
    pad: [dim('base/size/12'), dim('base/size/16'), dim('base/size/12'), dim('base/size/16')],
  });
  const marker = await createFrame({ name: 'release-row/state', dir: 'V', pad: [dim('base/size/4'), 0, 0, 0] });
  marker.appendChild(icon(state.icon, state.ink, 16));
  row.appendChild(marker);

  const trailing: Row[] = [await checksSummary(release)];
  if (author) trailing.push(await avatar({ initials: author.initials, name: author.name, series: Number(author.id.slice(1)) }));
  const trailingWidth = trailing.reduce((sum, node) => sum + node.width, 0) + 16 * trailing.length;
  const mainWidth = width - 32 - 24 - trailingWidth;
  const main = await createFrame({ name: 'release-row/main', dir: 'V', w: mainWidth, gap: dim('base/size/4') });
  const titleLine = await createFrame({ name: 'release-row/title', dir: 'H', w: mainWidth, gap: dim('base/size/8'), align: 'CENTER' });
  const labels: FrameNode[] = [];
  for (const name of release.labels) labels.push(await label({ text: name, variant: LABEL_VARIANTS[name] || 'default' }));
  const labelsWidth = labels.reduce((sum, node) => sum + node.width + 8, 0);
  titleLine.appendChild(await createText({
    style: 'title/small', text: release.version + ' · ' + release.title, maxW: Math.max(40, mainWidth - labelsWidth),
  }));
  for (const node of labels) titleLine.appendChild(node);
  main.appendChild(titleLine);
  main.appendChild(await createText({
    style: 'body/small', color: 'fgColor/muted', w: mainWidth, truncate: true,
    text: state.label + ' · #' + release.number + ' · created ' + release.created
      + (author ? ' by ' + author.name : '') + ' · ' + release.commits + ' commits',
  }));
  row.appendChild(main);

  const side = await createFrame({ name: 'release-row/side', dir: 'H', gap: dim('base/size/16'), align: 'CENTER', pad: [dim('base/size/4'), 0, 0, 0] });
  for (const node of trailing) side.appendChild(node);
  row.appendChild(side);
  row.setPluginData('aria.role', 'link');
  row.setPluginData('aria.accessible-name', release.version + ' ' + release.title + ', ' + state.label);
  return row;
};

/** A box of releases; an empty list says so and offers the next step. */
export const releaseList = async function (
  data: RelayData,
  releases: readonly Release[],
  width: number,
  header: { title: string; count?: number; actions?: readonly FrameNode[] },
): Promise<FrameNode> {
  const rows: FrameNode[] = [];
  for (const release of releases) rows.push(await releaseRow(data, release, width));
  if (!rows.length) {
    const empty = await createFrame({ name: 'release-list/empty', dir: 'V', w: width, pad: dim('base/size/32'), align: 'CENTER', gap: dim('base/size/8') });
    empty.appendChild(icon('tag', 'fgColor/muted', 24));
    empty.appendChild(await createText({ style: 'title/small', text: 'No releases yet', align: 'CENTER' }));
    empty.appendChild(await createText({
      style: 'body/medium', color: 'fgColor/muted', w: Math.min(width - 64, 360), align: 'CENTER',
      text: 'Draft a release from a branch to start tracking its checks and rollout.',
    }));
    rows.push(empty);
  }
  return box({
    name: 'Release list', w: width, rows,
    header: {
      title: header.title,
      count: header.count == null ? undefined : await counterLabel({ count: header.count }),
      actions: header.actions,
    },
  });
};

const CHECK_WORDS: Readonly<Record<Check['state'], readonly [IconName, ColorToken, string]>> = Object.freeze({
  success: ['check-circle-fill', 'fgColor/success', 'Passed in '],
  running: ['dot-fill', 'fgColor/attention', 'Running for '],
  failure: ['x-circle-fill', 'fgColor/danger', 'Failed after '],
  skipped: ['skip', 'fgColor/muted', 'Skipped after '],
});

/** One check: its state as an icon and words, its summary and its duration. */
export const checkRow = async function (check: Check, width: number): Promise<FrameNode> {
  const [glyph, ink, prefix] = CHECK_WORDS[check.state];
  const row = await createFrame({
    name: 'check/' + check.name, dir: 'H', w: width, h: 48, gap: dim('base/size/8'), align: 'CENTER',
    pad: [0, dim('base/size/16'), 0, dim('base/size/16')],
  });
  row.appendChild(icon(glyph, ink, 16));
  const name = await createText({ style: 'body/medium-600', text: check.name });
  const duration = await createText({ style: 'body/small', text: prefix + check.duration, color: 'fgColor/muted' });
  const details = await createText({ style: 'body/medium', text: 'Details', color: 'fgColor/link' });
  const summaryWidth = Math.max(40, width - 32 - 24 - name.width - duration.width - details.width - 40);
  const summary = await createText({ style: 'body/small', text: check.summary, color: 'fgColor/muted', w: summaryWidth, truncate: true });
  row.appendChild(name);
  row.appendChild(summary);
  row.appendChild(await createStrut(strutForRow(row, [row.children[0] as Row, name, summary, duration, details]), 1));
  row.appendChild(duration);
  row.appendChild(details);
  return row;
};

const ENVIRONMENT_STATES: Readonly<Record<Environment['state'], readonly [string, LabelVariant, ColorToken]>> = Object.freeze({
  healthy: ['Healthy', 'success', 'bgColor/success-emphasis'],
  rollingOut: ['Rolling out', 'attention', 'bgColor/attention-emphasis'],
  building: ['Building', 'accent', 'bgColor/accent-emphasis'],
  degraded: ['Degraded', 'danger', 'bgColor/danger-emphasis'],
});

/** One environment: what runs there, its state and how far the rollout is. */
export const environmentRow = async function (environment: Environment, width: number): Promise<FrameNode> {
  const [word, variant, fill] = ENVIRONMENT_STATES[environment.state];
  const row = await createFrame({
    name: 'environment/' + environment.name, dir: 'H', w: width, gap: dim('base/size/12'), align: 'CENTER',
    pad: [dim('base/size/12'), dim('base/size/16'), dim('base/size/12'), dim('base/size/16')],
  });
  row.appendChild(icon('server', 'fgColor/muted', 16));
  const identity = await createFrame({ name: 'environment/identity', dir: 'V', w: 160, gap: 0 });
  identity.appendChild(await createText({ style: 'body/medium-600', text: environment.name, w: 160, truncate: true }));
  identity.appendChild(await createText({
    style: 'body/small', text: environment.version + ' · ' + environment.updated, color: 'fgColor/muted', w: 160, truncate: true,
  }));
  row.appendChild(identity);
  // A fixed slot keeps every bar starting at the same x, whatever the state word.
  const state = await createFrame({ name: 'environment/state', dir: 'H', w: 96 });
  state.appendChild(await label({ text: word, variant }));
  row.appendChild(state);
  const percent = Math.round(environment.rollout * 100) + '%';
  const share = await createText({ style: 'body/small', text: percent, color: 'fgColor/muted', w: 36, align: 'RIGHT' });
  const barWidth = Math.max(40, width - 32 - 16 - 160 - 96 - 36 - 48);
  row.appendChild(await progressBar({
    w: barWidth, accessibleName: environment.name + ': ' + percent + ' of traffic on ' + environment.version,
    segments: [{ label: environment.version, token: fill, value: environment.rollout * 100 }],
  }));
  row.appendChild(share);
  return row;
};

const ACTIVITY_ICONS: Readonly<Record<ActivityEvent['kind'], IconName>> = Object.freeze({
  promoted: 'rocket',
  checksPassed: 'check',
  rolledBack: 'history',
  drafted: 'file-diff',
  deployed: 'server',
  commented: 'comment',
});

export const activityIcon = function (event: ActivityEvent): IconName {
  return ACTIVITY_ICONS[event.kind];
};

/** Who did what, and when, drawn at a timeline body width. */
export const activityBody = function (data: RelayData, event: ActivityEvent) {
  return async function (width: number): Promise<FrameNode> {
    const person = personById(data, event.actorId);
    const body = await createFrame({ name: 'activity/' + event.id, dir: 'V', w: width, gap: 0 });
    const line = await createFrame({ name: 'activity/line', dir: 'H', w: width, gap: dim('base/size/8'), align: 'CENTER' });
    line.appendChild(await avatar({ initials: person?.initials || '?', name: person?.name || 'Someone', series: Number(event.actorId.slice(1)) }));
    const who = await createText({ style: 'body/medium-600', text: person?.name || 'Someone' });
    line.appendChild(who);
    line.appendChild(await createText({
      style: 'body/medium', text: event.text, color: 'fgColor/muted',
      w: Math.max(40, width - 20 - who.width - 16), truncate: true,
    }));
    body.appendChild(line);
    body.appendChild(await createText({ style: 'body/small', text: event.at, color: 'fgColor/muted', w: width }));
    return body;
  };
};
