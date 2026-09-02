const entryEvent = {
  payload: {
    event: 'view',
    message: { isEntry: true },
  },
};

describe('periodic market token listener', () => {
  let listener;
  let mockGetAllMarketTokenFetcher;
  let mockIsSignedOut;
  let mockRefreshExpiringTokens;

  beforeEach(() => {
    jest.resetModules();
    mockIsSignedOut = jest.fn().mockReturnValue(false);
    mockRefreshExpiringTokens = jest.fn();
    mockGetAllMarketTokenFetcher = jest.fn(() => ({
      refreshExpiringTokens: mockRefreshExpiringTokens,
    }));
    jest.doMock('../utils/MessageBusUtils', () => ({
      registerListener: jest.fn((_channel, _name, callback) => {
        listener = callback;
      }),
    }));
    jest.doMock('../utils/marketIdPathFunctions', () => ({
      VIEW_EVENT: 'view',
      VISIT_CHANNEL: 'visit',
    }));
    jest.doMock('../api/singletons', () => ({
      getAllMarketTokenFetcher: mockGetAllMarketTokenFetcher,
    }));
    jest.doMock('../utils/logoutState', () => ({
      isSignedOut: mockIsSignedOut,
    }));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.isolateModules(() => {
      const { registerMarketTokenListeners } = require('./tokenUtils');
      registerMarketTokenListeners();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('owns a synchronous setup failure and reports it while signed in', async () => {
    const error = new Error('setup failed');
    mockGetAllMarketTokenFetcher.mockImplementation(() => {
      throw error;
    });
    let result;

    expect(() => {
      result = listener(entryEvent);
    }).not.toThrow();

    await expect(result).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith(error);
  });

  it('owns an asynchronous refresh failure without reporting after logout', async () => {
    const error = Object.assign(new Error('cancelled'), { cancelled: true });
    mockIsSignedOut.mockReturnValue(true);
    mockRefreshExpiringTokens.mockRejectedValue(error);

    await expect(listener(entryEvent)).resolves.toBeUndefined();

    expect(mockRefreshExpiringTokens).toHaveBeenCalledWith(72);
    expect(console.error).not.toHaveBeenCalled();
  });

  it('retains ownership when the logout marker cannot be read', async () => {
    const markerError = new Error('invalid marker storage');
    const refreshError = new Error('refresh failed');
    mockIsSignedOut.mockImplementation(() => {
      throw markerError;
    });
    mockRefreshExpiringTokens.mockRejectedValue(refreshError);

    await expect(listener(entryEvent)).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(refreshError);
  });
});
