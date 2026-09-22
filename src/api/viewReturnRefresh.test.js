import {
  isExplicitFreshnessReason,
  LONG_ABSENCE_REFRESH_REASON,
  viewReturnRefresh,
} from './viewReturnRefresh';

const STALENESS_MS = 30000;

describe('viewReturnRefresh', () => {
  it('keeps a short return on the speculative skip', () => {
    expect(viewReturnRefresh(1_000, 1_000 + STALENESS_MS, STALENESS_MS)).toEqual({
      reason: 'viewChange',
      skipIfRefreshedWithinMs: STALENESS_MS,
    });
  });

  it('does not treat a longer absence as already fresh', () => {
    const request = viewReturnRefresh(0, STALENESS_MS + 1, STALENESS_MS);
    expect(request).toEqual({ reason: LONG_ABSENCE_REFRESH_REASON });
    expect(request.skipIfRefreshedWithinMs).toBeUndefined();
  });

  it('stays speculative when the page was not marked away', () => {
    expect(viewReturnRefresh(undefined, 100_000, STALENESS_MS).reason).toBe('viewChange');
  });
});

describe('isExplicitFreshnessReason', () => {
  it('runs a long-absence return immediately and leaves ordinary view changes speculative', () => {
    expect(isExplicitFreshnessReason(LONG_ABSENCE_REFRESH_REASON)).toBe(true);
    expect(isExplicitFreshnessReason('viewChange')).toBe(false);
    expect(isExplicitFreshnessReason('navigation')).toBe(true);
    expect(isExplicitFreshnessReason('manual')).toBe(true);
    expect(isExplicitFreshnessReason('serverResponse')).toBe(true);
  });
});
