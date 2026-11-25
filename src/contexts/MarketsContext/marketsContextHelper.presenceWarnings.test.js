import { getNotHiddenMarketDetailsForUser } from './marketsContextHelper';
import { getMarketPresences } from '../MarketPresencesContext/marketPresencesHelper';

let mockInitialSyncComplete = false;

jest.mock('../../api/syncStatus', () => ({
  isInitialSyncComplete: () => mockInitialSyncComplete
}));
jest.mock('../MarketPresencesContext/marketPresencesHelper', () => ({
  getMarketPresences: jest.fn((state, id) => (state[id] || []).filter((presence) => !presence.market_banned))
}));
jest.mock('./marketsContextReducer', () => ({}));
jest.mock('../../utils/MessageBusUtils', () => ({}));
jest.mock('../MarketPresencesContext/marketPresencesMessages', () => ({}));
jest.mock('../../api/versionedFetchUtils', () => ({}));

describe('missing current-user diagnostics', () => {
  let warn;
  const markets = { marketDetails: [{ id: 'visible' }, { id: 'missing' }, { id: 'banned' }] };
  const presences = {
    visible: [{ current_user: true }],
    banned: [{ current_user: true, market_banned: true }]
  };

  beforeEach(() => {
    mockInitialSyncComplete = true;
    getNotHiddenMarketDetailsForUser({ marketDetails: [] }, {});
    getMarketPresences.mockClear();
    warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => warn.mockRestore());

  it('does not compute membership until participant loading and initial sync finish', () => {
    mockInitialSyncComplete = false;
    expect(getNotHiddenMarketDetailsForUser(markets, presences).marketDetails)
      .toEqual([]);
    mockInitialSyncComplete = true;
    getNotHiddenMarketDetailsForUser({ ...markets, initializing: true }, presences);
    getNotHiddenMarketDetailsForUser(markets, { ...presences, initializing: true });
    expect(warn).not.toHaveBeenCalled();
    expect(getMarketPresences).not.toHaveBeenCalled();
    expect(getNotHiddenMarketDetailsForUser(markets, presences).marketDetails).toEqual([{ id: 'visible' }]);
  });

  it('reports thousands of missing markets once, with a bounded example list', () => {
    const manyMarkets = { marketDetails: Array.from({ length: 3000 }, (_, id) => ({ id: `market-${id}` })) };
    getNotHiddenMarketDetailsForUser(manyMarkets, {});
    getNotHiddenMarketDetailsForUser({ ...manyMarkets }, {});
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][0]).toContain('3000 cached markets');
    expect(warn.mock.calls[0][1]).toHaveLength(5);
  });

  it('excludes intentionally hidden users and reports a missing presence again only after recovery', () => {
    getNotHiddenMarketDetailsForUser(markets, presences);
    getNotHiddenMarketDetailsForUser(markets, presences);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0][1]).toEqual(['missing']);
    getNotHiddenMarketDetailsForUser(markets, { ...presences, missing: [{ current_user: true }] });
    getNotHiddenMarketDetailsForUser(markets, presences);
    expect(warn).toHaveBeenCalledTimes(2);
    expect(warn.mock.calls[1][1]).toEqual(['missing']);
  });
});
