import React, { act, useContext, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CommentsContext } from '../CommentsContext/CommentsContext';
import { InvestiblesContext } from '../InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../MarketsContext/MarketsContext';
import { NotificationsContext, NotificationsRefreshContext } from '../NotificationsContext/NotificationsContext';
import { LeaderContext } from '../LeaderContext/LeaderContext';
import { SyncedMessagesContext, SyncedMessagesProvider, SyncedMessagesStatusContext, useSyncedMessages } from './SyncedMessagesContext';
import { refreshNotifications } from '../../api/versionedFetchUtils';

jest.mock('../CommentsContext/CommentsContext', () => {
  const React = require('react');
  return { CommentsContext: React.createContext() };
});
jest.mock('../InvestibesContext/InvestiblesContext', () => {
  const React = require('react');
  return { InvestiblesContext: React.createContext() };
});
jest.mock('../MarketGroupsContext/MarketGroupsContext', () => {
  const React = require('react');
  return { MarketGroupsContext: React.createContext() };
});
jest.mock('../MarketPresencesContext/MarketPresencesContext', () => {
  const React = require('react');
  return { MarketPresencesContext: React.createContext() };
});
jest.mock('../MarketsContext/MarketsContext', () => {
  const React = require('react');
  return { MarketsContext: React.createContext() };
});
jest.mock('../NotificationsContext/NotificationsContext', () => {
  const React = require('react');
  return { NotificationsContext: React.createContext(), NotificationsRefreshContext: React.createContext() };
});
jest.mock('../LeaderContext/LeaderContext', () => {
  const React = require('react');
  return { LeaderContext: React.createContext([{}, jest.fn(), { requestFreshness: () => Promise.resolve() }]) };
});
jest.mock('../../api/useInitialSyncComplete', () => ({
  useInitialSyncComplete: () => true
}));
jest.mock('../../api/versionedFetchUtils', () => ({ refreshNotifications: jest.fn() }));
jest.mock('../MarketsContext/marketsContextHelper', () => ({
  getNotHiddenMarketDetailsForUser: (marketsState) => marketsState,
  marketTokenLoaded: (marketId, tokensHash) => Boolean(tokensHash[marketId])
}));
function Probe() {
  const { stillLoading, syncedMessages } = useContext(SyncedMessagesContext);
  const { messagesSyncing, refreshError } = useContext(SyncedMessagesStatusContext);
  return <>
    <div id="loading">{String(stillLoading)}</div>
    <div id="syncing">{String(messagesSyncing)}</div>
    <div id="error">{String(refreshError)}</div>
    <div id="messages">{syncedMessages.map((message) => message.comment_id).join(',')}</div>
  </>;
}

function providerTree({
  tokensHash = { 'market-a': 'token-a', 'market-b': 'token-b' },
  messages = [],
  comments = {},
  notificationRefresh = { refreshed: true, refreshError: false },
  RefreshProvider = NotificationsRefreshContext.Provider,
  children = <Probe />,
  requestFreshness = () => Promise.resolve()
} = {}) {
  const marketsState = {
    initializing: false,
    marketDetails: [{ id: 'market-a' }, { id: 'market-b' }]
  };
  return (
    <NotificationsContext.Provider value={[{ messages }, jest.fn(), true]}>
      <RefreshProvider value={notificationRefresh}>
        <MarketsContext.Provider value={[marketsState, jest.fn(), tokensHash]}>
          <MarketPresencesContext.Provider value={[{}]}>
            <CommentsContext.Provider value={[comments]}>
              <InvestiblesContext.Provider value={[{}]}>
                <MarketGroupsContext.Provider value={[{}]}>
                  <LeaderContext.Provider value={[{}, jest.fn(), { requestFreshness }]}>
                    <SyncedMessagesProvider>
                      {children}
                    </SyncedMessagesProvider>
                  </LeaderContext.Provider>
                </MarketGroupsContext.Provider>
              </InvestiblesContext.Provider>
            </CommentsContext.Provider>
          </MarketPresencesContext.Provider>
        </MarketsContext.Provider>
      </RefreshProvider>
    </NotificationsContext.Provider>
  );
}

const unsyncedMessage = {
  type: 'UNREAD_COMMENT',
  market_id: 'market-a',
  comment_id: 'comment-a',
  comment_version: 2
};

describe('SyncedMessagesProvider', () => {
  let container;
  let root;

  let previousActEnvironment;

  beforeEach(() => {
    jest.clearAllMocks();
    previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;
    window.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  it('registers and retires an unsynced notification dependency', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());

    act(() => root.render(providerTree({ messages: [unsyncedMessage], requestFreshness })));

    expect(requestFreshness).toHaveBeenLastCalledWith({
      reason: 'notificationDependencies',
      dependencies: [{ marketId: 'market-a', commentId: 'comment-a', version: 2 }]
    });

    act(() => root.render(providerTree({ messages: [], requestFreshness })));

    expect(requestFreshness).toHaveBeenLastCalledWith({
      reason: 'notificationDependencies',
      dependencies: []
    });
  });

  it('keeps cached messages loading until a fresh snapshot arrives, even when the cache is empty', () => {
    act(() => root.render(providerTree({ notificationRefresh: { refreshed: false } })));

    expect(container.querySelector('#loading').textContent).toBe('true');
    expect(refreshNotifications).toHaveBeenCalledWith({ onlyIfIdle: true });

    act(() => root.render(providerTree()));

    expect(container.querySelector('#loading').textContent).toBe('false');
  });

  it('keeps the sync indicator and recovery active until the missing comment arrives', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    const messages = [unsyncedMessage];
    act(() => root.render(providerTree({ messages, requestFreshness })));

    expect(container.querySelector('#loading').textContent).toBe('false');
    expect(container.querySelector('#syncing').textContent).toBe('true');
    expect(container.querySelector('#messages').textContent).toBe('');
    expect(requestFreshness).toHaveBeenLastCalledWith({ reason: 'notificationDependencies',
      dependencies: [{ marketId: 'market-a', commentId: 'comment-a', version: 2 }] });

    act(() => root.render(providerTree({ messages, requestFreshness,
      comments: { 'market-a': [{ id: 'comment-a', version: 2 }] } })));

    expect(container.querySelector('#syncing').textContent).toBe('false');
    expect(container.querySelector('#messages').textContent).toBe('comment-a');
    expect(requestFreshness).toHaveBeenLastCalledWith({ reason: 'notificationDependencies', dependencies: [] });
  });

  it('keeps a sync indicator for a trailing server snapshot even when the visible messages are ready', () => {
    act(() => root.render(providerTree({
      notificationRefresh: { refreshed: true, refreshing: true, refreshError: false }
    })));

    expect(container.querySelector('#loading').textContent).toBe('false');
    expect(container.querySelector('#syncing').textContent).toBe('true');

    act(() => root.render(providerTree()));

    expect(container.querySelector('#syncing').textContent).toBe('false');
  });

  it('does not rerender message-only consumers when refresh status changes', () => {
    let changeRefresh;
    const renders = jest.fn();
    function RefreshProvider({ children }) {
      const [status, setStatus] = useState({ refreshed: true, refreshing: false, refreshError: false });
      changeRefresh = setStatus;
      return <NotificationsRefreshContext.Provider value={status}>{children}</NotificationsRefreshContext.Provider>;
    }
    function MessagesOnly() {
      renders(useSyncedMessages());
      return null;
    }
    act(() => root.render(providerTree({ RefreshProvider, children: <MessagesOnly /> })));
    const renderedBeforeRefresh = renders.mock.calls.length;

    act(() => changeRefresh({ refreshed: true, refreshing: true, refreshError: false }));
    expect(renders).toHaveBeenCalledTimes(renderedBeforeRefresh);
    act(() => changeRefresh({ refreshed: true, refreshing: false, refreshError: false }));
    expect(renders).toHaveBeenCalledTimes(renderedBeforeRefresh);
  });

  it('exposes a failed initial fetch instead of leaving the inbox on an inaccessible loading screen', () => {
    act(() => root.render(providerTree({
      notificationRefresh: { refreshed: false, refreshError: true }
    })));

    expect(container.querySelector('#loading').textContent).toBe('false');
    expect(container.querySelector('#error').textContent).toBe('true');
  });

  it('renews an unsynced dependency while its tab remains mounted', () => {
    jest.useFakeTimers();
    try {
      const requestFreshness = jest.fn(() => Promise.resolve());
      act(() => root.render(providerTree({ messages: [unsyncedMessage], requestFreshness })));
      requestFreshness.mockClear();

      act(() => jest.advanceTimersByTime(60000));

      expect(requestFreshness).toHaveBeenCalledWith({
        reason: 'notificationDependencies',
        dependencies: [{ marketId: 'market-a', commentId: 'comment-a', version: 2 }],
        heartbeat: true
      });
    } finally {
      jest.useRealTimers();
    }
  });

  // Moved here from NavigationChevrons with J-all-440: the chevron is now told whether the set is
  // ready, and deriving that from market tokens belongs to the provider.
  it('stays dormant and requests nothing while a workspace token is missing', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());

    act(() => root.render(providerTree({
      tokensHash: { 'market-a': 'token-a' },
      messages: [unsyncedMessage],
      requestFreshness
    })));

    expect(container.querySelector('#loading').textContent).toBe('true');
    expect(requestFreshness).not.toHaveBeenCalled();
  });
});
