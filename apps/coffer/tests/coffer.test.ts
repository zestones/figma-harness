'use strict';

const assert: typeof import('node:assert/strict') = require('node:assert/strict');
const test: typeof import('node:test') = require('node:test');

test('Coffer writes money, counts and chart values without Intl', async () => {
  const { count, money, thousands, wholeMoney } = await import('../src/pages/format.ts');

  assert.equal(money(2400), '$2,400.00');
  assert.equal(money(-84), '−$84.00');
  assert.equal(money(987654321.99), '$987,654,321.99');
  assert.equal(wholeMoney(86420.4), '$86,420');
  assert.equal(count(12845), '12,845');
  assert.equal(thousands(60), '$60k');
  assert.equal(thousands(49, 1), '$49.0k');
  assert.equal(thousands(1250), '$1,250k');
});

test('Coffer fixtures hold together', async () => {
  const { COFFER, customerById, paymentById } = await import('../src/fixtures/index.ts');

  const payment = paymentById(COFFER, COFFER.selectedPaymentId);
  assert.ok(payment?.events?.length, 'the selected payment has a history');
  assert.equal(customerById(COFFER, COFFER.selectedCustomerId)?.id, payment.customerId);
  assert.equal(new Set([...COFFER.payments, ...COFFER.history].map((item) => item.id)).size,
    COFFER.payments.length + COFFER.history.length);
  assert.ok([...COFFER.payments, ...COFFER.history].every((item) => customerById(COFFER, item.customerId)));
  assert.ok(COFFER.payments.some((item) => item.status === 'disputed'), 'the overview has a dispute to answer');

  const { current, previous } = COFFER.revenue;
  assert.equal(current.length, 30);
  assert.equal(previous.length, current.length);
  assert.ok([...current, ...previous].every((value) => value >= 0 && value <= 60), 'the chart ticks hold every value');
  assert.ok(COFFER.metrics.some((metric) => metric.label === 'Net revenue'));
  assert.equal(Math.round(COFFER.methods.reduce((sum, method) => sum + method.share, 0) * 100), 100);
});

test('Coffer animates only the refund dialog, and wires nothing under it', async () => {
  const { FLOW_TRANSITIONS } = await import('../src/flows/transitions.ts');
  const { PROTOTYPE_SCREENS } = await import('../src/screens.ts');
  const { validateProductFlowContract } = await import('../src/flows/rules.ts');

  assert.deepEqual(validateProductFlowContract(), []);
  assert.deepEqual(
    FLOW_TRANSITIONS.filter((transition) => transition.motion).map((transition) => [transition.id, transition.motion]),
    [
      ['refund.open', 'enter'],
      ['refund.close', 'exit'],
      ['refund.cancel', 'exit'],
      ['refund.confirm', 'exit'],
    ],
  );
  assert.deepEqual(
    FLOW_TRANSITIONS.filter((transition) => transition.sources.includes('paymentRefund')).map((transition) => transition.id),
    ['refund.close', 'refund.cancel', 'refund.confirm'],
  );
  assert.deepEqual(PROTOTYPE_SCREENS.map((screen) => screen.key), [
    'overview', 'payments', 'payment', 'paymentRefund', 'paymentRefunded', 'customer',
  ]);
  for (const screen of PROTOTYPE_SCREENS) {
    assert.ok(
      FLOW_TRANSITIONS.some((transition) => transition.destination === screen.key) || screen.key === 'overview',
      screen.key + ' is reachable',
    );
  }
});

/* National check-digit rules for the tax IDs the fixtures use. An ID that
   passes its rule could belong to a real organisation. The rules were checked
   against published examples, which are deliberately not kept here. */
const digitsOf = (value: string): number[] => [...value.replace(/\D/g, '')].map(Number);
const luhn = (numbers: readonly number[]): boolean => numbers.slice().reverse().reduce((sum, digit, index) => {
  const doubled = index % 2 === 1 ? digit * 2 : digit;
  return sum + (doubled > 9 ? doubled - 9 : doubled);
}, 0) % 10 === 0;
const weighted = (numbers: readonly number[], weights: readonly number[]): number =>
  weights.reduce((sum, weight, index) => sum + weight * numbers[index], 0);
const TAX_ID_RULES: Readonly<Record<string, (value: string) => boolean>> = {
  AU(value) {
    const numbers = digitsOf(value);
    numbers[0] -= 1;
    return weighted(numbers, [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]) % 89 === 0;
  },
  CA: (value) => luhn(digitsOf(value)),
  DE(value) {
    const numbers = digitsOf(value);
    let product = 10;
    for (const digit of numbers.slice(0, 8)) {
      const sum = (digit + product) % 10 || 10;
      product = (2 * sum) % 11;
    }
    return (11 - product) % 10 === numbers[8];
  },
  GB(value) {
    const numbers = digitsOf(value);
    const sum = weighted(numbers, [8, 7, 6, 5, 4, 3, 2]);
    const check = numbers[7] * 10 + numbers[8];
    return (sum + check) % 97 === 0 || (sum + 55 + check) % 97 === 0;
  },
  IE(value) {
    const compact = value.replace(/\s/g, '').slice(2);
    const sum = weighted(digitsOf(compact.slice(0, 7)), [8, 7, 6, 5, 4, 3, 2]);
    return compact[7] === 'WABCDEFGHIJKLMNOPQRSTUV'[sum % 23];
  },
  JP(value) {
    const [check, ...base] = digitsOf(value);
    const sum = base.slice().reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 1 : 2), 0);
    return check === 9 - (sum % 9);
  },
  NL(value) {
    const numbers = digitsOf(value.split('B')[0]);
    return (weighted(numbers, [9, 8, 7, 6, 5, 4, 3, 2]) - numbers[8]) % 11 === 0;
  },
  NZ(value) {
    const numbers = digitsOf(value).length === 8 ? [0, ...digitsOf(value)] : digitsOf(value);
    for (const weights of [[3, 2, 7, 6, 5, 4, 3, 2], [7, 4, 3, 2, 5, 2, 7, 6]]) {
      const remainder = weighted(numbers, weights) % 11;
      const check = remainder === 0 ? 0 : 11 - remainder;
      if (check !== 10) return check === numbers[8];
    }
    return false;
  },
  SE: (value) => luhn(digitsOf(value).slice(0, 10)),
  // The IRS never assigns these prefixes.
  US: (value) => ![0, 7, 8, 9, 17, 18, 19, 28, 29, 49, 69, 70, 78, 79, 89].includes(Number(value.replace(/\D/g, '').slice(0, 2))),
};

test('every tax ID in the fixtures fails its national check, so none is real', async () => {
  const { COFFER } = await import('../src/fixtures/index.ts');

  for (const customer of COFFER.customers) {
    const rule = TAX_ID_RULES[customer.taxId.slice(0, 2)];
    assert.ok(rule, customer.taxId + ' has a known format');
    assert.equal(rule(customer.taxId), false, customer.taxId + ' passes its national check');
  }
});
