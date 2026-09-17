/* Stress cases: every screen at every supported artboard size and with
 * extreme data. The harness builds each case and fails on any layout issue.
 * Extend this file with the screens and blocks you add. */

import { starter } from '@figma-harness/template-design-system';
import { PRODUCT } from './app.ts';
import { SAMPLE, type SampleData } from './fixtures/index.ts';
import { FRAME_H, FRAME_W, setFrameSize } from './pages/frame.ts';
import { screenProject } from './pages/project.ts';
import { screenProjects } from './pages/projects.ts';

const LONG_TEXT = 'A deliberately long name that keeps going well past any sensible column width';

export const STRESS_CONTRACT = Object.freeze({
  /** The design system's starter screen on its own, down to a phone width. */
  boxes: Object.freeze([
    {
      name: 'starter.screen',
      build: (width: number, height: number) => starter.screen({
        name: 'stress', w: width, h: height, product: PRODUCT.name, title: LONG_TEXT, text: LONG_TEXT,
        items: [{ name: 'stress/row', label: LONG_TEXT, detail: LONG_TEXT, link: true, status: { label: 'At risk', tone: 'warning' } }],
        primary: { label: 'Save', name: 'button/Save' },
        secondary: { label: 'Cancel', name: 'button/Cancel' },
      }),
      widths: [360, 768, 1280],
      heights: [640],
    },
  ]),
  /** Whole screens, rebuilt at every supported artboard size. */
  frameSizes: Object.freeze([
    [1024, 768], [1440, 1024], [1920, 1080],
  ] as const),
  screens: Object.freeze([
    { name: 'projects', build: () => screenProjects('stress') },
    { name: 'project', build: () => screenProject({ name: 'stress' }) },
    { name: 'project/complete', build: () => screenProject({ name: 'stress', complete: true }) },
  ]),
  frameSize: (): readonly [width: number, height: number] => [FRAME_W, FRAME_H],
  setFrameSize,
  /** Data extremes applied to the live fixtures, each restored afterwards. */
  prepareMutations() {
    const snapshot = JSON.stringify(SAMPLE);
    return {
      restore(): void {
        const fresh = JSON.parse(snapshot) as SampleData;
        SAMPLE.projects = fresh.projects;
        SAMPLE.selectedId = fresh.selectedId;
      },
      mutations: [
        ['long names', () => {
          for (const project of SAMPLE.projects) {
            project.name = LONG_TEXT;
            project.owner = LONG_TEXT;
            project.summary = LONG_TEXT + ' ' + LONG_TEXT;
            for (const task of project.tasks) {
              task.title = LONG_TEXT;
              task.assignee = LONG_TEXT;
            }
          }
        }],
        ['no projects', () => { SAMPLE.projects = []; }],
        ['no tasks', () => { for (const project of SAMPLE.projects) project.tasks = []; }],
        ['unknown project', () => { SAMPLE.selectedId = 'missing'; }],
      ] as ReadonlyArray<readonly [string, () => void]>,
    };
  },
});
