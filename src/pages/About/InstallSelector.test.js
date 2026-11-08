import React, { act, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import InstallSelector from './InstallSelector';
import { buildInstallArgs, DEFAULT_TOKEN_AUDIT_BUCKETS } from './installUtils';

function InstallForm() {
  const [tokenAudit, setTokenAudit] = useState(false);
  const [buckets, setBuckets] = useState(DEFAULT_TOKEN_AUDIT_BUCKETS);
  return <>
    <InstallSelector scope='global' setScope={() => {}} clients={['codex']} setClients={() => {}}
      tokenAudit={tokenAudit} setTokenAudit={setTokenAudit}
      tokenAuditBuckets={buckets} setTokenAuditBuckets={setBuckets}
      tokenCollector={false} setTokenCollector={() => {}} workClaims={false} setWorkClaims={() => {}} />
    <output>{buildInstallArgs('workspace', 'view', 'stage', ['codex'], 'global', tokenAudit,
      false, false, buckets)}</output>
  </>;
}

it('offers editable defaults when enabled and keeps the chosen buckets across toggles', () => {
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement('div');
  const root = createRoot(container);
  try {
    act(() => root.render(<InstallForm />));
    expect(container.querySelector('#installTokenAuditBuckets')).toBeNull();
    act(() => container.querySelector('#installTokenAuditOn').click());
    const input = container.querySelector('#installTokenAuditBuckets');
    expect(input.value).toBe(DEFAULT_TOKEN_AUDIT_BUCKETS);
    act(() => Simulate.change(input, { target: { value: 'planning, design review, testing, writing' } }));
    expect(container.querySelector('output').textContent)
      .toContain("--token-audit-buckets 'planning,design review,testing,writing'");
    act(() => container.querySelector('#installTokenAuditOff').click());
    expect(container.querySelector('output').textContent).not.toContain('--token-audit-buckets');
    act(() => container.querySelector('#installTokenAuditOn').click());
    expect(container.querySelector('#installTokenAuditBuckets').value).toBe('planning, design review, testing, writing');
    act(() => Simulate.change(container.querySelector('#installTokenAuditBuckets'), {
      target: { value: 'testing,testing' },
    }));
    expect(container.textContent).toContain('Each bucket must have a different name.');
    expect(container.querySelector('output').textContent).toBe('');
  } finally {
    act(() => root.unmount());
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  }
});
