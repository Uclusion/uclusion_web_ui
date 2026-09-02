import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { LeaderContext } from '../../contexts/LeaderContext/LeaderContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import NavigationChevrons from './NavigationChevrons';

jest.mock('../../contexts/CommentsContext/CommentsContext', () => {
  const React = require('react');
  return { CommentsContext: React.createContext() };
});
jest.mock('../../contexts/InvestibesContext/InvestiblesContext', () => {
  const React = require('react');
  return { InvestiblesContext: React.createContext() };
});
jest.mock('../../contexts/MarketGroupsContext/MarketGroupsContext', () => {
  const React = require('react');
  return { MarketGroupsContext: React.createContext() };
});
jest.mock('../../contexts/MarketPresencesContext/MarketPresencesContext', () => {
  const React = require('react');
  return { MarketPresencesContext: React.createContext() };
});
jest.mock('../../contexts/MarketsContext/MarketsContext', () => {
  const React = require('react');
  return { MarketsContext: React.createContext() };
});
jest.mock('../../contexts/MarketStagesContext/MarketStagesContext', () => {
  const React = require('react');
  return { MarketStagesContext: React.createContext() };
});
jest.mock('../../contexts/NotificationsContext/NotificationsContext', () => {
  const React = require('react');
  return { NotificationsContext: React.createContext() };
});
jest.mock('../../contexts/SearchResultsContext/SearchResultsContext', () => {
  const React = require('react');
  return { SearchResultsContext: React.createContext() };
});
jest.mock('../../contexts/LeaderContext/LeaderContext', () => {
  const React = require('react');
  return {
    LeaderContext: React.createContext([{}, jest.fn(), {
      requestFreshness: () => Promise.resolve()
    }])
  };
});
jest.mock('@material-ui/core/Toolbar', () => ({ children }) => <div>{children}</div>);
jest.mock('@material-ui/core', () => ({
  Button: ({ children, disabled, id, onClick, 'aria-disabled': ariaDisabled }) => (
    <button disabled={disabled} id={id} onClick={onClick} aria-disabled={ariaDisabled}>{children}</button>
  ),
  Tooltip: ({ children }) => <>{children}</>,
  makeStyles: () => () => ({ magicButton: 'magicButton' }),
  useMediaQuery: () => false,
  useTheme: () => ({ breakpoints: { down: () => '(max-width: 960px)' } })
}));
jest.mock('@material-ui/icons', () => ({
  ArrowBack: () => null,
  ArrowForward: () => null,
  ArrowUpward: () => null
}));
jest.mock('react-hotkeys-hook', () => ({ useHotkeys: () => undefined }));
jest.mock('react-intl', () => ({
  injectIntl: (Component) => Component,
  useIntl: () => ({ formatMessage: ({ id }) => id })
}));
jest.mock('react-router', () => ({
  useHistory: () => ({}),
  useLocation: () => ({ pathname: '/market-a/job-a', search: '', hash: '' })
}));
jest.mock('../../api/useInitialSyncComplete', () => ({
  useInitialSyncComplete: () => true
}));
jest.mock('../../contexts/MarketsContext/marketsContextHelper', () => ({
  getMarketDetailsForType: () => ({}),
  getNotHiddenMarketDetailsForUser: (marketsState) => marketsState,
  marketTokenLoaded: (marketId, tokensHash) => Boolean(tokensHash[marketId])
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextHelper', () => ({
  dehighlightMessage: () => undefined,
  getInboxTarget: () => '',
  getNotificationSyncState: (messages) => ({
    syncedMessages: [],
    dependencies: (messages || []).map((message) => ({
      marketId: message.comment_market_id || message.market_id,
      commentId: message.comment_id,
      version: message.comment_version
    }))
  }),
  isInboxItemNavigationUrl: (url = '') => url.startsWith('/inbox/'),
  isInboxNavigationUrl: () => false,
  isInboxTopLevelNavigationUrl: () => false
}));
jest.mock('../../contexts/NotificationsContext/notificationsContextReducer', () => ({
  addNavigation: () => ({}),
  removeNavigation: (url) => ({ type: 'REMOVE_NAVIGATION', url })
}));
jest.mock('../../contexts/CommentsContext/commentsContextHelper', () => ({
  getOpenInvestibleComments: () => []
}));
jest.mock('../../pages/Home/YourWork/InboxExpansionPanel', () => ({
  getWorkspaceData: () => []
}));
jest.mock('../../pages/Home/YourWork/InboxContext', () => ({
  addWorkspaceGroupAttribute: (messages) => messages
}));
jest.mock('../../utils/marketIdPathFunctions', () => ({
  ASSIGNED_HASH: '',
  clearJobBackOrigin: () => undefined,
  clearNavigationOrigins: () => undefined,
  formatGroupLinkWithSuffix: () => '',
  formCommentLink: () => '',
  formInboxItemLink: () => '',
  formInvestibleLink: () => '',
  formMarketLink: () => '',
  getCanonicalNavigationUrl: () => '/market-a/job-a',
  getJobBackOrigin: () => undefined,
  isReturnableNavigationUrl: () => true,
  navigate: jest.fn(),
  rememberSeenNavigationUrl: () => undefined
}));
jest.mock('../../utils/messageUtils', () => ({
  findMessagesForTypeObjectId: () => undefined
}));
jest.mock('../../utils/redirectUtils', () => ({
  getCurrentWorkspace: () => undefined,
  getGroupForInvestibleId: () => undefined
}));
jest.mock('../../pages/Home/ReturnTop', () => () => null);

function navigationChevronsTree({
  tokensHash = { 'market-a': 'token-a' },
  navigations = [{ url: '/previous', time: 1 }],
  messages = [],
  messagesDispatch = jest.fn(),
  requestFreshness = () => Promise.resolve()
} = {}) {
  const marketsState = {
    initializing: false,
    marketDetails: [{ id: 'market-a' }, { id: 'market-b' }]
  };
  return (
    <NotificationsContext.Provider value={[{
      messages,
      navigations
    }, messagesDispatch, true]}>
      <MarketsContext.Provider value={[marketsState, jest.fn(), tokensHash]}>
        <MarketPresencesContext.Provider value={[{}]}>
          <CommentsContext.Provider value={[{}]}>
            <InvestiblesContext.Provider value={[{}]}>
              <MarketStagesContext.Provider value={[{}]}>
                <MarketGroupsContext.Provider value={[{}]}>
                  <SearchResultsContext.Provider value={[{ search: '' }]}>
                    <LeaderContext.Provider value={[{}, jest.fn(), {
                      requestFreshness
                    }]}>
                      <NavigationChevrons action="dialog" />
                    </LeaderContext.Provider>
                  </SearchResultsContext.Provider>
                </MarketGroupsContext.Provider>
              </MarketStagesContext.Provider>
            </InvestiblesContext.Provider>
          </CommentsContext.Provider>
        </MarketPresencesContext.Provider>
      </MarketsContext.Provider>
    </NotificationsContext.Provider>
  );
}

describe('NavigationChevrons', () => {
  let container;
  let root;
  const previousActEnvironment = window.IS_REACT_ACT_ENVIRONMENT;

  beforeAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    window.IS_REACT_ACT_ENVIRONMENT = previousActEnvironment;
  });

  beforeEach(() => {
    container = document.createElement('div');
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
  });

  it('disables navigation while a workspace token is missing', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({ requestFreshness })));

    requestFreshness.mockClear();
    const next = container.querySelector('#nextNavigation');
    const back = container.querySelector('#backNavigation');
    expect(next).not.toBeNull();
    expect(back).not.toBeNull();
    expect(next.disabled).toBe(true);
    expect(back.disabled).toBe(true);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    act(() => next.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Forward when loaded state has no navigation target', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [],
      requestFreshness
    })));

    requestFreshness.mockClear();
    const next = container.querySelector('#nextNavigation');
    expect(next.disabled).toBe(true);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    act(() => next.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Back after its last navigation target is consumed', () => {
    const messagesDispatch = jest.fn();
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      messagesDispatch,
      requestFreshness
    })));

    requestFreshness.mockClear();
    navigate.mockClear();
    const enabledBack = container.querySelector('#backNavigation');
    expect(enabledBack.disabled).toBe(false);
    act(() => enabledBack.click());
    expect(messagesDispatch).toHaveBeenCalledWith({ type: 'REMOVE_NAVIGATION', url: '/previous' });
    expect(navigate).toHaveBeenCalledWith(expect.any(Object), '/previous');

    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [],
      messagesDispatch,
      requestFreshness
    })));

    const back = container.querySelector('#backNavigation');
    expect(back.disabled).toBe(true);
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('disables Back while a remembered inbox target is not synced', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    act(() => root.render(navigationChevronsTree({
      tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
      navigations: [{ url: '/inbox/stale', time: 1 }],
      requestFreshness
    })));

    requestFreshness.mockClear();
    const back = container.querySelector('#backNavigation');
    expect(back.disabled).toBe(true);
    expect(back.getAttribute('aria-disabled')).toBe('true');
    act(() => back.click());
    expect(requestFreshness).not.toHaveBeenCalled();
  });

  it('registers and retires an unsynced notification dependency', () => {
    const requestFreshness = jest.fn(() => Promise.resolve());
    const loadedTokens = { 'market-a': 'token-a', 'market-b': 'token-b' };
    const message = {
      type: 'UNREAD_COMMENT',
      market_id: 'market-a',
      comment_id: 'comment-a',
      comment_version: 2
    };
    act(() => root.render(navigationChevronsTree({
      tokensHash: loadedTokens,
      messages: [message],
      requestFreshness
    })));

    expect(requestFreshness).toHaveBeenLastCalledWith({
      reason: 'notificationDependencies',
      dependencies: [{ marketId: 'market-a', commentId: 'comment-a', version: 2 }]
    });

    act(() => root.render(navigationChevronsTree({
      tokensHash: loadedTokens,
      messages: [],
      requestFreshness
    })));

    expect(requestFreshness).toHaveBeenLastCalledWith({
      reason: 'notificationDependencies',
      dependencies: []
    });
  });

  it('renews an unsynced dependency while its tab remains mounted', () => {
    jest.useFakeTimers();
    try {
      const requestFreshness = jest.fn(() => Promise.resolve());
      const message = {
        type: 'UNREAD_COMMENT',
        market_id: 'market-a',
        comment_id: 'comment-a',
        comment_version: 2
      };
      act(() => root.render(navigationChevronsTree({
        tokensHash: { 'market-a': 'token-a', 'market-b': 'token-b' },
        messages: [message],
        requestFreshness
      })));
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
});
