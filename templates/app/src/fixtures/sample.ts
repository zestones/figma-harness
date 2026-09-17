/* Deterministic sample data: a few projects and their tasks. Pages and stress
 * cases change it only through the stress mutations, which restore it. */

export type ProjectState = 'active' | 'at-risk' | 'blocked' | 'done';

export interface Task {
  assignee: string;
  done: boolean;
  id: string;
  title: string;
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  state: ProjectState;
  summary: string;
  tasks: Task[];
}

export interface SampleData {
  projects: Project[];
  /** The project the detail screen shows. */
  selectedId: string;
}

export const SAMPLE: SampleData = {
  selectedId: 'website',
  projects: [
    {
      id: 'website',
      name: 'Website refresh',
      owner: 'Amara Diallo',
      state: 'active',
      summary: 'New home page and pricing page, shipped behind a flag first.',
      tasks: [
        { id: 'copy', title: 'Write the home page copy', assignee: 'Amara Diallo', done: true },
        { id: 'pricing', title: 'Design the pricing table', assignee: 'Jonas Weber', done: false },
        { id: 'flag', title: 'Add the rollout flag', assignee: 'Mei Tanaka', done: false },
      ],
    },
    {
      id: 'billing',
      name: 'Billing migration',
      owner: 'Jonas Weber',
      state: 'at-risk',
      summary: 'Move every account to the new invoicing service.',
      tasks: [
        { id: 'export', title: 'Export the old invoices', assignee: 'Jonas Weber', done: true },
        { id: 'dry-run', title: 'Run the migration on a copy', assignee: 'Sofia Rossi', done: false },
      ],
    },
    {
      id: 'mobile',
      name: 'Mobile sign-in',
      owner: 'Mei Tanaka',
      state: 'blocked',
      summary: 'Passkeys on both mobile apps, waiting on the identity review.',
      tasks: [
        { id: 'review', title: 'Pass the identity review', assignee: 'Mei Tanaka', done: false },
      ],
    },
    {
      id: 'handbook',
      name: 'Team handbook',
      owner: 'Sofia Rossi',
      state: 'done',
      summary: 'How the team plans, reviews and ships.',
      tasks: [
        { id: 'publish', title: 'Publish the handbook', assignee: 'Sofia Rossi', done: true },
      ],
    },
  ],
};

export const projectById = function (data: SampleData, id: string): Project | undefined {
  return data.projects.find((project) => project.id === id);
};
