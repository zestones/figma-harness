/* Deterministic, API-shaped sample data for Relay, the example release
 * manager. Every name and figure is fictional. Nothing here touches Figma. */

export type ReleaseState = 'draft' | 'queued' | 'rollingOut' | 'shipped' | 'rolledBack';
export type CheckState = 'success' | 'running' | 'failure' | 'skipped';
export type EnvironmentState = 'healthy' | 'rollingOut' | 'building' | 'degraded';
export type ActivityKind = 'promoted' | 'checksPassed' | 'rolledBack' | 'drafted' | 'deployed' | 'commented';

export interface Person {
  handle: string;
  id: string;
  initials: string;
  name: string;
}

export interface ChecksSummary {
  failed: number;
  passed: number;
  running: number;
  total: number;
}

export interface Release {
  authorId: string;
  checks: ChecksSummary;
  commits: number;
  created: string;
  id: string;
  labels: string[];
  number: number;
  state: ReleaseState;
  title: string;
  version: string;
}

export interface Check {
  duration: string;
  id: string;
  name: string;
  state: CheckState;
  summary: string;
}

export interface Environment {
  id: string;
  name: string;
  /** Share of traffic on the version, 0 to 1. */
  rollout: number;
  state: EnvironmentState;
  updated: string;
  version: string;
}

export interface ActivityEvent {
  actorId: string;
  at: string;
  id: string;
  kind: ActivityKind;
  text: string;
}

export interface RequiredCheck {
  caption: string;
  name: string;
  required: boolean;
}

export interface RelaySettings {
  autoRollback: boolean;
  defaultBranch: string;
  nameTemplate: string;
  projectName: string;
  requiredChecks: RequiredCheck[];
}

export interface WeeklyDeploys {
  production: number;
  staging: number;
  week: string;
}

export interface RelayStats {
  leadTime: string;
  leadTimeDelta: string;
  openIncidents: number;
  releasesThisMonth: number;
  releasesDelta: number;
  successRate: string;
  successDelta: string;
}

export interface ReleaseDetail {
  approverIds: string[];
  branch: string;
  checks: Check[];
  environments: string[];
  id: string;
  milestone: { name: string; progress: number };
  rolloutStarted: string;
  timeline: ActivityEvent[];
}

export interface RelayData {
  activity: ActivityEvent[];
  counts: { open: number; shipped: number; total: number };
  environments: Environment[];
  org: string;
  people: Person[];
  project: string;
  release: ReleaseDetail;
  releases: Release[];
  settings: RelaySettings;
  stats: RelayStats;
  viewerId: string;
  weekly: WeeklyDeploys[];
}

const PEOPLE: Person[] = [
  { id: 'u1', name: 'Rhea Okafor', initials: 'RO', handle: 'rhea' },
  { id: 'u2', name: 'Kai Lindqvist', initials: 'KL', handle: 'kai' },
  { id: 'u3', name: 'Priya Raman', initials: 'PR', handle: 'priya' },
  { id: 'u4', name: 'Tomás Ferreira', initials: 'TF', handle: 'tomas' },
  { id: 'u5', name: 'Hana Sato', initials: 'HS', handle: 'hana' },
  { id: 'u6', name: 'Jonah Weiss', initials: 'JW', handle: 'jonah' },
];

const checks = function (passed: number, total: number, running = 0, failed = 0): ChecksSummary {
  return { passed, total, running, failed };
};

const RELEASES: Release[] = [
  { id: 'r13', number: 418, version: 'v4.13.0', title: 'Gift cards', state: 'draft', authorId: 'u3', created: '20 minutes ago', commits: 9, labels: ['feature'], checks: checks(4, 12, 8) },
  { id: 'r12b', number: 417, version: 'v4.12.1', title: 'Search ranking', state: 'queued', authorId: 'u2', created: '1 hour ago', commits: 6, labels: ['search'], checks: checks(12, 12) },
  { id: 'r12', number: 416, version: 'v4.12.0', title: 'Faster checkout', state: 'rollingOut', authorId: 'u1', created: '2 hours ago', commits: 23, labels: ['performance', 'checkout'], checks: checks(11, 12, 1) },
  { id: 'r11c', number: 414, version: 'v4.11.2', title: 'Payment retry fix', state: 'shipped', authorId: 'u4', created: 'yesterday', commits: 3, labels: ['bug'], checks: checks(12, 12) },
  { id: 'r11b', number: 413, version: 'v4.11.1', title: 'Tax rounding', state: 'rolledBack', authorId: 'u2', created: '3 days ago', commits: 2, labels: ['bug'], checks: checks(11, 12, 0, 1) },
  { id: 'r11', number: 411, version: 'v4.11.0', title: 'Saved carts', state: 'shipped', authorId: 'u5', created: '5 days ago', commits: 31, labels: ['feature', 'checkout'], checks: checks(12, 12) },
  { id: 'r10d', number: 409, version: 'v4.10.3', title: 'Image loading', state: 'shipped', authorId: 'u6', created: '9 days ago', commits: 7, labels: ['performance'], checks: checks(12, 12) },
  { id: 'r10c', number: 407, version: 'v4.10.2', title: 'Address autocomplete', state: 'shipped', authorId: 'u3', created: '12 days ago', commits: 12, labels: ['feature'], checks: checks(12, 12) },
];

const ENVIRONMENTS: Environment[] = [
  { id: 'e1', name: 'Production', version: 'v4.12.0', state: 'rollingOut', rollout: 0.6, updated: '42 minutes ago' },
  { id: 'e2', name: 'Staging', version: 'v4.12.1', state: 'healthy', rollout: 1, updated: '1 hour ago' },
  { id: 'e3', name: 'Preview', version: 'v4.13.0', state: 'building', rollout: 0.35, updated: '4 minutes ago' },
];

const ACTIVITY: ActivityEvent[] = [
  { id: 'a1', kind: 'promoted', actorId: 'u1', at: '42 minutes ago', text: 'promoted v4.12.0 to 60% of Production' },
  { id: 'a2', kind: 'checksPassed', actorId: 'u2', at: '1 hour ago', text: 'passed all 12 checks on v4.12.1' },
  { id: 'a3', kind: 'drafted', actorId: 'u3', at: '20 minutes ago', text: 'drafted v4.13.0' },
  { id: 'a4', kind: 'rolledBack', actorId: 'u2', at: '3 days ago', text: 'rolled back v4.11.1 from Production' },
];

const CHECKS: Check[] = [
  { id: 'c1', name: 'Unit tests', state: 'success', duration: '2m 14s', summary: '1,284 passed' },
  { id: 'c2', name: 'Integration tests', state: 'success', duration: '6m 02s', summary: '212 passed' },
  { id: 'c3', name: 'Visual regression', state: 'running', duration: '4m 40s', summary: '38 of 64 screens compared' },
  { id: 'c4', name: 'Accessibility', state: 'success', duration: '1m 51s', summary: 'No violations' },
  { id: 'c5', name: 'Bundle size', state: 'success', duration: '48s', summary: '−14 kB since v4.11.2' },
  { id: 'c6', name: 'Security scan', state: 'success', duration: '3m 07s', summary: 'No new findings' },
];

const TIMELINE: ActivityEvent[] = [
  { id: 't1', kind: 'drafted', actorId: 'u1', at: '2 hours ago', text: 'created this release from release/4.12' },
  { id: 't2', kind: 'checksPassed', actorId: 'u2', at: '1 hour ago', text: 'approved the release' },
  { id: 't3', kind: 'deployed', actorId: 'u1', at: '58 minutes ago', text: 'deployed to Staging' },
  { id: 't4', kind: 'promoted', actorId: 'u1', at: '42 minutes ago', text: 'started a rollout to 60% of Production' },
];

const createRelay = function (): RelayData {
  return {
    org: 'acme-inc',
    project: 'storefront',
    viewerId: 'u1',
    people: PEOPLE.map((person) => ({ ...person })),
    releases: RELEASES.map((release) => ({ ...release, labels: [...release.labels], checks: { ...release.checks } })),
    counts: { open: 3, shipped: 28, total: 32 },
    environments: ENVIRONMENTS.map((environment) => ({ ...environment })),
    activity: ACTIVITY.map((event) => ({ ...event })),
    stats: {
      releasesThisMonth: 14,
      releasesDelta: 3,
      successRate: '96.4%',
      successDelta: '+1.2 pts',
      leadTime: '3h 20m',
      leadTimeDelta: '−25m',
      openIncidents: 1,
    },
    weekly: [
      ['W30', 4, 9], ['W31', 5, 11], ['W32', 3, 8], ['W33', 6, 12], ['W34', 5, 10], ['W35', 7, 13],
      ['W36', 4, 9], ['W37', 6, 14], ['W38', 8, 15], ['W39', 5, 11], ['W40', 7, 12], ['W41', 9, 16],
    ].map(([week, production, staging]) => ({ week: String(week), production: Number(production), staging: Number(staging) })),
    release: {
      id: 'r12',
      branch: 'release/4.12',
      rolloutStarted: '42 minutes ago',
      approverIds: ['u2', 'u4', 'u5'],
      environments: ['Production', 'Staging'],
      milestone: { name: 'Q4 checkout', progress: 0.7 },
      checks: CHECKS.map((check) => ({ ...check })),
      timeline: TIMELINE.map((event) => ({ ...event })),
    },
    settings: {
      projectName: 'storefront',
      defaultBranch: 'main',
      nameTemplate: 'v{major}.{minor}.{patch}',
      autoRollback: true,
      requiredChecks: [
        { name: 'Unit tests', caption: 'Runs on every commit.', required: true },
        { name: 'Integration tests', caption: 'Runs against Staging.', required: true },
        { name: 'Visual regression', caption: 'Compares 64 screens; adds about five minutes.', required: false },
      ],
    },
  };
};

/** The live sample data. Stress checks mutate it and restore it afterwards. */
export const RELAY: RelayData = createRelay();

export const personById = function (data: RelayData, id: string): Person | undefined {
  return data.people.find((person) => person.id === id);
};

export const releaseById = function (data: RelayData, id: string): Release | undefined {
  return data.releases.find((release) => release.id === id);
};
