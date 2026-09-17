/* C4 · Feedback and overlays. */

import {
  BADGE_TONES,
  alert,
  checkbox,
  dialog,
  emptyState,
  f as frame,
  field,
  menu,
  segmented,
  select,
  toast,
} from '../index.ts';
import { column, defineSheet, note, section, sheet, stage } from './support.ts';

const ALERTS = Object.freeze({
  neutral: ['Payouts are paused on weekends', 'Transfers resume on Monday at 09:00.'],
  accent: ['Your new plan starts on October 1', 'Lower fees apply to every payment from that day.'],
  positive: ['Bank account verified', 'Payouts can now be sent to Northbank ···· 6021.'],
  warning: ['A dispute needs a response', 'Harborview Clinics disputed $860.00. Respond before Sept 24.'],
  critical: ['3 payments failed today', 'The cards were declined by the issuing bank.'],
} as const);

export const sheetFeedback = defineSheet({
  code: 'C4', group: 'Components', title: 'Feedback and overlays',
  build: async () => {
    const layout = await sheet('C4', 'Feedback and overlays', 'Messages about the page, confirmations, dialogs and menus. A message states its tone in words and with an icon.');
    // The dialog keeps its own width; the other columns share the rest.
    const dialogWidth = 480;
    const width = Math.floor((layout.w - dialogWidth - layout.body.itemSpacing * 2) / 2);
    const first = await column(layout.body, width);
    const alerts = await section(first, 'Alert', width);
    for (const tone of BADGE_TONES) {
      const [title, body] = ALERTS[tone];
      alerts.appendChild(await alert({
        w: width, tone, title, text: body,
        action: tone === 'warning' ? { label: 'Respond', name: 'button/Respond · specimen' } : undefined,
      }));
    }
    const toasts = await section(first, 'Toast', width);
    toasts.appendChild(await toast({ w: width, title: 'Refund issued', text: '$2,400.00 will reach the customer in 5–10 days.' }));

    const second = await column(layout.body, dialogWidth);
    const dialogs = await section(second, 'Dialog', dialogWidth, 'Modal: focus moves into the dialog and returns to the button that opened it.');
    const holder = await frame({ name: 'dialog-holder', dir: 'V', w: dialogWidth });
    holder.appendChild(await dialog({
      name: 'dialog/specimen', closeName: 'dialog-close/specimen', title: 'Delete this customer?',
      description: 'Their payment history stays in your reports.',
      icon: { name: 'exclamation-triangle', tone: 'critical' },
      primary: { label: 'Delete', variant: 'danger', name: 'button/Delete · specimen' },
      secondary: { label: 'Cancel', name: 'button/Cancel · specimen' },
      body: async (room) => [await field({ w: room, label: 'Type the customer name', placeholder: 'Harborview Clinics', name: 'field/Confirm name' })],
    }));
    dialogs.appendChild(holder);
    const form = await frame({ name: 'dialog-holder', dir: 'V', w: dialogWidth });
    form.appendChild(await dialog({
      name: 'dialog/form-specimen', closeName: 'dialog-close/form-specimen', title: 'Refund payment',
      description: 'The money reaches Amex ···· 1005 in 5–10 business days.',
      primary: { label: 'Refund $2,400.00', name: 'button/Refund payment · specimen' },
      secondary: { label: 'Cancel', name: 'button/Cancel form · specimen' },
      body: async (room) => [
        await segmented([{ label: 'Full refund', current: true }, { label: 'Partial refund' }], 'Refund type'),
        await field({ w: room, label: 'Amount', prefix: '$', value: '2,400.00', suffix: 'USD', name: 'field/Amount · specimen' }),
        await select({ w: room, label: 'Reason', value: 'Requested by customer', name: 'field/Reason · specimen' }),
        await checkbox({ w: room, checked: true, label: 'Email a receipt', description: 'Sent to payments@tidewater.example' }),
      ],
    }));
    dialogs.appendChild(form);
    dialogs.appendChild(await note('A dialog is 480 px wide; in a screen it sits on a scrim that dims the page. A form dialog names its main action after its result.', dialogWidth));

    const third = await column(layout.body, width);
    const menus = await section(third, 'Menu', width);
    menus.appendChild(await menu([
      { label: 'View payment', icon: 'arrow-top-right-on-square', highlighted: true },
      { label: 'Copy payment ID', icon: 'document-duplicate', shortcut: 'Ctrl C' },
      { label: 'Send receipt', icon: 'envelope' },
      { label: 'Refund payment', icon: 'arrow-uturn-left', danger: true, divider: true },
    ], 240));
    const empty = await stage(await section(third, 'Empty state', width), width);
    empty.appendChild(await emptyState({
      w: width - 40, icon: 'credit-card', title: 'No payments yet',
      text: 'Payments appear here as soon as a customer pays an invoice or a payment link.',
      action: { label: 'Create a payment link', name: 'button/Create a payment link · specimen' },
    }));
    return layout.frame;
  },
});
