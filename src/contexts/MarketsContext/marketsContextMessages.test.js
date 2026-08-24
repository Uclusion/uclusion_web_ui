import { getMarketFromUrl } from '../../api/marketLogin';
import {
  getStorageStates,
  sendMarketsStruct,
  updateMarkets,
} from '../../api/versionedFetchUtils';
import {
  loadMarketById,
  loadMarketFromPromise,
} from './marketsContextMessages';

jest.mock('./marketsContextReducer', () => ({
  __esModule: true,
  default: jest.fn(),
  removeMarketDetails: jest.fn(),
}));
jest.mock('../../utils/MessageBusUtils', () => ({
  pushMessage: jest.fn(),
  registerListener: jest.fn(),
}));
jest.mock('./marketsContextHelper', () => ({
  addMarketsToStorage: jest.fn(),
  addMarketToStorage: jest.fn(),
}));
jest.mock('../../api/marketLogin', () => ({
  getMarketFromUrl: jest.fn(),
}));
jest.mock('../../utils/userMessage', () => ({
  toastError: jest.fn(),
}));
jest.mock('../MarketPresencesContext/marketPresencesMessages', () => ({
  ADD_PRESENCE: 'ADD_PRESENCE',
}));
jest.mock('../NotificationsContext/notificationsContextMessages', () => ({
  ADD_EVENT: 'ADD_EVENT',
}));
jest.mock('../../api/versionedFetchUtils', () => ({
  getStorageStates: jest.fn(),
  NOTIFICATIONS_HUB_CHANNEL: 'notifications',
  PUSH_INVESTIBLES_CHANNEL: 'investibles',
  PUSH_MARKETS_CHANNEL: 'markets',
  PUSH_PRESENCE_CHANNEL: 'presence',
  PUSH_STAGE_CHANNEL: 'stages',
  REMOVED_MARKETS_CHANNEL: 'removed',
  sendMarketsStruct: jest.fn(),
  updateMarkets: jest.fn(),
  VERSIONS_EVENT: 'versions',
}));

const workspaceId = '00000000-0000-4000-8000-000000000001';
const loginResult = {
  market: { id: workspaceId },
  user: { id: 'user-id' },
  stages: [],
};

describe('market load lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getStorageStates.mockResolvedValue({});
    updateMarkets.mockResolvedValue();
    getMarketFromUrl.mockResolvedValue(loginResult);
  });

  it('does not resolve or publish the full market until version hydration finishes', async () => {
    let finishHydration;
    updateMarkets.mockReturnValue(new Promise((resolve) => {
      finishHydration = resolve;
    }));
    let loadFinished = false;

    const load = loadMarketFromPromise(Promise.resolve(loginResult), jest.fn(), () => true)
      .then(() => {
        loadFinished = true;
      });
    await Promise.resolve();
    await Promise.resolve();

    expect(loadFinished).toBe(false);
    expect(sendMarketsStruct).not.toHaveBeenCalled();

    finishHydration();
    await load;
    expect(sendMarketsStruct).toHaveBeenCalledTimes(1);
  });

  it('does not publish hydrated data after the caller becomes inactive', async () => {
    let active = true;
    updateMarkets.mockImplementation(() => {
      active = false;
      return Promise.resolve();
    });

    await expect(loadMarketFromPromise(
      Promise.resolve(loginResult), jest.fn(), () => active
    )).rejects.toMatchObject({ cancelled: true });
    expect(sendMarketsStruct).not.toHaveBeenCalled();
  });

  it('clears a failed in-flight entry so a later attempt can load again', async () => {
    const firstError = new Error('first load failed');
    const activityGuard = () => true;
    getMarketFromUrl
      .mockRejectedValueOnce(firstError)
      .mockResolvedValueOnce(loginResult);

    await expect(loadMarketById(
      workspaceId, jest.fn(), activityGuard
    )).rejects.toBe(firstError);
    await expect(loadMarketById(
      workspaceId, jest.fn(), activityGuard
    )).resolves.toEqual(loginResult);

    expect(getMarketFromUrl).toHaveBeenCalledTimes(2);
    expect(getMarketFromUrl).toHaveBeenLastCalledWith(workspaceId, activityGuard);
  });
});
