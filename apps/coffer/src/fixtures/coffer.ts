/* Deterministic sample data: one month of payments for Brightline Studio, a
 * design studio that bills its clients through Coffer, seen on Sept 17. Stress
 * cases change it only through their mutations, which restore it. Every name,
 * address and number is invented; tax IDs are chosen to fail their national
 * check digits, so none can belong to a real organisation. */

export type PaymentStatus = 'disputed' | 'failed' | 'processing' | 'refunded' | 'succeeded';
export type MethodKind = 'bank' | 'card' | 'wallet';

export interface PaymentMethod {
  brand: string;
  expires?: string;
  kind: MethodKind;
  last4: string;
}

export interface PaymentEvent {
  detail: string;
  kind: 'check' | 'invoice' | 'payout' | 'refund' | 'started' | 'succeeded';
  time: string;
  title: string;
}

export interface Payment {
  amount: number;
  created: string;
  currency: string;
  customerId: string;
  description: string;
  /** Newest first; only the payment a person opens lists its events. */
  events?: PaymentEvent[];
  fee: number;
  id: string;
  /** The invoice this payment settles. */
  invoice?: string;
  method: PaymentMethod;
  status: PaymentStatus;
}

export interface Customer {
  country: string;
  email: string;
  id: string;
  initials: string;
  name: string;
  plan: { name: string; price: number; renews: string; progress: number };
  since: string;
  taxId: string;
  totals: { lifetime: number; payments: number; refunded: number };
}

export interface Invoice {
  amount: number;
  customerId: string;
  /** When it was paid, or when it goes out. */
  date: string;
  id: string;
  status: 'open' | 'paid' | 'scheduled';
}

export interface Metric {
  change: string;
  direction: 'down' | 'up';
  /** Whether the change is good news. */
  good: boolean;
  label: string;
  series: number[];
  value: string;
}

export interface ActivityEvent {
  customerId: string;
  detail: string;
  kind: 'dispute' | 'invoice' | 'payment' | 'payout' | 'refund' | 'subscription';
  time: string;
  title: string;
}

export interface CofferData {
  activity: ActivityEvent[];
  counts: { all: number; disputed: number; failed: number; processing: number; refunded: number; succeeded: number };
  customers: Customer[];
  /** Earlier payments, listed only on a customer's page. */
  history: Payment[];
  invoices: Invoice[];
  metrics: Metric[];
  methods: Array<{ label: string; share: number }>;
  payments: Payment[];
  payout: { amount: number; arrives: string; bank: string; progress: number };
  /** The refund issued from the payment page, and what the dialog proposes. */
  refund: { arrives: string; event: PaymentEvent; reason: string };
  revenue: { current: number[]; labels: string[]; previous: number[] };
  selectedCustomerId: string;
  selectedPaymentId: string;
  user: { email: string; initials: string; name: string };
  workspace: { name: string };
}

const visa = (last4: string, expires: string): PaymentMethod => ({ kind: 'card', brand: 'Visa', last4, expires });
const mastercard = (last4: string, expires: string): PaymentMethod => ({ kind: 'card', brand: 'Mastercard', last4, expires });
const amex = (last4: string, expires: string): PaymentMethod => ({ kind: 'card', brand: 'Amex', last4, expires });
const bank = (brand: string, last4: string): PaymentMethod => ({ kind: 'bank', brand, last4 });

export const COFFER: CofferData = {
  workspace: { name: 'Brightline Studio' },
  user: { name: 'Maya Castellanos', email: 'maya@brightline.example', initials: 'MC' },
  selectedPaymentId: 'pay_3QuN6cLq1Zwd',
  selectedCustomerId: 'tidewater',
  counts: { all: 12845, succeeded: 12512, processing: 18, refunded: 214, disputed: 9, failed: 92 },
  metrics: [
    { label: 'Gross volume', value: '$1,284,390', change: '+12.4%', direction: 'up', good: true, series: [31, 34, 33, 38, 36, 41, 44, 43, 47, 52] },
    { label: 'Net revenue', value: '$1,246,180', change: '+9.8%', direction: 'up', good: true, series: [30, 31, 33, 32, 35, 37, 36, 40, 42, 45] },
    { label: 'Successful payments', value: '12,512', change: '+6.1%', direction: 'up', good: true, series: [18, 20, 19, 22, 21, 23, 24, 23, 26, 27] },
    { label: 'Dispute rate', value: '0.21%', change: '−0.04 pts', direction: 'down', good: true, series: [9, 9, 8, 8, 7, 7, 6, 6, 5, 5] },
  ],
  revenue: {
    labels: ['Sept 1', 'Sept 8', 'Sept 15', 'Sept 22', 'Sept 30'],
    current: [
      31.0, 33.5, 31.9, 35.9, 37.6, 34.5, 29.3, 37.1, 39.5, 41.2,
      38.9, 42.2, 40.9, 36.3, 41.7, 44.1, 43.1, 46.5, 49.0, 45.5,
      40.4, 44.8, 47.3, 45.9, 49.8, 48.4, 43.4, 46.9, 51.1, 48.7,
    ],
    previous: [
      30.0, 31.5, 33.1, 32.4, 34.6, 33.7, 29.3, 33.4, 35.9, 36.7,
      35.3, 37.6, 36.9, 33.1, 38.3, 39.6, 38.9, 41.1, 43.5, 42.0,
      37.7, 40.3, 41.6, 40.9, 44.2, 43.3, 39.3, 42.1, 44.7, 44.0,
    ],
  },
  methods: [
    { label: 'Cards', share: 0.64 },
    { label: 'Bank transfers', share: 0.21 },
    { label: 'Wallets', share: 0.11 },
    { label: 'Other', share: 0.04 },
  ],
  payout: { amount: 48216.4, arrives: 'Sept 19', bank: 'Northbank ···· 6021', progress: 0.71 },
  refund: {
    arrives: '5–10 business days',
    reason: 'Requested by customer',
    event: { kind: 'refund', title: 'Refund issued', detail: '$2,400.00 back to Amex ···· 1005', time: 'Sept 17, 10:24' },
  },
  customers: [
    {
      id: 'tidewater', name: 'Tidewater Logistics', initials: 'TL', email: 'payments@tidewater.example',
      country: 'Netherlands', since: 'January 2024', taxId: 'NL 8214 59 301 B01',
      plan: { name: 'Growth retainer', price: 2400, renews: 'Oct 16', progress: 0.03 },
      totals: { lifetime: 86420, payments: 38, refunded: 0 },
    },
    {
      id: 'harborview', name: 'Harborview Clinics', initials: 'HC', email: 'billing@harborview.example',
      country: 'United States', since: 'March 2023', taxId: 'US 07-2750193',
      plan: { name: 'Enterprise retainer', price: 12400, renews: 'Oct 17', progress: 0 },
      totals: { lifetime: 412800, payments: 31, refunded: 0 },
    },
    {
      id: 'quarry', name: 'Quarry Analytics', initials: 'QA', email: 'finance@quarry.example',
      country: 'Canada', since: 'June 2024', taxId: 'CA 81234 5678',
      plan: { name: 'Product sprint', price: 4800, renews: 'Oct 17', progress: 0 },
      totals: { lifetime: 57600, payments: 12, refunded: 0 },
    },
    {
      id: 'fernwood', name: 'Fernwood Supply Co.', initials: 'FS', email: 'ap@fernwood.example',
      country: 'United Kingdom', since: 'August 2025', taxId: 'GB 294 7710 21',
      plan: { name: 'Brand refresh', price: 860, renews: 'Oct 16', progress: 0.03 },
      totals: { lifetime: 6880, payments: 8, refunded: 0 },
    },
    {
      id: 'pinecrest', name: 'Pinecrest Academy', initials: 'PA', email: 'bursar@pinecrest.example',
      country: 'Ireland', since: 'September 2022', taxId: 'IE 4827193P',
      plan: { name: 'Campus website', price: 18000, renews: 'Dec 15', progress: 0.02 },
      totals: { lifetime: 198000, payments: 11, refunded: 0 },
    },
    {
      id: 'saltmarsh', name: 'Saltmarsh Coffee', initials: 'SC', email: 'hello@saltmarsh.example',
      country: 'Australia', since: 'July 2026', taxId: 'AU 47 318 205 916',
      plan: { name: 'Starter care plan', price: 129, renews: 'Oct 15', progress: 0.07 },
      totals: { lifetime: 387, payments: 3, refunded: 0 },
    },
    {
      id: 'bluestem', name: 'Bluestem Energy', initials: 'BE', email: 'accounts@bluestem.example',
      country: 'Germany', since: 'November 2024', taxId: 'DE 318 504 172',
      plan: { name: 'Data dashboard', price: 6250, renews: 'Oct 14', progress: 0.1 },
      totals: { lifetime: 75000, payments: 12, refunded: 6250 },
    },
    {
      id: 'copperline', name: 'Copperline Games', initials: 'CG', email: 'billing@copperline.example',
      country: 'Sweden', since: 'February 2025', taxId: 'SE 5567 1234 8901',
      plan: { name: 'Launch campaign', price: 3200, renews: 'Oct 13', progress: 0.13 },
      totals: { lifetime: 25600, payments: 8, refunded: 0 },
    },
    {
      id: 'everfield', name: 'Everfield Farms', initials: 'EF', email: 'office@everfield.example',
      country: 'New Zealand', since: 'April 2026', taxId: 'NZ 123-456-789',
      plan: { name: 'Shop care plan', price: 540, renews: 'Oct 12', progress: 0.17 },
      totals: { lifetime: 3240, payments: 6, refunded: 0 },
    },
    {
      id: 'moonrise', name: 'Moonrise Robotics', initials: 'MR', email: 'finance@moonrise.example',
      country: 'Japan', since: 'May 2025', taxId: 'JP T1234567890123',
      plan: { name: 'Investor deck', price: 7500, renews: 'Oct 11', progress: 0.2 },
      totals: { lifetime: 45000, payments: 6, refunded: 0 },
    },
  ],
  payments: [
    { id: 'pay_3QxL2m9ZkT4a', customerId: 'harborview', amount: 12400, currency: 'USD', status: 'succeeded', method: visa('4242', '08/28'), created: 'Sept 17, 14:32', description: 'Enterprise retainer, September', fee: 359.9 },
    { id: 'pay_3QwH8DpR2sKb', customerId: 'quarry', amount: 4800, currency: 'USD', status: 'processing', method: bank('Northbank', '6021'), created: 'Sept 17, 11:05', description: 'Product sprint 4', fee: 5 },
    { id: 'pay_3Qv4XbM7eTnc', customerId: 'fernwood', amount: 860, currency: 'USD', status: 'disputed', method: mastercard('8810', '11/27'), created: 'Sept 16, 16:48', description: 'Brand refresh, milestone 2', fee: 25.24 },
    {
      id: 'pay_3QuN6cLq1Zwd', customerId: 'tidewater', amount: 2400, currency: 'USD', status: 'succeeded', method: amex('1005', '04/29'),
      created: 'Sept 16, 09:12', description: 'Growth retainer, September', fee: 84, invoice: 'INV-2026-0914',
      events: [
        { kind: 'payout', title: 'Scheduled for payout', detail: 'Arrives Sept 19 in Northbank ···· 6021', time: 'Sept 16, 09:14' },
        { kind: 'succeeded', title: 'Payment succeeded', detail: 'Amex ···· 1005 was charged $2,400.00', time: 'Sept 16, 09:12' },
        { kind: 'check', title: 'Risk evaluated as normal', detail: 'Card security code and postal code matched', time: 'Sept 16, 09:12' },
        { kind: 'started', title: 'Invoice INV-2026-0914 opened', detail: 'By payments@tidewater.example', time: 'Sept 16, 09:08' },
      ],
    },
    { id: 'pay_3QtR9vKs3Ape', customerId: 'pinecrest', amount: 18000, currency: 'USD', status: 'succeeded', method: bank('Harbor Credit', '3310'), created: 'Sept 15, 13:40', description: 'Campus website, deposit', fee: 5 },
    { id: 'pay_3QsJ2hMw5Byf', customerId: 'saltmarsh', amount: 129, currency: 'USD', status: 'failed', method: visa('0019', '02/27'), created: 'Sept 15, 08:02', description: 'Starter care plan', fee: 0 },
    { id: 'pay_3QrW7nPx8Czg', customerId: 'bluestem', amount: 6250, currency: 'USD', status: 'refunded', method: mastercard('4471', '09/28'), created: 'Sept 14, 17:26', description: 'Data dashboard, phase 1', fee: 181.55 },
    { id: 'pay_3QqB5tYv2Dph', customerId: 'copperline', amount: 3200, currency: 'USD', status: 'succeeded', method: visa('7702', '05/29'), created: 'Sept 13, 10:18', description: 'Launch campaign, week 2', fee: 93.1 },
    { id: 'pay_3QpK1rUz6Eqj', customerId: 'everfield', amount: 540, currency: 'USD', status: 'succeeded', method: { kind: 'wallet', brand: 'Wallet', last4: '9921' }, created: 'Sept 12, 15:44', description: 'Shop care plan', fee: 15.96 },
    { id: 'pay_3QoM8wQa4Frk', customerId: 'moonrise', amount: 7500, currency: 'USD', status: 'succeeded', method: amex('3003', '12/28'), created: 'Sept 11, 12:09', description: 'Investor deck', fee: 262.5 },
  ],
  history: [
    { id: 'pay_3PzT4hQm8Lxa', customerId: 'tidewater', amount: 2400, currency: 'USD', status: 'succeeded', method: amex('1005', '04/29'), created: 'Aug 16, 09:10', description: 'Growth retainer, August', fee: 84 },
    { id: 'pay_3PkW1nRc5Jyb', customerId: 'tidewater', amount: 650, currency: 'USD', status: 'succeeded', method: amex('1005', '04/29'), created: 'Aug 2, 15:22', description: 'Workshop, extra session', fee: 22.75 },
    { id: 'pay_3OxD7sLp2Hzc', customerId: 'tidewater', amount: 2400, currency: 'USD', status: 'succeeded', method: amex('1005', '04/29'), created: 'Jul 16, 09:11', description: 'Growth retainer, July', fee: 84 },
    { id: 'pay_3OiG5wMc4Lbe', customerId: 'tidewater', amount: 2400, currency: 'USD', status: 'succeeded', method: amex('1005', '04/29'), created: 'Jun 17, 10:02', description: 'Growth retainer, June', fee: 84 },
    { id: 'pay_3OhF3vNb9Kad', customerId: 'tidewater', amount: 2400, currency: 'USD', status: 'failed', method: amex('1005', '04/29'), created: 'Jun 16, 09:15', description: 'Growth retainer, June', fee: 0 },
  ],
  invoices: [
    { id: 'INV-2026-1014', customerId: 'tidewater', amount: 2400, date: 'Oct 14', status: 'scheduled' },
    { id: 'INV-2026-0914', customerId: 'tidewater', amount: 2400, date: 'Sept 16', status: 'paid' },
    { id: 'INV-2026-0814', customerId: 'tidewater', amount: 2400, date: 'Aug 16', status: 'paid' },
    { id: 'INV-2026-0731', customerId: 'tidewater', amount: 650, date: 'Aug 2', status: 'paid' },
  ],
  activity: [
    { customerId: 'tidewater', kind: 'payment', title: 'Payment succeeded', detail: '$2,400.00 for Growth retainer, September', time: 'Sept 16, 09:12' },
    { customerId: 'tidewater', kind: 'invoice', title: 'Invoice sent', detail: 'INV-2026-0914 emailed to payments@tidewater.example', time: 'Sept 14, 18:00' },
    { customerId: 'tidewater', kind: 'payout', title: 'Paid out', detail: 'In the August payout to Northbank ···· 6021', time: 'Aug 19, 07:30' },
    { customerId: 'tidewater', kind: 'subscription', title: 'Retainer renewed', detail: 'Growth retainer at $2,400 a month', time: 'Aug 16, 00:00' },
  ],
};

export const customerById = function (data: CofferData, id: string): Customer | undefined {
  return data.customers.find((customer) => customer.id === id);
};

export const paymentById = function (data: CofferData, id: string): Payment | undefined {
  return data.payments.find((payment) => payment.id === id);
};
