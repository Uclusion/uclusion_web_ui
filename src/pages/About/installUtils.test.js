import { buildInstallArgs } from './installUtils';

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
      'workspace-1 view-1 stage --clients claude --project --token-audit --token-collector --work-claims'
    );
  });
});
