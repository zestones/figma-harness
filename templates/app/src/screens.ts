/* Every generated screen, grouped as it is laid out on the Screens page, and
 * where a prototype presentation starts. */

import type { ScreenDefinition, ScreenGroup } from '@figma-harness/contract';
import { screenProject } from './pages/project.ts';
import { screenProjects } from './pages/projects.ts';

/** Bump whenever screen keys or the prototype matrix change: a document built
 *  from another version is rewired completely on its next refresh. */
export const CATALOG_VERSION = 'template-v1';

/** The frame a prototype presentation starts from. */
export const START_SCREEN = 'projects';

const defineScreen = function (key: string, title: string, build: (name: string) => Promise<FrameNode>): ScreenDefinition {
  return Object.freeze({ key, title, build: () => build(title) });
};

export const SCREEN_GROUPS: readonly ScreenGroup[] = Object.freeze([
  Object.freeze({
    letter: 'A',
    title: 'Projects',
    body: 'Every project and its state.',
    prototype: true,
    screens: Object.freeze([
      defineScreen('projects', '01 · Projects', screenProjects),
    ]),
  }),
  Object.freeze({
    letter: 'B',
    title: 'Project',
    body: 'One project with its tasks, before and after it is marked complete.',
    prototype: true,
    screens: Object.freeze([
      defineScreen('project', '02 · Project', (name) => screenProject({ name })),
      defineScreen('projectComplete', '03 · Project — complete', (name) => screenProject({ name, complete: true })),
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
