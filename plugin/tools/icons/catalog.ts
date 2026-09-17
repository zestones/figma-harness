/** The Octicons the kit ships, by Primer name. The names are kit API. */
export const OCTICONS = Object.freeze([
  // Navigation and actions
  'apps', 'arrow-down', 'arrow-right', 'arrow-switch', 'arrow-up', 'bell', 'bookmark',
  'check', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up', 'copy', 'download',
  'duplicate', 'eye', 'filter', 'gear', 'history', 'home', 'kebab-horizontal', 'link-external',
  'lock', 'pencil', 'pin', 'play', 'plus', 'search', 'sign-out', 'sort-desc', 'star', 'sync',
  'three-bars', 'trash', 'triangle-down', 'upload', 'x',
  // Status
  'alert', 'alert-fill', 'blocked', 'check-circle', 'check-circle-fill', 'circle-slash', 'clock',
  'dash', 'dot-fill', 'hourglass', 'info', 'question', 'shield-check', 'skip', 'stop',
  'unverified', 'verified', 'x-circle', 'x-circle-fill',
  // Release and delivery
  'beaker', 'broadcast', 'bug', 'calendar', 'checklist', 'cloud', 'code', 'comment', 'container',
  'file', 'file-diff', 'git-branch', 'git-commit', 'git-compare', 'git-merge', 'git-pull-request',
  'globe', 'goal', 'graph', 'inbox', 'issue-closed', 'issue-opened', 'list-unordered', 'log',
  'mail', 'milestone', 'note', 'organization', 'package', 'people', 'person', 'project', 'pulse',
  'repo', 'rocket', 'rows', 'server', 'tag', 'terminal', 'versions', 'workflow', 'zap',
] as const);

/* GitHub's marks are trademarks, not icons: an example app never ships them. */
export const BRAND_GLYPHS = /github|copilot|octoface|hubot|mark-/;
