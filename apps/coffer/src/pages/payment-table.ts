/* The payments table, shared by the overview, the payments list and a customer. */

import {
  actionCell,
  amountCell,
  badgeCell,
  codeCell,
  emptyState,
  iconCell,
  personCell,
  stackedCell,
  table,
  textCell,
  type TableColumn,
  type TableRow,
} from '@figma-harness/carrara';
import { COFFER, customerById, type Payment } from '../fixtures/index.ts';
import { methodIcon, methodLabel, money, statusBadge } from './format.ts';

export interface PaymentTableOptions {
  /** Leave out the customer column, on a customer's page. */
  customer?: boolean;
  /** Show the payment ID column. */
  ids?: boolean;
  label: string;
  payments: readonly Payment[];
  w: number;
}

export const paymentTable = function (options: PaymentTableOptions): Promise<FrameNode> {
  const showCustomer = options.customer !== false;
  const compact = options.w < 960;
  // A narrow customer table writes the date under the description.
  const stacked = !showCustomer && options.w < 720;
  const columns: TableColumn[] = [
    showCustomer
      ? { key: 'customer', header: 'Customer', weight: 2.3 }
      : { key: 'description', header: 'Description', weight: stacked ? 3 : 2.3 },
    { key: 'amount', header: 'Amount', align: 'RIGHT', weight: 1.3 },
    // Wide enough for the longest state, "Needs response".
    { key: 'status', header: 'Status', width: 128 },
    ...(compact ? [] : [{ key: 'method', header: 'Method', weight: 1.9 }]),
    ...(options.ids && !compact ? [{ key: 'id', header: 'Payment ID', weight: 1.6 }] : []),
    ...(stacked ? [] : [{ key: 'date', header: 'Date', weight: 1.2, sorted: 'desc' as const }]),
    { key: 'menu', header: '', width: 32 },
  ];
  const rows: TableRow[] = options.payments.map((payment) => {
    const customer = customerById(COFFER, payment.customerId);
    return {
      name: 'payment-row/' + payment.id,
      cells: {
        customer: personCell(customer ? customer.name : 'Unknown customer', customer ? customer.email : payment.customerId, customer ? customer.initials : '?'),
        description: stacked ? stackedCell(payment.description, payment.created) : textCell(payment.description, 'primary'),
        amount: amountCell(money(payment.amount), payment.currency),
        status: badgeCell(statusBadge(payment.status)),
        method: iconCell(methodIcon(payment.method), methodLabel(payment.method)),
        id: codeCell(payment.id),
        date: textCell(payment.created),
        menu: actionCell('Actions for ' + payment.id, 'row-action/' + payment.id),
      },
    };
  });
  return table({
    w: options.w, label: options.label, name: 'payments-table', columns, rows,
    empty: (width) => emptyState({
      w: width, icon: 'credit-card', title: 'No payments yet',
      text: 'Payments appear here as soon as a customer pays an invoice or a payment link.',
    }),
  });
};
