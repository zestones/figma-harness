/* C1 · Actions and inputs. */

import {
  BUTTON_STATES,
  BUTTON_VARIANTS,
  FIELD_STATES,
  button,
  checkbox,
  dim,
  f as frame,
  field,
  iconButton,
  segmented,
  select,
  text,
  toggle,
} from '../index.ts';
import { column, columnWidth, defineSheet, note, section, sheet, stage } from './support.ts';

const FIELD_NOTES = Object.freeze({
  rest: 'Enter an amount up to the payment total.',
  focus: 'The edge turns to the accent and the outline appears.',
  error: 'The amount is larger than what remains to refund.',
  disabled: 'Refunds are closed for this payment.',
});

export const sheetActions = defineSheet({
  code: 'C1', group: 'Components', title: 'Actions and inputs',
  build: async () => {
    const layout = await sheet('C1', 'Actions and inputs', 'Buttons in every variant and state, and the controls forms are made of. Every control keeps its label in words.');
    const wide = columnWidth(layout, 3) * 2 + layout.body.itemSpacing;
    const first = await column(layout.body, wide);
    const buttons = await stage(await section(first, 'Button · rest, hover, focus, disabled', wide), wide);
    for (const variant of BUTTON_VARIANTS) {
      const line = await frame({ name: 'row/' + variant, dir: 'H', gap: dim('space/24'), align: 'CENTER', pad: dim('space/8') });
      const label = variant === 'danger' ? 'Refund' : variant === 'primary' ? 'New invoice' : 'Export';
      for (const state of BUTTON_STATES) {
        line.appendChild(await button({ label, variant, state, icon: variant === 'primary' ? 'plus' : undefined }));
      }
      buttons.appendChild(line);
    }
    const compact = await frame({ name: 'row/compact', dir: 'H', gap: dim('space/12'), align: 'CENTER', pad: dim('space/8') });
    compact.appendChild(await button({ label: 'Filter', icon: 'funnel', size: 'sm' }));
    compact.appendChild(await button({ label: 'Last 30 days', iconAfter: 'chevron-down', size: 'sm' }));
    compact.appendChild(await iconButton({ icon: 'ellipsis-horizontal', label: 'More', size: 'sm' }));
    compact.appendChild(await iconButton({ icon: 'bell', label: 'Notifications' }));
    compact.appendChild(await iconButton({ icon: 'arrow-down-tray', label: 'Download', variant: 'secondary' }));
    compact.appendChild(await iconButton({ icon: 'document-duplicate', label: 'Copy', variant: 'secondary', state: 'focus' }));
    buttons.appendChild(compact);
    buttons.appendChild(await note('Primary for the one main action of a view, secondary for the others, ghost inside toolbars, danger for what cannot be undone.', wide - 40));

    const fields = await stage(await section(first, 'Field and select', wide), wide);
    const half = Math.floor((wide - 40 - 24) / 2);
    for (let start = 0; start < FIELD_STATES.length; start += 2) {
      const line = await frame({ name: 'fields', dir: 'H', w: wide - 40, gap: dim('space/24'), align: 'MIN', pad: [dim('space/4'), 0, dim('space/4'), 0] });
      for (const state of FIELD_STATES.slice(start, start + 2)) {
        line.appendChild(await field({
          w: half, label: 'Refund amount', prefix: '$', suffix: 'USD', value: state === 'error' ? '2,600.00' : '1,200.00',
          helper: FIELD_NOTES[state], state, name: 'field/Refund amount · ' + state,
        }));
      }
      fields.appendChild(line);
    }
    const more = await frame({ name: 'fields', dir: 'H', w: wide - 40, gap: dim('space/24'), align: 'MIN' });
    more.appendChild(await field({ w: half, icon: 'magnifying-glass', placeholder: 'Search payments', shortcut: '/', name: 'field/Search' }));
    more.appendChild(await select({ w: half, label: 'Reason', value: 'Requested by customer', name: 'field/Reason' }));
    fields.appendChild(more);

    const width = columnWidth(layout, 3);
    const third = await column(layout.body, width);
    const choices = await stage(await section(third, 'Checkbox and switch', width), width);
    choices.appendChild(await checkbox({ w: width - 40, checked: true, label: 'Email the customer a receipt', description: 'Sent to jonas@brightline.example' }));
    choices.appendChild(await checkbox({ w: width - 40, checked: false, label: 'Refund the processing fee' }));
    choices.appendChild(await checkbox({ w: width - 40, checked: true, focused: true, label: 'Focused checkbox' }));
    choices.appendChild(await toggle({ w: width - 40, checked: true, label: 'Automatic payouts', description: 'Every business day at 09:00' }));
    choices.appendChild(await toggle({ w: width - 40, checked: false, label: 'Card testing protection' }));
    choices.appendChild(await toggle({ w: width - 40, checked: true, focused: true, label: 'Focused switch' }));
    const ranges = await stage(await section(third, 'Segmented', width), width);
    ranges.appendChild(await segmented([
      { label: '7D' }, { label: '30D', current: true }, { label: '90D' }, { label: '12M' },
    ], 'Time range'));
    ranges.appendChild(await segmented([
      { label: 'Gross', current: true }, { label: 'Net' },
    ], 'Revenue basis'));
    ranges.appendChild(await text({ style: 'body/sm', text: 'One choice among a few, applied at once.', color: 'text/tertiary', w: width - 40 }));
    return layout.frame;
  },
});
