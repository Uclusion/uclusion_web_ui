import { buildInstallArgs } from './installUtils';

describe('buildInstallArgs', () => {
  it('defaults a production global command to an explicit audit opt-out', () => {
    expect(buildInstallArgs(
      'workspace-1', 'view-1', 'production', ['claude', 'codex'], 'global', false
    )).toBe(
      'workspace-1 view-1 --clients claude,codex --no-token-audit'
    );
  });

  it('adds the environment, project scope, and audit opt-in', () => {
    expect(buildInstallArgs(
      'workspace-1', 'view-1', 'stage', ['claude'], 'project', true
    )).toBe(
      'workspace-1 view-1 stage --clients claude --project --token-audit'
    );
  });
});
