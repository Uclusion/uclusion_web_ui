import _ from 'lodash';

/**
 * T-all-2485: during a storm the leader accrues everything it fetches instead of releasing it
 * once per fetch cycle. R-all-2302 measured seven questions producing twelve refresh cycles and
 * up to thirty-six sendMarketsStruct releases across ten contexts each; this collapses them to
 * one release per debounce window. R-all-2316 is the settled design and R-all-2317 records why
 * the overlay below replaced reusing each context reducer's merge.
 *
 * Nothing here dispatches or persists. Because no reducer runs during the storm, no whole-state
 * clone reaches IndexedDB either, which is what Q-all-478 O-1 settled: disk is written once, at
 * release, as an ordinary consequence of the single dispatch.
 */

// Q-all-477 O-2 with the numbers delegated in R-all-2315. The quiet window sits above the
// T-all-2259 push verifier's PUSH_VERIFY_BASE_DELAY_MS of 2000 so its first retry stays inside
// the same storm instead of forcing a second release.
export const QUIET_WINDOW_MS = 2500;
export const MAX_HOLD_MS = 10000;

// Both numbers were chosen from reasoning rather than measurement (R-all-2315), so they are
// overridable at runtime the same way the profiler is armed, without a rebuild:
//   localStorage.setItem('uclusionReleaseQuietMs', '120000')
//   localStorage.setItem('uclusionReleaseCapMs', '180000')
// Raising the quiet window alone does nothing, because the maximum hold still fires; a
// diagnostic that wants no release during a storm has to raise both.
function readOverrideMs(key, fallback) {
  try {
    const raw = typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    const parsed = raw === null ? NaN : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  } catch (ignored) {
    return fallback;
  }
}

export function quietWindowMs() {
  return readOverrideMs('uclusionReleaseQuietMs', QUIET_WINDOW_MS);
}

export function maxHoldMs() {
  return readOverrideMs('uclusionReleaseCapMs', MAX_HOLD_MS);
}

// Stage one policy (R-all-2334). Same shape and same reasoning as the release window, but its own
// numbers so the two ends of the pipeline can be tuned independently.
// Best-guess defaults. The quiet window sits above the T-all-2259 verifier's 2000ms base so its
// retry does not split a storm, and above burst eight's 2.7s median gap between version changes so
// a drip actually coalesces. The cap bounds worst-case staleness during sustained activity; an idle
// client still syncs immediately on the leading edge, so a lone notification is never delayed.
// Tuning past this buys fewer calls for proportional staleness and does not reduce client CPU
// (R-all-2337), so these are deliberately modest.
export const SYNC_QUIET_MS = 5000;
export const SYNC_MAX_HOLD_MS = 15000;

export function syncQuietMs() {
  return readOverrideMs('uclusionSyncQuietMs', SYNC_QUIET_MS);
}

export function syncCapMs() {
  return readOverrideMs('uclusionSyncCapMs', SYNC_MAX_HOLD_MS);
}

/**
 * Trailing debounce with an idle leading edge. Measured from the last REQUEST, not the last cycle,
 * which is the distinction that matters: burst eight's version checks arrived a median 2.7s apart
 * across 65s, so a window measured from the last cycle expires between every pair and fires every
 * time, pacing instead of collapsing. Resetting on each request lets a drip settle into one pass.
 *
 * An idle client still syncs immediately, so a lone notification is never delayed.
 */
export function msUntilSync(now, lastRequestMs, firstSuppressedMs, quietMs = SYNC_QUIET_MS,
  capMs = SYNC_MAX_HOLD_MS) {
  if (lastRequestMs === undefined || now - lastRequestMs >= quietMs) {
    return 0;
  }
  const quietDueMs = now + quietMs;
  const capDueMs = (firstSuppressedMs === undefined ? quietDueMs : firstSuppressedMs + capMs);
  return Math.max(0, Math.min(quietDueMs, capDueMs) - now);
}

// Accrued entries go in under keys that cannot collide with stored ones, so the overlay only
// ever adds candidates and never displaces what is already there. That matters for investibles,
// where replacing a stored entry would drop the market_infos of markets this fetch did not
// touch and make them look unfetched (R-all-2317).
const ACCRUED_KEY_PREFIX = '__accrued_';

let accrued = {};
let firstAccruedMs = undefined;

/**
 * Folds one phase's marketsStruct into the accrued struct using exactly the shape rules
 * addMarketsStructInfo uses: per-market types are objects keyed by market id holding arrays,
 * everything else is a flat array.
 */
export function accrueMarketsStruct(marketsStruct) {
  if (_.isEmpty(marketsStruct)) {
    return;
  }
  Object.keys(marketsStruct).forEach((infoType) => {
    const details = marketsStruct[infoType];
    if (_.isEmpty(details)) {
      return;
    }
    if (infoType === 'existingCommentIds') {
      // Carried through rather than concatenated per market - the comments reducer ignores it
      // today, but dropping it here would be a silent behavior change.
      accrued.existingCommentIds = _.union(accrued.existingCommentIds || [], details);
    } else if (_.isArray(details)) {
      accrued[infoType] = (accrued[infoType] || []).concat(details);
    } else {
      const byMarket = accrued[infoType] || (accrued[infoType] = {});
      Object.keys(details).forEach((marketId) => {
        byMarket[marketId] = (byMarket[marketId] || []).concat(details[marketId]);
      });
    }
  });
  // Only a phase that actually carried something starts the maximum hold clock. A cycle that
  // found nothing dirty must not age the cap, or a quiet workspace would release on the cap
  // rather than the quiet window.
  if (firstAccruedMs === undefined && hasAccrued()) {
    firstAccruedMs = Date.now();
  }
}

export function hasAccrued() {
  return !_.isEmpty(accrued);
}

/** When the oldest unreleased change arrived, which is what the maximum hold is measured from. */
export function getFirstAccruedMs() {
  return firstAccruedMs;
}

/** Hands the accrued struct to the caller and starts a fresh accrual. */
export function takeAccrued() {
  const taken = accrued;
  resetAccrued();
  return taken;
}

export function resetAccrued() {
  accrued = {};
  firstAccruedMs = undefined;
}

function prependByMarket(storedByMarket, accruedByMarket) {
  if (_.isEmpty(accruedByMarket)) {
    return storedByMarket;
  }
  const merged = { ...(storedByMarket || {}) };
  Object.keys(accruedByMarket).forEach((marketId) => {
    // Accrued first, never appended. satisfyComments resolves a reply's parent with a find on
    // reply_id, so a stale copy sitting ahead of the fresh one would return a parent whose
    // children does not list the new reply and fabricate an unmatched signature (R-all-2317).
    merged[marketId] = (accruedByMarket[marketId] || []).concat(merged[marketId] || []);
  });
  return merged;
}

/**
 * Returns storageStates with everything accrued so far layered on top. This is what makes the
 * accumulator, rather than the context state, the thing that decides what still needs fetching.
 * Without it, holding dispatches back would leave every accrued market looking dirty on the next
 * cycle and being fetched again (R-all-2308).
 */
export function overlayStorageStates(storageStates) {
  if (!hasAccrued()) {
    return storageStates;
  }
  const overlaid = { ...storageStates };
  overlaid.commentsState = prependByMarket(storageStates.commentsState, accrued.comments);
  overlaid.marketPresencesState = prependByMarket(storageStates.marketPresencesState, accrued.users);
  overlaid.marketStagesState = prependByMarket(storageStates.marketStagesState, accrued.stages);
  overlaid.marketGroupsState = prependByMarket(storageStates.marketGroupsState, accrued.group);
  if (!_.isEmpty(accrued.markets)) {
    const stored = storageStates.marketsState || {};
    overlaid.marketsState = { ...stored, marketDetails: accrued.markets.concat(stored.marketDetails || []) };
  }
  if (!_.isEmpty(accrued.investibles)) {
    // satisfyInvestibles reads Object.values, so a synthetic key is enough to be seen and keeps
    // the stored entry intact for markets this fetch did not cover.
    const merged = { ...(storageStates.investiblesState || {}) };
    accrued.investibles.forEach((item, index) => {
      merged[`${ACCRUED_KEY_PREFIX}${item?.investible?.id || index}`] = item;
    });
    overlaid.investiblesState = merged;
  }
  if (!_.isEmpty(accrued.members)) {
    // satisfyGroupMembers flattens every value regardless of key.
    overlaid.groupMembersState = { ...(storageStates.groupMembersState || {}),
      [`${ACCRUED_KEY_PREFIX}members`]: accrued.members };
  }
  return overlaid;
}

/**
 * How long until the storm should be released, in millis. Pure so the policy can be tested
 * without timers (Q-all-481 O-1). Releases at the quiet window after the last cycle, or at the
 * maximum hold measured from the first unreleased change, whichever comes first.
 */
export function msUntilRelease(now, lastCycleEndMs, firstUnreleasedMs, quietMs = QUIET_WINDOW_MS,
  capMs = MAX_HOLD_MS) {
  const quietDueMs = lastCycleEndMs + quietMs;
  const capDueMs = (firstUnreleasedMs === undefined ? quietDueMs : firstUnreleasedMs + capMs);
  return Math.max(0, Math.min(quietDueMs, capDueMs) - now);
}
