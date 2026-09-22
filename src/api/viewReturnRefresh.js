// B-all-664: coming back after a long absence must start a sync. C-all-1066 still
// skips a speculative refresh when one is in progress or succeeded within the
// freshness window, so a quick tab flip does not queue a second full cycle.
// Absence longer than that window is not "already fresh": background tabs
// freeze timers, and the drift runner does not catch up on return.

export const LONG_ABSENCE_REFRESH_REASON = 'longAbsence';

export function isExplicitFreshnessReason(reason) {
  return reason === 'navigation' || reason === 'manual' || reason === 'serverResponse' ||
    reason === LONG_ABSENCE_REFRESH_REASON;
}

export function viewReturnRefresh(leftAt, now, stalenessMs) {
  const absentMs = leftAt === undefined || leftAt === null ? 0 : now - leftAt;
  if (absentMs > stalenessMs) {
    return { reason: LONG_ABSENCE_REFRESH_REASON };
  }
  return { reason: 'viewChange', skipIfRefreshedWithinMs: stalenessMs };
}
