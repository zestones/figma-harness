/* Every generated screen, grouped as it is laid out on the Screens page. */

import { screenOverview } from './overview.ts';
import { screenRelease } from './release.ts';
import { screenReleases } from './releases.ts';
import { screenSettings } from './settings.ts';

export interface ScreenDefinition {
  readonly build: () => Promise<FrameNode>;
  readonly key: string;
  readonly note?: string;
  readonly title: string;
}

export interface ScreenGroup {
  readonly body: string;
  readonly letter: string;
  /** Screens that take part in the clickable prototype. */
  readonly prototype: boolean;
  readonly screens: readonly ScreenDefinition[];
  readonly title: string;
}

const screen = function (
  key: string,
  title: string,
  build: (name: string) => Promise<FrameNode>,
  note?: string,
): ScreenDefinition {
  return Object.freeze({ key, title, note, build: () => build(title) });
};

export const SCREEN_GROUPS: readonly ScreenGroup[] = Object.freeze([
  Object.freeze({
    letter: 'A',
    title: 'Overview and releases',
    body: 'Release health across environments, then every release, searchable and filterable.',
    prototype: true,
    screens: Object.freeze([
      screen('overview', '01 · Overview', (name) => screenOverview({ name })),
      screen('releases', '02 · Releases', (name) => screenReleases({ name })),
    ]),
  }),
  Object.freeze({
    letter: 'B',
    title: 'Release',
    body: 'One release: its rollout, checks and history, and the dialog that promotes it.',
    prototype: true,
    screens: Object.freeze([
      screen('release', '03 · Release', (name) => screenRelease({ name })),
      screen('releasePromote', '04 · Release — promote', (name) => screenRelease({ name, promoting: true })),
    ]),
  }),
  Object.freeze({
    letter: 'C',
    title: 'Settings',
    body: 'One form: at rest, with an unsaved change, and after a failed save.',
    prototype: true,
    screens: Object.freeze([
      screen('settings', '05 · Settings', (name) => screenSettings({ name })),
      screen('settingsChanged', '06 · Settings — unsaved change', (name) => screenSettings({ name, changed: true })),
      screen('settingsFailed', '07 · Settings — save failed', (name) => screenSettings({ name, failed: true })),
    ]),
  }),
]);

/** Every screen, in canvas order. */
export const ALL_SCREENS: readonly ScreenDefinition[] = Object.freeze(
  SCREEN_GROUPS.flatMap((group) => group.screens),
);

/** Screens wired into the clickable prototype. */
export const PROTOTYPE_SCREENS: readonly ScreenDefinition[] = Object.freeze(
  SCREEN_GROUPS.filter((group) => group.prototype).flatMap((group) => group.screens),
);
