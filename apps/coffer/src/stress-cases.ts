/* Stress cases: every screen at every supported artboard size, the blocks
 * whose width varies, and extreme data. The harness builds each case and
 * fails on any layout issue. Extend this file with the screens and blocks you
 * add. */

import { areaChart, button, pageHeader, stat } from '@figma-harness/carrara';
import { COFFER, type CofferData } from './fixtures/index.ts';
import { FRAME_H, FRAME_W, setFrameSize } from './pages/frame.ts';
import { screenCustomer } from './pages/customer.ts';
import { screenOverview } from './pages/overview.ts';
import { screenPayment } from './pages/payment.ts';
import { paymentTable } from './pages/payment-table.ts';
import { screenPayments } from './pages/payments.ts';

const LONG_NAME = 'Featherstonehaugh-Montgomery International Freight and Warehousing Cooperative';
const LONG_TEXT = 'A deliberately long description that keeps going well past any sensible column width';
const LONG_EMAIL = 'accounts-payable.department@featherstonehaugh-montgomery-international.example';

export const STRESS_CONTRACT = Object.freeze({
  /** Blocks whose width follows the page, from a phone to a wide screen. */
  boxes: Object.freeze([
    {
      name: 'paymentTable',
      build: (width: number) => paymentTable({ w: width, label: 'Payments', payments: COFFER.payments, ids: true }),
      widths: [720, 960, 1128, 1600],
      heights: [0],
    },
    {
      name: 'customerPayments',
      build: (width: number) => paymentTable({ w: width, label: 'Payments', payments: COFFER.history, customer: false }),
      widths: [520, 584, 744, 1184],
      heights: [0],
    },
    {
      name: 'stat',
      build: (width: number) => stat({
        w: width, label: LONG_TEXT, value: '$1,284,390,000', caption: LONG_TEXT,
        series: COFFER.metrics[0].series, trend: { value: '+1,204.9%', direction: 'up' },
      }),
      widths: [224, 272, 360, 400],
      heights: [0],
    },
    {
      name: 'areaChart',
      build: (width: number, height: number) => areaChart({
        w: width, h: height, series: { label: 'September', values: COFFER.revenue.current },
        comparison: { label: 'August', values: COFFER.revenue.previous },
        xLabels: COFFER.revenue.labels, yTicks: [0, 20, 40, 60], format: (value) => '$' + value + 'k',
        highlight: { index: 29, title: 'Sept 30', rows: [{ label: 'September', value: '$48.7k' }, { label: 'August', value: '$44.0k' }] },
      }),
      widths: [320, 544, 696, 1184],
      heights: [160, 240],
    },
    {
      name: 'pageHeader',
      build: async (width: number) => pageHeader({
        w: width, title: LONG_NAME, description: LONG_TEXT, breadcrumbs: [{ label: 'Customers' }],
        actions: [await button({ label: 'Send invoice' }), await button({ label: 'Create payment', variant: 'primary' })],
      }),
      widths: [360, 720, 1128],
      heights: [0],
    },
  ]),
  /** Whole screens, rebuilt at every supported artboard size. */
  frameSizes: Object.freeze([
    [768, 1024], [1024, 768], [1280, 800], [1440, 1024], [1920, 1080],
  ] as const),
  screens: Object.freeze([
    { name: 'overview', build: () => screenOverview('stress') },
    { name: 'payments', build: () => screenPayments('stress') },
    { name: 'payment', build: () => screenPayment({ name: 'stress' }) },
    { name: 'payment/refund', build: () => screenPayment({ name: 'stress', refund: 'dialog' }) },
    { name: 'payment/refunded', build: () => screenPayment({ name: 'stress', refund: 'done' }) },
    { name: 'customer', build: () => screenCustomer('stress') },
  ]),
  frameSize: (): readonly [width: number, height: number] => [FRAME_W, FRAME_H],
  setFrameSize,
  /** Data extremes applied to the live fixtures, each restored afterwards. */
  prepareMutations() {
    const snapshot = JSON.stringify(COFFER);
    return {
      restore(): void {
        Object.assign(COFFER, JSON.parse(snapshot) as CofferData);
      },
      mutations: [
        ['long names', () => {
          COFFER.workspace.name = LONG_NAME;
          COFFER.user.name = LONG_NAME;
          COFFER.user.email = LONG_EMAIL;
          for (const customer of COFFER.customers) {
            customer.name = LONG_NAME;
            customer.email = LONG_EMAIL;
            customer.country = LONG_TEXT;
            customer.since = LONG_TEXT;
            customer.plan.name = LONG_TEXT;
          }
          for (const payment of [...COFFER.payments, ...COFFER.history]) {
            payment.description = LONG_TEXT;
            payment.method.brand = LONG_NAME;
            for (const event of payment.events || []) {
              event.title = LONG_TEXT;
              event.detail = LONG_TEXT + ' ' + LONG_TEXT;
            }
          }
          for (const event of COFFER.activity) event.detail = LONG_TEXT + ' ' + LONG_TEXT;
          for (const method of COFFER.methods) method.label = LONG_TEXT;
          for (const invoice of COFFER.invoices) invoice.id = LONG_TEXT;
          COFFER.payout.bank = LONG_NAME;
          COFFER.refund.reason = LONG_TEXT;
        }],
        ['large amounts', () => {
          for (const payment of COFFER.payments) {
            payment.amount = 987654321.99;
            payment.fee = 34567901.27;
          }
          COFFER.payout.amount = 987654321.99;
          for (const customer of COFFER.customers) customer.totals.lifetime = 98765432100;
          COFFER.counts.all = 98765432;
        }],
        ['no payments', () => {
          COFFER.payments = [];
          COFFER.history = [];
          COFFER.counts.all = 0;
        }],
        ['no activity', () => {
          COFFER.activity = [];
          COFFER.invoices = [];
          for (const payment of COFFER.payments) payment.events = [];
        }],
        ['unknown payment', () => { COFFER.selectedPaymentId = 'missing'; }],
        ['unknown customer', () => {
          COFFER.selectedCustomerId = 'missing';
          COFFER.customers = [];
        }],
      ] as ReadonlyArray<readonly [string, () => void]>,
    };
  },
});
