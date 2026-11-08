import { buildInstallArgs, DEFAULT_TOKEN_AUDIT_BUCKETS } from './installUtils';

describe('buildInstallArgs', () => {
  it('defaults a production global command to explicit audit and claims opt-outs', () => {
    expect(buildInstallArgs(
      'workspace-1', 'view-1', 'production', ['claude', 'codex'], 'global', false, false, false
    )).toBe(
      'workspace-1 view-1 --clients claude,codex --no-token-audit --no-token-collector --no-work-claims'
    );
  });

  it('adds the environment, project scope, audit opt-in, and claims opt-in', () => {
    expect(buildInstallArgs(
      'workspace-1', 'view-1', 'stage', ['claude'], 'project', true, true, true
    )).toBe(
      'workspace-1 view-1 stage --clients claude --project --token-audit --token-collector --work-claims' +
      ` --token-audit-buckets '${DEFAULT_TOKEN_AUDIT_BUCKETS.replace(/ /g, '')}'`
    );
  });

  it('passes renamed and added buckets as one shell argument', () => {
    expect(buildInstallArgs(
      'workspace-1', 'view-1', 'stage', ['codex'], 'global', true, false, false,
      'planning, design review, implementation, customer research'
    )).toContain("--token-audit-buckets 'planning,design review,implementation,customer research'");
  });

  it.each(['', 'testing,', 'testing, testing', 'design review, testing', 'x'.repeat(81), "planning'; touch /tmp/nope"])(
    'does not produce an install command for invalid buckets: %s', (buckets) => {
      expect(buildInstallArgs(
        'workspace-1', 'view-1', 'stage', ['codex'], 'global', true, false, false, buckets
      )).toBeNull();
      expect(buildInstallArgs(
        'workspace-1', 'view-1', 'stage', ['codex'], 'global', false, false, false, buckets
      )).toContain('--no-token-audit');
    }
  );
});
