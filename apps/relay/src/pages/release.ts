/* 03 · Release: one release's rollout, checks and history, with its details
 * in a side pane. 04 adds the confirmation dialog for promoting it. */

import { RELAY, personById, releaseById, type RelayData } from '../fixtures/index.ts';
import {
  abs,
  avatar,
  box,
  branchName,
  breadcrumbs,
  button,
  checkbox,
  counterLabel,
  dialog,
  dim,
  f as createFrame,
  icon,
  inlineMessage,
  label,
  overlayBackdrop,
  pageHeader,
  progressBar,
  stateLabel,
  t as createText,
  timeline,
  token,
  underlineNav,
} from '@figma-harness/primer';
import {
  RELEASE_STATES,
  activityBody,
  activityIcon,
  checkRow,
} from './cells.ts';
import { shell } from './frame.ts';

export interface ReleaseOptions {
  name: string;
  /** Show the dialog that confirms promoting the release to all traffic. */
  promoting?: boolean;
}

const paneSection = async function (title: string, width: number, content: FrameNode, last = false): Promise<FrameNode> {
  const section = await createFrame({
    name: 'pane/' + title, dir: 'V', w: width, gap: dim('base/size/8'),
    pad: [0, 0, last ? 0 : dim('stack/padding/normal'), 0],
    stroke: last ? null : 'borderColor/muted', strokeSide: 'Bottom', strokeW: 1,
  });
  section.appendChild(await createText({ style: 'body/small-600', text: title, color: 'fgColor/muted' }));
  section.appendChild(content);
  return section;
};

const wrapRow = function (name: string, width: number): Promise<FrameNode> {
  return createFrame({ name, dir: 'H', w: width, gap: dim('base/size/4'), wrap: true, rowGap: dim('base/size/4') });
};

const sidePane = async function (data: RelayData, pane: FrameNode, width: number): Promise<void> {
  const detail = data.release;
  const release = releaseById(data, detail.id);
  const environments = await wrapRow('pane/environments', width);
  for (const name of detail.environments) environments.appendChild(await token({ text: name, icon: 'server' }));
  pane.appendChild(await paneSection('Environments', width, environments));

  const approvers = await createFrame({ name: 'pane/approvers', dir: 'V', w: width, gap: dim('base/size/8') });
  const people = detail.approverIds.map((id) => personById(data, id));
  for (const person of people) {
    if (!person) continue;
    const line = await createFrame({ name: 'approver/' + person.handle, dir: 'H', w: width, gap: dim('base/size/8'), align: 'CENTER' });
    line.appendChild(await avatar({ initials: person.initials, name: person.name, series: Number(person.id.slice(1)) }));
    line.appendChild(await createText({ style: 'body/medium-600', text: person.name, maxW: width - 52 }));
    line.appendChild(icon('check', 'fgColor/success', 16));
    approvers.appendChild(line);
  }
  if (!people.some((person) => !!person)) {
    approvers.appendChild(await createText({ style: 'body/medium', text: 'No approvals yet', color: 'fgColor/muted' }));
  }
  pane.appendChild(await paneSection('Approvers', width, approvers));

  const labels = await wrapRow('pane/labels', width);
  for (const name of release?.labels || []) labels.appendChild(await label({ text: name }));
  if (!release?.labels.length) labels.appendChild(await createText({ style: 'body/medium', text: 'None yet', color: 'fgColor/muted' }));
  pane.appendChild(await paneSection('Labels', width, labels));

  const milestone = await createFrame({ name: 'pane/milestone', dir: 'V', w: width, gap: dim('base/size/4') });
  milestone.appendChild(await progressBar({
    w: width, accessibleName: detail.milestone.name + ': ' + Math.round(detail.milestone.progress * 100) + '% complete',
    segments: [{ label: 'complete', token: 'bgColor/success-emphasis', value: detail.milestone.progress * 100 }],
  }));
  milestone.appendChild(await createText({
    style: 'body/medium', w: width, truncate: true,
    text: detail.milestone.name + ' · ' + Math.round(detail.milestone.progress * 100) + '% complete',
  }));
  pane.appendChild(await paneSection('Milestone', width, milestone));

  pane.appendChild(await paneSection('Notifications', width,
    await button({ label: 'Subscribe', leadingVisual: 'bell', w: width }), true));
};

/** The share of Production traffic the release is served to, in percent. */
const productionShare = function (data: RelayData): number {
  const production = data.environments.find((environment) => environment.name === 'Production');
  return production ? Math.round(production.rollout * 100) : 0;
};

const rolloutBox = async function (data: RelayData, width: number): Promise<FrameNode> {
  const share = productionShare(data);
  const body = await createFrame({ name: 'rollout/body', dir: 'V', w: width, gap: dim('base/size/12'), pad: dim('stack/padding/normal') });
  body.appendChild(await progressBar({
    w: width - 32, size: 'large', accessibleName: share + '% of Production traffic',
    segments: [{ label: 'Production', token: 'bgColor/attention-emphasis', value: share }],
  }));
  body.appendChild(await createText({
    style: 'body/medium', w: width - 32,
    text: share + '% of Production traffic since ' + data.release.rolloutStarted + '. Error rate 0.4%, under the 2% rollback threshold.',
  }));
  const actions = await createFrame({ name: 'rollout/actions', dir: 'H', gap: dim('stack/gap/condensed') });
  actions.appendChild(await button({ label: 'Pause rollout', leadingVisual: 'stop' }));
  actions.appendChild(await button({ label: 'Roll back', variant: 'danger', leadingVisual: 'history' }));
  body.appendChild(actions);
  return box({
    name: 'Rollout', w: width, rows: [body],
    header: { title: 'Rollout', count: await counterLabel({ count: share + '%' }) },
  });
};

export const screenRelease = async function (options: ReleaseOptions): Promise<FrameNode> {
  const data = RELAY;
  const detail = data.release;
  const release = releaseById(data, detail.id);
  if (!release) throw new Error('the release fixture names an unknown release ' + detail.id);
  const state = RELEASE_STATES[release.state];
  const author = personById(data, release.authorId);
  const layout = await shell({ name: options.name, section: 'Releases', pane: 'end' });
  const width = layout.contentWidth;
  const content = layout.content;

  content.appendChild(await breadcrumbs([{ label: 'Releases' }, { label: release.version }]));

  const description = await createFrame({ name: 'release/byline', dir: 'H', w: width, gap: dim('base/size/8'), align: 'CENTER' });
  if (author) description.appendChild(await avatar({ initials: author.initials, name: author.name, series: 1 }));
  description.appendChild(await createText({
    style: 'body/medium', color: 'fgColor/muted',
    text: (author ? author.name : 'Someone') + ' created this release ' + release.created + ' from',
  }));
  description.appendChild(await branchName(detail.branch));
  description.appendChild(await createText({ style: 'body/medium', color: 'fgColor/muted', text: '· ' + release.commits + ' commits' }));
  content.appendChild(await pageHeader({
    w: width,
    title: release.version + ' · ' + release.title,
    trailingVisual: await stateLabel({ status: state.status, text: state.label, icon: state.icon }),
    actions: [
      await button({ label: 'Edit', leadingVisual: 'pencil' }),
      await button({ label: 'Promote to 100%', variant: 'primary', leadingVisual: 'rocket' }),
    ],
    description,
  }));

  content.appendChild(await underlineNav({
    w: width, flush: true, accessibleName: 'Release', itemPrefix: 'release-tab/',
    items: [
      { label: 'Overview', icon: 'rocket', current: true },
      { label: 'Checks', icon: 'checklist', count: detail.checks.length },
      { label: 'Commits', icon: 'git-commit', count: release.commits },
      { label: 'Environments', icon: 'server', count: detail.environments.length },
    ],
  }));

  content.appendChild(await rolloutBox(data, width));

  const checks: FrameNode[] = [];
  for (const check of detail.checks) checks.push(await checkRow(check, width));
  if (!checks.length) {
    const none = await createFrame({ name: 'checks/empty', dir: 'V', w: width, pad: dim('stack/padding/normal') });
    none.appendChild(await createText({ style: 'body/medium', color: 'fgColor/muted', w: width - 32, text: 'No checks are configured for this project.' }));
    checks.push(none);
  }
  const passed = detail.checks.filter((check) => check.state === 'success').length;
  content.appendChild(await box({
    name: 'Checks', w: width, rows: checks,
    header: { title: 'Checks', count: await counterLabel({ count: passed + '/' + detail.checks.length }) },
  }));

  const history = await createFrame({ name: 'history', dir: 'V', w: width, gap: dim('base/size/8') });
  history.appendChild(await createText({ style: 'title/small', text: 'Activity' }));
  history.appendChild(await timeline({
    w: width,
    items: detail.timeline.map((event) => ({ icon: activityIcon(event), body: activityBody(data, event) })),
  }));
  content.appendChild(history);

  if (layout.pane) await sidePane(data, layout.pane, layout.paneWidth);
  layout.fit();

  if (options.promoting) {
    const frame = layout.frame;
    abs(frame, await overlayBackdrop(frame.width, frame.height), 0, 0);
    const confirm = await dialog({
      name: 'promote-dialog',
      title: 'Promote ' + release.version + ' to all traffic?',
      subtitle: 'Production · currently at ' + productionShare(data) + '%',
      body: async (bodyWidth) => {
        const stack = await createFrame({ name: 'promote/body', dir: 'V', w: bodyWidth, gap: dim('stack/gap/normal') });
        stack.appendChild(await createText({
          style: 'body/medium', w: bodyWidth,
          text: 'Everyone will be served ' + release.version + ' within five minutes. You can roll back at any time.',
        }));
        const running = detail.checks.filter((check) => check.state === 'running');
        if (running.length) {
          stack.appendChild(await inlineMessage('warning',
            running.length + ' check is still running: ' + running.map((check) => check.name).join(', '), bodyWidth));
        }
        stack.appendChild(await checkbox({
          checked: true, w: bodyWidth, label: 'Notify #releases when the rollout completes',
        }));
        return stack;
      },
      footer: [
        await button({ label: 'Cancel' }),
        await button({ label: 'Promote', variant: 'primary', state: 'focus' }),
      ],
    });
    abs(frame, confirm, Math.round((frame.width - confirm.width) / 2), 160);
  }
  return layout.frame;
};
