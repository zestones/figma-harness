# Page brief: Coffer

- Mode: `PAGE_AUTHORING`
- Owner/reviewer: repository maintainers
- Figma page and frame names: `01 · Screens`, frames `01`–`06`
- Question this app answers: how is the business doing this month, what needs attention, and what happened to one payment?
- In scope: an overview, the payments list, one payment with its refund dialog and after the refund, and one customer, for a fictional payments dashboard called Coffer, with a clickable prototype
- Out of scope: sign-in, the customers list, invoices, payouts, reports, settings, dispute evidence, and any real data

This brief documents the second example that ships with the repository. It exists to show what an app built on a design system created from the template can look like.

## Data and context

- API-shaped inputs: `COFFER` from `src/fixtures/index.ts`: Brightline Studio, a fictional design studio, and Maya Castellanos, its finance lead; this month's figures and daily net revenue against last month; payment method shares and the next payout; ten customers and ten payments, one of them disputed and one failed; the selected payment's events; the selected customer's earlier payments, invoices and activity; the refund the dialog proposes. Every email address uses the reserved `.example` domain, and every tax ID fails its country's check digits, which `tests/coffer.test.ts` verifies.
- Time: every date is a pre-formatted string, so the screens do not depend on a clock or a time zone.
- Money: amounts are numbers, formatted by `src/pages/format.ts` without `Intl`, which Figma's plugin runtime lacks.
- States on screen: a payment before the refund, with the refund dialog open, and once refunded. Empty lists, unknown payments and customers, long names and very large amounts are rendered by the stress cases rather than as screens.

## Screens and interaction

| Key | Title | Shows |
| --- | --- | --- |
| `overview` | 01 · Overview | A dispute alert, four figures with trends and sparklines, net revenue against last month, payment methods and the next payout, recent payments |
| `payments` | 02 · Payments | State tabs with counts, search and filters, ten payments, pagination |
| `payment` | 03 · Payment | Breadcrumbs, the amount and its state, a strip of facts, activity, the breakdown, details, the customer and the payment method |
| `paymentRefund` | 04 · Payment — refund | The refund dialog over the payment: full or partial, amount, reason, receipt |
| `paymentRefunded` | 05 · Payment — refunded | The payment marked refunded, the refund first in its activity, the breakdown with the refund, and a toast |
| `customer` | 06 · Customer | Four figures, the customer's payments and activity, the subscription, invoices and details |

- Primary actions: New invoice (overview), Create payment (payments and customer), Refund (payment), Refund $2,400.00 (dialog).
- Keyboard and focus: the refund dialog is modal; it takes focus when it opens and returns it to Refund when it closes. The toast does not move focus.
- Prototype: the start screen is `01 · Overview`. The sidebar's Overview and Payments items, the payment rows, the overview's View all, the Payments breadcrumb and View customer navigate instantly; the Customers breadcrumb goes back. The dialog enters on Refund and exits on its close button, Cancel and Refund $2,400.00, the last one onto the refunded payment. Nothing under the dialog is wired.
- Navigation (`src/app.ts`): Overview, Payments and Customers, then Invoices, Payouts and Reports under Finance, with Help, Settings and the signed-in person at the bottom. Below 1024 px the sidebar folds into the top bar.

## Kit usage

All of it comes from `@figma-harness/carrara`.

- Shell and patterns: `shell` (sidebar and top bar), `pageHeader`, and `matchHeights` for the cards beside the chart.
- Components: `alert`, `stat`, `card`, `table` with `personCell`, `stackedCell`, `textCell`, `amountCell`, `badgeCell`, `iconCell`, `codeCell` and `actionCell`, `tabs`, `segmented`, `field`, `select`, `checkbox`, `button`, `iconButton`, `badge`, `trend`, `pagination`, `timeline`, `descriptionList`, `factStrip`, `listRow`, `progress`, `barList`, `avatar`, `dialog`, `scrim`, `toast`, `emptyState`.
- Visualisation: `areaChart`, `chartLegend`, and the sparklines inside `stat`.
- Added to the design system for this app: `factStrip`, `stackedCell`, `matchHeights`, and the `details` option of `pageHeader`. Amount cells, progress details and bar values fit narrow widths, and a stat's caption always has its own line.

## Acceptance evidence

- Focused tests: `apps/coffer/tests/coffer.test.ts` and `apps/coffer/tests/flows.test.ts`.
- Stress cases: the payments table, a customer's payments, stats, the area chart and the page header across their widths; six screens at five artboard sizes; long names, large amounts, no payments, no activity, an unknown payment and an unknown customer.
- Audits and signatures: `pnpm each audit` and the other checks in `pnpm verify`. The design and component signatures are recorded in `apps/coffer/baselines/` once a maintainer has reviewed the output in Figma.
