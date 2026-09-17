/* 01 · Projects: every project with its state. A row opens the project. */

import type { StarterItem } from '@figma-harness/contract';
import { starter } from '@figma-harness/template-design-system';
import { PRODUCT } from '../app.ts';
import { SAMPLE, type Project, type ProjectState } from '../fixtures/index.ts';
import { FRAME_H, FRAME_W } from './frame.ts';

const STATES: Readonly<Record<ProjectState, NonNullable<StarterItem['status']>>> = Object.freeze({
  'active': { label: 'On track', tone: 'positive' },
  'at-risk': { label: 'At risk', tone: 'warning' },
  'blocked': { label: 'Blocked', tone: 'critical' },
  'done': { label: 'Done', tone: 'neutral' },
});

const openTasks = function (project: Project): string {
  const open = project.tasks.filter((task) => !task.done).length;
  return open === 0 ? 'No open tasks' : open === 1 ? '1 open task' : open + ' open tasks';
};

export const screenProjects = function (name: string): Promise<FrameNode> {
  return starter.screen({
    name, w: FRAME_W, h: FRAME_H, product: PRODUCT.name,
    title: 'Projects',
    text: SAMPLE.projects.length
      ? 'Everything the team is working on. Open a project to see its tasks.'
      : 'No projects yet. Create the first one to get started.',
    items: SAMPLE.projects.map((project) => ({
      name: 'project/' + project.id,
      link: true,
      label: project.name,
      detail: project.owner + ' · ' + openTasks(project),
      status: STATES[project.state],
    })),
    primary: { label: 'New project', name: 'button/New project' },
  });
};
