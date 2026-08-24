import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Router } from 'react-router';
import { createMemoryHistory } from 'history';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { loadMarketById } from '../../contexts/MarketsContext/marketsContextMessages';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../../utils/logoutState';
import { toastError } from '../../utils/userMessage';
import SetupWorkspaceLoad from './SetupWorkspaceLoad';

jest.mock('../../contexts/MarketsContext/marketsContextMessages', () => ({
  loadMarketById: jest.fn(),
}));
jest.mock('../../utils/logoutState', () => ({
  getLogoutGeneration: jest.fn(),
  isLogoutGenerationCurrent: jest.fn(),
  isSignedOut: jest.fn(),
}));
jest.mock('../../utils/userMessage', () => ({
  toastError: jest.fn(),
}));

const workspaceId = '00000000-0000-4000-8000-000000000001';
const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

describe('SetupWorkspaceLoad', () => {
  let container;
  let history;
  let marketsDispatch;
  let root;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    loadMarketById.mockReset().mockResolvedValue({});
    getLogoutGeneration.mockReset().mockReturnValue('session-a');
    isLogoutGenerationCurrent.mockReset().mockImplementation(
      (generation) => generation === 'session-a'
    );
    isSignedOut.mockReset().mockReturnValue(false);
    toastError.mockReset();
    history = createMemoryHistory({
      initialEntries: [{
        pathname: `/dialog/${workspaceId}`,
        state: { setupWorkspaceId: workspaceId },
      }],
    });
    marketsDispatch = jest.fn();
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  async function renderLoader(marketsState) {
    await act(async () => {
      root.render(
        <Router history={history}>
          <MarketsContext.Provider value={[marketsState, marketsDispatch, {}]}>
            <SetupWorkspaceLoad />
          </MarketsContext.Provider>
        </Router>
      );
      await Promise.resolve();
    });
  }

  it('loads the setup workspace once after the live market provider initializes', async () => {
    let finishLoad;
    loadMarketById.mockReturnValue(new Promise((resolve) => {
      finishLoad = resolve;
    }));
    await renderLoader({ initializing: true, marketDetails: [] });
    expect(loadMarketById).not.toHaveBeenCalled();

    await renderLoader({ initializing: false, marketDetails: [] });
    await renderLoader({
      initializing: false,
      marketDetails: [{ id: workspaceId }],
    });

    expect(loadMarketById).toHaveBeenCalledTimes(1);
    expect(loadMarketById).toHaveBeenCalledWith(
      workspaceId,
      expect.any(Function),
      expect.any(Function)
    );
    expect(loadMarketById.mock.calls[0][2]()).toBe(true);

    await act(async () => {
      finishLoad({});
      await Promise.resolve();
    });
    await renderLoader({ initializing: false, marketDetails: [] });
    expect(loadMarketById).toHaveBeenCalledTimes(1);
  });

  it('does not mistake existing market metadata for completed hydration', async () => {
    await renderLoader({
      initializing: false,
      marketDetails: [{ id: workspaceId }],
    });

    expect(loadMarketById).toHaveBeenCalledTimes(1);
  });

  it('shows reload guidance after full hydration fails', async () => {
    const error = new Error('full hydration failed');
    loadMarketById.mockRejectedValue(error);

    await renderLoader({ initializing: false, marketDetails: [{ id: workspaceId }] });

    expect(toastError).toHaveBeenCalledWith(error, 'setupWorkspaceOpenFailed');
  });

  it('silently invalidates an in-flight load on unmount or sign out', async () => {
    let activityGuard;
    loadMarketById.mockImplementation((_workspaceId, _dispatch, guard) => {
      activityGuard = guard;
      return new Promise(() => {});
    });
    await renderLoader({ initializing: false, marketDetails: [] });
    expect(activityGuard()).toBe(true);

    act(() => root.unmount());
    root = createRoot(container);
    expect(activityGuard()).toBe(false);

    isSignedOut.mockReturnValue(true);
    await renderLoader({ initializing: false, marketDetails: [] });
    expect(loadMarketById.mock.calls[1][2]()).toBe(false);
  });

  it('does not resume hydration after rapid logout and login', async () => {
    let activityGuard;
    loadMarketById.mockImplementation((_workspaceId, _dispatch, guard) => {
      activityGuard = guard;
      return new Promise(() => {});
    });
    await renderLoader({ initializing: false, marketDetails: [] });
    expect(activityGuard()).toBe(true);

    isLogoutGenerationCurrent.mockImplementation(
      (generation) => generation === 'session-b'
    );
    isSignedOut.mockReturnValue(false);

    expect(activityGuard()).toBe(false);
  });
});
