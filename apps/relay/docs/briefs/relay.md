# Page brief: Relay

- Mode: `PAGE_AUTHORING`
- Owner/reviewer: repository maintainers
- Figma page and frame names: `01 · Screens`, frames `01`–`07`
- Question this app answers: is the release that is rolling out healthy, and what does it take to ship it to everyone?
- In scope: an overview, the release list, one release with its promote dialog, and project settings for a fictional release manager called Relay, with a clickable prototype
- Out of scope: sign-in, search results, the Commits and Environments tabs, the other settings pages, and any real data

This brief documents the example that ships with the repository. It exists to show every mechanism the harness verifies with a small but believable Primer application.

## Data and context

- API-shaped inputs: `RELAY` from `src/fixtures/index.ts`: six fictional people, the `acme-inc/storefront` project, its releases, three environments (Production rolling out at 60%, Staging, Preview), weekly deployments, the current release's checks and history, and the project settings.
- Time: every date is a pre-formatted relative string, so the screens do not depend on a clock or a time zone.
- States on screen: the settings form at rest, with an unsaved change, and after a failed save. Empty lists, missing checks, missing approvers and long names are rendered by the stress cases rather than as screens.

## Screens and interaction

| Key | Title | Shows |
| --- | --- | --- |
| `overview` | 01 · Overview | Four figures, environments with their rollout, deployments per week, latest releases, recent activity |
| `releases` | 02 · Releases | Search, filters and sort, the state switch, eight releases, pagination |
| `release` | 03 · Release | Breadcrumbs, state label, tabs, rollout, checks, activity, and a details pane |
| `releasePromote` | 04 · Release — promote | The confirmation dialog over the release |
| `settings` | 05 · Settings | Project settings; nothing to save yet, so Save is disabled |
| `settingsChanged` | 06 · Settings — unsaved change | Visual regression made required, Save and Discard available |
| `settingsFailed` | 07 · Settings — save failed | A critical banner above the form; the change is kept |

- Primary actions: Draft a new release (overview and releases), Promote to 100% (release), Save changes (settings, once something changed).
- Keyboard and focus: the promote dialog opens with its confirm button focused and returns focus to Promote to 100% when it closes; the failed-save banner does not move focus.
- Prototype: the start screen is `01 · Overview`. The Overview, Releases and Settings tabs, the release rows and the Releases breadcrumb navigate instantly. The dialog uses `enter` and `exit`, the required-check checkbox and Discard use `stateChange`, and the failed-save banner enters on Save and exits when dismissed.
- Navigation (`src/app.ts`): Overview, Releases (with its count) and Settings, under a header with the product name, the project, search, Create, Notifications and the signed-in person.

## Kit usage

All of it comes from `@figma-harness/primer`.

- Shell and patterns: `appHeader`, `pageLayout`, `pageHeader`.
- Components: `box`, `button`, `counterLabel`, `label`, `token`, `stateLabel`, `branchName`, `avatar`, `breadcrumbs`, `underlineNav`, `navList`, `pagination`, `segmentedControl`, `textInput`, `select`, `checkbox`, `toggleSwitch`, `formControl`, `banner`, `inlineMessage`, `progressBar`, `timeline`, `dialog`, `overlayBackdrop`.
- Visualisation: `columnChart`, `chartLegend`. The deployments chart uses the purple and orange series, because blue already means "building" on the page.
- Missing reusable capability: none.

## Acceptance evidence

- Focused tests: `apps/relay/tests/flows.test.ts` and `apps/relay/tests/shells.test.ts`.
- Stress cases: app header, release list, data table, page header, banner and dialog across their widths; five screens at five artboard sizes; long names, no releases, no activity, no checks and no approvers.
- Audits and signatures: `pnpm verify`. The design and component signatures in `apps/relay/baselines/` were accepted after a maintainer reviewed the output in Figma.
