import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import SubscriptionStatus from './SubscriptionStatus';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';

jest.mock('../../contexts/AccountContext/AccountContext', () => ({
  AccountContext: require('react').createContext(),
}));
jest.mock('../../contexts/OperationInProgressContext/OperationInProgressContext', () => ({
  OperationInProgressContext: require('react').createContext(),
}));
jest.mock('../../contexts/AccountContext/accountContextHelper', () => ({
  getAccount: (state) => state.account,
  getUnusedFullPromotions: () => [],
  updateAccount: jest.fn(),
}));
jest.mock('../../api/users', () => ({ endSubscription: jest.fn() }));
jest.mock('../../components/SpinBlocking/SpinBlockingButton', () => ({ id }) => <button>{id}</button>);
jest.mock('../../containers/SubSection/SubSection', () => ({ children }) => <section>{children}</section>);
jest.mock('react-intl', () => ({ useIntl: () => ({ formatMessage: ({ id }) => id, formatDate: String }) }));

function render(account, pricing = { model: 'active_agent_v1', active_people: 0, estimated_charge_cents: 0,
  trial_end: 1, accounting_status: 'current', cutover_at: 1 }) {
  return renderToStaticMarkup(
    <AccountContext.Provider value={[{ account }, jest.fn()]}>
      <OperationInProgressContext.Provider value={[false, jest.fn()]}>
        <SubscriptionStatus subscriptionInfo={{ subscription: { status: 'active' },
          payment_methods: [], uclusion_pricing: pricing }} />
      </OperationInProgressContext.Provider>
    </AccountContext.Provider>
  );
}

test('a quiet active-agent month still shows a failed prior invoice and permits cancellation', () => {
  const html = render({ billing_subscription_status: 'FREE', invoice_payment_failed: true });
  expect(html).toContain('billingNeedCard');
  expect(html).toContain('billingSubCancel');
});

test('a quiet month without a failed invoice does not demand a payment method', () => {
  const html = render({ billing_subscription_status: 'FREE', invoice_payment_failed: false });
  expect(html).not.toContain('billingNeedCard');
  expect(html).toContain('billingSubCancel');
});

test('canceled subscriptions retain their status and have no second cancellation action', () => {
  const html = render({ billing_subscription_status: 'CANCELED', invoice_payment_failed: true });
  expect(html).toContain('billingSubCanceled');
  expect(html).not.toContain('<button>billingSubCancel</button>');
  expect(html).toContain('billingNeedCard');
});

test('legacy free-tier payment and cancellation behavior stays unchanged', () => {
  const html = render({ billing_subscription_status: 'FREE', invoice_payment_failed: true }, null);
  expect(html).not.toContain('billingNeedCard');
  expect(html).not.toContain('billingSubCancel');
});
