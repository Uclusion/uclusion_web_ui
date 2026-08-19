import _ from 'lodash';
import {
  accrueMarketsStruct,
  getFirstAccruedMs,
  hasAccrued,
  MAX_HOLD_MS,
  msUntilRelease,
  msUntilSync,
  overlayStorageStates,
  QUIET_WINDOW_MS,
  SYNC_QUIET_MS,
  resetAccrued,
  takeAccrued
} from './syncAccumulator';
import { fetchableInvestibleSignatures } from './versionedFetchUtils';

// T-all-2485 / Q-all-481 O-1: the fold and the debounce policy are the two pieces a later
// refactor could silently break back into a per-cycle release, and both are pure.

describe('accrueMarketsStruct', () => {
  beforeEach(() => resetAccrued());

  it('starts empty', () => {
    expect(hasAccrued()).toBe(false);
    expect(getFirstAccruedMs()).toBeUndefined();
  });

  it('concatenates per market types across phases and keeps markets apart', () => {
    accrueMarketsStruct({ comments: { m1: [{ id: 'c1' }] } });
    accrueMarketsStruct({ comments: { m1: [{ id: 'c2' }], m2: [{ id: 'c3' }] } });
    const accrued = takeAccrued();
    expect(accrued.comments.m1.map((comment) => comment.id)).toEqual(['c1', 'c2']);
    expect(accrued.comments.m2.map((comment) => comment.id)).toEqual(['c3']);
  });

  it('concatenates flat types across phases', () => {
    accrueMarketsStruct({ markets: [{ id: 'm1' }] });
    accrueMarketsStruct({ markets: [{ id: 'm2' }], investibles: [{ investible: { id: 'i1' } }] });
    const accrued = takeAccrued();
    expect(accrued.markets.map((market) => market.id)).toEqual(['m1', 'm2']);
    expect(accrued.investibles).toHaveLength(1);
  });

  it('unions existingCommentIds instead of overwriting them', () => {
    accrueMarketsStruct({ existingCommentIds: ['c1', 'c2'] });
    accrueMarketsStruct({ existingCommentIds: ['c2', 'c3'] });
    expect(takeAccrued().existingCommentIds.sort()).toEqual(['c1', 'c2', 'c3']);
  });

  it('ignores empty phases so a clean cycle does not start the maximum hold clock', () => {
    accrueMarketsStruct({});
    accrueMarketsStruct({ comments: {} });
    expect(hasAccrued()).toBe(false);
    expect(getFirstAccruedMs()).toBeUndefined();
  });

  it('stamps the first accrual only, since the cap is measured from the oldest change', () => {
    accrueMarketsStruct({ markets: [{ id: 'm1' }] });
    const first = getFirstAccruedMs();
    accrueMarketsStruct({ markets: [{ id: 'm2' }] });
    expect(getFirstAccruedMs()).toBe(first);
  });

  it('takeAccrued hands over the storm and starts a fresh one', () => {
    accrueMarketsStruct({ markets: [{ id: 'm1' }] });
    expect(takeAccrued().markets).toHaveLength(1);
    expect(hasAccrued()).toBe(false);
    expect(getFirstAccruedMs()).toBeUndefined();
  });

  it('does not alias the caller struct, which doVersionRefresh mutates as an output parameter', () => {
    const phase = { comments: { m1: [{ id: 'c1' }] } };
    accrueMarketsStruct(phase);
    phase.comments.m1.push({ id: 'mutated after accrual' });
    expect(takeAccrued().comments.m1).toHaveLength(1);
  });
});

describe('overlayStorageStates', () => {
  beforeEach(() => resetAccrued());

  it('is the identity while nothing has been accrued', () => {
    const states = { commentsState: { m1: [{ id: 'c1' }] } };
    expect(overlayStorageStates(states)).toBe(states);
  });

  it('prepends accrued comments so a reply finds its fresh parent first', () => {
    // satisfyComments resolves a reply's parent with a find on reply_id. A stale parent ahead of
    // the fresh one lists no children and fabricates an unmatched signature (R-all-2317).
    accrueMarketsStruct({ comments: { m1: [{ id: 'p1', version: 2, children: ['r1'] }] } });
    const overlaid = overlayStorageStates({ commentsState: { m1: [{ id: 'p1', version: 1 }] } });
    expect(overlaid.commentsState.m1.map((comment) => comment.version)).toEqual([2, 1]);
    expect(overlaid.commentsState.m1.find((comment) => comment.id === 'p1').children).toEqual(['r1']);
  });

  it('prepends accrued markets onto marketDetails and keeps the rest of that state', () => {
    accrueMarketsStruct({ markets: [{ id: 'm2' }] });
    const overlaid = overlayStorageStates({ marketsState: { marketDetails: [{ id: 'm1' }], other: 1 } });
    expect(overlaid.marketsState.marketDetails.map((market) => market.id)).toEqual(['m2', 'm1']);
    expect(overlaid.marketsState.other).toBe(1);
  });

  it('adds accrued investibles without displacing the stored entry for other markets', () => {
    // satisfyInvestibles reads Object.values, so replacing by id would drop the market_infos of
    // markets this fetch did not cover and make them look unfetched.
    accrueMarketsStruct({ investibles: [{ investible: { id: 'i1', version: 2 },
      market_infos: [{ market_id: 'm1' }] }] });
    const stored = { i1: { investible: { id: 'i1', version: 1 },
      market_infos: [{ market_id: 'm1' }, { market_id: 'm2' }] } };
    const overlaid = overlayStorageStates({ investiblesState: stored });
    const values = Object.values(overlaid.investiblesState);
    expect(values).toHaveLength(2);
    expect(overlaid.investiblesState.i1).toBe(stored.i1);
    expect(_.flatten(values.map((item) => item.market_infos)).map((info) => info.market_id))
      .toEqual(expect.arrayContaining(['m1', 'm2']));
  });

  it('adds accrued group members where the flatten over values will see them', () => {
    accrueMarketsStruct({ members: [{ id: 'u1' }] });
    const overlaid = overlayStorageStates({ groupMembersState: { g1: [{ id: 'u2' }] } });
    expect(_.flatten(Object.values(overlaid.groupMembersState)).map((user) => user.id))
      .toEqual(expect.arrayContaining(['u1', 'u2']));
  });

  it('leaves the passed in states untouched', () => {
    accrueMarketsStruct({ comments: { m1: [{ id: 'c2' }] } });
    const states = { commentsState: { m1: [{ id: 'c1' }] } };
    overlayStorageStates(states);
    expect(states.commentsState.m1).toHaveLength(1);
  });
});

describe('msUntilRelease', () => {
  it('waits the quiet window after the last cycle when the storm is short', () => {
    expect(msUntilRelease(1000, 1000, 900)).toBe(QUIET_WINDOW_MS);
  });

  it('lets the maximum hold win once a storm never goes quiet', () => {
    // Cycles keep ending, so the quiet window keeps moving out; the cap does not.
    const firstAccrued = 0;
    const now = 9000;
    expect(msUntilRelease(now, now, firstAccrued)).toBe(MAX_HOLD_MS - now);
  });

  it('returns zero rather than a negative delay once the cap has passed', () => {
    expect(msUntilRelease(30000, 30000, 0)).toBe(0);
  });

  it('falls back to the quiet window when nothing has been accrued', () => {
    // A cycle that found no dirty markets still releases, because notifications ride the gate.
    expect(msUntilRelease(1000, 1000, undefined)).toBe(QUIET_WINDOW_MS);
  });

  it('honours overridden windows so the policy stays tunable', () => {
    expect(msUntilRelease(0, 0, 0, 500, 100000)).toBe(500);
    expect(msUntilRelease(0, 0, 0, 500000, 250)).toBe(250);
  });
});

describe('fetchableInvestibleSignatures', () => {
  // T-all-2485: a signature with no market_infos is rejected by the endpoint's validator, and
  // because the schema validates the whole body it takes every other entry down with it. This
  // is the exact pair David captured from the failing request.
  const good = { investible: { id: '9d50d9ac', version: 1 },
    market_infos: [{ id: 'fe418995', version: 1 }] };
  const unfetchable = { investible: { id: 'da0c8eda', version: 1 } };

  it('keeps the well formed entry and drops the one that can never be served', () => {
    expect(fetchableInvestibleSignatures([good, unfetchable])).toEqual([good]);
  });

  it('treats an empty market_infos the same as a missing one', () => {
    // minItems 0 lets it past the schema, but get_market_investibles then KeyErrors on it
    expect(fetchableInvestibleSignatures([{ investible: { id: 'x' }, market_infos: [] }])).toEqual([]);
  });

  it('returns nothing for an empty or missing list so the call can be skipped', () => {
    expect(fetchableInvestibleSignatures([])).toEqual([]);
    expect(fetchableInvestibleSignatures(undefined)).toEqual([]);
  });
});

describe('msUntilSync', () => {
  // T-all-2485: burst eight's version checks arrived a median 2.7s apart across 65s. A window
  // measured from the last cycle expires between every pair and fires every time, which paced the
  // cycles at exactly the window instead of collapsing them (R-all-2336). Resetting on each
  // request is what makes this a debounce.
  it('syncs immediately when the client is idle', () => {
    expect(msUntilSync(100000, undefined, undefined)).toBe(0);
    expect(msUntilSync(100000, 100000 - SYNC_QUIET_MS, undefined)).toBe(0);
  });

  it('defers a request that arrives inside the window, measured from that request', () => {
    expect(msUntilSync(1000, 900, 900)).toBe(SYNC_QUIET_MS);
  });

  it('keeps deferring while a drip keeps arriving inside the window', () => {
    // Requests 2.7s apart against a 5s window: every one pushes the due time out again, so the
    // whole drip collapses into one pass rather than one pass per request.
    let firstSuppressed = 1000;
    for (const now of [1000, 3700, 6400, 9100]) {
      expect(msUntilSync(now, now - 2700, firstSuppressed, 5000, 60000)).toBe(5000);
    }
  });

  it('does not defer when the gap exceeds the window, so a real lull syncs at once', () => {
    expect(msUntilSync(9000, 9000 - 5001, 1000, 5000, 60000)).toBe(0);
  });

  it('lets the cap bound a drip that never goes quiet', () => {
    expect(msUntilSync(9000, 8900, 0, 5000, 10000)).toBe(1000);
  });

  it('never returns a negative delay once the cap has passed', () => {
    expect(msUntilSync(30000, 29900, 0, 5000, 10000)).toBe(0);
  });
});
