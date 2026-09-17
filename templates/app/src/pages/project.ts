/* 02 · Project and 03 · Project — complete: one project and its tasks, before
 * and after it is marked complete. The two states differ only where that
 * changes them, so the prototype can animate between them. */

import { starter } from '@figma-harness/template-design-system';
import { PRODUCT } from '../app.ts';
import { SAMPLE, projectById } from '../fixtures/index.ts';
import { FRAME_H, FRAME_W } from './frame.ts';

export interface ProjectScreenOptions {
  /** Show the project after it has been marked complete. */
  complete?: boolean;
  name: string;
}

export const screenProject = function (options: ProjectScreenOptions): Promise<FrameNode> {
  const project = projectById(SAMPLE, SAMPLE.selectedId);
  const text = !project
    ? 'It may have been deleted. Go back to see every project.'
    : options.complete ? 'Complete. Every task is done.' : project.summary;
  return starter.screen({
    name: options.name, w: FRAME_W, h: FRAME_H, product: PRODUCT.name,
    title: project ? project.name : 'Project not found',
    text,
    items: (project ? project.tasks : []).map((task) => ({
      name: 'task/' + task.id,
      label: task.title,
      detail: task.assignee,
      status: task.done || options.complete ? { label: 'Done', tone: 'positive' } : { label: 'Open', tone: 'neutral' },
    })),
    secondary: { label: 'Back to projects', name: 'button/Back' },
    primary: project
      ? options.complete
        ? { label: 'Reopen', name: 'button/Reopen' }
        : { label: 'Mark complete', name: 'button/Mark complete' }
      : undefined,
  });
};
