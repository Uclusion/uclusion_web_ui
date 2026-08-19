import _ from 'lodash';
import {
  accrueMarketsStruct,
  getFirstAccruedMs,
  hasAccrued,
  MAX_HOLD_MS,
  msUntilRelease,
  overlayStorageStates,
  QUIET_WINDOW_MS,
  resetAccrued,
  takeAccrued
} from './syncAccumulator';

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

