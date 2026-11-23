import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ActiveAgentPricing from './ActiveAgentPricing';

const pricing = {
  model: 'active_agent_v1', period_start: 2000, period_end: 3000,
  active_people: 2, estimated_charge_cents: 750, currency: 'usd',
  trial_end: 1000, cutover_at: 2000, accounting_status: 'current',
};

test('shows the calculated charge and active people instead of the zero-dollar subscription base', () => {
  const html = renderToStaticMarkup(<ActiveAgentPricing pricing={pricing} now={2100000} />);
  expect(html).toContain('2 active people');
  expect(html).toContain('$7.50');
  expect(html).toContain('up to $9 total');
  expect(html).toContain('Billing period:');
});

test('pending accounting never renders an unconfirmed free month', () => {
  const html = renderToStaticMarkup(<ActiveAgentPricing
    pricing={{ ...pricing, accounting_status: 'pending', active_people: 0, estimated_charge_cents: null }}
    now={2100000} />);
  expect(html).toContain('Accounting is pending');
  expect(html).not.toContain('Current estimate:');
  expect(html).not.toContain('0 active people');
});

test('preserves the existing trial and explains a future migration boundary', () => {
  const html = renderToStaticMarkup(<ActiveAgentPricing
    pricing={{ ...pricing, cutover_at: 3000, trial_end: 4000, estimated_charge_cents: 0 }} now={2100000} />);
  expect(html).toContain('Your free trial ends');
  expect(html).toContain('Active agent pricing begins');
  expect(html).toContain('Your current billing period keeps its existing charge');
});
