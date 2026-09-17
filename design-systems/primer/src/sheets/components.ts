/* C1–C4 · Components: buttons, labels, form controls and navigation. */

import {
  actionList,
  avatar,
  avatarStack,
  branchName,
  breadcrumbs,
  button,
  checkbox,
  cols,
  counterLabel,
  f as createFrame,
  formControl,
  iconButton,
  label,
  navList,
  pagination,
  radio,
  segmentedControl,
  select,
  span,
  stateLabel,
  strut as createStrut,
  t as createText,
  textarea,
  textInput,
  toggleSwitch,
  token,
  underlineNav,
  type ButtonVariant,
  type InteractionState,
  type LabelVariant,
} from '../index.ts';
import { block, caption, defineSheet, ruleRow, sheet } from './support.ts';

const VARIANTS: ReadonlyArray<readonly [ButtonVariant, string, string]> = [
  ['default', 'Edit', 'Most actions.'],
  ['primary', 'Promote', 'The one action that leads a view.'],
  ['invisible', 'Discard', 'Quiet actions in dense places.'],
  ['danger', 'Roll back', 'Destructive; solid only when engaged.'],
];
const STATES: readonly InteractionState[] = ['rest', 'hover', 'active', 'focus', 'disabled', 'loading'];

export const sheetC1 = defineSheet({ code: 'C1', group: 'Components', title: 'Buttons', build: async () => {
  const sh = await sheet({
    code: 'C1', title: 'Buttons',
    note: 'Four variants, six states, three sizes',
    rule: 'Hover and press change the surface; focus adds Primer\'s inset outline; loading keeps the label\'s width and shows a spinner.',
  });
  const labelWidth = 120;
  const cell = Math.floor((sh.w - labelWidth - 16 * STATES.length) / STATES.length);
  const head = await createFrame({ name: 'matrix-head', dir: 'H', w: sh.w, h: 20, gap: 16, align: 'CENTER' });
  head.appendChild(await createStrut(labelWidth, 1));
  for (const state of STATES) head.appendChild(await createText({ style: 'body/small-600', text: state, color: 'fgColor/muted', w: cell }));
  sh.body.appendChild(head);
  const matrix = await createFrame({ name: 'matrix', dir: 'V', w: sh.w, gap: 12 });
  for (const [variant, text, use] of VARIANTS) {
    const row = await createFrame({ name: 'row/' + variant, dir: 'H', w: sh.w, h: 64, gap: 16, align: 'CENTER' });
    const name = await createFrame({ name: 'row-label', dir: 'V', w: labelWidth, gap: 0 });
    name.appendChild(await createText({ style: 'body/medium-600', text: variant }));
    name.appendChild(await caption(use, labelWidth));
    row.appendChild(name);
    for (const state of STATES) {
      const holder = await createFrame({ name: 'cell', dir: 'H', w: cell, h: 40, align: 'CENTER' });
      holder.appendChild(await button({ label: text, variant, state }));
      row.appendChild(holder);
    }
    matrix.appendChild(row);
  }
  sh.body.appendChild(matrix);

  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'button-details', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const sizes = await block({ w: left, title: 'Sizes', note: '28 · 32 · 40', dir: 'H', gap: 12, wrap: true, rowGap: 12 });
  sizes.body.appendChild(await button({ label: 'Small', size: 'small' }));
  sizes.body.appendChild(await button({ label: 'Medium' }));
  sizes.body.appendChild(await button({ label: 'Large', size: 'large' }));
  sizes.body.appendChild(await button({ label: 'Draft a release', variant: 'primary', leadingVisual: 'plus', size: 'large' }));
  row.appendChild(sizes.frame);
  const parts = await block({ w: middle, title: 'Visuals, counters and menus', dir: 'H', gap: 12, wrap: true, rowGap: 12 });
  parts.body.appendChild(await button({ label: 'Checks', leadingVisual: 'checklist', count: 12 }));
  parts.body.appendChild(await button({ label: 'Approve', variant: 'primary', count: 3 }));
  parts.body.appendChild(await button({ label: 'Newest', leadingVisual: 'sort-desc', trailingAction: true }));
  parts.body.appendChild(await button({ label: 'Promote', inactive: true }));
  row.appendChild(parts.frame);
  const icons = await block({ w: right, title: 'Icon buttons', note: 'always named', dir: 'H', gap: 12, wrap: true, rowGap: 12 });
  icons.body.appendChild(await iconButton({ icon: 'kebab-horizontal', label: 'More actions' }));
  icons.body.appendChild(await iconButton({ icon: 'x', label: 'Close', variant: 'invisible' }));
  icons.body.appendChild(await iconButton({ icon: 'trash', label: 'Delete', variant: 'danger' }));
  icons.body.appendChild(await iconButton({ icon: 'bell', label: 'Notifications', state: 'focus' }));
  icons.body.appendChild(await iconButton({ icon: 'sync', label: 'Refresh', state: 'loading' }));
  icons.body.appendChild(await iconButton({ icon: 'pencil', label: 'Edit', size: 'small' }));
  row.appendChild(icons.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

const LABEL_VARIANTS: readonly LabelVariant[] = ['default', 'secondary', 'accent', 'success', 'attention', 'severe', 'danger', 'done'];
const PEOPLE = [
  { initials: 'RO', name: 'Rhea Okafor' },
  { initials: 'KL', name: 'Kai Lindqvist' },
  { initials: 'PR', name: 'Priya Raman' },
  { initials: 'TF', name: 'Tomás Ferreira' },
];

export const sheetC2 = defineSheet({ code: 'C2', group: 'Components', title: 'Labels and identity', build: async () => {
  const sh = await sheet({
    code: 'C2', title: 'Labels and identity',
    note: 'Label, StateLabel, CounterLabel, Token, BranchName, Avatar',
    rule: 'A state is a StateLabel: an emphasis fill, an Octicon and a word. A Label only categorises; it never reports a state.',
  });
  const labels = await block({ w: sh.w, title: 'Label', note: 'small and large', dir: 'H', gap: 8, wrap: true, rowGap: 8 });
  for (const variant of LABEL_VARIANTS) labels.body.appendChild(await label({ text: variant, variant }));
  for (const variant of LABEL_VARIANTS.slice(0, 3)) labels.body.appendChild(await label({ text: variant + ' large', variant, size: 'large' }));
  sh.body.appendChild(labels.frame);

  const states = await block({ w: sh.w, title: 'StateLabel', note: 'small and medium', dir: 'H', gap: 8, wrap: true, rowGap: 8 });
  const statuses = [
    ['open', 'Rolling out', 'rocket'], ['done', 'Shipped', 'check-circle'], ['closed', 'Rolled back', 'history'],
    ['draft', 'Draft', 'file-diff'], ['queued', 'Queued', 'clock'], ['unavailable', 'Archived', 'blocked'],
  ] as const;
  for (const [status, text, glyph] of statuses) states.body.appendChild(await stateLabel({ status, text, icon: glyph }));
  for (const [status, text, glyph] of statuses) states.body.appendChild(await stateLabel({ status, text, icon: glyph, size: 'small' }));
  sh.body.appendChild(states.frame);

  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'identity', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const counters = await block({ w: left, title: 'CounterLabel and Token', dir: 'H', gap: 8, wrap: true, rowGap: 8 });
  counters.body.appendChild(await counterLabel({ count: 12 }));
  counters.body.appendChild(await counterLabel({ count: 3, variant: 'primary' }));
  counters.body.appendChild(await counterLabel({ count: '1.2k' }));
  counters.body.appendChild(await token({ text: 'Production', icon: 'server' }));
  counters.body.appendChild(await token({ text: 'Staging', selected: true }));
  counters.body.appendChild(await token({ text: 'large', size: 'large' }));
  row.appendChild(counters.frame);
  const branches = await block({ w: middle, title: 'BranchName', dir: 'H', gap: 8, wrap: true, rowGap: 8 });
  branches.body.appendChild(await branchName('release/4.12'));
  branches.body.appendChild(await branchName('main', false));
  branches.body.appendChild(await ruleRow(middle, 'A branch is monospace on the accent tint, and a link when it goes somewhere.'));
  row.appendChild(branches.frame);
  const people = await block({ w: right, title: 'Avatar and AvatarStack', dir: 'H', gap: 12, wrap: true, rowGap: 12 });
  for (const size of [16, 20, 24, 32, 40] as const) people.body.appendChild(await avatar({ ...PEOPLE[0], size, series: size % 4 }));
  people.body.appendChild(await avatarStack({ people: PEOPLE }));
  people.body.appendChild(await avatarStack({ people: PEOPLE.slice(0, 3), size: 24 }));
  row.appendChild(people.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetC3 = defineSheet({ code: 'C3', group: 'Components', title: 'Form controls', build: async () => {
  const sh = await sheet({
    code: 'C3', title: 'Form controls',
    note: 'FormControl, TextInput, Select, Textarea and choices',
    rule: 'A field always has a visible label. Validation sits under the field with an icon and words; the caption comes after it.',
  });
  const [left, middle, right] = span(sh.w, [4, 4, 4], 32);
  const row = await createFrame({ name: 'forms', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const fields = await block({ w: left, title: 'Text inputs', gap: 16 });
  fields.body.appendChild(await formControl(
    await textInput({ w: left, value: 'storefront', accessibleName: 'Project name' }),
    { w: left, label: 'At rest', required: true },
  ));
  fields.body.appendChild(await formControl(
    await textInput({ w: left, placeholder: 'Search releases', leadingVisual: 'search', accessibleName: 'Search releases', focused: true }),
    { w: left, label: 'Focused, with a leading visual' },
  ));
  fields.body.appendChild(await formControl(
    await textInput({ w: left, value: 'v4..12', validation: 'error', accessibleName: 'Release name' }),
    { w: left, label: 'Invalid', validation: { variant: 'error', message: 'Use major.minor.patch, for example v4.12.0.' } },
  ));
  fields.body.appendChild(await formControl(
    await textInput({ w: left, value: 'acme-inc', disabled: true, accessibleName: 'Organisation' }),
    { w: left, label: 'Disabled', disabled: true, caption: 'Set by the organisation.' },
  ));
  row.appendChild(fields.frame);

  const others = await block({ w: middle, title: 'Select and Textarea', gap: 16 });
  others.body.appendChild(await formControl(
    await select({ w: middle, value: 'main', accessibleName: 'Default branch' }),
    { w: middle, label: 'Select', caption: 'Releases are cut from this branch.' },
  ));
  others.body.appendChild(await formControl(
    await select({ w: middle, placeholder: 'Choose an environment', accessibleName: 'Environment', focused: true }),
    { w: middle, label: 'Select, focused' },
  ));
  others.body.appendChild(await formControl(
    await textarea({ w: middle, value: 'Faster checkout: fewer steps, and payment details are remembered.', accessibleName: 'Release notes' }),
    { w: middle, label: 'Textarea', validation: { variant: 'success', message: 'Release notes saved.' } },
  ));
  row.appendChild(others.frame);

  const choices = await block({ w: right, title: 'Choices', gap: 12 });
  choices.body.appendChild(await checkbox({ label: 'Unit tests', caption: 'Runs on every commit.', checked: true, w: right }));
  choices.body.appendChild(await checkbox({ label: 'Visual regression', w: right }));
  choices.body.appendChild(await checkbox({ label: 'Some environments', indeterminate: true, w: right }));
  choices.body.appendChild(await checkbox({ label: 'Security scan (required by policy)', checked: true, disabled: true, w: right }));
  const marks = await createFrame({ name: 'choice-marks', dir: 'H', gap: 16, align: 'CENTER' });
  marks.appendChild(await checkbox({ focused: true }));
  marks.appendChild(await radio({ checked: true, focused: true }));
  marks.appendChild(await radio({}));
  marks.appendChild(await radio({ disabled: true }));
  choices.body.appendChild(marks);
  choices.body.appendChild(await radio({ label: 'Roll out gradually', checked: true, w: right }));
  choices.body.appendChild(await radio({ label: 'Release to everyone at once', w: right }));
  const switches = await createFrame({ name: 'switches', dir: 'H', gap: 16, wrap: true, rowGap: 8, w: right });
  switches.appendChild(await toggleSwitch({ label: 'Automatic rollback', on: true }));
  switches.appendChild(await toggleSwitch({ label: 'Deploy previews', focused: true }));
  switches.appendChild(await toggleSwitch({ label: 'Canary', size: 'small', disabled: true }));
  choices.body.appendChild(switches);
  choices.body.appendChild(await segmentedControl({
    accessibleName: 'Chart range', focusedIndex: 1,
    options: [{ label: 'Week' }, { label: 'Month', selected: true }, { label: 'Quarter' }],
  }));
  row.appendChild(choices.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });

export const sheetC4 = defineSheet({ code: 'C4', group: 'Components', title: 'Navigation', build: async () => {
  const sh = await sheet({
    code: 'C4', title: 'Navigation',
    note: 'UnderlineNav, NavList, ActionList, Breadcrumbs, Pagination',
    rule: 'The current page is marked three ways at once: a semibold label, an indicator, and aria-current.',
  });
  const tabs = await block({ w: sh.w, title: 'UnderlineNav', note: 'current · hovered · focused', gap: 8 });
  tabs.body.appendChild(await underlineNav({
    w: sh.w, accessibleName: 'Specimen',
    items: [
      { label: 'Overview', icon: 'home', current: true },
      { label: 'Releases', icon: 'tag', count: 32, hovered: true },
      { label: 'Environments', icon: 'server', focused: true },
      { label: 'Settings', icon: 'gear' },
    ],
    itemPrefix: 'specimen-tab/',
  }));
  sh.body.appendChild(tabs.frame);

  const [left, middle, right] = cols(sh.w, 3, 32);
  const row = await createFrame({ name: 'navigation', dir: 'H', w: sh.w, gap: 32, align: 'MIN' });
  const nav = await block({ w: left, title: 'NavList', gap: 0 });
  nav.body.appendChild(await navList({
    w: left, heading: 'Project settings', itemPrefix: 'specimen-nav/',
    items: [
      { label: 'General', leadingVisual: 'gear', current: true },
      { label: 'Environments', leadingVisual: 'server', trailingCount: 3, state: 'hover' },
      { label: 'Checks', leadingVisual: 'checklist', state: 'focus' },
      { label: 'Access', leadingVisual: 'people', state: 'disabled' },
    ],
  }));
  row.appendChild(nav.frame);
  const menu = await block({ w: middle, title: 'ActionList', note: 'with dividers', gap: 0 });
  menu.body.appendChild(await actionList({
    w: middle, dividers: true,
    items: [
      { label: 'Copy version', leadingVisual: 'copy', trailingText: '⌘C' },
      { label: 'View on Staging', leadingVisual: 'link-external', description: 'Opens staging.storefront.example' },
      { label: 'Pause rollout', leadingVisual: 'stop', state: 'active' },
      { label: 'Delete draft', leadingVisual: 'trash', variant: 'danger' },
    ],
  }));
  row.appendChild(menu.frame);
  const trail = await block({ w: right, title: 'Breadcrumbs and Pagination', gap: 16 });
  trail.body.appendChild(await breadcrumbs([{ label: 'acme-inc' }, { label: 'Releases', focused: true }, { label: 'v4.12.0' }]));
  trail.body.appendChild(await pagination({ currentPage: 1, pageCount: 12 }));
  trail.body.appendChild(await pagination({ currentPage: 3, pageCount: 5, focusedPage: 3 }));
  trail.body.appendChild(await ruleRow(right,
    'Pagination shows the first and last pages, the current page and its neighbours.',
    'A page count the service cannot vouch for.'));
  row.appendChild(trail.frame);
  sh.body.appendChild(row);
  return sh.frame;
} });
