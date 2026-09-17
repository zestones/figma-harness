/* 05–07 · Settings: the project form at rest, with an unsaved change, and after
 * a failed save. A NavList pane lists the other settings pages. */

import { RELAY } from '../../fixtures/public.ts';
import {
  banner,
  box,
  button,
  checkbox,
  dim,
  f as createFrame,
  formControl,
  navList,
  pageHeader,
  select,
  strut as createStrut,
  strutForRow,
  t as createText,
  textInput,
  toggleSwitch,
} from '../../kit/public.ts';
import { shell } from './frame.ts';

export interface SettingsOptions {
  /** The optional check the person has just made required. */
  changed?: boolean;
  /** Saving that change failed; the change is kept. */
  failed?: boolean;
  name: string;
}

const FIELD_WIDTH = 440;

const dangerRow = async function (title: string, body: string, action: string, width: number): Promise<FrameNode> {
  const row = await createFrame({
    name: 'danger/' + action, dir: 'H', w: width, gap: dim('stack/gap/normal'), align: 'CENTER',
    pad: dim('stack/padding/normal'),
  });
  const text = await createFrame({ name: 'danger/text', dir: 'V', w: width - 32 - 16 - 120, gap: 0 });
  text.appendChild(await createText({ style: 'body/medium-600', text: title, w: width - 168 }));
  text.appendChild(await createText({ style: 'body/medium', text: body, color: 'fgColor/muted', w: width - 168 }));
  row.appendChild(text);
  const trigger = await button({ label: action, variant: 'danger' });
  row.appendChild(await createStrut(strutForRow(row, [text, trigger]), 1));
  row.appendChild(trigger);
  return row;
};

export const screenSettings = async function (options: SettingsOptions): Promise<FrameNode> {
  const data = RELAY;
  const settings = data.settings;
  const dirty = !!options.changed || !!options.failed;
  const layout = await shell({ name: options.name, section: 'Settings', pane: 'start' });
  const width = layout.contentWidth;
  const content = layout.content;

  if (layout.pane) {
    layout.pane.appendChild(await navList({
      w: layout.paneWidth,
      heading: 'Project settings',
      items: [
        { label: 'General', leadingVisual: 'gear', current: true },
        { label: 'Environments', leadingVisual: 'server', trailingCount: data.environments.length },
        { label: 'Checks', leadingVisual: 'checklist' },
        { label: 'Notifications', leadingVisual: 'bell' },
        { label: 'Access', leadingVisual: 'people' },
      ],
    }));
  }

  content.appendChild(await pageHeader({ w: width, title: 'General', hasBorder: true }));

  if (options.failed) {
    content.appendChild(await banner({
      name: 'save-error', variant: 'critical', w: width, dismissible: true,
      title: 'Settings could not be saved',
      description: 'The release service did not answer in time. Your change is still here; try again.',
    }));
  }

  const form = await createFrame({ name: 'Settings form', dir: 'V', w: width, gap: dim('stack/gap/spacious') });
  form.appendChild(await formControl(
    await textInput({ w: FIELD_WIDTH, value: settings.projectName, accessibleName: 'Project name' }),
    { w: FIELD_WIDTH, label: 'Project name', required: true },
  ));
  form.appendChild(await formControl(
    await select({ w: FIELD_WIDTH, value: settings.defaultBranch, accessibleName: 'Default branch' }),
    { w: FIELD_WIDTH, label: 'Default branch', caption: 'Releases are cut from this branch.' },
  ));
  form.appendChild(await formControl(
    await textInput({ w: FIELD_WIDTH, value: settings.nameTemplate, accessibleName: 'Release name template' }),
    { w: FIELD_WIDTH, label: 'Release name template', caption: 'Used when a release is drafted.' },
  ));

  const checks = await createFrame({ name: 'required-checks', dir: 'V', w: FIELD_WIDTH, gap: dim('base/size/12') });
  checks.appendChild(await createText({ style: 'body/medium-600', text: 'Required checks', w: FIELD_WIDTH }));
  for (const check of settings.requiredChecks) {
    const required = check.required || (dirty && check.name === 'Visual regression');
    const row = await checkbox({ checked: required, label: check.name, caption: check.caption, w: FIELD_WIDTH });
    row.name = 'setting/' + check.name;
    checks.appendChild(row);
  }
  form.appendChild(checks);

  const rollback = await createFrame({ name: 'setting/Automatic rollback', dir: 'H', w: width, gap: dim('stack/gap/normal'), align: 'CENTER' });
  const rollbackText = await createFrame({ name: 'rollback/text', dir: 'V', w: FIELD_WIDTH, gap: 0 });
  rollbackText.appendChild(await createText({ style: 'body/medium-600', text: 'Automatic rollback', w: FIELD_WIDTH }));
  rollbackText.appendChild(await createText({
    style: 'body/small', color: 'fgColor/muted', w: FIELD_WIDTH,
    text: 'Roll back a rollout on its own when the error rate passes 2%.',
  }));
  rollback.appendChild(rollbackText);
  rollback.appendChild(await toggleSwitch({ label: 'Automatic rollback', on: settings.autoRollback }));
  form.appendChild(rollback);

  const actions = await createFrame({ name: 'form-actions', dir: 'H', gap: dim('stack/gap/condensed'), align: 'CENTER' });
  actions.appendChild(await button({ label: 'Save changes', variant: 'primary', state: dirty ? 'rest' : 'disabled' }));
  if (dirty) actions.appendChild(await button({ label: 'Discard', variant: 'invisible' }));
  form.appendChild(actions);
  form.setPluginData('spec.form.pristine', String(!dirty));
  content.appendChild(form);

  const dangerHeading = await createText({ style: 'title/medium', text: 'Danger zone' });
  const danger = await box({
    name: 'Danger zone', w: width, border: 'borderColor/danger-emphasis',
    rows: [
      await dangerRow('Archive this project', 'Releases stay readable; nothing new can be drafted.', 'Archive', width),
      await dangerRow('Delete this project', 'Deletes every release, check result and environment. This cannot be undone.', 'Delete', width),
    ],
  });
  const dangerSection = await createFrame({ name: 'danger-section', dir: 'V', w: width, gap: dim('base/size/8') });
  dangerSection.appendChild(dangerHeading);
  dangerSection.appendChild(danger);
  content.appendChild(dangerSection);
  layout.fit();
  return layout.frame;
};
