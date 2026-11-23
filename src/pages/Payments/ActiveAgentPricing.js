import React from 'react';
import { Typography } from '@material-ui/core';

export default function ActiveAgentPricing({ pricing, now = Date.now() }) {
  const date = (seconds) => new Date(seconds * 1000).toLocaleDateString();
  const pending = pricing.accounting_status !== 'current';
  const trial = pricing.trial_end && now < pricing.trial_end * 1000;
  const scheduled = now < pricing.cutover_at * 1000;

  return (
    <div>
      {scheduled && (
        <Typography>
          Active agent pricing begins on {date(pricing.cutover_at)}. Your current billing period keeps its existing charge.
        </Typography>
      )}
      <Typography>$3.75 per active user/month, up to $9 total.</Typography>
      <Typography>
        Only people who use MCP or CLI for work during the month count. People who collaborate without an agent are free.
        One person with several agents counts once.
      </Typography>
      {pricing.period_start && pricing.period_end && (
        <Typography>Billing period: {date(pricing.period_start)} to {date(pricing.period_end)}.</Typography>
      )}
      {!pricing.trial_end && <Typography>Your six-month free period begins with your first agent use.</Typography>}
      {trial && <Typography>Your free trial ends on {date(pricing.trial_end)}.</Typography>}
      {pending ? (
        <Typography>Accounting is pending. The active-user count and charge are not yet confirmed.</Typography>
      ) : (
        <Typography>
          {pricing.active_people} active {pricing.active_people === 1 ? 'person' : 'people'} this billing month.
          {' '}Current estimate: ${(pricing.estimated_charge_cents / 100).toFixed(2)}
          {trial ? ' during your free trial.' : ', billed after the month ends.'}
        </Typography>
      )}
    </div>
  );
}
