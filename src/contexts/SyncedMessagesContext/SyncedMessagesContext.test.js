import React, { act, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { CommentsContext } from '../CommentsContext/CommentsContext';
import { InvestiblesContext } from '../InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../MarketsContext/MarketsContext';
import { NotificationsContext } from '../NotificationsContext/NotificationsContext';
import { LeaderContext } from '../LeaderContext/LeaderContext';
import { SyncedMessagesContext, SyncedMessagesProvider } from './SyncedMessagesContext';

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
  return { NotificationsContext: React.createContext() };
});
jest.mock('../LeaderContext/LeaderContext', () => {
  const React = require('react');
  return { LeaderContext: React.createContext([{}, jest.fn(), { requestFreshness: () => Promise.resolve() }]) };
});
jest.mock('../../api/useInitialSyncComplete', () => ({
  useInitialSyncComplete: () => true
}));
jest.mock('../MarketsContext/marketsContextHelper', () => ({
  getNotHiddenMarketDetailsForUser: (marketsState) => marketsState,
  marketTokenLoaded: (marketId, tokensHash) => Boolean(tokensHash[marketId])
}));
// The provider is the code under test; the sync predicate it calls is not changed by J-all-440,
// so it is stubbed here to control inputs. The real predicate runs in
// notificationSyncTransition.test.js.
jest.mock('../NotificationsContext/notificationsContextHelper', () => ({
  getNotificationSyncState: (messages) => ({
    syncedMessages: [],
    dependencies: (messages || []).map((message) => ({
      marketId: message.comment_market_id || message.market_id,
      commentId: message.comment_id,
      version: message.comment_version
    }))
  })
}));

function Probe() {
  const { stillLoading } = useContext(SyncedMessagesContext);
  return <div id="loading">{String(stillLoading)}</div>;
}

function providerTree({
  tokensHash = { 'market-a': 'token-a', 'market-b': 'token-b' },
  messages = [],
  requestFreshness = () => Promise.resolve()
} = {}) {
  const marketsState = {
    initializing: false,
    marketDetails: [{ id: 'market-a' }, { id: 'market-b' }]
  };
  return (
    <NotificationsContext.Provider value={[{ messages }, jest.fn(), true]}>
      <MarketsContext.Provider value={[marketsState, jest.fn(), tokensHash]}>
        <MarketPresencesContext.Provider value={[{}]}>
          <CommentsContext.Provider value={[{}]}>
            <InvestiblesContext.Provider value={[{}]}>
              <MarketGroupsContext.Provider value={[{}]}>
                <LeaderContext.Provider value={[{}, jest.fn(), { requestFreshness }]}>
                  <SyncedMessagesProvider>
                    <Probe />
                  </SyncedMessagesProvider>
                </LeaderContext.Provider>
              </MarketGroupsContext.Provider>
            </InvestiblesContext.Provider>
          </CommentsContext.Provider>
        </MarketPresencesContext.Provider>
      </MarketsContext.Provider>
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
