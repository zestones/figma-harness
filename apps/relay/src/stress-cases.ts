/* Stress cases for the Relay pages: every size-sensitive block and screen,
 * across the sizes and data extremes it must survive. The harness builds each
 * case and fails on any layout issue. Page authors extend this file with the
 * pages they add. */

import { RELAY, type RelayData } from './fixtures/index.ts';
import {
  appHeader,
  banner,
  dataTable,
  dialog,
  pageHeader,
  t as createText,
} from '@figma-harness/primer';
import { APP_ACTIONS, APP_USER, PRODUCT, appNavigation } from './app.ts';
import { releaseList } from './pages/cells.ts';
import { FRAME_H, FRAME_W, setFrameSize } from './pages/frame.ts';
import { screenOverview } from './pages/overview.ts';
import { screenRelease } from './pages/release.ts';
import { screenReleases } from './pages/releases.ts';
import { screenSettings } from './pages/settings.ts';

type StressResult = Promise<unknown> | unknown;

export interface StressBoxCase {
  readonly build: (width: number, height: number) => StressResult;
  readonly heights: readonly number[];
  readonly name: string;
  readonly widths: readonly number[];
}

export interface StressScreenCase {
  readonly build: () => StressResult;
  readonly name: string;
}

export interface StressMutations {
  readonly mutations: ReadonlyArray<readonly [label: string, apply: () => void]>;
  readonly restore: () => void;
}

const LONG_TITLE = 'A deliberately long release title that keeps going well past any sensible column width';
const LONG_PERSON = 'Maximilian Alexander Featherstonehaugh-Montgomery';

export const STRESS_CONTRACT = Object.freeze({
  /** Every size-sensitive public block, across the sizes it must survive. */
  boxes: Object.freeze([
    {
      name: 'appHeader',
      build: (width: number) => appHeader({
        w: width, product: PRODUCT, context: [RELAY.org, RELAY.project], search: 'Search or jump to…',
        actions: APP_ACTIONS, user: APP_USER, nav: appNavigation('Releases', RELAY.counts.total),
      }),
      widths: [1024, 1280, 1440, 1920],
      heights: [113],
    },
    {
      name: 'releaseList',
      build: (width: number) => releaseList(RELAY, RELAY.releases, width, { title: 'All releases', count: RELAY.counts.total }),
      widths: [560, 720, 960, 1280],
      heights: [0],
    },
    {
      name: 'dataTable',
      build: (width: number) => dataTable({
        w: width, rowPrefix: 'stress-row/',
        columns: [
          { field: 'version', header: 'Version', weight: 1.2, rowHeader: true },
          { field: 'title', header: 'Title', weight: 3 },
          { field: 'created', header: 'Created', weight: 1.4, align: 'end' },
        ],
        rows: RELAY.releases.map((release) => ({
          id: release.id, cells: { version: release.version, title: release.title, created: release.created },
        })),
        empty: { icon: 'tag', heading: 'No releases', description: 'Nothing to show yet.' },
      }),
      widths: [360, 560, 960],
      heights: [0],
    },
    {
      name: 'pageHeader',
      build: (width: number) => pageHeader({
        w: width, title: LONG_TITLE,
        description: undefined,
      }),
      widths: [320, 640, 960, 1280],
      heights: [33],
    },
    {
      name: 'banner',
      build: (width: number) => banner({
        w: width, variant: 'critical', dismissible: true, title: LONG_TITLE,
        description: 'The release service did not answer in time. Your change is still here; try again.',
      }),
      widths: [320, 480, 960],
      heights: [0],
    },
    {
      name: 'dialog',
      build: (width: number) => dialog({
        w: width, title: LONG_TITLE, subtitle: 'Production · currently at 60%',
        body: (bodyWidth) => createText({ style: 'body/medium', text: LONG_TITLE, w: bodyWidth }),
      }),
      widths: [320, 480, 640],
      heights: [0],
    },
  ] satisfies readonly StressBoxCase[]),
  /** Whole screens, rebuilt at every supported artboard size. */
  frameSizes: Object.freeze([
    [1024, 768], [1280, 800], [1440, 1024], [1920, 1080], [2560, 1440],
  ] as const),
  screens: Object.freeze([
    { name: 'overview', build: () => screenOverview({ name: 'stress' }) },
    { name: 'releases', build: () => screenReleases({ name: 'stress' }) },
    { name: 'release', build: () => screenRelease({ name: 'stress' }) },
    { name: 'release/promote', build: () => screenRelease({ name: 'stress', promoting: true }) },
    { name: 'settings/failed', build: () => screenSettings({ name: 'stress', failed: true }) },
  ] satisfies readonly StressScreenCase[]),
  frameSize: (): readonly [width: number, height: number] => [FRAME_W, FRAME_H],
  setFrameSize,
  /** Data extremes applied to the live fixtures, each restored afterwards. */
  prepareMutations(): StressMutations {
    const data = RELAY;
    const snapshot = JSON.parse(JSON.stringify(data)) as RelayData;
    const copy = (): RelayData => JSON.parse(JSON.stringify(snapshot)) as RelayData;
    return {
      restore(): void {
        const fresh = copy();
        data.people = fresh.people;
        data.releases = fresh.releases;
        data.environments = fresh.environments;
        data.activity = fresh.activity;
        data.release = fresh.release;
        data.counts = fresh.counts;
      },
      mutations: [
        ['long names', () => {
          for (const release of data.releases) release.title = LONG_TITLE;
          for (const person of data.people) person.name = LONG_PERSON;
          for (const environment of data.environments) environment.name = LONG_TITLE;
          for (const check of data.release.checks) check.summary = LONG_TITLE;
          for (const event of data.activity) event.text = LONG_TITLE;
          data.release.milestone.name = LONG_TITLE;
        }],
        ['no releases', () => {
          data.releases = data.releases.filter((release) => release.id === data.release.id);
          data.counts = { open: 1, shipped: 0, total: 1 };
          data.activity = [];
        }],
        ['no activity', () => { data.activity = []; data.release.timeline = []; }],
        ['no checks', () => { data.release.checks = []; }],
        ['no approvers', () => { data.release.approverIds = []; }],
      ],
    };
  },
});
